import { useAuth } from "../auth/AuthContext";
import { useGame } from "../game/GameContext";

export function AccountCard() {
  const { configured, googleEnabled, loading, busy, verified, user, profile, error, signInWithGoogle, signOut, refreshAccount } = useAuth();
  const { syncMessage } = useGame();

  return (
    <section className="mt-8 rounded-lg border border-white/15 bg-[#071018]/70 p-4" aria-label="Conta">
      <p className="text-[11px] font-medium tracking-[0.28em] text-white/70 uppercase">Conta</p>
      {loading ? (
        <p className="mt-3 text-xs text-white/70" role="status">Verificando sua conta…</p>
      ) : user ? (
        <>
          <p className="mt-3 font-serif text-xl text-[var(--foam)]">
            {profile?.display_name ?? "Conta Google conectada"}
          </p>
          <p className="mt-1 break-all text-xs text-white/65">{user.email}</p>
          {!verified && <button type="button" disabled={busy} onClick={refreshAccount}
            className="mt-3 min-h-11 border border-[var(--gold)]/40 px-4 text-xs text-[var(--gold)] disabled:opacity-50">
            Verificar conta novamente
          </button>}
          <button
            type="button"
            disabled={busy}
            onClick={() => void signOut()}
            className="mt-4 min-h-11 rounded border border-white/25 px-4 text-xs text-white/85 hover:bg-white/10 disabled:opacity-50"
          >
            Sair da conta
          </button>
        </>
      ) : !configured || !googleEnabled ? (
        <p className="mt-3 text-xs leading-relaxed text-white/70">
          O login com Google não está disponível nesta versão.
        </p>
      ) : (
        <>
          <p className="mt-3 text-xs leading-relaxed text-white/70">
            Entre com sua conta Google para mergulhar e registrar suas descobertas.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void signInWithGoogle()}
            className="mt-4 min-h-11 rounded border border-[var(--gold)]/50 bg-[var(--gold)]/15 px-4 text-xs font-medium text-[var(--gold)] hover:bg-[var(--gold)]/25 disabled:opacity-50"
          >
            {busy ? "Abrindo Google…" : "Entrar com Google"}
          </button>
        </>
      )}
      {error && <p className="mt-3 text-xs text-rose-300" role="alert">{error}</p>}
      <p className="mt-4 text-[10px] leading-relaxed text-white/50">
        {user ? syncMessage : "Uma conta conectada é necessária para iniciar sessões."}
        {" "}As sessões confirmadas ficam na sua conta. Este dispositivo guarda uma cópia do progresso.
      </p>
    </section>
  );
}
