import { build } from "vite";

// A extensão ainda não tem um redirect OAuth próprio publicado e testado.
// Desativa apenas o login no bundle da extensão; builds móveis usam o fluxo normal.
process.env.VITE_GOOGLE_AUTH_ENABLED = "false";

await build({ configLoader: "runner", mode: "extension" });
