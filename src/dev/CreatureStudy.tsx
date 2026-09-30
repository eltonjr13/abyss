import { useEffect, useRef, useState } from "react";
import { PixelCreature } from "../components/PixelCreature";
import { BIOMES, BIOME_ORDER } from "../data/biomes";
import { SPECIES } from "../data/species";
import { OceanEngine } from "../ocean/engine";
import type { BiomeId } from "../types";

export default function CreatureStudy() {
  const [biome, setBiome] = useState<BiomeId>("reef");
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const engine = new OceanEngine(canvas.current!, { biome, life: 100, timeOfDay: "day", intensity: 1 });
    void engine.init();
    const resize = () => engine.resize();
    window.addEventListener("resize", resize);
    return () => { engine.stop(); window.removeEventListener("resize", resize); };
  }, [biome]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 text-[#e6eee8]">
      <p className="text-xs tracking-[0.3em] text-[#80bcb5]">MERGULHE / ESTUDO DA FAUNA</p>
      <h1 className="mt-3 font-serif text-4xl italic">Um oceano com personalidade.</h1>
      <p className="mt-3 max-w-xl text-sm text-white/50">As {SPECIES.length} espécies do jogo, com suas cores e movimentos. Selecione um habitat para observar a fauna em cena.</p>
      <nav aria-label="Habitat" className="my-6 flex flex-wrap gap-2">
        {BIOME_ORDER.map(id => <button key={id} onClick={() => setBiome(id)} aria-pressed={biome === id} className={`border px-4 py-2 text-xs ${biome === id ? "border-[#80bcb5] text-[#a3ddd4]" : "border-white/15 text-white/50"}`}>{BIOMES[id].short}</button>)}
      </nav>
      <canvas ref={canvas} aria-label={`Fauna de ${BIOMES[biome].name}`} className="aspect-video w-full border border-white/10" style={{ imageRendering: "pixelated" }} />
      {BIOME_ORDER.map(id => <section key={id} className="mt-10">
        <h2 className="mb-4 font-serif text-2xl italic">{BIOMES[id].name}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SPECIES.filter(s => s.biome === id).map(s => <article key={s.id} className="min-w-0 border border-white/10 bg-[#0b1922] px-2 pb-4 text-center">
            <div className="flex h-28 items-center justify-center"><PixelCreature species={s} scale={4} /></div>
            <h3 className="text-xs">{s.name}</h3><p className="mt-1 text-[10px] text-white/35 italic">{s.scientific}</p>
          </article>)}
        </div>
      </section>)}
    </main>
  );
}
