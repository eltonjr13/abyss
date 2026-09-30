import type { BiomeId, TimeOfDay } from "../types";

type RGB = readonly [number, number, number];

export interface WaterProfile {
  sunlight: number;
  current: number;
  haze: RGB;
}

export const WATER: Record<BiomeId, WaterProfile> = {
  reef: { sunlight: 1, current: 1.6, haze: [42, 133, 150] },
  kelp: { sunlight: 0.55, current: 1.2, haze: [43, 107, 99] },
  mangrove: { sunlight: 0.4, current: 0.7, haze: [89, 117, 90] },
  island: { sunlight: 1.1, current: 2.1, haze: [64, 151, 163] },
  deep: { sunlight: 0.045, current: 0.5, haze: [26, 58, 93] },
  abyss: { sunlight: 0, current: 0.3, haze: [19, 33, 57] },
};

const SUN: Record<TimeOfDay, number> = { dawn: 0.55, day: 1, dusk: 0.35, night: 0 };
const LIGHT: Record<TimeOfDay, RGB> = {
  dawn: [255, 213, 163], day: [211, 244, 246], dusk: [250, 178, 136], night: [111, 162, 196],
};

export function waterLight(biome: BiomeId, timeOfDay: TimeOfDay) {
  return { strength: WATER[biome].sunlight * SUN[timeOfDay], color: LIGHT[timeOfDay] };
}

/** A slow shared flow; local eddies vary by depth, never by particle identity. */
export function waterCurrent(biome: BiomeId, time: number, y: number) {
  const strength = WATER[biome].current;
  return {
    x: strength * (0.8 + 0.35 * Math.sin(time * 0.22 + y * 0.009)),
    y: strength * 0.22 * Math.sin(time * 0.17 + y * 0.014),
  };
}

/** Quantize distance into three cached palettes instead of filtering every sprite each frame. */
export function submergedPalette(palette: string[], biome: BiomeId, timeOfDay: TimeOfDay, z: number, emissive = false) {
  const distance = z < 0.45 ? 0.65 : z < 0.75 ? 0.35 : 0.1;
  const haze = WATER[biome].haze;
  const light = LIGHT[timeOfDay];
  const dim = timeOfDay === "night" ? 0.58 : timeOfDay === "dusk" ? 0.85 : 1;
  const depthDim = biome === "abyss" ? 0.65 : biome === "deep" ? 0.8 : 1;
  return palette.map((hex, index) => {
    // Preserve the luminous accents, while still submerging the body.
    if (emissive && index >= 3) return hex;
    const value = Number.parseInt(hex.slice(1), 16);
    const channels = [value >> 16 & 255, value >> 8 & 255, value & 255];
    return "#" + channels.map((channel, i) => {
      const immersed = channel * (1 - distance * 0.5) + haze[i] * distance * 0.5;
      return Math.round(Math.min(255, immersed * dim * depthDim * (0.94 + light[i] / 255 * 0.06))).toString(16).padStart(2, "0");
    }).join("");
  });
}

/** Zero slope at both ends, with a short fade for reduced-motion users. */
export function habitatBlend(elapsed: number, reduced = false) {
  const t = Math.min(1, Math.max(0, elapsed / (reduced ? 0.24 : 1.4)));
  return t * t * (3 - 2 * t);
}
