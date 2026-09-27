import type { BiomeId, TimeOfDay } from "../../types";

export type ImageKey =
  | "reefDead"
  | "reefAlive"
  | "reefNight"
  | "kelp"
  | "mangrove"
  | "island"
  | "deep"
  | "abyss"
  | "surface"
  | "map";

/**
 * Retorna as chaves lógicas das imagens necessárias para o bioma e horário informados.
 * Garante carregamento sob demanda puro e desacoplado.
 */
export function getBiomeImageKeys(biome: BiomeId, timeOfDay: TimeOfDay): ImageKey[] {
  if (biome === "reef") {
    const list: ImageKey[] = ["reefDead", "reefAlive"];
    if (timeOfDay === "night") list.push("reefNight");
    return list;
  }
  const biomeMap: Record<BiomeId, ImageKey> = {
    reef: "reefAlive",
    kelp: "kelp",
    mangrove: "mangrove",
    island: "island",
    deep: "deep",
    abyss: "abyss",
  };
  return [biomeMap[biome]];
}
