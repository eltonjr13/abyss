import { BIOME_ORDER } from "../data/biomes";
import { SPECIES } from "../data/species";
import { clamp, shiftDateKey, todayKey } from "../lib/format";
import type { ActiveSession, BiomeId, GameState } from "../types";

const KEY = "tide-save-v2";
const LEGACY_KEY = "tide-save-v1";
const speciesIds = new Set(SPECIES.map((species) => species.id));
const biomeIds = new Set<string>(BIOME_ORDER);

export interface SaveSnapshot {
  state: GameState;
  session: ActiveSession | null;
}

export const INITIAL: GameState = {
  seenOnboarding: false,
  xp: 0,
  totalFocusSeconds: 0,
  todayFocusSeconds: 0,
  todayDate: todayKey(),
  streak: 0,
  lastSessionDate: null,
  sessionsCompleted: 0,
  currentBiome: "reef",
  biomeLife: { reef: 5, kelp: 0, mangrove: 0, island: 0, deep: 0, abyss: 0 },
  unlockedBiomes: ["reef"],
  discovered: [],
  history: [],
  audio: { music: 0.42, ambient: 0.5, sfx: 0.38 },
  pity: {},
};

export function freshState(now = Date.now()): GameState {
  return {
    ...INITIAL,
    todayDate: todayKey(new Date(now)),
    biomeLife: { ...INITIAL.biomeLife },
    unlockedBiomes: [...INITIAL.unlockedBiomes],
    discovered: [],
    history: [],
    audio: { ...INITIAL.audio },
    pity: {},
  };
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function nonNegative(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp(value, 0, Number.MAX_SAFE_INTEGER)
    : fallback;
}

function whole(value: unknown, fallback = 0): number {
  return Math.floor(nonNegative(value, fallback));
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  return todayKey(new Date(year!, month! - 1, day!)) === value;
}

function biomeId(value: unknown): value is BiomeId {
  return typeof value === "string" && biomeIds.has(value);
}

export function refreshDay(state: GameState, today: string): GameState {
  const streakCurrent =
    state.lastSessionDate === today || state.lastSessionDate === shiftDateKey(today, -1);
  if (state.todayDate === today && (streakCurrent || state.streak === 0)) return state;
  return {
    ...state,
    todayDate: today,
    todayFocusSeconds: state.todayDate === today ? state.todayFocusSeconds : 0,
    streak: streakCurrent ? state.streak : 0,
  };
}

export function hydrate(raw: unknown, now = Date.now()): GameState {
  const source = record(raw);
  const initial = freshState(now);
  const life = record(source.biomeLife);
  const audio = record(source.audio);
  const pity = record(source.pity);
  const unlocked = Array.isArray(source.unlockedBiomes)
    ? source.unlockedBiomes.filter(biomeId)
    : [];
  const unlockedBiomes = BIOME_ORDER.filter((id) => id === "reef" || unlocked.includes(id));
  const discovered = Array.isArray(source.discovered)
    ? [...new Set(source.discovered.filter((id): id is string => typeof id === "string" && speciesIds.has(id)))]
    : [];
  const history = Array.isArray(source.history)
    ? source.history
        .map(record)
        .filter((entry) => validDate(entry.date))
        .map((entry) => ({ date: entry.date as string, seconds: whole(entry.seconds) }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-60)
    : [];
  const biomeLife = { ...initial.biomeLife };
  for (const id of BIOME_ORDER) biomeLife[id] = clamp(nonNegative(life[id], biomeLife[id]), 0, 100);
  const safePity: Record<string, number> = {};
  for (const [id, count] of Object.entries(pity)) {
    if (speciesIds.has(id)) safePity[id] = Math.min(100, whole(count));
  }
  const currentBiome = biomeId(source.currentBiome) && unlockedBiomes.includes(source.currentBiome)
    ? source.currentBiome
    : "reef";
  const state: GameState = {
    ...initial,
    seenOnboarding: source.seenOnboarding === true,
    xp: whole(source.xp),
    totalFocusSeconds: whole(source.totalFocusSeconds),
    todayFocusSeconds: whole(source.todayFocusSeconds),
    todayDate: validDate(source.todayDate) ? source.todayDate : initial.todayDate,
    streak: whole(source.streak),
    lastSessionDate: validDate(source.lastSessionDate) ? source.lastSessionDate : null,
    sessionsCompleted: whole(source.sessionsCompleted),
    currentBiome,
    biomeLife,
    unlockedBiomes,
    discovered,
    history,
    audio: {
      music: clamp(nonNegative(audio.music, initial.audio.music), 0, 1),
      ambient: clamp(nonNegative(audio.ambient, initial.audio.ambient), 0, 1),
      sfx: clamp(nonNegative(audio.sfx, initial.audio.sfx), 0, 1),
    },
    pity: safePity,
  };
  return refreshDay(state, todayKey(new Date(now)));
}

function hydrateSession(raw: unknown, state: GameState, now: number): ActiveSession | null {
  const source = record(raw);
  if (!biomeId(source.biome) || !state.unlockedBiomes.includes(source.biome)) return null;
  if (typeof source.id !== "string" || typeof source.quote !== "string") return null;
  const plannedSeconds = source.plannedSeconds;
  if (plannedSeconds !== null &&
      (typeof plannedSeconds !== "number" || !Number.isInteger(plannedSeconds) ||
        plannedSeconds < 60 || plannedSeconds > 180 * 60)) return null;
  const startedAt = source.startedAt;
  if (startedAt !== null &&
      (typeof startedAt !== "number" || !Number.isFinite(startedAt))) return null;
  return {
    id: source.id,
    biome: source.biome,
    plannedSeconds,
    elapsedMs: Math.min(nonNegative(source.elapsedMs), 7 * 24 * 60 * 60 * 1000),
    startedAt: startedAt === null ? null : Math.min(startedAt as number, now),
    quote: source.quote,
  };
}

export function loadSnapshot(now = Date.now()): SaveSnapshot {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      const parsed = record(JSON.parse(saved));
      if (parsed.version === 2) {
        const state = hydrate(parsed.state, now);
        return { state, session: hydrateSession(parsed.session, state, now) };
      }
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    return { state: legacy ? hydrate(JSON.parse(legacy), now) : freshState(now), session: null };
  } catch {
    return { state: freshState(now), session: null };
  }
}

export function persistSnapshot(snapshot: SaveSnapshot): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 2, ...snapshot }));
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* Storage can be unavailable or full; the current session remains in memory. */
  }
}

export function loadState(now = Date.now()): GameState {
  return loadSnapshot(now).state;
}

export function persistState(state: GameState): void {
  try {
    const existing = loadSnapshot();
    persistSnapshot({ ...existing, state });
  } catch {
    /* ignore */
  }
}

export function overallLife(state: GameState): number {
  const ids = state.unlockedBiomes;
  if (!ids.length) return 0;
  const sum = ids.reduce((acc, id) => acc + (state.biomeLife[id] ?? 0), 0);
  return sum / ids.length;
}
