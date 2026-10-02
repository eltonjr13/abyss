import { COMPLETE_QUOTES } from "../data/quotes";
import { SPECIES } from "../data/species";
import { levelFromXp } from "../data/levels";
import { clamp, shiftDateKey, todayKey } from "../lib/format";
import type { BiomeId, GameState, Rewards } from "../types";
import { MIN_REWARD_SECONDS } from "./session";
import { collectionAchievements, encounterChance, researchRequired, suitableFocusSeconds } from "./collection";

function lifeGainFor(seconds: number): number {
  const m = seconds / 60;
  return Math.round((Math.min(m, 25) * 0.42 + Math.max(0, m - 25) * 0.22) * 10) / 10;
}

function xpFor(seconds: number): number {
  const m = seconds / 60;
  return Math.max(1, Math.round(m * 1.2));
}

function updateStreak(state: GameState, today: string): number {
  if (state.lastSessionDate === today) return Math.max(1, state.streak);
  if (state.lastSessionDate === shiftDateKey(today, -1)) return state.streak + 1;
  return 1;
}

function updateHistory(history: GameState["history"], today: string, seconds: number) {
  const next = history.map((h) => ({ ...h }));
  const found = next.find((h) => h.date === today);
  if (found) found.seconds += seconds;
  else next.push({ date: today, seconds });
  next.sort((a, b) => a.date.localeCompare(b.date));
  return next.slice(-60);
}

export function unlockCheck(state: GameState): BiomeId[] {
  const life = state.biomeLife;
  const newly: BiomeId[] = [];
  const has = new Set(state.unlockedBiomes);
  const add = (id: BiomeId) => {
    if (!has.has(id)) {
      has.add(id);
      newly.push(id);
    }
  };

  if (life.reef >= 16) add("kelp");
  if ((life.kelp >= 14 || life.reef >= 40) && has.has("kelp")) add("mangrove");
  if ((life.mangrove >= 14 || life.kelp >= 36) && has.has("mangrove")) add("island");
  if (life.island >= 18 && state.totalFocusSeconds >= 40 * 60 && has.has("island")) add("deep");
  if (life.deep >= 22 && levelFromXp(state.xp) >= 4 && has.has("deep")) add("abyss");

  return newly;
}

function rollDiscoveries(
  state: GameState,
  biome: BiomeId,
  seconds: number,
  newLife: number,
  random: () => number,
): { found: string[]; researchSeconds: Record<string, number>; researchGains: Record<string, number>; guaranteed: string[] } {
  const pending = SPECIES.filter(
    (s) => s.biome === biome && newLife >= s.minLife && !state.discovered.includes(s.id),
  );
  const researchSeconds = { ...state.researchSeconds };
  const researchGains: Record<string, number> = {};
  const guaranteed: string[] = [];
  const found = new Set<string>();
  const ordered = [...pending].sort((a, b) => a.minLife - b.minLife);
  for (const species of ordered) {
    const activeSeconds = suitableFocusSeconds(state.biomeLife[biome], species.minLife, seconds);
    const previous = researchSeconds[species.id] ?? 0;
    const next = Math.min(researchRequired(species), previous + activeSeconds);
    researchSeconds[species.id] = next;
    researchGains[species.id] = next - previous;
    if (next >= researchRequired(species)) {
      found.add(species.id);
      guaranteed.push(species.id);
    } else {
      // Duration-based probability: splitting focus into tiny sessions gives no extra chance.
      const chance = encounterChance(species, activeSeconds);
      if (random() < chance) found.add(species.id);
    }
  }
  // The first five accumulated minutes welcome the player with an eligible common species.
  if (!state.discovered.length && state.totalFocusSeconds + seconds >= 5 * 60) {
    const first = ordered.find(s => s.rarity === "comum");
    if (first) found.add(first.id);
  }
  return { found: pending.filter(s => found.has(s.id)).map(s => s.id), researchSeconds, researchGains, guaranteed };
}

export function applySession(
  state: GameState,
  biome: BiomeId,
  seconds: number,
  today = todayKey(),
  random: () => number = Math.random,
): { state: GameState; rewards: Rewards } {
  if (!Number.isFinite(seconds) || seconds < MIN_REWARD_SECONDS) {
    throw new Error("A sessão precisa de pelo menos um minuto de foco.");
  }
  const safeSeconds = Math.floor(seconds);
  const gain = lifeGainFor(safeSeconds);
  const xp = xpFor(safeSeconds);
  const oldLife = state.biomeLife[biome] ?? 0;
  const newLife = clamp(oldLife + gain, 0, 100);
  const oldLevel = levelFromXp(state.xp);

  const discoveries = rollDiscoveries(state, biome, safeSeconds, newLife, random);
  const discovered = discoveries.found;
  const pity = { ...state.pity };
  for (const s of SPECIES.filter((sp) => sp.biome === biome && newLife >= sp.minLife && !state.discovered.includes(sp.id))) {
    if (discovered.includes(s.id)) delete pity[s.id];
    else pity[s.id] = (pity[s.id] ?? 0) + 1;
  }

  let next: GameState = {
    ...state,
    xp: state.xp + xp,
    totalFocusSeconds: state.totalFocusSeconds + safeSeconds,
    todayFocusSeconds: (state.todayDate === today ? state.todayFocusSeconds : 0) + safeSeconds,
    todayDate: today,
    streak: updateStreak(state, today),
    lastSessionDate: today,
    sessionsCompleted: state.sessionsCompleted + 1,
    biomeLife: { ...state.biomeLife, [biome]: newLife },
    discovered: [...state.discovered, ...discovered],
    history: updateHistory(state.history, today, safeSeconds),
    pity,
    researchSeconds: discoveries.researchSeconds,
    targetSpecies: state.targetSpecies && discovered.includes(state.targetSpecies) ? null : state.targetSpecies,
  };

  const newBiomes = unlockCheck(next);
  if (newBiomes.length) {
    next = {
      ...next,
      unlockedBiomes: [...next.unlockedBiomes, ...newBiomes],
    };
  }

  const newLevel = levelFromXp(next.xp);
  const previousAchievements = new Set(collectionAchievements(state.discovered).filter(a => a.complete).map(a => a.id));
  const rewards: Rewards = {
    xp,
    lifeGain: Math.round((newLife - oldLife) * 10) / 10,
    biome,
    seconds: safeSeconds,
    newSpecies: discovered,
    newBiomes,
    newAchievements: collectionAchievements(next.discovered)
      .filter(a => a.complete && !previousAchievements.has(a.id))
      .map(a => a.id),
    researchGains: discoveries.researchGains,
    guaranteedSpecies: discoveries.guaranteed,
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
    oldLife,
    newLife,
    quote: COMPLETE_QUOTES[biome][Math.floor(random() * COMPLETE_QUOTES[biome].length)]!,
  };

  return { state: next, rewards };
}

export const DURATIONS = [
  { label: "5 min", seconds: 5 * 60 },
  { label: "15 min", seconds: 15 * 60 },
  { label: "25 min", seconds: 25 * 60 },
  { label: "45 min", seconds: 45 * 60 },
  { label: "60 min", seconds: 60 * 60 },
  { label: "90 min", seconds: 90 * 60 },
];
