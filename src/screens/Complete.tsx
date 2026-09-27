import { useState } from "react";
import { BIOMES } from "../data/biomes";
import { SPECIES_BY_ID } from "../data/species";
import { levelTitle } from "../data/levels";
import { useGame } from "../game/GameContext";
import { formatHours } from "../lib/format";
import { DiscoveryCard } from "../components/DiscoveryCard";

export function Complete() {
  const { rewards, setView, state } = useGame();
  const [idx, setIdx] = useState(0);

  if (!rewards) {
    return (
      <div className="relative z-20 flex min-h-dvh items-center justify-center">
        <button onClick={() => setView("home")} className="text-white/60">
          Voltar
        </button>
      </div>
    );
  }

  const pending = rewards.newSpecies;
  if (idx < pending.length) {
    const spec = SPECIES_BY_ID[pending[idx]!];
    if (spec) {
      return <DiscoveryCard species={spec} onClose={() => setIdx((i) => i + 1)} />;
    }
  }

  const biome = BIOMES[rewards.biome];

  return (
    <div className="relative z-20 flex min-h-dvh flex-col items-center justify-center px-6 pb-[max(96px,env(safe-area-inset-bottom))] pt-[max(28px,env(safe-area-inset-top))]">
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className="mote"
          style={{
            left: `${10 + i * 8}%`,
            bottom: `${8 + (i % 5) * 6}%`,
            animationDelay: `${i * 0.45}s`,
            animationDuration: `${6 + (i % 3)}s`,
          }}
        />
      ))}
      <div className="rise w-full max-w-sm text-center">
        <p className="font-pixel text-[10px] tracking-[0.4em] text-[var(--gold)] uppercase">
          Foco concluído
        </p>
        <h1 className="mt-5 font-serif text-3xl text-[var(--foam)] italic">{biome.name}</h1>
        <p className="mt-4 font-serif text-lg leading-relaxed text-white/70 italic">
          “{rewards.quote}”
        </p>

        <div className="mt-8 space-y-3 text-[12px] tracking-[0.18em] text-white/60 uppercase">
          <p>+{rewards.xp} XP</p>
          <p>+{rewards.lifeGain} vida marinha</p>
          <p>{formatHours(rewards.seconds)} de presença</p>
        </div>

        <div className="mx-auto mt-6 h-[6px] w-48 overflow-hidden bg-white/10">
          <div
            className="h-full bg-[var(--foam)]/80 transition-all duration-1000"
            style={{ width: `${rewards.newLife}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-white/40">
          {Math.round(rewards.oldLife)}% → {Math.round(rewards.newLife)}%
        </p>

        {rewards.leveledUp && (
          <p className="mt-5 font-serif text-base text-[var(--gold)] italic">
            Nível {rewards.newLevel} — {levelTitle(rewards.newLevel)}
          </p>
        )}

        {rewards.newBiomes.length > 0 && (
          <p className="mt-4 text-[11px] tracking-[0.16em] text-[var(--foam)]/80 uppercase">
            Nova região: {BIOMES[rewards.newBiomes[0]!].name}
          </p>
        )}

        <p className="mt-8 text-[11px] text-white/35">
          Sequência de {state.streak} dia{state.streak === 1 ? "" : "s"}
        </p>

        <button
          onClick={() => setView("home")}
          className="mt-8 min-h-12 w-full border border-white/25 py-4 text-[12px] tracking-[0.28em] text-[var(--foam)] uppercase hover:border-white/50 sm:tracking-[0.38em]"
        >
          Ver o oceano
        </button>
      </div>
    </div>
  );
}
