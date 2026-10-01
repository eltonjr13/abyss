import test from "node:test";
import assert from "node:assert/strict";
import { SPECIES, discoveredSpeciesOfBiome } from "../src/data/species.js";
import { freshState } from "../src/game/save.js";
import { applySession } from "../src/game/progress.js";
import { oceanPopulation } from "../src/ocean/population.js";
import { habitatRestoration } from "../src/ocean/restoration.js";

test("an empty collection never introduces fallback animals in any habitat", () => {
  for (const species of SPECIES) {
    assert.deepEqual(discoveredSpeciesOfBiome(species.biome, []), []);
  }
});

test("only collected species belonging to the active habitat can appear", () => {
  const reef = SPECIES.find(s => s.biome === "reef")!;
  const kelp = SPECIES.find(s => s.biome === "kelp")!;
  const collection = [reef.id, kelp.id, "invalid-species", reef.id];
  assert.deepEqual(discoveredSpeciesOfBiome("reef", collection), [reef]);
  assert.deepEqual(discoveredSpeciesOfBiome("kelp", collection), [kelp]);
  assert.deepEqual(discoveredSpeciesOfBiome("abyss", collection), []);
  assert.equal(collection.length, 4);
});

test("revitalization alone does not populate the ocean before a discovery is earned", () => {
  const state = freshState();
  state.biomeLife.reef = 100;
  assert.deepEqual(discoveredSpeciesOfBiome("reef", state.discovered), []);
  const result = applySession(state, "reef", 5 * 60, "2026-10-01", () => 0);
  assert.ok(result.rewards.newSpecies.length > 0);
  assert.deepEqual(
    discoveredSpeciesOfBiome("reef", result.state.discovered).map(s => s.id),
    result.rewards.newSpecies,
  );
});

test("collected animals remain available even when habitat life is below their discovery threshold", () => {
  const species = SPECIES.find(s => s.biome === "reef" && s.minLife > 0)!;
  const state = freshState();
  state.discovered = [species.id];
  state.biomeLife.reef = 0;
  assert.deepEqual(discoveredSpeciesOfBiome("reef", state.discovered), [species]);
});

test("every collected species is represented, with at most two copies even in a restored habitat", () => {
  const reef = SPECIES.filter(s => s.biome === "reef");
  for (const count of [1, 3, reef.length]) {
    const ids = reef.slice(0, count).map(s => s.id);
    for (const life of [0, 20, 100]) {
      for (const time of ["day", "night"] as const) {
        const animals = oceanPopulation("reef", ids, life, time);
        assert.deepEqual([...new Set(animals.map(s => s.id))], ids);
        assert.ok(animals.length <= count * 2);
        for (const id of ids) assert.ok(animals.filter(s => s.id === id).length <= 2);
      }
    }
  }
  assert.deepEqual(oceanPopulation("kelp", [reef[0]!.id], 100, "day"), []);
});

test("all habitats recover gradually without turning natural darkness into a restoration penalty", () => {
  for (const biome of ["reef", "kelp", "mangrove", "island", "deep", "abyss"] as const) {
    let previous = habitatRestoration(biome, 0);
    assert.equal(previous.plants, 0);
    for (let life = 5; life <= 100; life += 5) {
      const next = habitatRestoration(biome, life);
      assert.ok(next.brightness >= previous.brightness);
      assert.ok(next.saturation >= previous.saturation);
      assert.ok(next.plants >= previous.plants);
      assert.ok(next.sediment <= previous.sediment);
      previous = next;
    }
    assert.equal(previous.brightness, 1);
    assert.equal(previous.saturation, 1);
    assert.equal(previous.sediment, 0);
    assert.equal(previous.label, "Habitat restaurado");
  }
  assert.equal(habitatRestoration("kelp", 25).label, "Vida retornando");
  assert.equal(habitatRestoration("kelp", 65).label, "Habitat florescendo");
});
