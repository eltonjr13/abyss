import { BIOMES } from "../data/biomes";
import { researchProgress } from "../game/collection";
import type { GameState, Species } from "../types";

export function CollectionProgress({ state, species }: { state: GameState; species: Species }) {
  const progress = researchProgress(state, species);
  return (
    <div className="mt-4 space-y-3 text-left text-xs leading-relaxed text-white/65">
      <div>
        <p>{progress.unlocked ? "Habitat" : "Região por desbloquear"} · {BIOMES[species.biome].name}</p>
        <p className="mt-1">Vida {Math.floor(state.biomeLife[species.biome])}% / {species.minLife}% necessários</p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Habitat adequado" aria-valuemin={0} aria-valuemax={species.minLife} aria-valuenow={Math.min(species.minLife, state.biomeLife[species.biome])}>
          <div className="h-full bg-[var(--foam)]/65" style={{ width: `${Math.min(100, state.biomeLife[species.biome] / species.minLife * 100)}%` }} />
        </div>
      </div>
      <div>
        <p>{progress.ready ? "Pesquisa em andamento" : "Pesquisa · começa com o habitat pronto"}</p>
        <p className="mt-1">{Math.floor(progress.seconds / 60)} / {progress.required / 60} min de foco · {progress.percent}%</p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Pesquisa da espécie" aria-valuemin={0} aria-valuemax={progress.required} aria-valuenow={progress.seconds}>
          <div className="h-full bg-[var(--gold)]" style={{ width: `${progress.percent}%` }} />
        </div>
      </div>
      <p className="text-[11px] text-white/45">Encontro garantido ao completar a pesquisa. Pode aparecer antes, de surpresa. Seus minutos ficam guardados.</p>
    </div>
  );
}
