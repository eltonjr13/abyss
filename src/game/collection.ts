import { BIOMES, BIOME_ORDER } from "../data/biomes";
import { SPECIES, SPECIES_BY_ID } from "../data/species";
import type { GameState, Rarity, Species } from "../types";

export const RARITIES: Record<Rarity, { label: string; color: string; minutes: number; chance: number }> = {
  comum: { label: "Comum", color: "#8aa8a8", minutes: 15, chance: 0.35 },
  incomum: { label: "Incomum", color: "#7ec8a0", minutes: 45, chance: 0.18 },
  rara: { label: "Rara", color: "#d4b06a", minutes: 90, chance: 0.08 },
  lendaria: { label: "Lendária", color: "#d080b0", minutes: 180, chance: 0.02 },
};

export function researchRequired(species: Species): number {
  return RARITIES[species.rarity].minutes * 60;
}

export function encounterChance(species: Species, seconds: number): number {
  return 1 - Math.pow(1 - RARITIES[species.rarity].chance, Math.max(0, seconds) / (25 * 60));
}

export function researchProgress(state: GameState, species: Species) {
  const required = researchRequired(species);
  const seconds = Math.min(required, state.researchSeconds[species.id] ?? 0);
  const discovered = state.discovered.includes(species.id);
  const unlocked = state.unlockedBiomes.includes(species.biome);
  const ready = unlocked && state.biomeLife[species.biome] >= species.minLife;
  return { seconds, required, percent: Math.floor(seconds / required * 100), discovered, unlocked, ready };
}

export function trackedSpecies(state: GameState): Species | null {
  const target = state.targetSpecies ? SPECIES_BY_ID[state.targetSpecies] : null;
  if (target && !state.discovered.includes(target.id)) return target;
  return SPECIES.filter(s => s.biome === state.currentBiome && !state.discovered.includes(s.id))
    .sort((a, b) => a.minLife - b.minLife)[0] ?? null;
}

export function discoveryHint(species: Species): string {
  if (species.id === "o-silencio") return "Uma forma quase invisível espera no ponto mais vivo do abismo.";
  if (species.rarity === "lendaria") return `Um grande encontro espera quando ${BIOMES[species.biome].short} recuperar sua vida.`;
  return `${species.blurb} Procure em ${BIOMES[species.biome].name}.`;
}

export interface CollectionAchievement {
  id: string;
  name: string;
  description: string;
  speciesIds: string[];
  required: number;
}

export const COLLECTION_ACHIEVEMENTS: CollectionAchievement[] = [
  { id: "first-five", name: "Primeiras cores", description: "Descubra suas primeiras cinco espécies.", speciesIds: SPECIES.map(s => s.id), required: 5 },
  { id: "rays", name: "Asas do oceano", description: "Encontre a Raia-pintada e a Jamanta.", speciesIds: ["raia-pintada", "jamanta"], required: 2 },
  { id: "giants", name: "Encontro com gigantes", description: "Descubra todas as baleias da coleção.", speciesIds: SPECIES.filter(s => s.id.startsWith("baleia-")).map(s => s.id), required: SPECIES.filter(s => s.id.startsWith("baleia-")).length },
  ...BIOME_ORDER.map(id => {
    const speciesIds = SPECIES.filter(s => s.biome === id).map(s => s.id);
    return { id: `habitat-${id}`, name: `${BIOMES[id].short} completo`, description: `Descubra todas as espécies de ${BIOMES[id].name}.`, speciesIds, required: speciesIds.length };
  }),
  { id: "whole-ocean", name: "Guardião do oceano", description: "Complete as 58 descobertas do seu oceano.", speciesIds: SPECIES.map(s => s.id), required: SPECIES.length },
];

export function collectionAchievements(discovered: readonly string[]) {
  const known = new Set(discovered);
  return COLLECTION_ACHIEVEMENTS.map(achievement => {
    const found = Math.min(achievement.required, achievement.speciesIds.filter(id => known.has(id)).length);
    return { ...achievement, found, complete: found >= achievement.required };
  });
}

// Only the portion of a session after the habitat becomes suitable counts as research.
export function suitableFocusSeconds(oldLife: number, minLife: number, seconds: number): number {
  const missingLife = Math.max(0, minLife - oldLife);
  const minutesToReady = missingLife <= 10.5 ? missingLife / 0.42 : 25 + (missingLife - 10.5) / 0.22;
  return Math.max(0, seconds - Math.ceil(minutesToReady * 60));
}
