import { discoveredSpeciesOfBiome } from "../data/species";
import type { BiomeId, Species, TimeOfDay } from "../types";

/** Every discovery gets a place; extra swimmers never overwhelm a small collection. */
export function oceanPopulation(biome: BiomeId, discovered: readonly string[], life: number, timeOfDay: TimeOfDay): Species[] {
  const pool = discoveredSpeciesOfBiome(biome, discovered);
  if (!pool.length) return [];
  const density = Math.floor(2 + Math.max(0, Math.min(100, life)) / 100 * (timeOfDay === "night" ? 10 : 16));
  const count = Math.max(pool.length, Math.min(density, pool.length * 2));
  return Array.from({ length: count }, (_, index) => pool[index % pool.length]!);
}
