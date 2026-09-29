import assert from "node:assert/strict";
import { test } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FocusConnection, focusEndTime, sessionFromRow, type FocusRow, type FocusSnapshot } from "../src/focus/shared";
import { elapsedSeconds } from "../src/game/session";
import { gameReducer, type GameData } from "../src/game/store";
import { freshState, loadSnapshot, persistSnapshot } from "../src/game/save";

const now = Date.parse("2026-09-29T12:00:00Z");
const row: FocusRow = {
  id: "98b35c02-0d54-4bf7-bbc9-054f3b1c83f1", user_id: "test-user", status: "running",
  biome: "reef", planned_seconds: 1500, elapsed_ms: 0, running_since: new Date(now).toISOString(),
  quote: "Foco", origin: "mobile", revision: 1, created_at: new Date(now).toISOString(),
  updated_at: new Date(now).toISOString(), completed_at: null,
};
const snapshot = (active: FocusRow | null, completed: FocusRow[] = []): FocusSnapshot => ({
  row: active, completed, connected: true, offset: 0, busy: false, error: null,
});

test("shared clock compensates device drift and survives a pause/resume on another device", () => {
  const offset = 120_000;
  assert.equal(elapsedSeconds(sessionFromRow(row, offset), now - offset + 65_000), 65);
  assert.equal(focusEndTime(row, offset), now - offset + 1_500_000);
  const paused: FocusRow = { ...row, status: "paused", elapsed_ms: 65_700, running_since: null, revision: 2 };
  assert.equal(elapsedSeconds(sessionFromRow(paused), now + 500_000), 65);
  assert.equal(focusEndTime(paused), null);
  const resumed = { ...paused, status: "running" as const, running_since: new Date(now + 500_000).toISOString() };
  assert.equal(elapsedSeconds(sessionFromRow(resumed), now + 510_300), 76);
  assert.equal(focusEndTime({ ...row, planned_seconds: null }), null);
});

test("completed session is rewarded once across repeated snapshots and reload", () => {
  const entries = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => { entries.set(key, value); },
    removeItem: (key: string) => entries.delete(key),
  } });
  const completed = { ...row, status: "completed" as const, running_since: null, elapsed_ms: 1_500_000,
    completed_at: new Date(now + 1_500_000).toISOString() };
  const action = { type: "shared" as const, userId: row.user_id, snapshot: snapshot(null, [completed]), now: now + 1_600_000 };
  const original: GameData = { state: freshState(now), session: null, rewards: null };
  const rewarded = gameReducer(original, action);
  assert.equal(rewarded.state.sessionsCompleted, 1);
  assert.equal(rewarded.state.totalFocusSeconds, 1500);
  assert.equal(gameReducer(rewarded, action).state.sessionsCompleted, 1);
  persistSnapshot(rewarded);
  const restored = { ...loadSnapshot(now + 1_700_000), rewards: null };
  assert.equal(gameReducer(restored, action).state.sessionsCompleted, 1);
  const stranger = { ...completed, id: "other", user_id: "another-account" };
  assert.equal(gameReducer(rewarded, { ...action, snapshot: snapshot(null, [stranger]) }).state.sessionsCompleted, 1);
});

test("account timer does not replace a guest session; sign-out detaches the timer without clearing progress", () => {
  const local = { id: "old-local", biome: "reef" as const, plannedSeconds: 300, elapsedMs: 0, startedAt: now, quote: "Local" };
  const original: GameData = { state: freshState(now), session: local, rewards: null };
  const action = { type: "shared" as const, userId: row.user_id, snapshot: snapshot(row), now };
  assert.equal(gameReducer(original, action), original);
  const cloud = gameReducer({ ...original, session: null }, action);
  assert.equal(cloud.session?.sharedUserId, row.user_id);
  const detached = gameReducer(cloud, { type: "detach_shared" });
  assert.equal(detached.session, null);
  assert.deepEqual(detached.state, cloud.state);
});

test("connection serializes competing commands, preserves its clock offline, and rejects stale account results", async () => {
  const commands: string[] = [];
  let failure = false;
  let wrongAccount = false;
  let current = { ...row };
  const client = { rpc: async (_name: string, params: Record<string, unknown>) => {
    commands.push(params.p_command as string);
    if (failure) return { error: new Error("offline"), data: null };
    if (params.p_command === "pause") {
      assert.equal(params.p_revision, 1);
      current = { ...current, status: "paused", running_since: null, revision: 2 };
    } else if (params.p_command === "resume") {
      assert.equal(params.p_revision, 2);
      current = { ...current, status: "running", running_since: new Date().toISOString(), revision: 3 };
    }
    return { error: null, data: { session: wrongAccount ? { ...current, user_id: "stranger" } : current,
      conflict: false, server_now: new Date().toISOString() } };
  } } as unknown as SupabaseClient;
  const connection = new FocusConnection(client, row.user_id, () => undefined, false);
  await connection.refresh();
  await Promise.all([connection.command("pause"), connection.command("resume")]);
  assert.deepEqual(commands, ["refresh", "pause", "resume"]);
  assert.equal(connection.snapshot.row?.revision, 3);
  failure = true;
  await assert.rejects(connection.refresh());
  assert.equal(connection.snapshot.row?.revision, 3);
  assert.equal(connection.snapshot.connected, false);
  failure = false; wrongAccount = true;
  await assert.rejects(connection.refresh());
  assert.equal(connection.snapshot.row?.user_id, row.user_id);
});

test("a realtime event arriving during a read triggers another read instead of leaving stale state", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let requests = 0;
  const client = { rpc: async () => {
    const revision = ++requests;
    if (revision === 1) await gate;
    return { error: null, data: { session: { ...row, revision }, conflict: false, server_now: new Date().toISOString() } };
  } } as unknown as SupabaseClient;
  const connection = new FocusConnection(client, row.user_id, () => undefined, false);
  const first = connection.refresh();
  await Promise.resolve();
  void connection.refresh();
  release();
  await first;
  for (let i = 0; i < 10 && connection.snapshot.row?.revision !== 2; i++) await new Promise(setImmediate);
  assert.equal(requests, 2);
  assert.equal(connection.snapshot.row?.revision, 2);
  connection.dispose();
});
