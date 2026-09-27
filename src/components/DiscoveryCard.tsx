import { BIOMES } from "../data/biomes";
import type { Species } from "../types";
import { PixelCreature } from "./PixelCreature";

const RARITY: Record<Species["rarity"], { label: string; color: string }> = {
  comum: { label: "Comum", color: "#8aa8a8" },
  incomum: { label: "Incomum", color: "#7ec8a0" },
  rara: { label: "Rara", color: "#d4b06a" },
  lendaria: { label: "Lendária", color: "#d080b0" },
};

export function DiscoveryCard({
  species,
  onClose,
  fresh = true,
}: {
  species: Species;
  onClose: () => void;
  fresh?: boolean;
}) {
  const r = RARITY[species.rarity];
  const biome = BIOMES[species.biome];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#03080c]/70 px-4 py-5 backdrop-blur-[2px]">
      <div role="dialog" aria-modal="true" aria-label={species.name} className="rise my-auto max-h-[calc(100dvh-40px)] w-full max-w-sm overflow-y-auto border border-white/10 bg-[#0b1620]/90 p-5 text-center shadow-2xl sm:p-8">
        <p className="font-pixel text-[10px] tracking-[0.35em] text-[var(--gold)] uppercase">
          {fresh ? "Nova descoberta" : "Espécie"}
        </p>
        <div className="mt-6 mb-4">
          <PixelCreature species={species} scale={7} />
        </div>
        <h2 className="font-serif text-3xl text-[var(--foam)] italic">{species.name}</h2>
        <p className="mt-1 text-[11px] tracking-wide text-white/40">{species.scientific}</p>
        <p className="mt-5 font-serif text-[17px] leading-relaxed text-white/75 italic">
          “{species.blurb}”
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 text-[10px] tracking-[0.2em] uppercase">
          <span style={{ color: r.color }}>{r.label}</span>
          <span className="text-white/25">·</span>
          <span className="text-white/50">{biome.short}</span>
        </div>
        <button
          onClick={onClose}
          className="mt-8 min-h-12 w-full border border-white/15 py-3 text-[11px] tracking-[0.28em] text-white/80 uppercase hover:border-white/40 hover:text-white"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
