import { useMemo, useState } from "react";
import { PixelCreature } from "../components/PixelCreature";
import { DiscoveryCard } from "../components/DiscoveryCard";
import { BIOMES, BIOME_ORDER } from "../data/biomes";
import { SPECIES, SPECIES_BY_ID } from "../data/species";
import { useGame } from "../game/GameContext";
import type { BiomeId } from "../types";
import { cn } from "../utils/cn";

export function Discoveries() {
  const { state, selectedSpecies, setSelectedSpecies } = useGame();
  const [filter, setFilter] = useState<BiomeId | "all">("all");

  const list = useMemo(() => {
    const src = filter === "all" ? SPECIES : SPECIES.filter((s) => s.biome === filter);
    return src;
  }, [filter]);

  const found = state.discovered.length;
  const selected = selectedSpecies ? SPECIES_BY_ID[selectedSpecies] : null;

  return (
    <div className="relative z-20 min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[max(28px,env(safe-area-inset-top))]">
      <header className="mx-auto max-w-2xl text-center">
        <p className="font-pixel text-[10px] tracking-[0.4em] text-white/50">CÓDICE</p>
        <h1 className="mt-2 font-serif text-3xl text-[var(--foam)] italic">Descobertas</h1>
        <p className="mt-2 text-sm text-white/45">
          {found} / {SPECIES.length} espécies
        </p>
      </header>

      <div className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-1.5">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          Todas
        </Chip>
        {BIOME_ORDER.map((id) => (
          <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>
            {BIOMES[id].short}
          </Chip>
        ))}
      </div>

      <div className="mx-auto mt-6 grid max-w-2xl grid-cols-3 gap-2 sm:grid-cols-4">
        {list.map((s) => {
          const known = state.discovered.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => known && setSelectedSpecies(s.id)}
              disabled={!known}
              aria-label={known ? `Ver ${s.name}` : "Espécie não descoberta"}
              className={cn(
                "flex min-h-28 flex-col items-center gap-2 border px-1 py-3 sm:px-2",
                known
                  ? "border-white/10 bg-[#0b1620]/50 hover:border-white/30"
                  : "border-white/5 bg-black/20",
              )}
            >
              <div className={cn(!known && "opacity-40")}>
                <PixelCreature species={s} scale={3} silhouette={!known} />
              </div>
              <span className="text-[9px] tracking-[0.08em] text-white/55">
                {known ? s.name : "????"}
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <DiscoveryCard species={selected} fresh={false} onClose={() => setSelectedSpecies(null)} />
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "min-h-10 border px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase",
        active ? "border-white/40 text-[var(--foam)]" : "border-white/10 text-white/40",
      )}
    >
      {children}
    </button>
  );
}
