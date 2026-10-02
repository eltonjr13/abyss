import { BIOMES } from "../data/biomes";
import { researchProgress, trackedSpecies } from "../game/collection";
import { useGame } from "../game/GameContext";
import { PixelCreature } from "./PixelCreature";
import { CollectionProgress } from "./CollectionProgress";

export function ExpeditionGoal({ compact = false }: { compact?: boolean }) {
  const { state, selectBiome, setView, setSelectedSpecies } = useGame();
  const species = trackedSpecies(state);
  if (!species) return <p className="mt-5 text-xs text-white/65">Habitat completo! Explore outra região para novas descobertas.</p>;
  const elsewhere = species.biome !== state.currentBiome;
  const unlocked = state.unlockedBiomes.includes(species.biome);
  const progress = researchProgress(state, species);
  return (
    <section className="mt-5 rounded-xl border border-white/15 bg-[#071018]/75 p-4 text-left backdrop-blur-sm" aria-label="Próxima descoberta">
      <p className="text-[10px] tracking-[0.2em] text-[var(--gold)] uppercase">{state.targetSpecies ? "Sua expedição" : "Próxima descoberta"}</p>
      <button className="mt-3 flex w-full items-center gap-3 text-left" onClick={() => { setSelectedSpecies(species.id); setView("discoveries"); }} aria-label={`Ver pistas de ${species.name}`}>
        <div className="w-16 shrink-0 opacity-65"><PixelCreature species={species} scale={3} silhouette /></div>
        <div><p className="font-serif text-xl text-[var(--foam)] italic">Em busca de {species.name}</p><p className="mt-1 text-[11px] text-white/55">{BIOMES[species.biome].name}</p></div>
      </button>
      {!compact && <CollectionProgress state={state} species={species} />}
      {compact && <div className="mt-2 space-y-1 text-xs text-white/65">
        <p>{progress.ready ? "Habitat pronto para o encontro" : `Habitat: ${Math.floor(state.biomeLife[species.biome])}% / ${species.minLife}% de vida`}</p>
        <p>Pesquisa: {Math.floor(progress.seconds / 60)} / {progress.required / 60} min · {progress.percent}%</p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Pesquisa da próxima descoberta" aria-valuemin={0} aria-valuemax={progress.required} aria-valuenow={progress.seconds}><div className="h-full bg-[var(--gold)]" style={{ width: `${progress.percent}%` }} /></div>
      </div>}
      {elsewhere && <button className="mt-3 min-h-11 w-full rounded-lg border border-white/20 px-3 text-xs text-[var(--foam)]" onClick={() => { if (unlocked) selectBiome(species.biome); setView(unlocked ? "setup" : "explore"); }}>{unlocked ? `Mergulhar em ${BIOMES[species.biome].short}` : "Explorar o mapa para abrir esta região"}</button>}
    </section>
  );
}
