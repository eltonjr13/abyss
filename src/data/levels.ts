export const XP_THRESHOLDS = [
  0, 30, 80, 150, 250, 380, 550, 760, 1020, 1350, 1750, 2250, 2900, 3700, 4700,
];

export const LEVEL_TITLES = [
  "Gotícula",
  "Maré rasa",
  "Espuma",
  "Recife",
  "Corrente",
  "Baía",
  "Maré viva",
  "Oceano",
  "Profundeza",
  "Abismo",
  "Mar aberto",
  "Guardião",
  "Maré-alta",
  "Horizonte",
  "Mito",
];

export function levelFromXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]!) level = i + 1;
  }
  return level;
}

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1] ?? "Gotícula";
}

export function xpProgress(xp: number): { level: number; current: number; next: number; t: number } {
  const level = levelFromXp(xp);
  const current = XP_THRESHOLDS[level - 1] ?? 0;
  const next = XP_THRESHOLDS[level] ?? current + 1200;
  const t = next === current ? 1 : (xp - current) / (next - current);
  return { level, current, next, t: Math.max(0, Math.min(1, t)) };
}
