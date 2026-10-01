import { useEffect, useRef, useState } from "react";
import { IMAGES, type ImageKey } from "../assets/images";
import { BIOMES, BIOME_ORDER } from "../data/biomes";
import { SPECIES } from "../data/species";
import { OceanEngine } from "../ocean/engine";
import { PerfPanel } from "../components/PerfPanel";
import type { BiomeId, TimeOfDay } from "../types";

const plates: { key: ImageKey; label: string }[] = [
  { key: "reefAlive", label: "Recife restaurado" },
  { key: "reefDead", label: "Recife degradado" },
  { key: "reefNight", label: "Recife à noite" },
  { key: "kelp", label: "Floresta de kelp" },
  { key: "mangrove", label: "Manguezal" },
  { key: "island", label: "Ilha tropical" },
  { key: "deep", label: "Mar profundo" },
  { key: "abyss", label: "Abismo" },
  { key: "surface", label: "Superfície" },
  { key: "map", label: "Mapa do oceano" },
];

export default function SceneryStudy() {
  const [biome, setBiome] = useState<BiomeId>("reef");
  const [life, setLife] = useState(100);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day");
  const [fauna, setFauna] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<OceanEngine | null>(null);
  useEffect(() => {
    const ocean = new OceanEngine(canvas.current!, { biome: "reef", life: 100, timeOfDay: "day", intensity: 1, discovered: SPECIES.map(s => s.id), showCreatures: false });
    engine.current = ocean;
    void ocean.init();
    const observer = new ResizeObserver(() => ocean.resize());
    observer.observe(canvas.current!);
    return () => { observer.disconnect(); ocean.stop(); engine.current = null; };
  }, []);
  useEffect(() => { engine.current?.setConfig({ biome, life, timeOfDay, showCreatures: fauna }); }, [biome, life, timeOfDay, fauna]);

  return <main className="mx-auto max-w-6xl px-5 py-8 text-[#e6eee8]">
    <p className="text-xs tracking-[0.3em] text-[#80bcb5]">MERGULHE / CENÁRIOS</p>
    <h1 className="mt-3 font-serif text-4xl italic">O habitat antes da vida.</h1>
    <p className="mt-3 text-sm text-white/50">Dez cenários com luz em movimento e correntes suaves. Ative a fauna para observar as cores e a profundidade; troque o habitat para comparar as transições.</p>
    <nav aria-label="Habitat" className="my-5 flex flex-wrap gap-2">
      {BIOME_ORDER.map(id => <button key={id} onClick={() => setBiome(id)} aria-pressed={biome === id} className={`border px-4 py-2 text-xs ${biome === id ? "border-[#80bcb5] text-[#a3ddd4]" : "border-white/15 text-white/50"}`}>{BIOMES[id].short}</button>)}
    </nav>
    <div className="mb-5 flex flex-wrap items-center gap-5 text-xs text-white/65">
      <label className="flex items-center gap-2">Restauração {life}% <input aria-label="Restauração" type="range" min="0" max="100" step="5" value={life} onInput={e => setLife(Number(e.currentTarget.value))} /></label>
      <label className="flex items-center gap-2">Luz <select aria-label="Horário" value={timeOfDay} onChange={e => setTimeOfDay(e.target.value as TimeOfDay)} className="border border-white/20 bg-[#0b1922] p-2"><option value="day">Dia</option><option value="night">Noite</option><option value="dawn">Amanhecer</option><option value="dusk">Entardecer</option></select></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={fauna} onChange={e => setFauna(e.target.checked)} />Mostrar fauna animada</label>
    </div>
    <canvas ref={canvas} aria-label={`Cena de ${BIOMES[biome].name}${fauna ? " com fauna animada" : " sem fauna"}`} className="aspect-video w-full border border-white/10" />
    <section aria-label="Imagens sem fauna" className="mt-8 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))" }}>
      {plates.map(({ key, label }) => <figure key={key} className="min-w-0 overflow-hidden border border-white/10 bg-[#0b1922]">
        <img src={IMAGES[key]} alt={label} className="aspect-video w-full object-cover" loading="lazy" width="1920" height="1080" />
        <figcaption className="px-4 py-3 text-sm">{label}<span className="ml-3 text-xs text-white/35">1920 × 1080</span></figcaption>
      </figure>)}
    </section>
    <PerfPanel />
  </main>;
}
