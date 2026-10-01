import type { BiomeId } from "../types";

export function habitatRestoration(biome: BiomeId, life: number) {
  const progress = Math.max(0, Math.min(1, life / 100));
  const recovery = progress * progress * (3 - 2 * progress);
  const deep = biome === "deep" || biome === "abyss";
  return {
    label: life < 25 ? "Em recuperação inicial" : life < 65 ? "Vida retornando" : life < 100 ? "Habitat florescendo" : "Habitat restaurado",
    recovery,
    saturation: 0.18 + recovery * 0.82,
    brightness: (deep ? 0.65 : 0.5) + recovery * (deep ? 0.35 : 0.5),
    sediment: (1 - recovery) * (deep ? 0.12 : 0.3),
    plants: Math.floor(recovery * 21),
    plantGrowth: 0.15 + recovery * 0.85,
  };
}
