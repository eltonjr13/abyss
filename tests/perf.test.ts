import test from "node:test";
import assert from "node:assert/strict";
import { getBiomeImageSources } from "../src/assets/images/index.js";
import { perfMonitor } from "../src/perf/monitor.js";

test("getBiomeImageSources loads only necessary images per biome instead of all 18MB", () => {
  // Reef durante o dia: apenas reefDead e reefAlive
  const dayReef = getBiomeImageSources("reef", "day");
  assert.equal(dayReef.length, 2);

  // Reef durante a noite: inclui reefNight
  const nightReef = getBiomeImageSources("reef", "night");
  assert.equal(nightReef.length, 3);

  // Outros biomas só precisam da sua respectiva imagem de fundo
  const kelp = getBiomeImageSources("kelp", "day");
  assert.equal(kelp.length, 1);

  const abyss = getBiomeImageSources("abyss", "night");
  assert.equal(abyss.length, 1);
});

test("perfMonitor correctly sets low power mode and target FPS", () => {
  perfMonitor.setLowPowerMode(false);
  assert.equal(perfMonitor.getTargetFps(), 60);
  assert.equal(perfMonitor.isLowPowerMode(), false);

  perfMonitor.setLowPowerMode(true);
  assert.equal(perfMonitor.getTargetFps(), 30);
  assert.equal(perfMonitor.isLowPowerMode(), true);

  // Restaura
  perfMonitor.setLowPowerMode(false);
});
