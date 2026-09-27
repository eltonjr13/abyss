import { useEffect, useState } from "react";
import { getAudio } from "./audio/engine";
import { OceanCanvas } from "./components/OceanCanvas";
import { NavBar } from "./components/NavBar";
import { GameProvider, useGame } from "./game/GameContext";
import { Complete } from "./screens/Complete";
import { Discoveries } from "./screens/Discoveries";
import { Explore } from "./screens/Explore";
import { Focus } from "./screens/Focus";
import { Home } from "./screens/Home";
import { Onboarding } from "./screens/Onboarding";
import { Profile } from "./screens/Profile";
import { Setup } from "./screens/Setup";
import { PerfPanel } from "./components/PerfPanel";

function Shell() {
  const { view, state } = useGame();
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [showStatusToast, setShowStatusToast] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setStatusMessage("Conexão restabelecida · Progresso salvo neste dispositivo");
      setShowStatusToast(true);
      const t = setTimeout(() => setShowStatusToast(false), 3500);
      return () => clearTimeout(t);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatusMessage("Modo sem internet · Suas sessões continuam salvas no dispositivo");
      setShowStatusToast(true);
      const t = setTimeout(() => setShowStatusToast(false), 4500);
      return () => clearTimeout(t);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const boot = () => {
      getAudio().setVolumes(state.audio);
      void getAudio().start(state.currentBiome);
    };
    window.addEventListener("pointerdown", boot, { once: true });
    return () => window.removeEventListener("pointerdown", boot);
  }, [state.audio, state.currentBiome]);

  const showOcean = view !== "onboarding";
  const dimmed = view === "explore" || view === "discoveries" || view === "profile";
  const showNav = view !== "onboarding" && view !== "focus" && view !== "complete";

  return (
    <div className="relative h-dvh overflow-x-hidden overflow-y-auto bg-[#061018] text-[var(--foam)]">
      {showOcean && <OceanCanvas dimmed={dimmed} />}
      {view !== "focus" && view !== "onboarding" && (
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-[#061018]/25 via-transparent to-[#061018]/70" />
      )}

      {/* Notificação discreta de status de rede */}
      {showStatusToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
        >
          <div className="rounded-full border border-white/20 bg-[#07121b]/90 px-4 py-1.5 text-xs text-white/90 shadow-lg backdrop-blur-md">
            <span className="mr-2">{isOnline ? "🟢" : "📡"}</span>
            {statusMessage}
          </div>
        </div>
      )}

      {view === "onboarding" && <Onboarding />}
      {view === "home" && <Home />}
      {view === "setup" && <Setup />}
      {view === "focus" && <Focus />}
      {view === "complete" && <Complete />}
      {view === "explore" && <Explore />}
      {view === "discoveries" && <Discoveries />}
      {view === "profile" && <Profile />}

      {showNav && <NavBar />}
      {import.meta.env.DEV && <PerfPanel />}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}
