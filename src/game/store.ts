import { todayKey } from "../lib/format";
import type { ActiveSession, AudioSettings, BiomeId, GameState, Rewards } from "../types";
import { applySession } from "./progress";
import { freshState, loadSnapshot, refreshDay } from "./save";
import { createSession, elapsedSeconds, MIN_REWARD_SECONDS, pauseSessionAt, resumeSessionAt } from "./session";

export interface GameData {
  state: GameState;
  session: ActiveSession | null;
  rewards: Rewards | null;
}

export type GameAction =
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
  | { type: "import"; state: GameState };

export function initialGameData(): GameData {
  return { ...loadSnapshot(), rewards: null };
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
      return { state: refreshDay(state, todayKey(new Date(action.now))), rewards, session: null };
    }
    case "abandon":
      return { ...data, session: null, rewards: null };
    case "audio":
      return { ...data, state: { ...data.state, audio: action.audio } };
    case "reset":
      return {
        state: { ...freshState(action.now), seenOnboarding: true, audio: data.state.audio },
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
  }
}
