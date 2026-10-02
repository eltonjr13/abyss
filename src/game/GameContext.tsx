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
import { loadSnapshot, persistSnapshot } from "./save";
import { gameReducer, initialGameData } from "./store";
import { useAuth } from "../auth/AuthContext";
import { Capacitor } from "@capacitor/core";
import { extensionChrome } from "../platform/chrome";
import { useSharedFocus } from "../focus/useSharedFocus";
import { isActive, type FocusCommand, type FocusSnapshot } from "../focus/shared";
import { canStartDive } from "../focus/access";
import { SPECIES_BY_ID } from "../data/species";

interface GameContextValue {
  state: GameState;
  view: ViewId;
  setView: (v: ViewId) => void;
  session: ActiveSession | null;
  rewards: Rewards | null;
  syncBusy: boolean;
  canDive: boolean;
  syncMessage: string | null;
  selectedSpecies: string | null;
  setSelectedSpecies: (id: string | null) => void;
  setTargetSpecies: (id: string | null) => void;
  highlightedSpecies: string | null;
  showSpeciesInOcean: (id: string) => void;
  clearHighlight: () => void;
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
  const { user, verified, busy: authBusy, loading: authLoading } = useAuth();
  const currentData = useRef(data);
  currentData.current = data;
  const [view, setView] = useState<ViewId>(() =>
    session ? "focus" : state.seenOnboarding ? "home" : "onboarding",
  );
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [highlightedSpecies, setHighlightedSpecies] = useState<string | null>(null);
  const announcedRewards = useRef(new Set(data.appliedSharedSessions ?? []));
  const syncedAccount = useRef<string | null>(null);
  const acceptShared = useCallback((snapshot: FocusSnapshot) => {
    if (!user || currentData.current.accountId !== user.id) return;
    const newlyCompleted = snapshot.completed.filter((row) => row.user_id === user.id &&
      !announcedRewards.current.has(row.id));
    for (const row of newlyCompleted) announcedRewards.current.add(row.id);
    const firstSync = syncedAccount.current !== user.id;
    const hasReward = newlyCompleted.length > 0 && (!firstSync || newlyCompleted.some(row => row.id === currentData.current.session?.id));
    syncedAccount.current = user.id;
    dispatch({ type: "shared", snapshot, userId: user.id, now: Date.now() });
    if (isActive(snapshot.row)) setView("focus");
    else if (hasReward) { setView("complete"); getAudio().chime(); }
    else if (currentData.current.session?.sharedUserId) setView("home");
  }, [user]);
  const shared = useSharedFocus(user?.id ?? null, acceptShared);
  const accountReady = data.accountId === (user?.id ?? null);
  const syncBusy = authLoading || !accountReady || Boolean(session?.sharedUserId && !user) ||
    Boolean(user && (!shared.snapshot?.connected || shared.snapshot.busy || syncedAccount.current !== user.id));
  const canDive = canStartDive({ userId: user?.id ?? null, accountId: data.accountId ?? null, verified,
    authLoading, authBusy, connected: shared.connection.current?.userId === user?.id && Boolean(shared.snapshot?.connected), syncBusy });
  const syncMessage = authLoading || !accountReady ? "Verificando sua conta…" : user && !verified
    ? "Verifique sua conta com internet antes de mergulhar."
    : shared.snapshot?.error ?? (user ? shared.snapshot?.connected
      ? "Sessões conectadas à sua conta." : "Conectando suas sessões…" : "Conecte sua conta para mergulhar e registrar suas descobertas.");

  useEffect(() => {
    if (authLoading || currentData.current.accountId === (user?.id ?? null)) return;
    const snapshot = loadSnapshot(Date.now(), user?.id);
    announcedRewards.current = new Set(snapshot.appliedSharedSessions ?? []);
    syncedAccount.current = null;
    dispatch({ type: "account", accountId: user?.id ?? null, snapshot });
    setSelectedSpecies(null);
    setHighlightedSpecies(null);
    setView(snapshot.state.seenOnboarding ? "home" : "onboarding");
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (!authLoading && accountReady && user && (!session || syncedAccount.current !== user.id)) {
      void shared.connection.current?.refresh().catch(() => undefined);
    }
  }, [authLoading, accountReady, data.accountId, session?.id, user?.id, shared.connection]);

  useEffect(() => {
    if (authLoading || !accountReady) return;
    if (data.accountId) persistSnapshot({ state, session, appliedSharedSessions: data.appliedSharedSessions }, data.accountId);
    else persistSnapshot({ ...loadSnapshot(), state });
  }, [state, session, data.appliedSharedSessions, data.accountId, accountReady, authLoading]);

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
    if (!user) persistSnapshot({ ...loadSnapshot(), state: { ...state, seenOnboarding: true } });
    setView("home");
    void getAudio().start(state.currentBiome);
  }, [state, user]);

  const selectBiome = useCallback((id: BiomeId) => {
    if (!state.unlockedBiomes.includes(id)) return;
    dispatch({ type: "biome", id });
    getAudio().setBiome(id);
  }, [state.unlockedBiomes]);

  const startSession = useCallback((seconds: number | null) => {
    if (seconds !== null && (!Number.isInteger(seconds) || seconds < 60 || seconds > 180 * 60)) return;
    const connection = shared.connection.current;
    if (!canDive || !user || currentData.current.accountId !== user.id || connection?.userId !== user.id ||
      !connection.snapshot.connected || connection.snapshot.busy || currentData.current.session) return;
    const origin = Capacitor.isNativePlatform() ? "mobile" : extensionChrome() ? "extension" : "web";
    void connection.start(seconds, state.currentBiome, pick(FOCUS_QUOTES), origin)
      .then(() => { if (currentData.current.accountId === user.id) void getAudio().start(state.currentBiome); }).catch(() => undefined);
  }, [state.currentBiome, canDive, user, shared.connection]);

  const setTargetSpecies = useCallback((id: string | null) => dispatch({ type: "target", id }), []);
  const clearHighlight = useCallback(() => setHighlightedSpecies(null), []);
  const showSpeciesInOcean = useCallback((id: string) => {
    const species = SPECIES_BY_ID[id];
    if (!species || !state.discovered.includes(id) || !state.unlockedBiomes.includes(species.biome)) return;
    selectBiome(species.biome);
    setHighlightedSpecies(id);
    setSelectedSpecies(null);
    setView("home");
  }, [state.discovered, state.unlockedBiomes, selectBiome]);

  const sharedCommand = useCallback((command: FocusCommand) => {
    const connection = shared.connection.current;
    if (!user || !verified || authBusy || currentData.current.accountId !== user.id ||
      currentData.current.session?.sharedUserId !== user.id || connection?.userId !== user.id ||
      !connection.snapshot.connected || connection.snapshot.busy) return;
    void connection.command(command).catch(() => undefined);
  }, [user, verified, authBusy, shared.connection]);

  const pauseSession = useCallback(() => {
    sharedCommand("pause");
  }, [sharedCommand]);

  const resumeSession = useCallback(() => {
    sharedCommand("resume");
  }, [sharedCommand]);

  const completeSession = useCallback(() => {
    sharedCommand("complete");
  }, [sharedCommand]);

  const abandonSession = useCallback(() => {
    sharedCommand("abandon");
  }, [sharedCommand]);

  const setAudio = useCallback((audio: AudioSettings) => {
    dispatch({ type: "audio", audio });
    getAudio().setVolumes(audio);
  }, []);

  const resetSave = useCallback(() => {
    dispatch({ type: "reset", now: Date.now() });
    setView("home");
    setSelectedSpecies(null);
    setHighlightedSpecies(null);
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
      canDive,
      syncMessage,
      selectedSpecies,
      setSelectedSpecies,
      setTargetSpecies,
      highlightedSpecies,
      showSpeciesInOcean,
      clearHighlight,
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
      canDive,
      syncMessage,
      selectedSpecies,
      setTargetSpecies,
      highlightedSpecies,
      showSpeciesInOcean,
      clearHighlight,
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

  return <GameContext.Provider value={value}>{accountReady ? children :
    <div role="status" className="flex min-h-dvh items-center justify-center bg-[#061018] text-white/70">Carregando seu oceano…</div>}
  </GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame");
  return ctx;
}
