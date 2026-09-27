import { SPECIES } from "../data/species";
import { BIOME_ORDER } from "../data/biomes";
import { levelTitle, xpProgress } from "../data/levels";
import { useGame } from "../game/GameContext";
import { overallLife } from "../game/save";
import { formatHours, shiftDateKey, todayKey } from "../lib/format";
import { getAudio } from "../audio/engine";
import { cn } from "../utils/cn";

export function Profile() {
  const { state, setAudio, resetSave } = useGame();
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
        <p className="text-center font-pixel text-[10px] tracking-[0.4em] text-white/50">PERFIL</p>
        <h1 className="mt-3 text-center font-serif text-3xl text-[var(--foam)] italic">
          {levelTitle(prog.level)}
        </h1>
        <p className="mt-1 text-center text-[11px] tracking-[0.2em] text-white/40 uppercase">
          Nível {prog.level}
        </p>
        <div className="mx-auto mt-4 h-[6px] w-48 overflow-hidden bg-white/10">
          <div className="h-full bg-[var(--gold)]/80" style={{ width: `${prog.t * 100}%` }} />
        </div>
        <p className="mt-2 text-center text-[11px] text-white/35">
          {state.xp} XP · próximo {prog.next}
        </p>

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

        <p className="mt-8 text-[10px] tracking-[0.28em] text-white/40 uppercase">Últimos 7 dias</p>
        <div className="mt-3 flex h-24 items-end justify-between gap-1.5">
          {week.map((d) => (
            <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <div
                className={cn(
                  "w-full",
                  d.seconds > 0 ? "bg-[var(--foam)]/70" : "bg-white/10",
                )}
                style={{ height: `${Math.max(6, (d.seconds / max) * 100)}%` }}
              />
              <span className="text-[8px] text-white/30">{d.key.slice(8)}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-[10px] tracking-[0.28em] text-white/40 uppercase">Áudio</p>
        <div className="mt-3 space-y-3">
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
        </div>

        <p className="mt-10 font-serif text-sm leading-relaxed text-white/40 italic">
          Depois de semanas, olhe para o oceano e lembre: isso existe porque você conseguiu
          manter o foco.
        </p>

        <button
          onClick={() => {
            if (confirm("Recomeçar o oceano? O progresso atual será esquecido.")) resetSave();
          }}
          className="mt-8 min-h-11 px-3 text-[11px] tracking-[0.2em] text-white/60 uppercase hover:text-white/85"
        >
          Recomeçar
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-[#0b1620]/40 px-3 py-3">
      <p className="text-[9px] tracking-[0.18em] text-white/40 uppercase">{label}</p>
      <p className="mt-1 font-serif text-xl text-[var(--foam)]">{value}</p>
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
    <label className="flex items-center gap-3 text-[11px] tracking-[0.16em] text-white/50 uppercase">
      <span className="w-20">{label}</span>
      <input
        type="range"
        aria-label={`Volume de ${label.toLowerCase()}`}
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-[var(--foam)]"
      />
    </label>
  );
}
