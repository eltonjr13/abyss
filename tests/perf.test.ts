import test from "node:test";
import assert from "node:assert/strict";
import { getBiomeImageKeys } from "../src/assets/images/keys.js";
import { perfMonitor } from "../src/perf/monitor.js";

test("getBiomeImageKeys selects only required images per biome instead of loading everything", () => {
  // Reef de dia: apenas reefDead e reefAlive
  const dayReef = getBiomeImageKeys("reef", "day");
  assert.equal(dayReef.length, 2);
  assert.ok(dayReef.includes("reefDead"));
  assert.ok(dayReef.includes("reefAlive"));

  // Reef à noite: inclui reefNight
  const nightReef = getBiomeImageKeys("reef", "night");
  assert.equal(nightReef.length, 3);
  assert.ok(nightReef.includes("reefNight"));

  // Outros biomas só precisam de 1 imagem específica
  const kelp = getBiomeImageKeys("kelp", "day");
  assert.deepEqual(kelp, ["kelp"]);

  const abyss = getBiomeImageKeys("abyss", "night");
  assert.deepEqual(abyss, ["abyss"]);
});

test("perfMonitor correctly sets low power mode and target FPS", () => {
  perfMonitor.setLowPowerMode(false);
  assert.equal(perfMonitor.getTargetFps(), 60);
  assert.equal(perfMonitor.isLowPowerMode(), false);

  perfMonitor.setLowPowerMode(true);
  assert.equal(perfMonitor.getTargetFps(), 30);
  assert.equal(perfMonitor.isLowPowerMode(), true);

  // Restaura o padrão
  perfMonitor.setLowPowerMode(false);
});
