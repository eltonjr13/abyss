import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "./client";

const nativeRedirect = "cloud.mergulhe.app://auth/callback";

interface Profile {
  id: string;
  display_name: string;
}

interface AuthValue {
  configured: boolean;
  googleEnabled: boolean;
  loading: boolean;
  busy: boolean;
  user: User | null;
  profile: Profile | null;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);
const googleEnabled = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === "true";

function displayNameFor(user: User): string {
  const googleName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  const fallback = user.email?.split("@")[0] ?? "Pessoa exploradora";
  const name = typeof googleName === "string" && googleName.trim() ? googleName.trim() : fallback;
  return name.slice(0, 80);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let active = true;
    let sequence = 0;

    async function refresh() {
      const current = ++sequence;
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (!active || current !== sequence) return;
      if (sessionError || !sessionData.session) {
        setUser(null);
        setProfile(null);
        setError(sessionError ? "Não foi possível verificar sua conta. Tente novamente com internet." : null);
        setLoading(false);
        return;
      }

      const { data, error: authError } = await client.auth.getUser();
      if (!active || current !== sequence) return;
      if (authError || !data.user) {
        setUser(null);
        setProfile(null);
        setError(authError ? "Não foi possível verificar sua conta. Tente novamente com internet." : null);
        setLoading(false);
        return;
      }

      const signedInUser = data.user;
      setUser(signedInUser);
      const { data: existing, error: selectError } = await client
        .from("profiles")
        .select("id, display_name")
        .eq("id", signedInUser.id)
        .maybeSingle();
      if (!active || current !== sequence) return;

      let saved = existing;
      let profileError = selectError;
      if (!profileError && !saved) {
        const result = await client
          .from("profiles")
          .upsert({ id: signedInUser.id, display_name: displayNameFor(signedInUser) }, {
            onConflict: "id",
            ignoreDuplicates: true,
          });
        profileError = result.error;
        if (!profileError) {
          const reread = await client
            .from("profiles")
            .select("id, display_name")
            .eq("id", signedInUser.id)
            .single();
          saved = reread.data;
          profileError = reread.error;
        }
      }
      if (!active || current !== sequence) return;
      setProfile(saved);
      setError(profileError ? "Sua conta entrou, mas o perfil não pôde ser carregado." : null);
      setLoading(false);
    }

    void refresh();
    const { data: { subscription } } = client.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") return;
      // Wait until Supabase releases its auth lock before querying Auth/PostgREST.
      setTimeout(() => { if (active) void refresh(); }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !Capacitor.isNativePlatform()) return;
    const client = supabase;
    let active = true;
    let listener: { remove: () => Promise<void> } | undefined;
    const handledCodes = new Set<string>();

    async function handleUrl(url: string) {
      if (!url.startsWith(nativeRedirect)) return;
      const callback = new URL(url);
      const code = callback.searchParams.get("code");
      if (code && !handledCodes.has(code)) {
        handledCodes.add(code);
        const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
        if (active && exchangeError) setError("Não foi possível concluir o login com Google. Tente novamente.");
      } else if (active && callback.searchParams.has("error")) {
        setError("O login com Google foi cancelado ou falhou.");
      }
      await Browser.close().catch(() => undefined);
    }

    void App.addListener("appUrlOpen", ({ url }) => { void handleUrl(url); })
      .then((handle) => {
        if (active) listener = handle;
        else void handle.remove();
      })
      .catch(() => { if (active) setError("O retorno do login não pôde ser configurado neste aparelho."); });
    void App.getLaunchUrl().then((result) => {
      if (active && result?.url) void handleUrl(result.url);
    }).catch(() => undefined);

    return () => {
      active = false;
      if (listener) void listener.remove();
    };
  }, []);

  async function signInWithGoogle() {
    if (!supabase || !googleEnabled) return;
    setBusy(true);
    setError(null);
    const native = Capacitor.isNativePlatform();
    const { data, error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: native ? nativeRedirect : window.location.origin + window.location.pathname,
        skipBrowserRedirect: native,
      },
    });
    if (signInError || (native && !data.url)) {
      setError("Não foi possível abrir o login do Google. Tente novamente.");
    } else if (native && data.url) {
      try {
        await Browser.open({ url: data.url });
      } catch {
        setError("Não foi possível abrir o login do Google. Tente novamente.");
      }
    }
    setBusy(false);
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError("Não foi possível sair da conta. Tente novamente.");
    setBusy(false);
  }

  return (
    <AuthContext.Provider value={{
      configured: Boolean(supabase), loading, busy, user, profile, error,
      googleEnabled,
      signInWithGoogle, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa de AuthProvider");
  return context;
}
