import { useState } from "react";
import { IMAGES } from "../assets/images";
import { BIOMES, BIOME_ORDER } from "../data/biomes";
import { speciesOfBiome } from "../data/species";
import { useGame } from "../game/GameContext";
import type { BiomeId } from "../types";
import { cn } from "../utils/cn";

const HOTSPOTS: { id: BiomeId; top: string; left: string; w: string; h: string }[] = [
  { id: "mangrove", top: "16%", left: "4%", w: "24%", h: "38%" },
  { id: "kelp", top: "54%", left: "6%", w: "32%", h: "38%" },
  { id: "island", top: "6%", left: "38%", w: "28%", h: "26%" },
  { id: "reef", top: "28%", left: "36%", w: "34%", h: "24%" },
  { id: "deep", top: "48%", left: "40%", w: "28%", h: "28%" },
  { id: "abyss", top: "52%", left: "66%", w: "30%", h: "40%" },
];

export function Explore() {
  const { state, selectBiome, setView } = useGame();
  const [preview, setPreview] = useState<BiomeId | null>(null);
  const selected = preview ?? state.currentBiome;
  const biome = BIOMES[selected];
  const life = state.biomeLife[selected] ?? 0;
  const found = speciesOfBiome(selected).filter((s) => state.discovered.includes(s.id)).length;
  const total = speciesOfBiome(selected).length;

  return (
    <div className="relative z-20 flex min-h-dvh flex-col px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[max(28px,env(safe-area-inset-top))]">
      <header className="mx-auto w-full max-w-3xl text-center">
        <p className="font-pixel text-[10px] tracking-[0.4em] text-white/50">MAPA</p>
        <h1 className="mt-2 font-serif text-3xl text-[var(--foam)] italic">O oceano conhecido</h1>
      </header>

      <div className="relative mx-auto mt-6 w-full max-w-3xl overflow-hidden border border-white/10">
        <img
          src={IMAGES.map}
          alt="Mapa do oceano"
          className="block w-full"
          style={{ imageRendering: "auto" }}
        />
        {HOTSPOTS.map((h) => {
          const unlocked = state.unlockedBiomes.includes(h.id);
          const active = selected === h.id;
          return (
            <button
              key={h.id}
              onClick={() => {
                setPreview(h.id);
                if (unlocked) selectBiome(h.id);
              }}
              aria-label={unlocked ? `Explorar ${BIOMES[h.id].name}` : `Região bloqueada: ${BIOMES[h.id].name}`}
              aria-pressed={active}
              style={{ top: h.top, left: h.left, width: h.w, height: h.h }}
              className={cn(
                "absolute border transition-colors",
                unlocked
                  ? active
                    ? "border-[var(--foam)]/80 bg-[var(--foam)]/10"
                    : "border-transparent hover:border-white/30 hover:bg-white/5"
                  : "border-transparent bg-[#061018]/55 hover:border-white/20",
              )}
              title={unlocked ? BIOMES[h.id].name : "Neblina"}
            >
              {!unlocked && (
                <span className="absolute inset-0 flex items-center justify-center text-lg text-white/40">
                  ░
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mx-auto mt-5 w-full max-w-md text-center">
        <p className="text-[11px] tracking-[0.3em] text-white/50 uppercase">{biome.name}</p>
        <p className="mt-2 font-serif text-base text-white/65 italic">{biome.poetic}</p>
        {state.unlockedBiomes.includes(selected) ? (
          <>
            <p className="mt-3 text-[12px] text-white/50">
              Vida {Math.round(life)}% · {found}/{total} espécies
            </p>
            <button
              onClick={() => setView("setup")}
              className="mt-5 border border-white/20 px-8 py-2.5 text-[11px] tracking-[0.28em] text-white/80 uppercase hover:border-white/40"
            >
              Mergulhar aqui
            </button>
          </>
        ) : (
          <p className="mt-3 text-[12px] text-white/40">{biome.unlockHint}</p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {BIOME_ORDER.map((id) => {
            const unlocked = state.unlockedBiomes.includes(id);
            return (
              <button
                key={id}
                onClick={() => {
                  setPreview(id);
                  if (unlocked) selectBiome(id);
                }}
                aria-label={unlocked ? BIOMES[id].name : `Região bloqueada: ${BIOMES[id].name}`}
                aria-pressed={selected === id}
                className={cn(
                  "min-h-10 border px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase",
                  selected === id
                    ? "border-white/40 text-[var(--foam)]"
                    : unlocked
                      ? "border-white/10 text-white/45 hover:text-white/70"
                      : "border-white/5 text-white/20",
                )}
              >
                {unlocked ? BIOMES[id].short : "····"}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
