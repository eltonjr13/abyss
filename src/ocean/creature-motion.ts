import type { ShapeId } from "../types";
import { CREATURE_FRAMES } from "./creature-art";

export type Locomotion = "swim" | "pulse" | "glide" | "crawl" | "anchored" | "surface";

export function locomotion(shape: ShapeId, species = ""): Locomotion {
  if (species === "peixe-tripode") return "anchored";
  if (["coral", "star", "urchin", "oyster", "leaf"].includes(shape)) return "anchored";
  if (shape === "crab") return "crawl";
  if (shape === "bird") return "surface";
  if (["jelly", "octopus", "squid", "seahorse", "nautilus"].includes(shape)) return "pulse";
  if (["ray", "manta", "whale", "turtle", "otter"].includes(shape)) return "glide";
  return "swim";
}

export function creaturePose(shape: ShapeId, time: number, phase: number, speed = 1, reduced = false, species = "") {
  const mode = locomotion(shape, species);
  const cycle = time * speed * (mode === "swim" ? 5 : mode === "crawl" ? 4 : 2.4) + phase;
  return {
    frame: reduced ? 0 : ((Math.floor(cycle / (Math.PI * 2) * CREATURE_FRAMES) % CREATURE_FRAMES) + CREATURE_FRAMES) % CREATURE_FRAMES,
    surge: mode === "anchored" ? 0 : mode === "pulse" ? 0.35 + 0.9 * Math.max(0, Math.sin(cycle)) : 0.85 + 0.15 * Math.sin(cycle),
    bob: mode === "anchored" || mode === "crawl" ? 0 : Math.sin(time * speed + phase),
    tilt: reduced || mode === "anchored" || mode === "crawl" ? 0 : Math.cos(time * speed + phase) * (mode === "glide" ? 0.04 : 0.08),
  };
}
