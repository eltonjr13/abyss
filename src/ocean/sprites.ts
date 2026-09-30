import type { ShapeId } from "../types";
import { CREATURE_FRAMES, creatureRows } from "./creature-art";

const shapeIds: ShapeId[] = ["fish1", "fish2", "fish3", "clown", "angel", "turtle", "seahorse", "jelly", "shark", "ray", "whale", "dolphin", "octopus", "crab", "star", "coral", "lantern", "angler", "squid", "manta", "otter", "unknown", "shrimp", "eel", "nautilus", "bird", "urchin", "oyster", "leaf"];

/** Static poses remain available to the landing-page exporter. */
export const SHAPES = Object.fromEntries(shapeIds.map(shape => [shape, creatureRows(shape)])) as Record<ShapeId, string[]>;

const spriteCache = new Map<string, HTMLCanvasElement>();
const CACHE_LIMIT = 1024;

export function getSpriteCanvas(
  shape: ShapeId,
  palette: string[],
  flip: boolean,
  scale: number,
  frame = 0,
  species = "",
): HTMLCanvasElement {
  const pose = ((Math.floor(frame) % CREATURE_FRAMES) + CREATURE_FRAMES) % CREATURE_FRAMES;
  const key = `${shape}|${palette.join(",")}|${flip ? 1 : 0}|${scale}|${pose}|${species}`;
  const hit = spriteCache.get(key);
  if (hit) return hit;

  const rows = creatureRows(shape, pose, species);
  const c = document.createElement("canvas");
  c.width = rows[0].length * scale;
  c.height = rows.length * scale;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][flip ? rows[y].length - 1 - x : x];
      if (ch === ".") continue;
      ctx.fillStyle = palette[Number(ch)] ?? palette[0] ?? "#fff";
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  if (spriteCache.size >= CACHE_LIMIT) spriteCache.delete(spriteCache.keys().next().value!);
  spriteCache.set(key, c);
  return c;
}

export function spriteSize(shape: ShapeId): { w: number; h: number } {
  const rows = SHAPES[shape];
  return { w: rows[0].length, h: rows.length };
}
