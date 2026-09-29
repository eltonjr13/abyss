import { WaveMark } from "../components/WaveMark";
import { BIOMES, getTimeOfDay, TIME_LABEL } from "../data/biomes";
import { IDLE_WHISPERS } from "../data/quotes";
import { useGame } from "../game/GameContext";
import { overallLife } from "../game/save";
import { formatHours } from "../lib/format";

export function Home() {
  const { state, setView } = useGame();
  const biome = BIOMES[state.currentBiome];
  const life = state.biomeLife[state.currentBiome] ?? 0;
  const tod = getTimeOfDay();

  return (
    <div className="relative z-20 flex min-h-dvh flex-col items-center justify-between px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[max(28px,env(safe-area-inset-top))] sm:px-6">
      <header className="flex w-full max-w-lg items-start justify-between gap-4">
        <div>
          <WaveMark className="text-[var(--foam)]/70" />
          <p className="mt-2 font-pixel text-[13px] tracking-[0.5em] text-white/80">MERGULHE</p>
          <p className="mt-1 text-[10px] tracking-[0.28em] text-white/40 uppercase">
            {TIME_LABEL[tod]}
          </p>
        </div>
        <p className="max-w-[52%] text-right font-serif text-sm text-white/55 italic">{biome.poetic}</p>
      </header>

      <div className="pointer-events-none flex-1" />

      <div className="rise w-full max-w-sm text-center">
        <p className="text-[11px] tracking-[0.32em] text-white/50 uppercase">{biome.name}</p>
        <div className="mx-auto mt-4 h-[6px] w-40 overflow-hidden bg-white/10">
          <div
            className="h-full bg-[var(--foam)]/80 transition-all duration-700"
            style={{ width: `${life}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] tracking-[0.18em] text-white/50">
          Vida {Math.round(life)}%
        </p>

        <button
          onClick={() => setView("setup")}
          className="mt-8 min-h-12 w-full border border-white/25 bg-[#071018]/35 py-4 text-[13px] tracking-[0.3em] text-[var(--foam)] uppercase backdrop-blur-sm hover:border-white/50 hover:bg-white/10 sm:tracking-[0.46em]"
        >
          Mergulhar
        </button>

        <div className="mt-6 flex items-center justify-center gap-5 text-[11px] tracking-wide text-white/55">
          <span>{formatHours(state.todayFocusSeconds)} hoje</span>
          <span className="text-white/25">·</span>
          <span>
            {state.streak > 0 ? `${state.streak} dia${state.streak > 1 ? "s" : ""}` : "sem sequência"}
          </span>
        </div>
        <p className="mt-3 text-[10px] tracking-[0.16em] text-white/30 uppercase">
          Oceano {Math.round(overallLife(state))}% restaurado
        </p>
        <p className="mt-5 font-serif text-sm text-white/35 italic">
          {IDLE_WHISPERS[state.sessionsCompleted % IDLE_WHISPERS.length]}
        </p>
      </div>
    </div>
  );
}
