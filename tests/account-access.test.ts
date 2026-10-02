import assert from "node:assert/strict";
import { test, afterEach } from "node:test";
import { canStartDive } from "../src/focus/access";
import { freshState, loadSnapshot, persistSnapshot } from "../src/game/save";
import { gameReducer, initialGameData } from "../src/game/store";
import { FocusConnection, type FocusRow, type FocusSnapshot } from "../src/focus/shared";
import type { SupabaseClient } from "@supabase/supabase-js";

const entries = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => entries.get(key) ?? null,
  setItem: (key: string, value: string) => { entries.set(key, value); },
  removeItem: (key: string) => entries.delete(key),
} });
afterEach(() => entries.clear());

test("starting a dive requires a verified owner and a ready account connection", () => {
  const ready = { userId: "alice", accountId: "alice", verified: true, authLoading: false,
    authBusy: false, connected: true, syncBusy: false };
  assert.equal(canStartDive(ready), true);
  for (const blocked of [{ userId: null }, { accountId: "bob" }, { verified: false },
    { authLoading: true }, { authBusy: true }, { connected: false }, { syncBusy: true }]) {
    assert.equal(canStartDive({ ...ready, ...blocked }), false);
  }
});

test("account caches isolate collections and retain the original unbound save", () => {
  const legacy = { state: { ...freshState(), xp: 70, discovered: ["peixe-palhaco"] }, session: null };
  persistSnapshot(legacy);
  const original = entries.get("tide-save-v2");
  assert.deepEqual(loadSnapshot(Date.now(), "alice").state.discovered, []);
  persistSnapshot({ state: { ...freshState(), discovered: ["donzela-azul"] }, session: null }, "alice");
  assert.deepEqual(loadSnapshot(Date.now(), "alice").state.discovered, ["donzela-azul"]);
  assert.deepEqual(loadSnapshot(Date.now(), "bob").state.discovered, []);
  assert.equal(entries.get("tide-save-v2"), original);
  entries.set("tide-save-v2:account:bob", entries.get("tide-save-v2:account:alice")!);
  assert.deepEqual(loadSnapshot(Date.now(), "bob").state.discovered, []);
});

test("switching accounts drops an unrelated timer and rejects a stale completion response", () => {
  const now = Date.now();
  const staleTimer = { id: "old", biome: "reef" as const, plannedSeconds: 300, elapsedMs: 0,
    startedAt: now, quote: "Foco", sharedUserId: "alice", revision: 1 };
  const bob = gameReducer({ state: freshState(), session: null, rewards: null }, {
    type: "account", accountId: "bob", snapshot: { state: freshState(), session: staleTimer },
  });
  assert.equal(bob.session, null);
  const stale: FocusSnapshot = { connected: true, busy: false, offset: 0, error: null, row: null, completed: [] };
  assert.equal(gameReducer(bob, { type: "shared", userId: "alice", snapshot: stale, now }), bob);
  const signedOut = gameReducer(bob, { type: "account", accountId: null,
    snapshot: { state: freshState(), session: staleTimer } });
  assert.equal(signedOut.session, null);
});

test("a legacy guest timer stays preserved without resuming or awarding anonymous progress", () => {
  const now = Date.now();
  const snapshot = { state: freshState(now), session: { id: "legacy", biome: "reef" as const,
    plannedSeconds: 300, elapsedMs: 100000, startedAt: now, quote: "Local" } };
  persistSnapshot(snapshot);
  assert.equal(initialGameData().session, null);
  assert.equal(loadSnapshot(now).session?.id, "legacy");
  assert.equal(loadSnapshot(now, "alice").session, null);
  assert.equal(loadSnapshot(now, "alice").state.sessionsCompleted, 0);
});

test("repeated account synchronization keeps its owner and the dive ready", () => {
  const now = Date.now();
  let data = gameReducer(initialGameData(), { type: "account", accountId: "alice",
    snapshot: { state: freshState(now), session: null } });
  const snapshot: FocusSnapshot = { connected: true, busy: false, offset: 0, error: null,
    row: null, completed: [] };
  for (let refresh = 0; refresh < 3; refresh++) {
    data = gameReducer(data, { type: "shared", userId: "alice", snapshot, now });
    assert.equal(data.accountId, "alice", "synchronization must not restart the account loading gate");
    assert.equal(canStartDive({ userId: "alice", accountId: data.accountId ?? null,
      verified: true, authLoading: false, authBusy: false, connected: true, syncBusy: false }), true);
    assert.equal(gameReducer(data, { type: "shared", userId: "bob", snapshot, now }), data);
  }
});

test("a history response from another account never becomes a connected, rewardable snapshot", async () => {
  const query = {
    select: () => query, eq: () => query, order: () => query,
    range: async () => ({ error: null, data: [{ user_id: "bob", status: "completed", completed_at: new Date().toISOString() }] }),
  };
  const client = { from: () => query,
    rpc: async () => ({ error: null, data: { session: null, conflict: false, server_now: new Date().toISOString() } }),
  } as unknown as SupabaseClient;
  const connection = new FocusConnection(client, "alice", () => {});
  await assert.rejects(connection.refresh(), /Histórico da conta inválido/);
  assert.equal(connection.snapshot.connected, false);
  assert.equal(connection.snapshot.busy, false);
  assert.deepEqual(connection.snapshot.completed, []);
  connection.dispose();
});

test("confirmed history restores the same discoveries on a new device and never rewards twice", () => {
  const now = Date.parse("2026-10-01T12:00:00Z");
  const rows: FocusRow[] = [0, 1, 2].map(index => ({
    id: `confirmed-${index}`, user_id: "alice", biome: "reef", status: "completed", planned_seconds: 1500,
    elapsed_ms: 1500000, running_since: null, quote: "Foco", origin: "web", revision: 2,
    created_at: new Date(now + index * 1500000).toISOString(),
    updated_at: new Date(now + (index + 1) * 1500000).toISOString(),
    completed_at: new Date(now + (index + 1) * 1500000).toISOString(),
  }));
  const seed = { accountId: "alice", state: freshState(now), session: null, rewards: null };
  const action = { type: "shared" as const, userId: "alice", now: now + 6000000,
    snapshot: { row: null, connected: true, busy: false, offset: 0, error: null, completed: rows } };
  const firstDevice = gameReducer(seed, action);
  assert.equal(firstDevice.accountId, "alice");
  const secondDevice = gameReducer(seed, { ...action, snapshot: { ...action.snapshot, completed: [...rows].reverse() } });
  assert.deepEqual(firstDevice.state, secondDevice.state);
  assert.ok(firstDevice.state.discovered.length > 0);
  persistSnapshot(firstDevice, "alice");
  const reloaded = { ...loadSnapshot(now + 6000000, "alice"), accountId: "alice", rewards: null };
  assert.deepEqual(gameReducer(reloaded, action).state, firstDevice.state);
});
