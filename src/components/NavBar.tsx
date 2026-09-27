import { useGame } from "../game/GameContext";
import type { ViewId } from "../types";
import { cn } from "../utils/cn";

const ITEMS: { id: ViewId; label: string; icon: string }[] = [
  { id: "home", label: "Oceano", icon: "ocean" },
  { id: "setup", label: "Foco", icon: "focus" },
  { id: "explore", label: "Explorar", icon: "map" },
  { id: "discoveries", label: "Descobertas", icon: "book" },
  { id: "profile", label: "Perfil", icon: "user" },
];

function Icon({ name, active }: { name: string; active: boolean }) {
  const c = active ? "var(--foam)" : "rgba(232,240,240,0.42)";
  const common = {
    fill: "none",
    stroke: c,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      {name === "ocean" && (
        <>
          <path {...common} d="M3 14c2-3 3.5-3 5 0s3 3 5 0 3.5-3 5 0 3 3 5 0" />
          <path {...common} d="M3 18c2-3 3.5-3 5 0s3 3 5 0 3.5-3 5 0 3 3 5 0" />
        </>
      )}
      {name === "focus" && (
        <>
          <circle {...common} cx="12" cy="12" r="8" />
          <path {...common} d="M12 8v4l2.5 1.5" />
        </>
      )}
      {name === "map" && (
        <path {...common} d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />
      )}
      {name === "book" && (
        <path {...common} d="M5 5h9a3 3 0 013 3v12H8a3 3 0 00-3 3V5zM8 8h6" />
      )}
      {name === "user" && (
        <>
          <circle {...common} cx="12" cy="8" r="3" />
          <path {...common} d="M5 19c1.5-3 4-4.5 7-4.5S17.5 16 19 19" />
        </>
      )}
    </svg>
  );
}

export function NavBar() {
  const { view, setView } = useGame();
  return (
    <nav aria-label="Navegação principal" className="pointer-events-auto fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(10px,env(safe-area-inset-bottom))]">
      <div className="mx-4 mb-2 flex w-full max-w-md items-stretch justify-between rounded-2xl border border-white/10 bg-[#071018]/70 px-1 py-1.5 backdrop-blur-md">
        {ITEMS.map((item) => {
          const active = view === item.id || (item.id === "setup" && view === "focus");
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id === "setup" ? "setup" : item.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] tracking-normal uppercase transition-colors sm:tracking-[0.12em]",
                active ? "text-[var(--foam)]" : "text-white/55 hover:text-white/80",
              )}
            >
              <Icon name={item.icon} active={active} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
