import test from "node:test";
import assert from "node:assert/strict";
import { exportSaveToCode, exportSaveToJson, mergeGameStates, parseSavePayload } from "../src/game/sync.js";
import { freshState } from "../src/game/save.js";
import type { GameState } from "../src/types.js";

test("exportSaveToJson and exportSaveToCode serialize correctly and parse without data loss", () => {
  const initial = freshState();
  initial.xp = 120;
  initial.discovered = ["coral_polyp", "anemone_clown"];
  initial.biomeLife.reef = 35;

  const json = exportSaveToJson(initial);
  const parsedFromJson = parseSavePayload(json);
  assert.ok(parsedFromJson !== null);
  assert.equal(parsedFromJson?.xp, 120);
  assert.deepEqual(parsedFromJson?.discovered, ["coral_polyp", "anemone_clown"]);
  assert.equal(parsedFromJson?.biomeLife.reef, 35);

  const code = exportSaveToCode(initial);
  const parsedFromCode = parseSavePayload(code);
  assert.ok(parsedFromCode !== null);
  assert.equal(parsedFromCode?.xp, 120);
  assert.deepEqual(parsedFromCode?.discovered, ["coral_polyp", "anemone_clown"]);
});

test("mergeGameStates preserves the maximum XP, union of discovered species, and best biome life", () => {
  const local: GameState = {
    ...freshState(),
    xp: 250,
    totalFocusSeconds: 3600,
    discovered: ["coral_polyp", "clownfish"],
    unlockedBiomes: ["reef", "kelp"],
    biomeLife: { reef: 40, kelp: 15, mangrove: 0, island: 0, deep: 0, abyss: 0 },
    streak: 3,
  };

  const remote: GameState = {
    ...freshState(),
    xp: 400,
    totalFocusSeconds: 5400,
    discovered: ["clownfish", "giant_kelp", "sea_otter"],
    unlockedBiomes: ["reef", "kelp", "mangrove"],
    biomeLife: { reef: 20, kelp: 60, mangrove: 25, island: 0, deep: 0, abyss: 0 },
    streak: 5,
  };

  const merged = mergeGameStates(local, remote);

  // Deve manter o maior XP e tempo total
  assert.equal(merged.xp, 400);
  assert.equal(merged.totalFocusSeconds, 5400);
  assert.equal(merged.streak, 5);

  // Deve desbloquear a união de biomas
  assert.ok(merged.unlockedBiomes.includes("reef"));
  assert.ok(merged.unlockedBiomes.includes("kelp"));
  assert.ok(merged.unlockedBiomes.includes("mangrove"));

  // Deve manter o maior nível de vida para cada bioma
  assert.equal(merged.biomeLife.reef, 40); // 40 do local > 20 do remoto
  assert.equal(merged.biomeLife.kelp, 60); // 60 do remoto > 15 do local
  assert.equal(merged.biomeLife.mangrove, 25);

  // Deve conter a união de todas as espécies sem duplicatas
  assert.ok(merged.discovered.includes("coral_polyp"));
  assert.ok(merged.discovered.includes("clownfish"));
  assert.ok(merged.discovered.includes("giant_kelp"));
  assert.ok(merged.discovered.includes("sea_otter"));
});
