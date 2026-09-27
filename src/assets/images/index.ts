import reefDead from "./optimized/reef-dead.jpg";
import reefAlive from "./optimized/reef-alive.jpg";
import reefNight from "./optimized/reef-night.jpg";
import kelp from "./optimized/kelp.jpg";
import mangrove from "./optimized/mangrove.jpg";
import island from "./optimized/island.jpg";
import deep from "./optimized/deep.jpg";
import abyss from "./optimized/abyss.jpg";
import surface from "./optimized/surface.jpg";
import map from "./optimized/map.jpg";
import type { BiomeId, TimeOfDay } from "../../types";

export const IMAGES = {
  reefDead,
  reefAlive,
  reefNight,
  kelp,
  mangrove,
  island,
  deep,
  abyss,
  surface,
  map,
};

/**
 * Retorna somente as URLs das imagens necessárias para o bioma e período do dia informados.
 * Isso evita carregar todos os 18MB/assets de uma vez no boot, carregando estritamente sob demanda.
 */
export function getBiomeImageSources(biome: BiomeId, timeOfDay: TimeOfDay): string[] {
  if (biome === "reef") {
    const list = [IMAGES.reefDead, IMAGES.reefAlive];
    if (timeOfDay === "night") list.push(IMAGES.reefNight);
    return list;
  }
  const biomeMap: Record<BiomeId, string> = {
    reef: IMAGES.reefAlive,
    kelp: IMAGES.kelp,
    mangrove: IMAGES.mangrove,
    island: IMAGES.island,
    deep: IMAGES.deep,
    abyss: IMAGES.abyss,
  };
  return [biomeMap[biome]];
}
