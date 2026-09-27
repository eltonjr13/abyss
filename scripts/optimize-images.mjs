import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const imagesDir = path.join(root, "src", "assets", "images");
const outputDir = path.join(imagesDir, "webp");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function optimize() {
  const files = fs.readdirSync(imagesDir).filter((f) => f.endsWith(".png"));
  let totalOrig = 0;
  let totalWebp = 0;

  console.log("Iniciando otimização de imagens...");

  for (const file of files) {
    const origPath = path.join(imagesDir, file);
    const baseName = file.replace(/\.png$/, "");
    const outPath = path.join(outputDir, `${baseName}.webp`);
    const origStat = fs.statSync(origPath);
    totalOrig += origStat.size;

    const isMap = file === "map.png";
    const targetW = isMap ? 960 : 480;
    const targetH = isMap ? 536 : 270;

    await sharp(origPath)
      .resize(targetW, targetH, { fit: "fill" })
      .webp({ quality: 86, effort: 5 })
      .toFile(outPath);

    const outStat = fs.statSync(outPath);
    totalWebp += outStat.size;

    console.log(
      `${file.padEnd(16)}: ${(origStat.size / (1024 * 1024)).toFixed(2)} MB -> ${(
        outStat.size / 1024
      ).toFixed(1)} KB (-${((1 - outStat.size / origStat.size) * 100).toFixed(1)}%)`
    );
  }

  console.log("-----------------------------------------");
  console.log(`Tamanho original total: ${(totalOrig / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Tamanho WebP total:     ${(totalWebp / (1024 * 1024)).toFixed(2)} MB`);
  console.log(
    `Economia total:         ${((1 - totalWebp / totalOrig) * 100).toFixed(1)}%`
  );
}

optimize().catch((err) => {
  console.error("Erro na otimização:", err);
  process.exit(1);
});
