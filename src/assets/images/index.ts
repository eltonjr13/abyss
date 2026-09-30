import reefDead from "./scenery/reef-dead.webp";
import reefAlive from "./scenery/reef-alive.webp";
import reefNight from "./scenery/reef-night.webp";
import kelp from "./scenery/kelp.webp";
import mangrove from "./scenery/mangrove.webp";
import island from "./scenery/island.webp";
import deep from "./scenery/deep.webp";
import abyss from "./scenery/abyss.webp";
import surface from "./scenery/surface.webp";
import map from "./scenery/map.webp";
import type { BiomeId, TimeOfDay } from "../../types";
import { getBiomeImageKeys, type ImageKey } from "./keys";

export { getBiomeImageKeys, type ImageKey };

export const IMAGES: Record<ImageKey, string> = {
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
 * A decodificação do cenário acontece sob demanda, conforme o habitat e o horário.
 */
export function getBiomeImageSources(biome: BiomeId, timeOfDay: TimeOfDay): string[] {
  return getBiomeImageKeys(biome, timeOfDay).map((key) => IMAGES[key]);
}
