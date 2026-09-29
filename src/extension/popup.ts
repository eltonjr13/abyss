import { supabase } from "../auth/client";
import { FocusConnection, isActive, sessionFromRow, type FocusSnapshot } from "../focus/shared";
import { elapsedSeconds, MIN_REWARD_SECONDS } from "../game/session";
import { formatTimer } from "../lib/format";
import { extensionChrome } from "../platform/chrome";

const chrome = extensionChrome()!;
const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const time = element("time");
const badge = element("badge");
const quote = element("quote");
const account = element("account");
const status = element("sync-status");
const login = element<HTMLButtonElement>("btn-login");
const logout = element<HTMLButtonElement>("btn-logout");
const pause = element<HTMLButtonElement>("btn-pause");
const finish = element<HTMLButtonElement>("btn-finish");
let connection: FocusConnection | null = null;
let unwatch: (() => void) | null = null;
let loading = false;
let reloadRequested = false;
let authBusy = false;
let authError: string | null = null;

function render(snapshot = connection?.snapshot) {
  const row = snapshot?.row ?? null;
  const active = isActive(row);
  const elapsed = active ? elapsedSeconds(sessionFromRow(row, snapshot?.offset), Date.now()) : 0;
  time.textContent = active ? formatTimer(row.planned_seconds === null ? elapsed : Math.max(0, row.planned_seconds - elapsed)) : "25:00";
  badge.textContent = active ? row.status === "paused" ? "Pausado" : "Mergulhando" : "Pronto";
  quote.textContent = active ? row.quote : "Seu foco acompanha você.";
  element("setup-controls").hidden = active || !connection;
  element("active-controls").hidden = !active;
  login.hidden = Boolean(connection);
  logout.hidden = !connection;
  pause.textContent = row?.status === "paused" ? "RETOMAR" : "PAUSAR";
  finish.textContent = elapsed >= MIN_REWARD_SECONDS ? "ENCERRAR SESSÃO" : "DESCARTAR SESSÃO";
  status.textContent = authError ?? snapshot?.error ?? (connection
    ? snapshot?.connected ? "Timer conectado ao celular." : "Conectando o timer…"
    : "Entre com a mesma conta Google usada no celular.");
  document.querySelectorAll<HTMLButtonElement>("button[data-mins], #btn-pause, #btn-finish").forEach((button) => {
    button.disabled = !snapshot?.connected || snapshot.busy;
  });
  login.disabled = authBusy || !supabase;
  logout.disabled = authBusy;
}

async function loadAccount() {
  if (!supabase) return;
  if (loading) { reloadRequested = true; return; }
  loading = true;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const user = data.session?.user;
    if (user?.id === connection?.userId) return;
    connection?.dispose(); unwatch?.();
    connection = null; unwatch = null;
    account.textContent = user?.email ?? "Conecte sua conta";
    if (user) {
      const active = new FocusConnection(supabase, user.id, (snapshot) => {
        render(snapshot);
        if (!snapshot.busy) void chrome.runtime.sendMessage({ type: "mergulhe:refresh" }).catch(() => undefined);
      }, false);
      connection = active;
      unwatch = active.watch();
      const stored = await chrome.storage.local.get("mergulhe:focus-cache");
      const cached = stored["mergulhe:focus-cache"] as { userId?: string; snapshot?: FocusSnapshot } | undefined;
      if (cached?.userId === user.id && cached.snapshot) {
        active.snapshot = { ...cached.snapshot, connected: false };
      }
      await active.refresh().catch(() => undefined);
    }
  } catch { authError = "Não foi possível verificar sua conta. Reconecte à internet."; }
  finally {
    loading = false; render();
    if (reloadRequested) { reloadRequested = false; void loadAccount(); }
  }
}

login.addEventListener("click", async () => {
  authBusy = true; authError = null; render();
  try {
    const result = await chrome.runtime.sendMessage({ type: "mergulhe:login" });
    if (result.error) authError = result.error;
    await loadAccount();
  } catch { authError = "Não foi possível abrir o login Google."; }
  finally { authBusy = false; render(); }
});
logout.addEventListener("click", async () => {
  if (!supabase) return;
  authBusy = true; authError = null; render();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) authError = "Não foi possível sair da conta.";
  await loadAccount(); authBusy = false; render();
});
pause.addEventListener("click", () => {
  const command = connection?.snapshot.row?.status === "paused" ? "resume" : "pause";
  void connection?.command(command).catch(() => undefined);
});
finish.addEventListener("click", () => {
  const snapshot = connection?.snapshot;
  if (!snapshot?.row) return;
  const command = elapsedSeconds(sessionFromRow(snapshot.row, snapshot.offset), Date.now()) >= MIN_REWARD_SECONDS ? "complete" : "abandon";
  void connection?.command(command).catch(() => undefined);
});
document.querySelectorAll<HTMLButtonElement>("button[data-mins]").forEach((button) => {
  button.addEventListener("click", () => {
    const minutes = Number(button.dataset.mins);
    void connection?.start(minutes === 0 ? null : minutes * 60, "reef", "Um respiro de cada vez.", "extension").catch(() => undefined);
  });
});
element("btn-open-ocean").addEventListener("click", () => {
  void chrome.tabs.create({ url: chrome.runtime.getURL("dist/index.html") });
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && Object.keys(changes).some((key) => key.endsWith("-auth-token"))) void loadAccount();
});
window.addEventListener("online", () => { void connection?.refresh().catch(() => undefined); });
window.setInterval(() => render(), 250);
window.setInterval(() => { void connection?.refresh().catch(() => undefined); }, 30_000);
void loadAccount();
render();
