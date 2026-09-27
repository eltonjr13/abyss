import type { ActiveSession, BiomeId } from "../types";

export const MIN_REWARD_SECONDS = 60;

export function createSession(
  biome: BiomeId,
  plannedSeconds: number | null,
  quote: string,
  now: number,
): ActiveSession {
  return {
    id: String(now),
    biome,
    plannedSeconds,
    elapsedMs: 0,
    startedAt: now,
    quote,
  };
}

export function elapsedMs(session: ActiveSession, now: number): number {
  const runningMs = session.startedAt === null ? 0 : Math.max(0, now - session.startedAt);
  return session.elapsedMs + runningMs;
}

export function elapsedSeconds(session: ActiveSession, now: number): number {
  const actual = Math.floor(elapsedMs(session, now) / 1000);
  return session.plannedSeconds === null ? actual : Math.min(actual, session.plannedSeconds);
}

export function pauseSessionAt(session: ActiveSession, now: number): ActiveSession {
  if (session.startedAt === null) return session;
  return { ...session, elapsedMs: elapsedMs(session, now), startedAt: null };
}

export function resumeSessionAt(session: ActiveSession, now: number): ActiveSession {
  if (session.startedAt !== null) return session;
  return { ...session, startedAt: now };
}
