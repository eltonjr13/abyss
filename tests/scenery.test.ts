import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const root = new URL("../", import.meta.url);
const receipts = JSON.parse(readFileSync(new URL("docs/scenery-prompts.json", root), "utf8")) as {
  assets: { id: string; asset: string; width: number; height: number; bytes: number; sha256: string }[];
};

test("all ten scenery plates are present, opaque, decodable Full HD WebP files", () => {
  assert.deepEqual(receipts.assets.map(asset => asset.id).sort(), ["abyss", "deep", "island", "kelp", "mangrove", "map", "reef-alive", "reef-dead", "reef-night", "surface"]);
  for (const asset of receipts.assets) {
    const bytes = readFileSync(new URL(asset.asset, root));
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF", asset.id);
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP", asset.id);
    assert.equal(bytes.toString("ascii", 12, 16), "VP8 ", asset.id);
    assert.deepEqual([...bytes.subarray(23, 26)], [0x9d, 0x01, 0x2a], asset.id);
    assert.equal(bytes.readUInt16LE(26) & 0x3fff, 1920, asset.id);
    assert.equal(bytes.readUInt16LE(28) & 0x3fff, 1080, asset.id);
    assert.equal(bytes.length, asset.bytes, asset.id);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256, asset.id);
  }
});

test("the app uses the reviewed scenery plates for every background, including map and onboarding", () => {
  const source = readFileSync(new URL("src/assets/images/index.ts", root), "utf8");
  const imports = [...source.matchAll(/from "\.\/scenery\/([^"]+)\.webp"/g)].map(match => match[1]).sort();
  assert.deepEqual(imports, receipts.assets.map(asset => asset.id).sort());
  assert.ok(!source.includes("./optimized/"));
});
