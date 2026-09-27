import { useEffect, useState } from "react";
import { perfMonitor, type PerfMetrics } from "../perf/monitor";
import { cn } from "../utils/cn";

export function PerfPanel() {
  const [open, setOpen] = useState(false);
  const [metrics, setMetrics] = useState<PerfMetrics>(() => perfMonitor.getMetrics());

  useEffect(() => {
    return perfMonitor.subscribe((m) => setMetrics(m));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Toggle com Ctrl+Shift+D ou tecla Alt+P
      if ((e.ctrlKey && e.shiftKey && e.code === "KeyD") || (e.altKey && e.code === "KeyP")) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-2 left-2 z-50 rounded bg-[#07121b]/80 px-2 py-1 text-[9px] font-mono tracking-wider text-white/50 backdrop-blur hover:text-white/90"
        title="Abrir diagnóstico de desempenho e bateria (Atalho: Ctrl+Shift+D)"
        aria-label="Abrir diagnóstico de desempenho e bateria"
      >
        {metrics.fps} FPS · {metrics.frameTimeMs}ms
        {metrics.batteryLevel !== null && ` · 🔋${metrics.batteryLevel}%`}
      </button>
    );
  }

  const toggleLowPower = () => {
    perfMonitor.setLowPowerMode(!metrics.lowPowerMode);
  };

  const fpsColor =
    metrics.fps >= 55
      ? "text-emerald-400"
      : metrics.fps >= 28
      ? "text-amber-400"
      : "text-rose-400";

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 rounded-xl border border-white/20 bg-[#07121b]/95 p-4 text-xs text-white shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[11px] tracking-widest text-[var(--gold)]">
            DIAGNÓSTICO
          </span>
          <span className="text-[10px] text-white/40">Desempenho & Bateria</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-white/40 hover:text-white"
          aria-label="Fechar diagnóstico"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 space-y-2.5 font-mono text-[11px]">
        {/* Animação & FPS */}
        <div className="flex items-center justify-between">
          <span className="text-white/60">Taxa de quadros:</span>
          <span className={cn("font-bold", fpsColor)}>
            {metrics.fps} FPS <span className="text-[9px] text-white/40">(alvo: {metrics.targetFps})</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/60">Tempo de frame (CPU):</span>
          <span>{metrics.frameTimeMs} ms</span>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded bg-black/30 p-2 text-[10px] text-white/70">
          <div>Simulação: {metrics.simulateTimeMs} ms</div>
          <div>Render canvas: {metrics.drawTimeMs} ms</div>
          <div>Quadros perdidos: {metrics.droppedFrames}</div>
          <div>Alvo orçamento: {(1000 / metrics.targetFps).toFixed(1)} ms</div>
        </div>

        {/* Entidades Ativas */}
        <div className="border-t border-white/10 pt-2">
          <span className="text-[10px] uppercase tracking-wider text-white/40">
            Carga no Canvas ({metrics.activeFish + metrics.activeBubbles + metrics.activeMotes + metrics.activePlants} objetos)
          </span>
          <div className="mt-1 grid grid-cols-3 gap-1 text-[10px] text-white/80">
            <div>🐟 Peixes: {metrics.activeFish}</div>
            <div>🫧 Bolhas: {metrics.activeBubbles}</div>
            <div>✨ Motes: {metrics.activeMotes}</div>
            <div>🌿 Plantas: {metrics.activePlants}</div>
            <div>🌊 Raios: {metrics.activeRays}</div>
            <div>🪨 Detritos: {metrics.activeDebris}</div>
          </div>
        </div>

        {/* Áudio */}
        <div className="border-t border-white/10 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-white/60">Áudio (Web Audio):</span>
            <span
              className={
                metrics.audioState === "running"
                  ? "text-emerald-400"
                  : metrics.audioState === "suspended"
                  ? "text-amber-400"
                  : "text-white/40"
              }
            >
              {metrics.audioState}
            </span>
          </div>
          {metrics.audioSampleRate > 0 && (
            <div className="mt-0.5 text-[10px] text-white/50">
              Taxa: {(metrics.audioSampleRate / 1000).toFixed(1)} kHz · Latência:{" "}
              {metrics.audioOutputLatencyMs} ms
            </div>
          )}
        </div>

        {/* Bateria */}
        <div className="border-t border-white/10 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-white/60">Bateria do dispositivo:</span>
            <span>
              {metrics.batterySupported && metrics.batteryLevel !== null
                ? `${metrics.batteryLevel}% ${metrics.batteryCharging ? "⚡ (carregando)" : "🔋"}`
                : "Não disponível na API"}
            </span>
          </div>
          {metrics.batteryDischargingHours !== null && !metrics.batteryCharging && (
            <div className="mt-0.5 text-[10px] text-white/50">
              Estimativa restante: {metrics.batteryDischargingHours} horas
            </div>
          )}
        </div>

        {/* Economia de Bateria */}
        <div className="border-t border-white/10 pt-2">
          <button
            onClick={toggleLowPower}
            className={cn(
              "flex w-full items-center justify-between rounded px-2.5 py-1.5 transition",
              metrics.lowPowerMode
                ? "bg-amber-500/20 text-amber-200 border border-amber-500/40"
                : "bg-white/10 text-white/70 hover:bg-white/15"
            )}
          >
            <span>Modo Economia (30 FPS)</span>
            <span className="font-sans font-medium">
              {metrics.lowPowerMode ? "ATIVADO" : "DESATIVADO"}
            </span>
          </button>
          <p className="mt-1 text-[9px] text-white/40">
            Reduz taxa de quadros e partículas decorativas para poupar bateria e resfriar a CPU.
          </p>
        </div>
      </div>
    </div>
  );
}
