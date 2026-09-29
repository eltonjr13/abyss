import { build, loadEnv } from "vite";

const env = loadEnv("extension", process.cwd(), "VITE_");
const define = Object.fromEntries(Object.entries(env).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]));

await build({ configLoader: "runner", mode: "extension", build: { outDir: "extension/dist" } });
for (const entry of ["background", "popup"]) {
  await build({
    configFile: false, define,
    build: {
      outDir: "extension/generated", emptyOutDir: false,
      lib: { entry: `src/extension/${entry}.ts`, formats: ["es"], fileName: () => `${entry}.js` },
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
}
