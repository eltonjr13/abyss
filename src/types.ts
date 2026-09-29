export type BiomeId =
  | "reef"
  | "kelp"
  | "mangrove"
  | "island"
  | "deep"
  | "abyss";

export type Rarity = "comum" | "incomum" | "rara" | "lendaria";

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

export type ViewId =
  | "onboarding"
  | "home"
  | "setup"
  | "focus"
  | "complete"
  | "explore"
  | "discoveries"
  | "profile";

export type ShapeId =
  | "fish1"
  | "fish2"
  | "fish3"
  | "clown"
  | "angel"
  | "turtle"
  | "seahorse"
  | "jelly"
  | "shark"
  | "ray"
  | "whale"
  | "dolphin"
  | "octopus"
  | "crab"
  | "star"
  | "coral"
  | "lantern"
  | "angler"
  | "squid"
  | "manta"
  | "otter"
  | "unknown"
  | "shrimp"
  | "eel"
  | "nautilus"
  | "bird"
  | "urchin"
  | "oyster"
  | "leaf";

export interface Species {
  id: string;
  name: string;
  scientific: string;
  biome: BiomeId;
  rarity: Rarity;
  minLife: number;
  blurb: string;
  shape: ShapeId;
  palette: string[];
}

export interface Biome {
  id: BiomeId;
  name: string;
  short: string;
  poetic: string;
  unlockHint: string;
  palette: {
    water: string;
    deep: string;
    light: string;
    accent: string;
  };
}

export interface AudioSettings {
  music: number;
  ambient: number;
  sfx: number;
}

export interface DayRecord {
  date: string;
  seconds: number;
}

export interface Rewards {
  xp: number;
  lifeGain: number;
  biome: BiomeId;
  seconds: number;
  newSpecies: string[];
  newBiomes: BiomeId[];
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  oldLife: number;
  newLife: number;
  quote: string;
}

export type PlusFeatureId =
  | "soundscapes_extended"
  | "sanctuary_mode"
  | "deep_metrics"
  | "tide_atmospheres"
  | "naturalist_cards";

export interface PlusEntitlement {
  isPlus: boolean;
  unlockedAt: string | null;
  transactionId: string | null;
  source: "purchase" | "restore" | "code" | "none";
}

export interface GameState {
  seenOnboarding: boolean;
  xp: number;
  totalFocusSeconds: number;
  todayFocusSeconds: number;
  todayDate: string;
  streak: number;
  lastSessionDate: string | null;
  sessionsCompleted: number;
  currentBiome: BiomeId;
  biomeLife: Record<BiomeId, number>;
  unlockedBiomes: BiomeId[];
  discovered: string[];
  history: DayRecord[];
  audio: AudioSettings;
  pity: Record<string, number>;
  plus: PlusEntitlement;
}

export interface ActiveSession {
  id: string;
  biome: BiomeId;
  plannedSeconds: number | null;
  elapsedMs: number;
  startedAt: number | null;
  quote: string;
  sharedUserId?: string;
  revision?: number;
}
