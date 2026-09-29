import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
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
import { useAuth } from "../auth/AuthContext";
import { Capacitor } from "@capacitor/core";
import { extensionChrome } from "../platform/chrome";
import { useSharedFocus } from "../focus/useSharedFocus";
import { isActive, type FocusCommand, type FocusSnapshot } from "../focus/shared";

interface GameContextValue {
  state: GameState;
  view: ViewId;
  setView: (v: ViewId) => void;
  session: ActiveSession | null;
  rewards: Rewards | null;
  syncBusy: boolean;
  syncMessage: string | null;
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
  unlockPlus: (transactionId?: string, source?: "purchase" | "restore" | "code") => void;
  revokePlus: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(gameReducer, undefined, initialGameData);
  const { state, session, rewards } = data;
  const { user, loading: authLoading, error: authError } = useAuth();
  const currentData = useRef(data);
  currentData.current = data;
  const [view, setView] = useState<ViewId>(() =>
    session ? "focus" : state.seenOnboarding ? "home" : "onboarding",
  );
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const announcedRewards = useRef(new Set(data.appliedSharedSessions ?? []));
  const acceptShared = useCallback((snapshot: FocusSnapshot) => {
    if (!user || (currentData.current.session && !currentData.current.session.sharedUserId)) return;
    const newlyCompleted = snapshot.completed.filter((row) => row.user_id === user.id &&
      !announcedRewards.current.has(row.id));
    for (const row of newlyCompleted) announcedRewards.current.add(row.id);
    const hasReward = newlyCompleted.length > 0;
    dispatch({ type: "shared", snapshot, userId: user.id, now: Date.now() });
    if (isActive(snapshot.row)) setView("focus");
    else if (hasReward) { setView("complete"); getAudio().chime(); }
    else if (currentData.current.session?.sharedUserId) setView("home");
  }, [user]);
  const shared = useSharedFocus(user?.id ?? null, acceptShared);
  const syncBusy = authLoading || Boolean(session?.sharedUserId && !user) ||
    Boolean(user && (!shared.snapshot?.connected || shared.snapshot.busy));
  const syncMessage = authLoading ? "Verificando sua conta…" : session && !session.sharedUserId && user
    ? "Finalize esta sessão local para conectar o timer à sua conta."
    : shared.snapshot?.error ?? (user ? shared.snapshot?.connected
      ? "Timer conectado à sua conta." : "Conectando seu timer…" : null);

  useEffect(() => {
    if (authLoading || (!user && authError)) return;
    if (currentData.current.session?.sharedUserId && currentData.current.session.sharedUserId !== user?.id) {
      dispatch({ type: "detach_shared" });
      setView("home");
    }
  }, [user?.id, authLoading, authError]);

  useEffect(() => {
    if (!session && user) void shared.connection.current?.refresh().catch(() => undefined);
  }, [session?.id, user?.id, shared.connection]);

  useEffect(() => {
    persistSnapshot({ state, session, appliedSharedSessions: data.appliedSharedSessions });
  }, [state, session, data.appliedSharedSessions]);

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
    if (authLoading || currentData.current.session) return;
    if (user) {
      const origin = Capacitor.isNativePlatform() ? "mobile" : extensionChrome() ? "extension" : "web";
      void shared.connection.current?.start(seconds, state.currentBiome, pick(FOCUS_QUOTES), origin)
        .then(() => { void getAudio().start(state.currentBiome); }).catch(() => undefined);
      return;
    }
    dispatch({ type: "start", seconds, quote: pick(FOCUS_QUOTES), now: Date.now() });
    setView("focus");
    void getAudio().start(state.currentBiome);
  }, [state.currentBiome, authLoading, user, shared.connection]);

  const sharedCommand = useCallback((command: FocusCommand) => {
    if (!currentData.current.session?.sharedUserId) return false;
    void shared.connection.current?.command(command).catch(() => undefined);
    return true;
  }, [shared.connection]);

  const pauseSession = useCallback(() => {
    if (sharedCommand("pause")) return;
    dispatch({ type: "pause", now: Date.now() });
  }, [sharedCommand]);

  const resumeSession = useCallback(() => {
    if (sharedCommand("resume")) return;
    dispatch({ type: "resume", now: Date.now() });
  }, [sharedCommand]);

  const completeSession = useCallback(() => {
    if (!session) return;
    if (sharedCommand("complete")) return;
    const now = Date.now();
    if (elapsedSeconds(session, now) < MIN_REWARD_SECONDS) return;
    dispatch({ type: "complete", id: session.id, now });
    setView("complete");
    getAudio().chime();
  }, [session, sharedCommand]);

  const abandonSession = useCallback(() => {
    if (sharedCommand("abandon")) return;
    dispatch({ type: "abandon" });
    setView("home");
  }, [sharedCommand]);

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

  const unlockPlus = useCallback(
    (transactionId?: string, source?: "purchase" | "restore" | "code") => {
      dispatch({ type: "unlock_plus", transactionId, source });
    },
    [],
  );

  const revokePlus = useCallback(() => {
    dispatch({ type: "revoke_plus" });
  }, []);

  const value = useMemo(
    () => ({
      state,
      view,
      setView,
      session,
      rewards,
      syncBusy,
      syncMessage,
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
      unlockPlus,
      revokePlus,
    }),
    [
      state,
      view,
      session,
      rewards,
      syncBusy,
      syncMessage,
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
      unlockPlus,
      revokePlus,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame");
  return ctx;
}
