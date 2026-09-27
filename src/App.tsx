import { useEffect } from "react";
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

function Shell() {
  const { view, state } = useGame();

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

      {view === "onboarding" && <Onboarding />}
      {view === "home" && <Home />}
      {view === "setup" && <Setup />}
      {view === "focus" && <Focus />}
      {view === "complete" && <Complete />}
      {view === "explore" && <Explore />}
      {view === "discoveries" && <Discoveries />}
      {view === "profile" && <Profile />}

      {showNav && <NavBar />}
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
