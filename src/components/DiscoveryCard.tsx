import { useState } from "react";
import { BIOMES } from "../data/biomes";
import { RARITIES } from "../game/collection";
import type { Species } from "../types";
import { PixelCreature } from "./PixelCreature";
import { CollectionDialog } from "./CollectionDialog";

export function DiscoveryCard({ species, onClose, onViewOcean, fresh = true, guaranteed = false }: {
  species: Species;
  onClose: () => void;
  onViewOcean?: () => void;
  fresh?: boolean;
  guaranteed?: boolean;
}) {
  const [revealed, setRevealed] = useState(!fresh);
  const rarity = RARITIES[species.rarity];
  const legendary = species.rarity === "lendaria";
  return (
    <CollectionDialog title={revealed ? species.name : "Nova descoberta por revelar"} onClose={onClose}>
      <p className="font-pixel text-[10px] tracking-[0.25em] text-[var(--gold)] uppercase">{fresh ? revealed ? legendary ? "Um encontro lendário" : "Nova descoberta" : "Algo voltou ao seu oceano" : "Sua coleção"}</p>
      <div className={`my-6 flex min-h-32 items-center justify-center rounded-full ${revealed ? "discovery-reveal" : "opacity-60"}`} style={revealed ? { background: `radial-gradient(ellipse, ${rarity.color}25, transparent 70%)` } : undefined}>
        <PixelCreature species={species} scale={7} silhouette={!revealed} />
      </div>
      <div aria-live="polite">
        <h2 className="font-serif text-3xl text-[var(--foam)] italic">{revealed ? species.name : "Uma nova presença"}</h2>
        {revealed ? <>
          <p className="mt-1 text-[11px] text-white/50">{species.scientific}</p>
          <p className="mt-4 font-serif text-lg leading-relaxed text-white/75 italic">“{species.blurb}”</p>
          <div className="mt-5 flex items-center justify-center gap-3 text-[10px] tracking-[0.15em] uppercase"><span style={{ color: rarity.color }}>{rarity.label}</span><span className="text-white/30">·</span><span className="text-white/65">{BIOMES[species.biome].short}</span></div>
          {fresh && <p className="mt-4 text-xs text-white/65">{guaranteed ? "Pesquisa concluída. Seu encontro está garantido." : "Um encontro inesperado durante seu mergulho."} Esta espécie agora habita seu oceano.</p>}
        </> : <p className="mt-4 font-serif text-lg text-white/65 italic">Seu foco abriu espaço para uma nova vida. Descubra quem chegou.</p>}
      </div>
      {!revealed ? <button onClick={() => setRevealed(true)} className="mt-6 min-h-12 w-full rounded-lg border border-[var(--gold)]/60 py-3 text-xs text-[var(--foam)]">Revelar descoberta</button> : <>
        {onViewOcean && <button onClick={onViewOcean} className="mt-6 min-h-12 w-full rounded-lg border border-[var(--gold)]/60 py-3 text-xs text-[var(--foam)]">Ver no meu oceano</button>}
        <button onClick={onClose} className="mt-3 min-h-11 w-full rounded-lg border border-white/15 py-3 text-xs text-white/75">{fresh ? "Continuar" : "Voltar à coleção"}</button>
      </>}
    </CollectionDialog>
  );
}
