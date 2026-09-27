import { useState } from "react";
import { useGame } from "../game/GameContext";
import { exportSaveToCode, exportSaveToJson, mergeGameStates, parseSavePayload } from "../game/sync";

export function SyncModal({ onClose }: { onClose: () => void }) {
  const { state, importState } = useGame();
  const [copied, setCopied] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const code = exportSaveToCode(state);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const json = exportSaveToJson(state);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tide-oceano-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importCode.trim()) {
      setIsError(true);
      setMessage("Cole um código de exportação ou JSON válido.");
      return;
    }
    const incoming = parseSavePayload(importCode);
    if (!incoming) {
      setIsError(true);
      setMessage("Código inválido ou corrompido.");
      return;
    }

    const merged = mergeGameStates(state, incoming);
    importState(merged);
    setIsError(false);
    setMessage(
      `Oceano sincronizado com sucesso! (${merged.discovered.length} espécies conhecidas, ${merged.xp} XP total)`
    );
    setImportCode("");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sincronização e Backup do Oceano"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-[#08131e] p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="font-serif text-xl italic text-[var(--foam)]">Sincronização do Oceano</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white"
            aria-label="Fechar sincronização"
          >
            ✕
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-white/60">
          Como o TIDE funciona totalmente sem internet no seu aparelho, use esta ferramenta para
          levar o mesmo oceano entre o celular, notebook e extensão Chrome.
        </p>

        {/* Exportar */}
        <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--gold)]">
            Exportar este dispositivo
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 rounded border border-white/25 bg-white/10 py-2 text-center text-xs tracking-wider uppercase text-white hover:bg-white/20"
            >
              {copied ? "✓ Copiado!" : "Copiar código"}
            </button>
            <button
              onClick={handleDownload}
              className="rounded border border-white/20 px-3 py-2 text-xs uppercase text-white/70 hover:bg-white/10"
              title="Baixar arquivo JSON de backup"
            >
              Baixar JSON
            </button>
          </div>
        </div>

        {/* Importar */}
        <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/80">
            Importar de outro aparelho
          </p>
          <textarea
            value={importCode}
            onChange={(e) => setImportCode(e.target.value)}
            placeholder="Cole o código de exportação ou JSON aqui..."
            rows={3}
            className="mt-2 w-full rounded border border-white/15 bg-black/40 p-2 font-mono text-xs text-white placeholder-white/30 focus:border-white/40 focus:outline-none"
          />
          <button
            onClick={handleImport}
            className="mt-2 w-full rounded border border-white/30 bg-[var(--foam)]/15 py-2 text-xs uppercase tracking-wider text-[var(--foam)] hover:bg-[var(--foam)]/25"
          >
            Mesclar e Sincronizar
          </button>
        </div>

        {message && (
          <p
            className={`mt-3 text-xs ${
              isError ? "text-rose-400" : "text-emerald-400 font-medium"
            }`}
          >
            {message}
          </p>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs uppercase tracking-wider text-white/50 hover:text-white"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
