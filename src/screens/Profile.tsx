import { useEffect, useState } from "react";
import { SPECIES } from "../data/species";
import { BIOME_ORDER } from "../data/biomes";
import { levelTitle, xpProgress } from "../data/levels";
import { useGame } from "../game/GameContext";
import { overallLife } from "../game/save";
import { formatHours, shiftDateKey, todayKey } from "../lib/format";
import { getAudio } from "../audio/engine";
import { perfMonitor, type PerfMetrics } from "../perf/monitor";
import { SyncModal } from "../components/SyncModal";
import { PlusModal } from "../components/PlusModal";
import { cn } from "../utils/cn";

export function Profile() {
  const { state, setAudio, resetSave } = useGame();
  const [showSync, setShowSync] = useState(false);
  const [showPlus, setShowPlus] = useState(false);
  const [metrics, setMetrics] = useState<PerfMetrics>(() => perfMonitor.getMetrics());
  const [pauseAudioOnExit, setPauseAudioOnExit] = useState(() => {
    try {
      return localStorage.getItem("tide-pause-audio-background") !== "false";
    } catch {
      return true;
    }
  });
  const [reducedMotion, setReducedMotion] = useState(() => {
    try {
      return localStorage.getItem("tide-reduced-motion") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    return perfMonitor.subscribe((m) => setMetrics(m));
  }, []);

  const togglePauseOnExit = () => {
    const next = !pauseAudioOnExit;
    setPauseAudioOnExit(next);
    getAudio().setPauseOnBackground(next);
    try {
      localStorage.setItem("tide-pause-audio-background", String(next));
    } catch {
      /* ignore */
    }
  };

  const toggleReducedMotion = () => {
    const next = !reducedMotion;
    setReducedMotion(next);
    try {
      localStorage.setItem("tide-reduced-motion", String(next));
    } catch {
      /* ignore */
    }
  };

  const toggleLowPower = () => {
    perfMonitor.setLowPowerMode(!metrics.lowPowerMode);
  };

  const prog = xpProgress(state.xp);
  const today = todayKey();
  const week = Array.from({ length: 7 }, (_, i) => {
    const key = shiftDateKey(today, i - 6);
    const rec = state.history.find((h) => h.date === key);
    return { key, seconds: rec?.seconds ?? 0 };
  });
  const max = Math.max(1, ...week.map((d) => d.seconds));

  return (
    <div className="relative z-20 min-h-dvh px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[max(28px,env(safe-area-inset-top))] sm:px-6">
      <div className="mx-auto max-w-md">
        <p className="text-center font-pixel text-[11px] tracking-[0.4em] text-white/70 uppercase">
          Perfil
        </p>
        <h1 className="mt-3 text-center font-serif text-3xl text-[var(--foam)] italic">
          {levelTitle(prog.level)}
        </h1>
        <p className="mt-1 text-center text-[12px] tracking-[0.2em] text-white/70 uppercase">
          Nível {prog.level}
        </p>
        <div className="mx-auto mt-4 h-[6px] w-48 overflow-hidden bg-white/20 rounded-full">
          <div className="h-full bg-[var(--gold)]" style={{ width: `${prog.t * 100}%` }} />
        </div>
        <p className="mt-2 text-center text-[12px] text-white/60">
          {state.xp} XP · próximo {prog.next}
        </p>

        {/* Prévia da oferta TIDE Plus */}
        <div className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-white/15 bg-gradient-to-r from-white/5 to-[var(--gold)]/10 p-3.5 backdrop-blur-xs">
          <div>
            <p className="text-xs font-medium text-white/95">✦ TIDE Plus · Compra única</p>
            <p className="text-[10px] text-white/60">Conheça os extras planejados para o Plus</p>
          </div>
          <button
            onClick={() => setShowPlus(true)}
            className="rounded border border-[var(--gold)]/50 bg-[var(--gold)]/15 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--gold)] hover:bg-[var(--gold)]/25"
          >
            Conhecer
          </button>
        </div>

        {/* Estatísticas */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Stat label="Tempo de foco" value={formatHours(state.totalFocusSeconds)} />
          <Stat label="Sequência" value={`${state.streak} dias`} />
          <Stat label="Sessões" value={String(state.sessionsCompleted)} />
          <Stat label="Vida restaurada" value={`${Math.round(overallLife(state))}%`} />
          <Stat label="Espécies" value={`${state.discovered.length} / ${SPECIES.length}`} />
          <Stat
            label="Biomas"
            value={`${state.unlockedBiomes.length} / ${BIOME_ORDER.length}`}
          />
        </div>

        {/* Últimos 7 dias */}
        <p className="mt-8 text-[11px] font-medium tracking-[0.28em] text-white/70 uppercase">
          Últimos 7 dias
        </p>
        <div className="mt-3 flex h-24 items-end justify-between gap-1.5 rounded-lg border border-white/10 bg-[#071018]/50 p-3">
          {week.map((d) => (
            <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <div
                className={cn(
                  "w-full rounded-t-sm transition-all",
                  d.seconds > 0 ? "bg-[var(--foam)]/85" : "bg-white/15"
                )}
                style={{ height: `${Math.max(6, (d.seconds / max) * 100)}%` }}
                title={`${d.key}: ${formatHours(d.seconds)}`}
              />
              <span className="text-[9px] text-white/60">{d.key.slice(8)}</span>
            </div>
          ))}
        </div>

        {/* Controles de Áudio (Item 7) */}
        <p className="mt-8 text-[11px] font-medium tracking-[0.28em] text-white/70 uppercase">
          Áudio & Paisagem Sonora
        </p>
        <div className="mt-3 space-y-3 rounded-lg border border-white/10 bg-[#071018]/50 p-4">
          <Slider
            label="Música"
            value={state.audio.music}
            onChange={(v) => {
              const next = { ...state.audio, music: v };
              setAudio(next);
              void getAudio().start(state.currentBiome);
            }}
          />
          <Slider
            label="Ambiente"
            value={state.audio.ambient}
            onChange={(v) => setAudio({ ...state.audio, ambient: v })}
          />
          <Slider
            label="Efeitos"
            value={state.audio.sfx}
            onChange={(v) => setAudio({ ...state.audio, sfx: v })}
          />

          <div className="border-t border-white/10 pt-3">
            <button
              onClick={togglePauseOnExit}
              className="flex w-full items-center justify-between text-left text-xs text-white/80 hover:text-white"
            >
              <span>Pausar som ao sair do app</span>
              <span className={pauseAudioOnExit ? "text-emerald-400 font-medium" : "text-white/40"}>
                {pauseAudioOnExit ? "ATIVADO" : "DESATIVADO"}
              </span>
            </button>
            <p className="mt-1 text-[10px] text-white/50">
              Economiza bateria e evita som em segundo plano quando você troca de aba.
            </p>
          </div>
        </div>

        {/* Desempenho e Bateria (Item 6) */}
        <p className="mt-8 text-[11px] font-medium tracking-[0.28em] text-white/70 uppercase">
          Desempenho & Bateria
        </p>
        <div className="mt-3 space-y-3 rounded-lg border border-white/10 bg-[#071018]/50 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/70">Taxa de quadros ao vivo:</span>
            <span className="font-mono text-emerald-400">
              {metrics.fps} FPS <span className="text-white/40">({metrics.frameTimeMs}ms)</span>
            </span>
          </div>

          {metrics.batterySupported && metrics.batteryLevel !== null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70">Bateria do aparelho:</span>
              <span className="font-mono text-white/90">
                {metrics.batteryLevel}% {metrics.batteryCharging ? "⚡ Carregando" : "🔋"}
              </span>
            </div>
          )}

          <div className="border-t border-white/10 pt-3">
            <button
              onClick={toggleLowPower}
              className="flex w-full items-center justify-between text-left text-xs text-white/80 hover:text-white"
            >
              <span>Modo Economia de Bateria (30 FPS)</span>
              <span
                className={metrics.lowPowerMode ? "text-amber-400 font-medium" : "text-white/40"}
              >
                {metrics.lowPowerMode ? "ATIVADO" : "DESATIVADO"}
              </span>
            </button>
            <p className="mt-1 text-[10px] text-white/50">
              Reduz partículas e limita a taxa a 30 FPS para diminuir o aquecimento e poupar bateria.
            </p>
          </div>
        </div>

        {/* Acessibilidade & Movimento (Item 7) */}
        <p className="mt-8 text-[11px] font-medium tracking-[0.28em] text-white/70 uppercase">
          Acessibilidade
        </p>
        <div className="mt-3 space-y-3 rounded-lg border border-white/10 bg-[#071018]/50 p-4">
          <button
            onClick={toggleReducedMotion}
            className="flex w-full items-center justify-between text-left text-xs text-white/80 hover:text-white"
          >
            <span>Movimento Reduzido</span>
            <span className={reducedMotion ? "text-emerald-400 font-medium" : "text-white/40"}>
              {reducedMotion ? "ATIVADO" : "PADRÃO SO"}
            </span>
          </button>
          <p className="text-[10px] text-white/50">
            Acalma as oscilações da água e reduz a velocidade de peixes e detritos.
          </p>
        </div>

        {/* Sincronização & Backup (Item 11) */}
        <p className="mt-8 text-[11px] font-medium tracking-[0.28em] text-white/70 uppercase">
          Sincronização & Dados
        </p>
        <div className="mt-3 rounded-lg border border-white/10 bg-[#071018]/50 p-4">
          <button
            onClick={() => setShowSync(true)}
            className="w-full rounded border border-white/25 bg-white/5 py-2.5 text-center text-xs tracking-wider uppercase text-[var(--foam)] hover:bg-white/15"
          >
            Sincronizar entre Celular e Chrome
          </button>
          <p className="mt-2 text-center text-[10px] text-white/50">
            Exporte ou importe seu progresso para ter o mesmo oceano em múltiplos aparelhos.
          </p>
        </div>

        <p className="mt-10 font-serif text-sm leading-relaxed text-white/60 italic text-center">
          Depois de semanas, olhe para o oceano e lembre: isso existe porque você conseguiu
          manter o foco.
        </p>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => {
              if (confirm("Recomeçar o oceano? O progresso atual será zerado.")) resetSave();
            }}
            className="min-h-11 px-4 text-[11px] tracking-[0.2em] text-rose-300/70 uppercase hover:text-rose-300"
          >
            Recomeçar do zero
          </button>
        </div>
      </div>

      {showSync && <SyncModal onClose={() => setShowSync(false)} />}
      {showPlus && <PlusModal onClose={() => setShowPlus(false)} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-[#0b1620]/60 px-3 py-3">
      <p className="text-[10px] tracking-[0.18em] text-white/60 uppercase">{label}</p>
      <p className="mt-1 font-serif text-2xl text-[var(--foam)]">{value}</p>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-[11px] tracking-[0.16em] text-white/70 uppercase">
      <span className="w-20">{label}</span>
      <input
        type="range"
        aria-label={`Volume de ${label.toLowerCase()}`}
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-[var(--foam)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--foam)]"
      />
    </label>
  );
}
