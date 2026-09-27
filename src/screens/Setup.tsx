import { useState } from "react";
import { BIOMES } from "../data/biomes";
import { useGame } from "../game/GameContext";
import { DURATIONS } from "../game/progress";
import { cn } from "../utils/cn";

export function Setup() {
  const { state, startSession } = useGame();
  const biome = BIOMES[state.currentBiome];
  const [choice, setChoice] = useState<number | "untimed" | "custom">(25 * 60);
  const [custom, setCustom] = useState(20);

  const begin = () => {
    if (choice === "untimed") startSession(null);
    else if (choice === "custom") startSession(Math.max(1, custom) * 60);
    else startSession(choice);
  };

  return (
    <div className="relative z-20 flex min-h-dvh flex-col items-center px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[max(28px,env(safe-area-inset-top))] sm:px-6">
      <div className="rise w-full max-w-sm text-center">
        <p className="font-pixel text-[10px] tracking-[0.4em] text-white/50">TIDE</p>
        <h1 className="mt-4 font-serif text-3xl text-[var(--foam)] italic">{biome.name}</h1>
        <p className="mt-2 text-sm text-white/50">Quanto tempo você pode permanecer?</p>

        <div className="mt-8 grid grid-cols-2 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.seconds}
              onClick={() => setChoice(d.seconds)}
              className={cn(
                "min-h-12 border px-1 py-3 text-[11px] tracking-[0.14em] uppercase transition-colors sm:text-[12px] sm:tracking-[0.22em]",
                choice === d.seconds
                  ? "border-white/50 bg-white/10 text-[var(--foam)]"
                  : "border-white/10 text-white/50 hover:border-white/25",
              )}
            >
              {d.label}
            </button>
          ))}
          <button
            onClick={() => setChoice("custom")}
            className={cn(
              "min-h-12 border px-1 py-3 text-[11px] tracking-[0.14em] uppercase sm:text-[12px] sm:tracking-[0.22em]",
              choice === "custom"
                ? "border-white/50 bg-white/10 text-[var(--foam)]"
                : "border-white/10 text-white/50 hover:border-white/25",
            )}
          >
            Personalizado
          </button>
          <button
            onClick={() => setChoice("untimed")}
            className={cn(
              "min-h-12 border px-1 py-3 text-[11px] tracking-[0.14em] uppercase sm:text-[12px] sm:tracking-[0.22em]",
              choice === "untimed"
                ? "border-white/50 bg-white/10 text-[var(--foam)]"
                : "border-white/10 text-white/50 hover:border-white/25",
            )}
          >
            Sem timer
          </button>
        </div>

        {choice === "custom" && (
          <div className="mt-6">
            <p className="text-[11px] tracking-[0.2em] text-white/45 uppercase">
              {custom} minutos
            </p>
            <input
              type="range"
              aria-label="Duração personalizada em minutos"
              min={1}
              max={180}
              value={custom}
              onChange={(e) => setCustom(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--foam)]"
            />
          </div>
        )}

        {choice === "untimed" && (
          <p className="mt-6 font-serif text-sm text-white/55 italic">
            Você começa. Você encerra. O oceano não conta os minutos — só a presença.
          </p>
        )}

        <p className="mt-8 text-[11px] leading-relaxed text-white/40">
          Depois de descer, o melhor a fazer é não tocar em nada.
        </p>

        <button
          onClick={begin}
          className="mt-8 min-h-12 w-full border border-white/25 bg-white/5 py-4 text-[13px] tracking-[0.3em] text-[var(--foam)] uppercase hover:border-white/50 sm:tracking-[0.42em]"
        >
          Descer
        </button>
      </div>
    </div>
  );
}
