import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { webcrypto } from "node:crypto";
import { test } from "node:test";
import vm from "node:vm";

const code = await readFile(new URL("../extension/generated/background.js", import.meta.url), "utf8");
const event = () => ({ listeners: [], addListener(fn) { this.listeners.push(fn); }, removeListener() {} });
const baseRow = () => ({ id: "test-session", user_id: "test-user", status: "running", biome: "reef",
  planned_seconds: 1500, elapsed_ms: 0, running_since: new Date().toISOString(), quote: "Teste",
  revision: 1, origin: "mobile", created_at: new Date().toISOString(), completed_at: null });

async function worker(storage = new Map(), network = { row: baseRow(), offline: false }) {
  const alarms = new Map();
  const notifications = [];
  let badge = "";
  const chrome = {
    runtime: { id: "test-extension", onInstalled: event(), onStartup: event(), onMessage: event(), getURL: (p) => p },
    storage: { local: {
      get: async (keys) => Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map((key) => [key, storage.get(key)])),
      set: async (values) => { for (const [key, value] of Object.entries(values)) storage.set(key, value); },
      remove: async (key) => { storage.delete(key); }, setAccessLevel: async () => {},
    }, onChanged: event() },
    alarms: { create: async (name, options) => { alarms.set(name, options); },
      clear: async (name) => alarms.delete(name), onAlarm: event() },
    action: { setBadgeText: async ({text}) => { badge = text; }, setBadgeBackgroundColor: async () => {} },
    notifications: { create: async (id) => { notifications.push(id); return id; } },
  };
  const payload = Buffer.from(JSON.stringify({ sub: "test-user", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url");
  if (!storage.has("sb-ukzixtqsdybeqrwsybqt-auth-token")) storage.set("sb-ukzixtqsdybeqrwsybqt-auth-token", JSON.stringify({
    access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.test`, refresh_token: "test-only", token_type: "bearer",
    expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: "test-user", aud: "authenticated" },
  }));
  const context = vm.createContext({ chrome, console: { ...console, warn: () => {} },
    crypto: webcrypto, Headers, Request, Response, URL, TextEncoder, TextDecoder, AbortController, WebSocket,
    setTimeout, clearTimeout, setInterval, clearInterval,
    navigator: { locks: { request: async (name, _options, fn) => fn({ name }) } },
    fetch: async (url) => {
      assert.match(String(url), /\/rest\/v1\/rpc\/focus_command$/);
      if (network.offline) throw new Error("offline");
      return new Response(JSON.stringify({ session: network.row, conflict: false, server_now: new Date().toISOString() }),
        { status: 200, headers: { "Content-Type": "application/json" } });
    },
  });
  vm.runInContext(code, context);
  const refresh = () => new Promise((resolve, reject) => {
    const handled = chrome.runtime.onMessage.listeners[0]({type:"mergulhe:refresh"}, {id:"test-extension"}, (result) => {
      if (result.error) reject(new Error(result.error)); else resolve();
    });
    assert.equal(handled, true);
  });
  return { storage, alarms, notifications, network, chrome, refresh, get badge() { return badge; } };
}

test("closed popup worker restores the account clock, updates alarms on pause, and recovers after restart", async () => {
  const first = await worker();
  await first.refresh();
  assert.equal(first.badge, "25m");
  assert.equal(first.alarms.get("mergulhe:focus-poll").periodInMinutes, 1);
  assert.ok(first.alarms.get("mergulhe:focus-end").when > Date.now());
  first.network.row = { ...first.network.row, status: "paused", running_since: null, elapsed_ms: 65000 };
  await first.refresh();
  assert.equal(first.badge, "Ⅱ");
  assert.equal(first.alarms.has("mergulhe:focus-end"), false);
  const restarted = await worker(first.storage, first.network);
  await restarted.refresh();
  assert.equal(restarted.badge, "Ⅱ");
  assert.equal(restarted.storage.get("mergulhe:focus-cache").snapshot.row.elapsed_ms, 65000);
  restarted.network.offline = true;
  await restarted.refresh();
  assert.equal(restarted.badge, "!");
  assert.equal(restarted.storage.get("mergulhe:focus-cache").snapshot.row.status, "paused");
});

test("completion notification is not repeated after a worker restart; sign-out clears alarms and the badge", async () => {
  const first = await worker();
  first.network.row = { ...first.network.row, status: "completed", running_since: null,
    elapsed_ms: 1500000, completed_at: new Date().toISOString() };
  await first.refresh();
  assert.equal(first.notifications.length, 1);
  const restarted = await worker(first.storage, first.network);
  await restarted.refresh();
  assert.equal(restarted.notifications.length, 0);
  first.storage.delete("sb-ukzixtqsdybeqrwsybqt-auth-token");
  const signedOut = await worker(first.storage, first.network);
  // Remove the harness's default account before the first refresh.
  first.storage.delete("sb-ukzixtqsdybeqrwsybqt-auth-token");
  await signedOut.refresh();
  assert.equal(signedOut.badge, "");
  assert.equal(signedOut.alarms.size, 0);
  assert.equal(first.storage.has("mergulhe:focus-cache"), false);
});
