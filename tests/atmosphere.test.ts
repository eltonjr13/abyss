import test from "node:test";
import assert from "node:assert/strict";
import { WATER, habitatBlend, submergedPalette, waterCurrent, waterLight } from "../src/ocean/atmosphere.js";
import { SPECIES } from "../src/data/species.js";
import type { BiomeId, TimeOfDay } from "../src/types.js";

const biomes = Object.keys(WATER) as BiomeId[];
const times: TimeOfDay[] = ["dawn", "day", "dusk", "night"];

test("sunlight follows habitat depth and disappears at night and in the abyss", () => {
  for (const biome of biomes) assert.equal(waterLight(biome, "night").strength, 0);
  for (const time of times) assert.equal(waterLight("abyss", time).strength, 0);
  assert.ok(waterLight("deep", "day").strength < waterLight("kelp", "day").strength);
  assert.ok(waterLight("reef", "dusk").strength < waterLight("reef", "day").strength);
});

test("shared currents stay slow and nearby particles flow in the same direction", () => {
  for (const biome of biomes) for (const time of [0, 10, 1000]) {
    const flow = waterCurrent(biome, time, 120);
    const adjacent = waterCurrent(biome, time, 121);
    assert.ok(flow.x > 0 && flow.x < 3);
    assert.ok(Math.abs(flow.y) < 0.5);
    assert.ok(Math.abs(flow.x - adjacent.x) < 0.01);
  }
});

test("submerged palettes remain valid and bounded across every species, habitat and light", () => {
  for (const species of SPECIES) for (const time of times) for (const z of [0, 0.5, 1]) {
    const palette = submergedPalette(species.palette, species.biome, time, z);
    assert.equal(palette.length, species.palette.length);
    assert.ok(palette.every(hex => /^#[0-9a-f]{6}$/i.test(hex)));
  }
  const near = submergedPalette(["#ffffff"], "reef", "day", 1)[0];
  const far = submergedPalette(["#ffffff"], "reef", "day", 0)[0];
  const night = submergedPalette(["#ffffff"], "reef", "night", 1)[0];
  assert.ok(parseInt(far.slice(1), 16) < parseInt(near.slice(1), 16));
  assert.ok(parseInt(night.slice(1), 16) < parseInt(near.slice(1), 16));
  const accents = ["#112233", "#223344", "#334455", "#44ffaa"];
  assert.equal(submergedPalette(accents, "abyss", "night", 0, true)[3], accents[3]);
});

test("habitat fades are monotonic, bounded and settle quickly with reduced motion", () => {
  let previous = 0;
  for (let ms = -100; ms <= 2000; ms += 10) {
    const blend = habitatBlend(ms / 1000);
    assert.ok(blend >= previous && blend <= 1);
    previous = blend;
  }
  assert.equal(habitatBlend(0), 0);
  assert.equal(habitatBlend(1.4), 1);
  assert.equal(habitatBlend(0.7), 0.5);
  assert.equal(habitatBlend(0.24, true), 1);
  assert.ok(habitatBlend(0.01) < 0.001);
});
