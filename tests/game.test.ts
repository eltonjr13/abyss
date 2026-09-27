import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { applySession } from "../src/game/progress";
import { freshState, hasPlus, canAccess, hydrate, loadSnapshot, persistSnapshot, refreshDay } from "../src/game/save";
import { createSession, elapsedSeconds, pauseSessionAt, resumeSessionAt } from "../src/game/session";
import { gameReducer, type GameData } from "../src/game/store";
import { shiftDateKey, todayKey } from "../src/lib/format";

const now = new Date(2026, 8, 27, 12, 0, 0).getTime();
const today = todayKey(new Date(now));
const entries = new Map<string, string>();
const storage = {
  getItem: (key: string) => entries.get(key) ?? null,
  setItem: (key: string, value: string) => { entries.set(key, value); },
  removeItem: (key: string) => { entries.delete(key); },
  clear: () => { entries.clear(); },
} as Storage;
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });

afterEach(() => storage.clear());

test("running sessions survive reload; repeated short pauses keep fractional time", () => {
  let session = createSession("reef", 300, "Foco", now);
  session = pauseSessionAt(session, now + 700);
  session = resumeSessionAt(session, now + 1_700);
  session = pauseSessionAt(session, now + 2_400);
  assert.equal(session.elapsedMs, 1_400);

  session = resumeSessionAt(session, now + 3_000);
  persistSnapshot({ state: freshState(now), session });
  const restored = loadSnapshot(now + 33_000);
  assert.equal(elapsedSeconds(restored.session!, now + 33_000), 31);
  assert.equal(elapsedSeconds(restored.session!, now + 303_000), 300);
});

test("legacy progress migrates and invalid saved fields cannot break the game", () => {
  storage.setItem("tide-save-v1", JSON.stringify({
    ...freshState(now), xp: 80, totalFocusSeconds: 1_500, discovered: ["peixe-palhaco"],
  }));
  const migrated = loadSnapshot(now);
  assert.equal(migrated.state.xp, 80);
  assert.equal(migrated.state.totalFocusSeconds, 1_500);
  assert.deepEqual(migrated.state.discovered, ["peixe-palhaco"]);
  persistSnapshot(migrated);
  assert.equal(storage.getItem("tide-save-v1"), null);

  const damaged = hydrate({
    currentBiome: "unknown", unlockedBiomes: ["unknown"],
    biomeLife: { reef: 500 }, audio: { music: 8 },
    discovered: ["unknown"], history: [{ date: "2026-99-99", seconds: 5 }],
  }, now);
  assert.equal(damaged.currentBiome, "reef");
  assert.deepEqual(damaged.unlockedBiomes, ["reef"]);
  assert.equal(damaged.biomeLife.reef, 100);
  assert.equal(damaged.audio.music, 1);
  assert.deepEqual(damaged.discovered, []);
  assert.deepEqual(damaged.history, []);
});

test("short sessions give no reward; 5, 25 and 90 minutes scale without a hard cap", () => {
  assert.throws(() => applySession(freshState(now), "reef", 59, today, () => 0.5));
  const short = applySession(freshState(now), "reef", 5 * 60, today, () => 0.5);
  const medium = applySession(freshState(now), "reef", 25 * 60, today, () => 0.5);
  const long = applySession(freshState(now), "reef", 90 * 60, today, () => 0.5);
  assert.deepEqual(
    [short.rewards.lifeGain, medium.rewards.lifeGain, long.rewards.lifeGain],
    [2.1, 10.5, 24.8],
  );
  assert.deepEqual([short.rewards.xp, medium.rewards.xp, long.rewards.xp], [6, 30, 108]);
  assert.deepEqual(medium.rewards.newBiomes, []);
  const next = applySession(medium.state, "reef", 25 * 60, today, () => 0.5);
  assert.deepEqual(next.rewards.newBiomes, ["kelp"]);
});

test("completion is deterministic and a repeated action cannot award twice", () => {
  const initial: GameData = { state: freshState(now), session: null, rewards: null };
  const started = gameReducer(initial, { type: "start", seconds: 300, quote: "Foco", now });
  const action = { type: "complete" as const, id: started.session!.id, now: now + 300_000 };
  const completed = gameReducer(started, action);
  assert.equal(completed.state.sessionsCompleted, 1);
  assert.equal(completed.session, null);
  assert.equal(gameReducer(completed, action), completed);
  assert.deepEqual(gameReducer(started, action), completed);
});

test("a recovered timed session is recorded on its scheduled finish day", () => {
  const lateStart = new Date(2026, 8, 27, 23, 55).getTime();
  const initial: GameData = { state: freshState(lateStart), session: null, rewards: null };
  const started = gameReducer(initial, { type: "start", seconds: 300, quote: "Foco", now: lateStart });
  const afterTwoDays = gameReducer(started, {
    type: "complete", id: started.session!.id, now: lateStart + 2 * 24 * 60 * 60 * 1000,
  });
  assert.equal(afterTwoDays.state.history[0]?.date, shiftDateKey(todayKey(new Date(lateStart)), 1));
});

test("daily focus resets at midnight and a missed day expires the streak", () => {
  const yesterday = shiftDateKey(today, -1);
  const state = { ...freshState(now), todayDate: yesterday, todayFocusSeconds: 900, streak: 3, lastSessionDate: yesterday };
  const todayState = refreshDay(state, today);
  assert.equal(todayState.todayFocusSeconds, 0);
  assert.equal(todayState.streak, 3);
  const later = refreshDay(todayState, shiftDateKey(today, 1));
  assert.equal(later.streak, 0);
});

test("TIDE Plus permanent purchase unlocks features, survives reload and reset, and can be restored", () => {
  const initial: GameData = { state: freshState(now), session: null, rewards: null };
  assert.equal(hasPlus(initial.state), false);
  assert.equal(canAccess(initial.state, "sanctuary_mode"), false);

  // Desbloqueia o Plus Vitalício
  const purchased = gameReducer(initial, {
    type: "unlock_plus",
    transactionId: "ord_vitalicio_999",
    source: "purchase",
  });
  assert.equal(hasPlus(purchased.state), true);
  assert.equal(canAccess(purchased.state, "soundscapes_extended"), true);
  assert.equal(purchased.state.plus.transactionId, "ord_vitalicio_999");
  assert.equal(purchased.state.plus.source, "purchase");

  // Persiste no storage e recarrega
  persistSnapshot({ state: purchased.state, session: null });
  const reloaded = loadSnapshot(now);
  assert.equal(hasPlus(reloaded.state), true);
  assert.equal(reloaded.state.plus.transactionId, "ord_vitalicio_999");

  // Recomeçar o oceano do zero (reset) NÃO pode apagar a compra permanente
  const afterReset = gameReducer(purchased, { type: "reset", now });
  assert.equal(afterReset.state.xp, 0);
  assert.equal(afterReset.state.sessionsCompleted, 0);
  assert.equal(hasPlus(afterReset.state), true);
  assert.equal(afterReset.state.plus.transactionId, "ord_vitalicio_999");

  // Restauração de compra
  const restored = gameReducer(initial, {
    type: "unlock_plus",
    transactionId: "restore_store_123",
    source: "restore",
  });
  assert.equal(hasPlus(restored.state), true);
  assert.equal(restored.state.plus.source, "restore");
});
