import { useEffect, useRef } from "react";
import type { Species } from "../types";
import { getSpriteCanvas } from "../ocean/sprites";

export function PixelCreature({
  species,
  scale = 6,
  silhouette = false,
}: {
  species: Species;
  scale?: number;
  silhouette?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const palette = silhouette
      ? species.palette.map(() => "#2a3a44")
      : species.palette;
    const spr = getSpriteCanvas(species.shape, palette, false, scale);
    canvas.width = spr.width;
    canvas.height = spr.height;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(spr, 0, 0);
  }, [species, scale, silhouette]);

  return (
    <canvas
      ref={ref}
      className="mx-auto"
      style={{ imageRendering: "pixelated" }}
      aria-hidden
    />
  );
}
