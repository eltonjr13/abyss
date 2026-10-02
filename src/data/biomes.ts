import type { Biome, BiomeId, TimeOfDay } from "../types";

export const BIOME_ORDER: BiomeId[] = [
  "reef",
  "kelp",
  "mangrove",
  "island",
  "deep",
  "abyss",
];

export const BIOMES: Record<BiomeId, Biome> = {
  reef: {
    id: "reef",
    name: "Recife de Coral",
    short: "Recife",
    poetic: "Onde a cor aprende a voltar.",
    unlockHint: "O primeiro silêncio. Sempre aberto.",
    palette: {
      water: "#1a4a63",
      deep: "#0b2433",
      light: "#7ec8c8",
      accent: "#d4896a",
    },
  },
  kelp: {
    id: "kelp",
    name: "Floresta de Kelp",
    short: "Kelp",
    poetic: "Catedrais verdes que balançam com a maré.",
    unlockHint: "Recupere o Recife até 16% de vida para abrir esta região.",
    palette: {
      water: "#1c3d32",
      deep: "#0a1f18",
      light: "#c4b06a",
      accent: "#6b8f71",
    },
  },
  mangrove: {
    id: "mangrove",
    name: "Manguezal",
    short: "Mangue",
    poetic: "Raízes que respiram entre dois mundos.",
    unlockHint: "Abra a Floresta de Kelp e alcance 14% de vida nela ou 40% no Recife.",
    palette: {
      water: "#2c4a3e",
      deep: "#14241c",
      light: "#c9a86c",
      accent: "#8a6a48",
    },
  },
  island: {
    id: "island",
    name: "Ilha Tropical",
    short: "Ilha",
    poetic: "Um pedaço de terra que o foco fez emergir.",
    unlockHint: "Abra o Manguezal e alcance 14% de vida nele ou 36% na Floresta de Kelp.",
    palette: {
      water: "#2a7a86",
      deep: "#123a44",
      light: "#f0e2b6",
      accent: "#e8b86a",
    },
  },
  deep: {
    id: "deep",
    name: "Mar Profundo",
    short: "Profundo",
    poetic: "O azul que engole o resto da luz.",
    unlockHint: "Abra a Ilha Tropical, alcance 18% de vida nela e acumule 40 minutos de foco no total.",
    palette: {
      water: "#122038",
      deep: "#070d18",
      light: "#4a6a8a",
      accent: "#6a8aaa",
    },
  },
  abyss: {
    id: "abyss",
    name: "Abismo",
    short: "Abismo",
    poetic: "Quase nada. Quase tudo. Quase silêncio.",
    unlockHint: "Abra o Mar Profundo, alcance 22% de vida nele e chegue ao nível 4.",
    palette: {
      water: "#07060e",
      deep: "#030208",
      light: "#2a4a5a",
      accent: "#6a3a8a",
    },
  },
};

export function getTimeOfDay(date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 17) return "day";
  if (h >= 17 && h < 20) return "dusk";
  return "night";
}

export const TIME_LABEL: Record<TimeOfDay, string> = {
  dawn: "Amanhecer",
  day: "Dia",
  dusk: "Pôr do sol",
  night: "Noite",
};
