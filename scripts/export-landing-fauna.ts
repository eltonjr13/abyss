import { writeFileSync } from 'node:fs';
import { SPECIES } from '../src/data/species';
import { BIOMES, BIOME_ORDER } from '../src/data/biomes';
import { SHAPES } from '../src/ocean/sprites';

// The presentation shares the app's art and descriptions, without its account/save runtime.
const swimming = new Set(['fish1', 'fish2', 'fish3', 'clown', 'angel', 'turtle', 'seahorse', 'jelly', 'shark', 'ray', 'whale', 'dolphin', 'octopus', 'lantern', 'angler', 'squid', 'manta', 'otter', 'shrimp', 'eel', 'nautilus']);
const biomes = Object.fromEntries(BIOME_ORDER.map(id => [id, {
  ...BIOMES[id],
  species: SPECIES.filter(species => species.biome === id && swimming.has(species.shape))
    .slice(0, 6).map(species => ({ ...species, pixels: SHAPES[species.shape] })),
}]));
writeFileSync(new URL('../landing/assets/fauna.json', import.meta.url), JSON.stringify(biomes));
console.log('Fauna da landing exportada dos dados e sprites do aplicativo.');
