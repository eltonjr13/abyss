import { signInExtension, supabase } from "../auth/client";
import { FocusConnection, focusEndTime, isActive, type FocusSnapshot } from "../focus/shared";
import { extensionChrome } from "../platform/chrome";

const chrome = extensionChrome()!;
const CACHE = "mergulhe:focus-cache";
const POLL = "mergulhe:focus-poll";
const END = "mergulhe:focus-end";
let pending: Promise<void> | null = null;
let loginPending: Promise<void> | null = null;
let syncAgain = false;

async function updateDisplay(snapshot: FocusSnapshot) {
  const end = focusEndTime(snapshot.row, snapshot.offset);
  await chrome.alarms.clear(END);
  if (end && end > Date.now()) await chrome.alarms.create(END, { when: end });
  const row = snapshot.row;
  const text = snapshot.error ? "!" : row?.status === "paused" ? "Ⅱ" : row?.status === "completed" ? "✓"
    : isActive(row) ? end ? `${Math.max(0, Math.ceil((end - Date.now()) / 60000))}m` : "∞" : "";
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color: snapshot.error ? "#b45309" : "#061018" });
  if (row?.status === "completed") {
    const key = `mergulhe:last-notified:${row.user_id}`;
    const stored = await chrome.storage.local.get(key);
    if (stored[key] !== row.id) {
      await chrome.storage.local.set({ [key]: row.id });
      await chrome.notifications.create(`focus:${row.id}`, {
        type: "basic", iconUrl: "icons/icon128.png", title: "Mergulhe — foco concluído!",
        message: "Sua sessão terminou. O celular e a extensão usam o mesmo timer.",
      });
    }
  }
}

async function sync() {
  if (pending) { syncAgain = true; return pending; }
  pending = (async () => {
    if (!supabase) return;
    const { data, error } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (error) throw error;
    if (!userId) {
      await chrome.storage.local.remove(CACHE);
      await chrome.alarms.clear(END);
      await chrome.alarms.clear(POLL);
      await chrome.action.setBadgeText({ text: "" });
      return;
    }
    await chrome.alarms.create(POLL, { periodInMinutes: 1 });
    const stored = await chrome.storage.local.get(CACHE);
    const cached = stored[CACHE] as { userId?: string; snapshot?: FocusSnapshot } | undefined;
    const connection = new FocusConnection(supabase, userId, () => undefined, false);
    if (cached?.userId === userId && cached.snapshot) connection.snapshot = cached.snapshot;
    try { await connection.refresh(); } catch { /* Preserve the cached clock while offline. */ }
    const snapshot = connection.snapshot;
    connection.dispose();
    const current = await supabase.auth.getSession();
    if (current.data.session?.user.id !== userId) { syncAgain = true; return; }
    await chrome.storage.local.set({ [CACHE]: { userId, snapshot, syncedAt: Date.now() } });
    await updateDisplay(snapshot);
  })().finally(() => {
    pending = null;
    if (syncAgain) { syncAgain = false; void sync().catch(() => undefined); }
  });
  return pending;
}

chrome.runtime.onInstalled.addListener(() => {
  void chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  // Retire the old independent quick timer without copying it into a user's account.
  void chrome.alarms.clear("tide-session-timer");
  void chrome.alarms.clear("tide-badge-updater");
  void sync().catch(() => undefined);
});
chrome.runtime.onStartup.addListener(() => { void sync().catch(() => undefined); });
chrome.alarms.onAlarm.addListener(({ name }) => {
  if (name === POLL || name === END) void sync().catch(() => undefined);
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && Object.keys(changes).some((key) => key.endsWith("-auth-token"))) {
    void sync().catch(() => undefined);
  }
});
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id) return;
  const action = message.type === "mergulhe:login" ? async () => {
    if (!loginPending) loginPending = signInExtension().finally(() => { loginPending = null; });
    await loginPending;
    await sync();
  } : message.type === "mergulhe:refresh" ? sync : null;
  if (!action) return;
  void action().then(() => respond({}), (error: unknown) => respond({ error: error instanceof Error ? error.message : "Não foi possível conectar o timer." }));
  return true;
});
