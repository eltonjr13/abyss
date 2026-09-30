import test from "node:test";
import assert from "node:assert/strict";
import { SPECIES } from "../src/data/species.js";
import { CREATURE_FRAMES, creatureRows } from "../src/ocean/creature-art.js";
import { creaturePose, locomotion } from "../src/ocean/creature-motion.js";
import { SHAPES } from "../src/ocean/sprites.js";

test("every species renders valid, nonempty pixel art throughout its animation cycle", () => {
  for (const species of SPECIES) {
    for (let frame = 0; frame < CREATURE_FRAMES; frame++) {
      const rows = creatureRows(species.shape, frame, species.id);
      assert.equal(rows.length, 32, species.id);
      assert.ok(rows.every(row => row.length === 48 && /^[.0-6]+$/.test(row)), species.id);
      assert.ok(rows.join("").replaceAll(".", "").length > 50, species.id);
      assert.ok([...rows.join("")].every(pixel => pixel === "." || species.palette[Number(pixel)]), species.id);
    }
  }
});

test("tails, wings, bells and tentacles deform independently rather than translating a static sprite", () => {
  for (const shape of ["clown", "turtle", "manta", "jelly", "squid", "octopus", "eel", "crab"] as const) {
    const frames = new Set(Array.from({ length: CREATURE_FRAMES }, (_, frame) => creatureRows(shape, frame).join("\n")));
    assert.ok(frames.size >= 3, `${shape}: only ${frames.size} distinct frames`);
  }
});

test("bottom dwellers remain anchored and pulse swimmers accelerate with their stroke", () => {
  for (const shape of ["coral", "urchin", "star", "oyster"] as const) {
    assert.equal(locomotion(shape), "anchored");
    for (const time of [0, 1, 5]) {
      const pose = creaturePose(shape, time, 0);
      assert.equal(pose.surge, 0); assert.equal(pose.bob, 0); assert.equal(pose.tilt, 0);
    }
  }
  assert.equal(locomotion("crab"), "crawl");
  assert.equal(locomotion("bird"), "surface");
  assert.equal(locomotion("fish1", "peixe-tripode"), "anchored");
  assert.notEqual(creaturePose("jelly", 0, 0).surge, creaturePose("jelly", 0.5, 0).surge);
});

test("reduced motion freezes local deformation and every frame stays inside the atlas", () => {
  for (const shape of Object.keys(SHAPES) as (keyof typeof SHAPES)[]) {
    for (const time of [0, 0.2, 1, 100_000]) {
      const reduced = creaturePose(shape, time, 4, 2, true);
      assert.equal(reduced.frame, 0); assert.equal(reduced.tilt, 0);
      const pose = creaturePose(shape, time, 4, 2);
      assert.ok(pose.frame >= 0 && pose.frame < CREATURE_FRAMES);
    }
    assert.deepEqual(creatureRows(shape, 0), creatureRows(shape, CREATURE_FRAMES));
  }
});

test("species sharing a shape can have their own identifying markings", () => {
  assert.notDeepEqual(creatureRows("fish2", 0, "peixe-cirurgiao"), creatureRows("fish2", 0, "peixe-arqueiro"));
  assert.notDeepEqual(creatureRows("star", 0, "estrela-girassol"), creatureRows("star", 0, "estrela-do-mar"));
  assert.notDeepEqual(creatureRows("coral", 0, "coral-cerebro"), creatureRows("coral", 0, "anemona"));
});
