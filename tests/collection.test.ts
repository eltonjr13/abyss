import assert from "node:assert/strict";
import test from "node:test";
import { SPECIES, SPECIES_BY_ID } from "../src/data/species";
import { collectionAchievements, COLLECTION_ACHIEVEMENTS, encounterChance, researchProgress, researchRequired, suitableFocusSeconds, trackedSpecies } from "../src/game/collection";
import { applySession } from "../src/game/progress";
import { freshState, hydrate, refreshDay } from "../src/game/save";
import { mergeGameStates, exportSaveToCode, parseSavePayload } from "../src/game/sync";
import { gameReducer, type GameData } from "../src/game/store";

const day = "2026-10-02";
const noEncounter = () => 0.999999;

test("research guarantees every rarity at the advertised accumulated duration", () => {
  for (const rarity of ["comum", "incomum", "rara", "lendaria"] as const) {
    const species = SPECIES.find(s => s.rarity === rarity)!;
    let state = freshState();
    state.unlockedBiomes = ["reef", "kelp", "mangrove", "island", "deep", "abyss"];
    state.biomeLife[species.biome] = 100;
    state.discovered = SPECIES.filter(s => s.id !== species.id).map(s => s.id);
    state.targetSpecies = species.id;
    const required = researchRequired(species);
    const before = applySession(state, species.biome, required - 60, day, noEncounter);
    assert.ok(!before.state.discovered.includes(species.id));
    assert.equal(before.state.targetSpecies, species.id);
    const result = applySession(before.state, species.biome, 60, day, noEncounter);
    assert.deepEqual(result.rewards.guaranteedSpecies, [species.id]);
    assert.ok(result.state.discovered.includes(species.id));
    assert.equal(result.state.targetSpecies, null);
    assert.equal(result.state.researchSeconds[species.id], required);
  }
});

test("short sessions accumulate the same research as continuous focus without farming guarantees", () => {
  const species = SPECIES_BY_ID["jamanta"]!;
  const initial = { ...freshState(), biomeLife: { ...freshState().biomeLife, reef: 100 }, discovered: ["peixe-palhaco"] };
  const long = applySession(initial, "reef", 60 * 60, day, noEncounter);
  let split = initial;
  for (let i = 0; i < 60; i++) split = applySession(split, "reef", 60, day, noEncounter).state;
  assert.equal(split.researchSeconds[species.id], long.state.researchSeconds[species.id]);
  assert.deepEqual(split.discovered, long.state.discovered);
  assert.ok(!split.discovered.includes(species.id));
  assert.equal(researchProgress(split, species).percent, 33);
});

test("encounter probability scales by rarity and partitioning minutes cannot increase it", () => {
  const chances = ["comum", "incomum", "rara", "lendaria"].map(rarity => {
    const species = SPECIES.find(s => s.rarity === rarity)!;
    const continuous = encounterChance(species, 25 * 60);
    const split = 1 - Math.pow(1 - encounterChance(species, 60), 25);
    assert.ok(Math.abs(continuous - split) < 1e-12);
    assert.equal(encounterChance(species, 0), 0);
    return continuous;
  });
  assert.ok(chances.every((value, index) => index === 0 || value < chances[index - 1]!));
});

test("only suitable minutes in the session habitat count and every session reports its gains", () => {
  const state = freshState();
  state.discovered = ["peixe-palhaco"];
  const result = applySession(state, "reef", 25 * 60, day, noEncounter);
  const active = suitableFocusSeconds(5, 10, 25 * 60);
  assert.ok(active > 0 && active < 25 * 60);
  assert.equal(result.state.researchSeconds["donzela-azul"], active);
  assert.equal(result.rewards.researchGains["donzela-azul"], active);
  assert.equal(result.state.researchSeconds["cavalo-marinho"], undefined);
  assert.equal(result.state.researchSeconds["garibaldi"], undefined);
  assert.equal(suitableFocusSeconds(0, 90, 25 * 60), 0);
});

test("five accumulated minutes welcome the player, rather than five seconds split into retries", () => {
  let state = freshState();
  for (let i = 0; i < 4; i++) {
    state = applySession(state, "reef", 60, day, noEncounter).state;
    assert.deepEqual(state.discovered, []);
  }
  state = applySession(state, "reef", 60, day, noEncounter).state;
  assert.deepEqual(state.discovered, ["peixe-palhaco"]);
});

test("a surprise can arrive early and collected species never get duplicate rewards", () => {
  const state = { ...freshState(), discovered: ["peixe-palhaco"], biomeLife: { ...freshState().biomeLife, reef: 100 } };
  const first = applySession(state, "reef", 60, day, () => 0);
  assert.ok(first.rewards.newSpecies.includes("jamanta"));
  assert.deepEqual(first.rewards.guaranteedSpecies, []);
  const second = applySession(first.state, "reef", 60, day, () => 0);
  assert.deepEqual(second.rewards.newSpecies, []);
  assert.equal(second.state.discovered.length, new Set(second.state.discovered).size);
});

test("tracking a different goal does not change research or confirmed-session rewards", () => {
  const initial: GameData = { state: freshState(), session: null, rewards: null };
  const selected = gameReducer(initial, { type: "target", id: "jamanta" });
  assert.equal(trackedSpecies(selected.state)?.id, "jamanta");
  assert.equal(gameReducer(selected, { type: "target", id: "invalid" }), selected);
  const a = applySession(initial.state, "reef", 25 * 60, day, noEncounter);
  const b = applySession(selected.state, "reef", 25 * 60, day, noEncounter);
  assert.deepEqual(a.state.discovered, b.state.discovered);
  assert.deepEqual(a.state.researchSeconds, b.state.researchSeconds);
  const switched = gameReducer({ ...selected, state: b.state }, { type: "target", id: "cavalo-marinho" });
  assert.deepEqual(switched.state.researchSeconds, b.state.researchSeconds);
});

test("old and malformed saves preserve discoveries and validate new collection fields", () => {
  const old = hydrate({ ...freshState(), discovered: ["peixe-palhaco"], researchSeconds: undefined, targetSpecies: undefined });
  assert.deepEqual(old.discovered, ["peixe-palhaco"]);
  assert.deepEqual(old.researchSeconds, {});
  assert.equal(old.targetSpecies, null);
  const bad = hydrate({ ...old, targetSpecies: "peixe-palhaco", researchSeconds: {
    invalid: 500, jamanta: Infinity, "cavalo-marinho": -1, "donzela-azul": 999999, moreia: "500",
  } });
  assert.equal(bad.targetSpecies, null);
  assert.deepEqual(bad.researchSeconds, { "donzela-azul": 900 });
});

test("backup merges keep the greatest research without doubling it and clear completed targets", () => {
  const local = { ...freshState(), targetSpecies: "jamanta", researchSeconds: { jamanta: 1800, "cavalo-marinho": 60 } };
  const remote = { ...freshState(), targetSpecies: "jamanta", researchSeconds: { jamanta: 600, "cavalo-marinho": 120 }, discovered: ["jamanta"] };
  const merged = mergeGameStates(local, remote);
  assert.equal(merged.researchSeconds.jamanta, 1800);
  assert.equal(merged.researchSeconds["cavalo-marinho"], 120);
  assert.equal(merged.targetSpecies, null);
  assert.ok(merged.discovered.includes("jamanta"));
  assert.deepEqual(mergeGameStates(merged, remote), merged);
  assert.deepEqual(parseSavePayload(exportSaveToCode(local))?.researchSeconds, local.researchSeconds);
});

test("sets use real catalog species and milestones unlock only once without disappearing after a break", () => {
  for (const achievement of COLLECTION_ACHIEVEMENTS) {
    assert.ok(achievement.required > 0 && achievement.required <= achievement.speciesIds.length);
    assert.ok(achievement.speciesIds.every(id => SPECIES_BY_ID[id]));
  }
  const initial = { ...freshState(), biomeLife: { ...freshState().biomeLife, reef: 100 }, discovered: SPECIES.filter(s => s.biome === "reef").slice(0, 4).map(s => s.id) };
  const first = applySession(initial, "reef", 25 * 60, day, noEncounter);
  assert.ok(first.rewards.newAchievements.includes("first-five"));
  const second = applySession(first.state, "reef", 60, day, noEncounter);
  assert.ok(!second.rewards.newAchievements.includes("first-five"));
  const later = refreshDay(second.state, "2026-10-10");
  assert.deepEqual(later.discovered, second.state.discovered);
  assert.deepEqual(later.researchSeconds, second.state.researchSeconds);
  assert.ok(collectionAchievements(later.discovered).find(a => a.id === "first-five")?.complete);
});
