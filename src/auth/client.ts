import { createClient, navigatorLock } from "@supabase/supabase-js";
import { extensionChrome } from "../platform/chrome";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
const chrome = extensionChrome();

export const extensionAuthStorage = chrome ? {
  async getItem(key: string) {
    const values = await chrome.storage.local.get(key);
    return typeof values[key] === "string" ? values[key] as string : null;
  },
  async setItem(key: string, value: string) { await chrome.storage.local.set({ [key]: value }); },
  async removeItem(key: string) { await chrome.storage.local.remove(key); },
} : undefined;

export const supabase = url && publishableKey
  ? createClient(url, publishableKey, {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: !chrome,
        detectSessionInUrl: !chrome,
        ...(chrome ? { storage: extensionAuthStorage, lock: navigatorLock } : {}),
      },
    })
  : null;

export async function signInExtension() {
  if (!chrome || !supabase) throw new Error("Login indisponível nesta extensão.");
  const redirectTo = chrome.identity.getRedirectURL("auth/callback");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google", options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw new Error("Não foi possível abrir o Google.");
  const callback = await chrome.identity.launchWebAuthFlow({ url: data.url, interactive: true });
  if (!callback || !callback.startsWith(redirectTo + "?")) throw new Error("O login foi cancelado.");
  const code = new URL(callback).searchParams.get("code");
  if (!code) throw new Error("O Google não concluiu o login.");
  const result = await supabase.auth.exchangeCodeForSession(code);
  if (result.error) throw new Error("Não foi possível concluir o login.");
}
