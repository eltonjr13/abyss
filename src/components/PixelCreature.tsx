import { useEffect, useRef } from "react";
import type { Species } from "../types";
import { getSpriteCanvas } from "../ocean/sprites";
import { creaturePose } from "../ocean/creature-motion";
import { observeCreatureAnimation } from "../ocean/creature-clock";

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
      ? species.palette.map(() => "#708a96")
      : species.palette;
    const ctx = canvas.getContext("2d")!;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const phase = [...species.id].reduce((n, ch) => n + ch.charCodeAt(0), 0) % 17;
    let lastFrame = -1;
    let visible = false;
    let unsubscribe: (() => void) | undefined;
    const draw = (seconds: number) => {
      const frame = silhouette ? 0 : creaturePose(species.shape, seconds, phase, 1, motion.matches, species.id).frame;
      if (frame === lastFrame) return;
      lastFrame = frame;
      // Cache native resolution so portraits share frames with the ocean.
      const spr = getSpriteCanvas(species.shape, palette, false, 1, frame, species.id);
      const width = Math.round(spr.width * scale / 2);
      const height = Math.round(spr.height * scale / 2);
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(spr, 0, 0, width, height);
    };
    const update = () => {
      unsubscribe?.(); unsubscribe = undefined;
      draw(0);
      if (visible && !silhouette && !motion.matches) unsubscribe = observeCreatureAnimation(draw);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(canvas);
    motion.addEventListener("change", update);
    draw(0);
    return () => { observer.disconnect(); motion.removeEventListener("change", update); unsubscribe?.(); };
  }, [species, scale, silhouette]);

  return (
    <canvas
      ref={ref}
      className="mx-auto"
      style={{ imageRendering: "pixelated", maxWidth: "100%", height: "auto" }}
      aria-hidden
    />
  );
}
