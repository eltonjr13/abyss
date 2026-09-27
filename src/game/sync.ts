import type { GameState } from "../types";
import { BIOME_ORDER } from "../data/biomes";
import { SPECIES } from "../data/species";
import { clamp } from "../lib/format";

export interface SyncPayload {
  version: 2;
  exportedAt: string;
  state: GameState;
}

/**
 * Exporta o estado atual do jogo como uma string JSON formatada.
 */
export function exportSaveToJson(state: GameState): string {
  const payload: SyncPayload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    state,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Exporta o estado como um código compacto Base64 para compartilhamento rápido entre celular e extensão.
 */
export function exportSaveToCode(state: GameState): string {
  const json = JSON.stringify({ v: 2, s: state });
  return btoa(encodeURIComponent(json));
}

/**
 * Decodifica um código de save Base64 ou string JSON.
 */
export function parseSavePayload(text: string): GameState | null {
  try {
    const trimmed = text.trim();
    if (trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      if (parsed.state) return parsed.state as GameState;
      if (parsed.xp !== undefined && parsed.currentBiome) return parsed as GameState;
    }
    // Tenta decodificar como base64
    const decoded = decodeURIComponent(atob(trimmed));
    const parsed = JSON.parse(decoded);
    if (parsed.s) return parsed.s as GameState;
    return null;
  } catch {
    return null;
  }
}

/**
 * Mescla de forma segura o estado local com o remoto (Estratégia: União e Maior Conquista).
 * Nenhum progresso, XP ou espécie descoberta é perdido.
 */
export function mergeGameStates(local: GameState, remote: GameState): GameState {
  const speciesSet = new Set(SPECIES.map((s) => s.id));

  // União das espécies descobertas
  const discovered = Array.from(
    new Set([...local.discovered, ...remote.discovered])
  ).filter((id) => speciesSet.has(id));

  // União dos biomas desbloqueados
  const unlockedBiomes = BIOME_ORDER.filter(
    (id) => id === "reef" || local.unlockedBiomes.includes(id) || remote.unlockedBiomes.includes(id)
  );

  // Maior vida para cada bioma
  const biomeLife = { ...local.biomeLife };
  for (const b of BIOME_ORDER) {
    const lLife = local.biomeLife[b] ?? 0;
    const rLife = remote.biomeLife[b] ?? 0;
    biomeLife[b] = clamp(Math.max(lLife, rLife), 0, 100);
  }

  // Histórico de dias combinados
  const historyMap = new Map<string, number>();
  for (const item of local.history) {
    historyMap.set(item.date, item.seconds);
  }
  for (const item of remote.history) {
    const existing = historyMap.get(item.date) ?? 0;
    historyMap.set(item.date, Math.max(existing, item.seconds));
  }
  const history = Array.from(historyMap.entries())
    .map(([date, seconds]) => ({ date, seconds }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-60);

  // Seleciona a maior quantidade de XP e foco total
  const xp = Math.max(local.xp, remote.xp);
  const totalFocusSeconds = Math.max(local.totalFocusSeconds, remote.totalFocusSeconds);
  const sessionsCompleted = Math.max(local.sessionsCompleted, remote.sessionsCompleted);

  // Sequência e data mais recente
  const streak = Math.max(local.streak, remote.streak);
  const lastSessionDate =
    (local.lastSessionDate && remote.lastSessionDate)
      ? local.lastSessionDate > remote.lastSessionDate
        ? local.lastSessionDate
        : remote.lastSessionDate
      : local.lastSessionDate || remote.lastSessionDate || null;

  // Preserva o status do Plus Vitalício se estiver ativo em qualquer um dos dispositivos
  const isPlus = Boolean(local.plus?.isPlus || remote.plus?.isPlus);
  const plus = isPlus
    ? (local.plus?.isPlus ? local.plus : remote.plus) || {
        isPlus: true,
        unlockedAt: new Date().toISOString(),
        transactionId: "sync",
        source: "restore",
      }
    : {
        isPlus: false,
        unlockedAt: null,
        transactionId: null,
        source: "none",
      };

  return {
    ...local,
    seenOnboarding: local.seenOnboarding || remote.seenOnboarding,
    xp,
    totalFocusSeconds,
    sessionsCompleted,
    streak,
    lastSessionDate,
    unlockedBiomes,
    biomeLife,
    discovered,
    history,
    plus,
  };
}
