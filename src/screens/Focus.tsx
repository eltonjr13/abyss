import { useEffect, useRef, useState } from "react";
import { BIOMES } from "../data/biomes";
import { useGame } from "../game/GameContext";
import { elapsedSeconds, MIN_REWARD_SECONDS } from "../game/session";
import { formatTimer } from "../lib/format";

export function Focus() {
  const { session, pauseSession, resumeSession, completeSession, abandonSession } = useGame();
  const [now, setNow] = useState(() => Date.now());
  const doneRef = useRef(false);
  const paused = session?.startedAt === null;

  useEffect(() => {
    const sync = () => setNow(Date.now());
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    if (paused) return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
    const interval = window.setInterval(sync, 250);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [paused]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      if (event.target instanceof HTMLElement &&
          event.target.closest("button, input, textarea, select, [contenteditable]")) return;
      event.preventDefault();
      if (paused) resumeSession();
      else pauseSession();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused, pauseSession, resumeSession]);

  const planned = session?.plannedSeconds ?? null;
  const elapsed = session ? elapsedSeconds(session, now) : 0;
  const remaining = planned === null ? null : Math.max(0, planned - elapsed);

  useEffect(() => {
    if (!session || planned === null || remaining !== 0 || doneRef.current) return;
    doneRef.current = true;
    completeSession();
  }, [session, planned, remaining, completeSession]);

  useEffect(() => {
    document.title = session
      ? `${formatTimer(remaining ?? elapsed)} · TIDE`
      : "TIDE — o oceano que você restaura";
    return () => {
      document.title = "TIDE — o oceano que você restaura";
    };
  }, [session, elapsed, remaining]);

  if (!session) return null;

  const biome = BIOMES[session.biome];
  const canEarn = elapsedSeconds(session, Date.now()) >= MIN_REWARD_SECONDS;
  const end = () => {
    if (elapsedSeconds(session, Date.now()) >= MIN_REWARD_SECONDS) completeSession();
    else abandonSession();
  };

  return (
    <div className="relative z-20 flex min-h-dvh flex-col items-center justify-between gap-8 px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(32px,env(safe-area-inset-top))]">
      <div className="text-center">
        <p className="text-[11px] tracking-[0.38em] text-white/55 uppercase">{biome.name}</p>
      </div>

      <div className="max-w-lg text-center">
        <p className="font-sans text-[clamp(3rem,15vw,5rem)] font-extralight tracking-[0.08em] text-[var(--foam)]/90" role="timer" aria-label={planned === null ? "Tempo decorrido" : "Tempo restante"}>
          {formatTimer(remaining ?? elapsed)}
        </p>
        <p className="mt-4 font-serif text-xl text-white/65 italic">{session.quote}</p>
      </div>

      <div className="flex w-full max-w-xs flex-col items-center gap-3">
        {paused && <p className="font-serif text-sm text-white/60 italic">O tempo está em suspenso.</p>}
        <button
          onClick={paused ? resumeSession : pauseSession}
          className="min-h-12 w-full border border-white/30 px-5 py-3 text-[11px] tracking-[0.28em] text-white/85 uppercase hover:border-white/50"
        >
          {paused ? "Retomar" : "Pausar"}
        </button>
        <button
          onClick={end}
          className="min-h-11 px-4 text-[11px] tracking-[0.18em] text-white/60 uppercase hover:text-white/85"
        >
          {canEarn ? "Encerrar sessão" : "Descartar sessão"}
        </button>
        {!canEarn && <p className="text-center text-xs text-white/45">O progresso começa após 1 minuto de foco.</p>}
      </div>
    </div>
  );
}
