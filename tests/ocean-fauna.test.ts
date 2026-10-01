import test from "node:test";
import assert from "node:assert/strict";
import { SPECIES, discoveredSpeciesOfBiome } from "../src/data/species.js";
import { freshState } from "../src/game/save.js";
import { applySession } from "../src/game/progress.js";

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
