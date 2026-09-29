// Only the Chrome APIs used by Mergulhe; absent on web and Capacitor.
interface ChromeEvent<T> { addListener(listener: T): void; removeListener(listener: T): void }
export interface ExtensionChrome {
  runtime: {
    id: string;
    getURL(path: string): string;
    sendMessage(message: unknown): Promise<{ error?: string }>;
    onMessage: ChromeEvent<(message: { type?: string }, sender: { id?: string }, respond: (value: unknown) => void) => boolean | void>;
    onInstalled: ChromeEvent<() => void>;
    onStartup: ChromeEvent<() => void>;
  };
  storage: {
    local: {
      get(keys: string | string[]): Promise<Record<string, unknown>>;
      set(values: Record<string, unknown>): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
      setAccessLevel(options: { accessLevel: "TRUSTED_CONTEXTS" }): Promise<void>;
    };
    onChanged: ChromeEvent<(changes: Record<string, { newValue?: unknown }>, area: string) => void>;
  };
  identity: {
    getRedirectURL(path?: string): string;
    launchWebAuthFlow(options: { url: string; interactive: boolean }): Promise<string | undefined>;
  };
  alarms: {
    create(name: string, options: { when?: number; periodInMinutes?: number }): Promise<void>;
    clear(name: string): Promise<boolean>;
    onAlarm: ChromeEvent<(alarm: { name: string }) => void>;
  };
  action: {
    setBadgeText(options: { text: string }): Promise<void>;
    setBadgeBackgroundColor(options: { color: string }): Promise<void>;
  };
  notifications: { create(id: string, options: { type: "basic"; iconUrl: string; title: string; message: string }): Promise<string> };
  tabs: { create(options: { url: string }): Promise<unknown> };
}

export function extensionChrome(): ExtensionChrome | null {
  const api = (globalThis as typeof globalThis & { chrome?: ExtensionChrome }).chrome;
  return api?.runtime?.id && api.storage?.local ? api : null;
}
