import { todayKey } from "../lib/format";
import type { ActiveSession, AudioSettings, BiomeId, GameState, Rewards } from "../types";
import { applySession } from "./progress";
import { freshState, loadSnapshot, refreshDay, type SaveSnapshot } from "./save";
import { createSession, elapsedSeconds, MIN_REWARD_SECONDS, pauseSessionAt, resumeSessionAt } from "./session";
import { isActive, sessionFromRow, type FocusSnapshot } from "../focus/shared";

export interface GameData {
  state: GameState;
  session: ActiveSession | null;
  rewards: Rewards | null;
  appliedSharedSessions?: string[];
  accountId?: string | null;
}

export type GameAction =
  | { type: "account"; accountId: string | null; snapshot: SaveSnapshot }
  | { type: "shared"; snapshot: FocusSnapshot; userId: string; now: number }
  | { type: "detach_shared" }
  | { type: "onboarding" }
  | { type: "biome"; id: BiomeId }
  | { type: "start"; seconds: number | null; quote: string; now: number }
  | { type: "pause"; now: number }
  | { type: "resume"; now: number }
  | { type: "complete"; id: string; now: number }
  | { type: "abandon" }
  | { type: "audio"; audio: AudioSettings }
  | { type: "reset"; now: number }
  | { type: "day"; today: string }
  | { type: "import"; state: GameState }
  | { type: "unlock_plus"; transactionId?: string; source?: "purchase" | "restore" | "code" }
  | { type: "revoke_plus" };

export function initialGameData(): GameData {
  return { ...loadSnapshot(), session: null, rewards: null, accountId: null };
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function gameReducer(data: GameData, action: GameAction): GameData {
  switch (action.type) {
    case "account":
      return { ...action.snapshot, accountId: action.accountId, rewards: null,
        session: action.accountId && action.snapshot.session?.sharedUserId === action.accountId ? action.snapshot.session : null };
    case "detach_shared":
      return data.session?.sharedUserId ? { ...data, session: null, rewards: null } : data;
    case "shared": {
      if (data.accountId !== undefined && data.accountId !== action.userId) return data;
      // Finish a pre-existing guest session locally before joining the account timer.
      if (data.session && !data.session.sharedUserId) return data;
      let state = data.state;
      let rewards = data.rewards;
      const applied = new Set(data.appliedSharedSessions ?? []);
      const completed = [...action.snapshot.completed].sort((a, b) =>
        (a.completed_at ?? "").localeCompare(b.completed_at ?? "") || a.id.localeCompare(b.id));
      for (const row of completed) {
        if (row.user_id !== action.userId || row.status !== "completed" || !row.completed_at || applied.has(row.id)) continue;
        applied.add(row.id);
        const seconds = Math.floor(Number(row.elapsed_ms) / 1000);
        if (seconds < MIN_REWARD_SECONDS) continue;
        const seed = [...row.id].reduce((value, char) => Math.imul(value, 31) + char.charCodeAt(0), 0);
        const day = todayKey(new Date(row.completed_at));
        const result = applySession(state, row.biome, seconds, day, seededRandom(seed));
        if (state.lastSessionDate && day < state.lastSessionDate) {
          // Late delivery of older completions must preserve today's existing streak/count.
          result.state.lastSessionDate = state.lastSessionDate;
          result.state.streak = state.streak;
          result.state.todayDate = state.todayDate;
          result.state.todayFocusSeconds = state.todayFocusSeconds;
        }
        state = result.state;
        rewards = result.rewards;
      }
      const row = action.snapshot.row;
      const session = isActive(row) && row.user_id === action.userId ? sessionFromRow(row, action.snapshot.offset) : null;
      return { ...data, state: refreshDay(state, todayKey(new Date(action.now))), session, rewards, appliedSharedSessions: [...applied] };
    }
    case "onboarding":
      return { ...data, state: { ...data.state, seenOnboarding: true } };
    case "biome":
      return data.state.unlockedBiomes.includes(action.id)
        ? { ...data, state: { ...data.state, currentBiome: action.id } }
        : data;
    case "start":
      if (data.session) return data;
      return {
        ...data,
        session: createSession(data.state.currentBiome, action.seconds, action.quote, action.now),
        rewards: null,
      };
    case "pause":
      return data.session ? { ...data, session: pauseSessionAt(data.session, action.now) } : data;
    case "resume":
      return data.session ? { ...data, session: resumeSessionAt(data.session, action.now) } : data;
    case "complete": {
      const session = data.session;
      if (!session || session.id !== action.id) return data;
      const seconds = elapsedSeconds(session, action.now);
      if (seconds < MIN_REWARD_SECONDS) return data;
      const finishedAt = session.plannedSeconds !== null && session.startedAt !== null &&
        seconds >= session.plannedSeconds
        ? Math.min(action.now, session.startedAt + session.plannedSeconds * 1000 - session.elapsedMs)
        : action.now;
      const today = todayKey(new Date(finishedAt));
      const { state, rewards } = applySession(
        data.state,
        session.biome,
        seconds,
        today,
        seededRandom(Number(session.id) ^ action.now),
      );
      return { ...data, state: refreshDay(state, todayKey(new Date(action.now))), rewards, session: null };
    }
    case "abandon":
      return { ...data, session: null, rewards: null };
    case "audio":
      return { ...data, state: { ...data.state, audio: action.audio } };
    case "reset":
      return {
        ...data,
        state: {
          ...freshState(action.now),
          seenOnboarding: true,
          audio: data.state.audio,
          plus: data.state.plus,
        },
        session: null,
        rewards: null,
      };
    case "day": {
      const state = refreshDay(data.state, action.today);
      return state === data.state ? data : { ...data, state };
    }
    case "import":
      return {
        ...data,
        state: refreshDay(action.state, todayKey(new Date())),
        rewards: null,
      };
    case "unlock_plus":
      return {
        ...data,
        state: {
          ...data.state,
          plus: {
            isPlus: true,
            unlockedAt: new Date().toISOString(),
            transactionId: action.transactionId ?? `tide_plus_${Date.now()}`,
            source: action.source ?? "purchase",
          },
        },
      };
    case "revoke_plus":
      return {
        ...data,
        state: {
          ...data.state,
          plus: {
            isPlus: false,
            unlockedAt: null,
            transactionId: null,
            source: "none",
          },
        },
      };
  }
}
