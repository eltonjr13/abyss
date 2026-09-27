/**
 * TIDE - Chrome Extension Background Service Worker
 * Mantém o timer de foco vivo mesmo após fechar a janela do popup da extensão.
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: "#061018" });
  chrome.action.setBadgeTextColor?.({ color: "#e7f2f2" });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "tide-session-timer") {
    const data = await chrome.storage.local.get(["session", "state"]);
    const session = data.session;
    if (session) {
      // Notificação nativa do Chrome
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "TIDE — Foco Concluído!",
        message: "Seu mergulho de foco terminou. Seu oceano recebeu nova vida e XP!",
        priority: 2,
      });

      chrome.action.setBadgeText({ text: "✓" });
      chrome.action.setBadgeBackgroundColor({ color: "#22c55e" });

      // Atualiza o estado da sessão
      session.completed = true;
      session.active = false;
      await chrome.storage.local.set({ session });
    }
  } else if (alarm.name === "tide-badge-updater") {
    updateBadge();
  }
});

async function updateBadge() {
  const data = await chrome.storage.local.get(["session"]);
  const session = data.session;
  if (!session || !session.active || !session.targetEndTime) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }

  const remainingMs = session.targetEndTime - Date.now();
  if (remainingMs <= 0) {
    chrome.action.setBadgeText({ text: "0m" });
  } else {
    const mins = Math.ceil(remainingMs / 60000);
    chrome.action.setBadgeText({ text: `${mins}m` });
  }
}

// Atualização periódica do badge a cada minuto enquanto ativo
chrome.alarms.create("tide-badge-updater", { periodInMinutes: 1 });
