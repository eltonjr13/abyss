import { useEffect, useRef } from "react";
import { getTimeOfDay } from "../data/biomes";
import { useGame } from "../game/GameContext";
import { OceanEngine } from "../ocean/engine";
import { cn } from "../utils/cn";

export function OceanCanvas({ dimmed = false }: { dimmed?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<OceanEngine | null>(null);
  const { state, view } = useGame();
  const intensity = view === "focus" ? 0.85 : 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new OceanEngine(canvas, {
      biome: state.currentBiome,
      life: state.biomeLife[state.currentBiome] ?? 0,
      timeOfDay: getTimeOfDay(),
      intensity,
      discovered: state.discovered,
    });
    engineRef.current = engine;
    void engine.init();
    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      engine.stop();
      engineRef.current = null;
    };
    // engine lives for the canvas mount; config updates happen below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setConfig({
      biome: state.currentBiome,
      life: state.biomeLife[state.currentBiome] ?? 0,
      timeOfDay: getTimeOfDay(),
      intensity,
      discovered: state.discovered,
    });
  }, [state.currentBiome, state.biomeLife, state.discovered, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "pointer-events-none fixed inset-0 h-full w-full transition-opacity duration-700",
        dimmed ? "opacity-35" : "opacity-100",
      )}
      style={{ imageRendering: "auto" }}
    />
  );
}
