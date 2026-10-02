import { useState } from "react";
import { PixelCreature } from "../components/PixelCreature";
import { DiscoveryCard } from "../components/DiscoveryCard";
import { CollectionDialog } from "../components/CollectionDialog";
import { CollectionProgress } from "../components/CollectionProgress";
import { BIOMES, BIOME_ORDER } from "../data/biomes";
import { SPECIES, SPECIES_BY_ID } from "../data/species";
import { collectionAchievements, discoveryHint, RARITIES, researchProgress } from "../game/collection";
import { useGame } from "../game/GameContext";
import type { BiomeId } from "../types";
import { cn } from "../utils/cn";

export function Discoveries() {
  const { state, selectedSpecies, setSelectedSpecies, setTargetSpecies, selectBiome, setView, showSpeciesInOcean } = useGame();
  const [filter, setFilter] = useState<BiomeId | "all">("all");
  const [mode, setMode] = useState<"all" | "owned" | "unknown">("all");
  const [tab, setTab] = useState<"collection" | "achievements">("collection");
  const habitats = filter === "all" ? BIOME_ORDER : [filter];
  const habitatSpecies = filter === "all" ? SPECIES : SPECIES.filter(s => s.biome === filter);
  const found = habitatSpecies.filter(s => state.discovered.includes(s.id)).length;
  const selected = selectedSpecies ? SPECIES_BY_ID[selectedSpecies] : null;
  const achievements = collectionAchievements(state.discovered);
  const completed = achievements.filter(a => a.complete).length;

  return (
    <div className="relative z-20 min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[max(28px,env(safe-area-inset-top))]">
      <header className="mx-auto max-w-2xl text-center">
        <p className="font-pixel text-[10px] tracking-[0.4em] text-white/50">SEU OCEANO, SUAS DESCOBERTAS</p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--foam)] italic">Coleção marinha</h1>
        <p className="mt-2 text-sm text-white/65">{found} / {habitatSpecies.length} espécies · {completed} conquistas</p>
        <div className="mx-auto mt-4 h-1.5 max-w-xs overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Coleção descoberta" aria-valuemin={0} aria-valuemax={habitatSpecies.length} aria-valuenow={found}>
          <div className="h-full bg-[var(--gold)] transition-all" style={{ width: `${found / habitatSpecies.length * 100}%` }} />
        </div>
      </header>

      <div className="mx-auto mt-6 flex max-w-2xl justify-center gap-2" aria-label="Seções da coleção">
        <Chip active={tab === "collection"} onClick={() => setTab("collection")}>Espécies</Chip>
        <Chip active={tab === "achievements"} onClick={() => setTab("achievements")}>Conquistas</Chip>
      </div>

      {tab === "achievements" ? (
        <div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
          {achievements.map(a => <article key={a.id} className={cn("rounded-xl border p-4", a.complete ? "border-[var(--gold)]/50 bg-[var(--gold)]/10" : "border-white/10 bg-[#0b1620]/65")}>
            <p className="text-[10px] tracking-[0.15em] text-[var(--gold)] uppercase">{a.complete ? "✦ Conquista desbloqueada" : "Conjunto por completar"}</p>
            <h2 className="mt-2 font-serif text-2xl italic">{a.name}</h2>
            <p className="mt-2 text-xs leading-relaxed text-white/60">{a.description}</p>
            <p className="mt-3 text-xs text-white/70">{a.found} / {a.required}</p>
            <div className="mt-2 h-1 rounded-full bg-white/10" role="progressbar" aria-label={a.name} aria-valuemin={0} aria-valuemax={a.required} aria-valuenow={a.found}><div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${a.found / a.required * 100}%` }} /></div>
          </article>)}
          <p className="text-xs text-white/55 sm:col-span-2">Sua coleção e suas conquistas permanecem com você, mesmo nos dias sem mergulho.</p>
        </div>
      ) : <>
        <div className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-2" aria-label="Visualização da coleção">
          <Chip active={mode === "all"} onClick={() => setMode("all")}>Todas</Chip>
          <Chip active={mode === "owned"} onClick={() => setMode("owned")}>Descobertas</Chip>
          <Chip active={mode === "unknown"} onClick={() => setMode("unknown")}>Por descobrir</Chip>
        </div>
        <div className="mx-auto mt-4 flex max-w-2xl flex-wrap justify-center gap-1.5" aria-label="Habitat da coleção">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>Todos</Chip>
          {BIOME_ORDER.map(id => <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>{BIOMES[id].short}</Chip>)}
        </div>
        <p className="mx-auto mt-5 max-w-sm text-center text-xs leading-relaxed text-white/55">Toque numa silhueta para ver pistas e escolher sua próxima descoberta. Cada mergulho ajuda a pesquisa das espécies do habitat.</p>
        {habitats.map(id => {
          const species = SPECIES.filter(s => s.biome === id);
          const knownCount = species.filter(s => state.discovered.includes(s.id)).length;
          const list = species.filter(s => mode === "all" || state.discovered.includes(s.id) === (mode === "owned"));
          const unlocked = state.unlockedBiomes.includes(id);
          return <section key={id} className="mx-auto mt-7 max-w-2xl" aria-label={`Coleção de ${BIOMES[id].name}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div><h2 className="font-serif text-2xl italic">{BIOMES[id].name}</h2><p className="mt-1 text-[11px] text-white/50">{unlocked ? knownCount === species.length ? "✦ Habitat completo" : BIOMES[id].poetic : "Região por desbloquear · veja as pistas"}</p></div>
              <span className="shrink-0 text-xs text-[var(--gold)]">{knownCount}/{species.length}</span>
            </div>
            {list.length === 0 && <p role="status" className="py-4 text-sm text-white/55">{mode === "owned" ? "As primeiras descobertas deste habitat esperam por você." : "Você completou este habitat."}</p>}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {list.map(s => {
                const known = state.discovered.includes(s.id);
                const target = state.targetSpecies === s.id;
                const rarity = RARITIES[s.rarity];
                const progress = researchProgress(state, s);
                return <button key={s.id} onClick={() => setSelectedSpecies(s.id)} aria-label={known ? `Ver ${s.name}` : `Ver pistas de ${s.name}`} className={cn("relative flex min-h-36 flex-col items-center justify-between gap-2 overflow-hidden rounded-xl border px-2 py-3 transition-colors hover:border-white/40", target ? "border-[var(--gold)]/70 bg-[#18252b]/90" : known ? "border-white/15 bg-[#0b1620]/90" : "border-white/15 bg-[#071018]/90")}>
                  <span className="text-[9px] tracking-[0.1em] uppercase" style={{ color: rarity.color }}>{target ? "✦ Seu objetivo" : rarity.label}</span>
                  <div className="flex min-h-12 w-full items-center justify-center"><PixelCreature species={s} scale={3} silhouette={!known} /></div>
                  <span className="text-[10px] leading-relaxed text-white/75">{known ? s.name : "Espécie misteriosa"}</span>
                  <span className="text-[9px] text-white/50">{known ? "Descoberta ✓" : !unlocked ? "Habitat fechado" : !progress.ready ? `Habitat: ${s.minLife}% de vida` : `Pesquisa: ${progress.percent}%`}</span>
                </button>;
              })}
            </div>
          </section>;
        })}
      </>}

      {selected && (state.discovered.includes(selected.id) ? <DiscoveryCard key={selected.id} species={selected} fresh={false} onClose={() => setSelectedSpecies(null)} onViewOcean={() => showSpeciesInOcean(selected.id)} /> : (
        <CollectionDialog title={`Pistas de ${selected.name}`} onClose={() => setSelectedSpecies(null)}>
          <p className="text-[10px] tracking-[0.25em] text-[var(--gold)] uppercase">Uma descoberta espera</p>
          <div className="mt-6 opacity-65"><PixelCreature species={selected} scale={6} silhouette /></div>
          <h2 className="mt-4 font-serif text-3xl italic">{selected.name}</h2>
          <p className="mt-2 text-xs" style={{ color: RARITIES[selected.rarity].color }}>{RARITIES[selected.rarity].label}</p>
          <p className="mt-4 font-serif text-lg leading-relaxed text-white/70 italic">{discoveryHint(selected)}</p>
          <CollectionProgress state={state} species={selected} />
          {!state.unlockedBiomes.includes(selected.biome) && <p className="mt-3 text-xs text-white/55">{BIOMES[selected.biome].unlockHint}</p>}
          <button className="mt-5 min-h-12 w-full rounded-lg border border-[var(--gold)]/60 py-3 text-xs text-[var(--foam)]" onClick={() => { setTargetSpecies(state.targetSpecies === selected.id ? null : selected.id); setSelectedSpecies(null); }}>{state.targetSpecies === selected.id ? "Remover objetivo" : "Quero descobrir"}</button>
          <button className="mt-2 min-h-11 w-full text-xs text-white/65" onClick={() => {
            setTargetSpecies(selected.id);
            setSelectedSpecies(null);
            if (state.unlockedBiomes.includes(selected.biome)) { selectBiome(selected.biome); setView("setup"); } else setView("explore");
          }}>{state.unlockedBiomes.includes(selected.biome) ? `Mergulhar em ${BIOMES[selected.biome].short}` : "Explorar o mapa"}</button>
        </CollectionDialog>
      ))}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return <button onClick={onClick} aria-pressed={active} className={cn("min-h-11 rounded-full border px-3 py-2 text-[10px] tracking-[0.06em] uppercase", active ? "border-white/40 bg-white/10 text-[var(--foam)]" : "border-white/15 text-white/60 hover:border-white/30")}>{children}</button>;
}
