import { useEffect, useRef, useState } from "react";
import { supabase } from "../auth/client";
import { FocusConnection, type FocusSnapshot } from "./shared";

export function useSharedFocus(userId: string | null, onChange: (snapshot: FocusSnapshot) => void) {
  const callback = useRef(onChange);
  callback.current = onChange;
  const connection = useRef<FocusConnection | null>(null);
  const [snapshot, setSnapshot] = useState<FocusSnapshot | null>(null);

  useEffect(() => {
    setSnapshot(null);
    if (!supabase || !userId) return;
    const active = new FocusConnection(supabase, userId, (next) => {
      setSnapshot(next);
      if (next.connected && !next.busy) callback.current(next);
    });
    connection.current = active;
    const refresh = () => { void active.refresh().catch(() => undefined); };
    const visible = () => { if (!document.hidden) refresh(); };
    const unwatch = active.watch();
    refresh();
    const interval = window.setInterval(visible, 30_000);
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", visible);
    return () => {
      active.dispose();
      unwatch();
      if (connection.current === active) connection.current = null;
      window.clearInterval(interval);
      window.removeEventListener("online", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [userId]);

  return { connection, snapshot };
}
