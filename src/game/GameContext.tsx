import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type { ActiveSession, AudioSettings, BiomeId, GameState, Rewards, ViewId } from "../types";
import { getAudio } from "../audio/engine";
import { FOCUS_QUOTES, pick } from "../data/quotes";
import { todayKey } from "../lib/format";
import { persistSnapshot } from "./save";
import { elapsedSeconds, MIN_REWARD_SECONDS } from "./session";
import { gameReducer, initialGameData } from "./store";

interface GameContextValue {
  state: GameState;
  view: ViewId;
  setView: (v: ViewId) => void;
  session: ActiveSession | null;
  rewards: Rewards | null;
  selectedSpecies: string | null;
  setSelectedSpecies: (id: string | null) => void;
  finishOnboarding: () => void;
  selectBiome: (id: BiomeId) => void;
  startSession: (seconds: number | null) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  completeSession: () => void;
  abandonSession: () => void;
  setAudio: (a: AudioSettings) => void;
  resetSave: () => void;
  importState: (incoming: GameState) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(gameReducer, undefined, initialGameData);
  const { state, session, rewards } = data;
  const [view, setView] = useState<ViewId>(() =>
    session ? "focus" : state.seenOnboarding ? "home" : "onboarding",
  );
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);

  useEffect(() => {
    persistSnapshot({ state, session });
  }, [state, session]);

  useEffect(() => {
    const refresh = () => dispatch({ type: "day", today: todayKey() });
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(refresh, 30_000);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, []);

  const finishOnboarding = useCallback(() => {
    dispatch({ type: "onboarding" });
    setView("home");
    void getAudio().start(state.currentBiome);
  }, [state.currentBiome]);

  const selectBiome = useCallback((id: BiomeId) => {
    if (!state.unlockedBiomes.includes(id)) return;
    dispatch({ type: "biome", id });
    getAudio().setBiome(id);
  }, [state.unlockedBiomes]);

  const startSession = useCallback((seconds: number | null) => {
    if (seconds !== null && (!Number.isInteger(seconds) || seconds < 60 || seconds > 180 * 60)) return;
    dispatch({ type: "start", seconds, quote: pick(FOCUS_QUOTES), now: Date.now() });
    setView("focus");
    void getAudio().start(state.currentBiome);
  }, [state.currentBiome]);

  const pauseSession = useCallback(() => {
    dispatch({ type: "pause", now: Date.now() });
  }, []);

  const resumeSession = useCallback(() => {
    dispatch({ type: "resume", now: Date.now() });
  }, []);

  const completeSession = useCallback(() => {
    if (!session) return;
    const now = Date.now();
    if (elapsedSeconds(session, now) < MIN_REWARD_SECONDS) return;
    dispatch({ type: "complete", id: session.id, now });
    setView("complete");
    getAudio().chime();
  }, [session]);

  const abandonSession = useCallback(() => {
    dispatch({ type: "abandon" });
    setView("home");
  }, []);

  const setAudio = useCallback((audio: AudioSettings) => {
    dispatch({ type: "audio", audio });
    getAudio().setVolumes(audio);
  }, []);

  const resetSave = useCallback(() => {
    dispatch({ type: "reset", now: Date.now() });
    setView("home");
  }, []);

  const importState = useCallback((incoming: GameState) => {
    dispatch({ type: "import", state: incoming });
  }, []);

  const value = useMemo(
    () => ({
      state,
      view,
      setView,
      session,
      rewards,
      selectedSpecies,
      setSelectedSpecies,
      finishOnboarding,
      selectBiome,
      startSession,
      pauseSession,
      resumeSession,
      completeSession,
      abandonSession,
      setAudio,
      resetSave,
      importState,
    }),
    [
      state,
      view,
      session,
      rewards,
      selectedSpecies,
      finishOnboarding,
      selectBiome,
      startSession,
      pauseSession,
      resumeSession,
      completeSession,
      abandonSession,
      setAudio,
      resetSave,
      importState,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame");
  return ctx;
}
