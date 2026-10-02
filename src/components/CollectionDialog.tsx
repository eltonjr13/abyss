import { useEffect, useRef, type ReactNode } from "react";

export function CollectionDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
      if (event.key !== "Tab") return;
      const nodes = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), [tabindex="0"]'));
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first.focus(); }
    };
    dialog.addEventListener("keydown", keydown);
    return () => { dialog.removeEventListener("keydown", keydown); if (previous?.isConnected) previous.focus(); };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#03080c]/85 px-4 py-5 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="rise relative my-auto max-h-[calc(100dvh-40px)] w-full max-w-sm overflow-y-auto rounded-2xl border border-white/15 bg-[#0b1620] p-5 text-center shadow-2xl sm:p-7">
        <button onClick={onClose} aria-label="Fechar detalhes" className="absolute top-1 right-1 flex size-11 items-center justify-center text-xl text-white/60">×</button>
        {children}
      </div>
    </div>
  );
}
