/**
 * Mergulhe Extension Popup Script
 * Opera de forma síncrona com chrome.storage.local e chrome.alarms
 */

const timeEl = document.getElementById("time");
const quoteEl = document.getElementById("quote");
const badgeEl = document.getElementById("badge");
const setupControls = document.getElementById("setup-controls");
const activeControls = document.getElementById("active-controls");
const btnPause = document.getElementById("btn-pause");
const btnFinish = document.getElementById("btn-finish");
const btnOpenOcean = document.getElementById("btn-open-ocean");

let currentSession = null;
let intervalId = null;

function format(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

async function loadSession() {
  const data = await chrome.storage.local.get(["session"]);
  currentSession = data.session || null;
  render();
}

function render() {
  if (!currentSession || !currentSession.active) {
    setupControls.style.display = "grid";
    activeControls.style.display = "none";
    badgeEl.textContent = "Pronto";
    timeEl.textContent = "25:00";
    quoteEl.textContent = "O oceano aguarda sua presença.";
    if (intervalId) clearInterval(intervalId);
    return;
  }

  setupControls.style.display = "none";
  activeControls.style.display = "block";
  badgeEl.textContent = currentSession.paused ? "Pausado" : "Mergulhando";
  btnPause.textContent = currentSession.paused ? "RETOMAR" : "PAUSAR";

  updateCountdown();
  if (!intervalId) {
    intervalId = setInterval(updateCountdown, 1000);
  }
}

function updateCountdown() {
  if (!currentSession || !currentSession.active) return;

  let remaining = 0;
  if (currentSession.paused) {
    remaining = currentSession.remainingSeconds;
  } else {
    const msLeft = currentSession.targetEndTime - Date.now();
    remaining = Math.max(0, Math.ceil(msLeft / 1000));
  }

  timeEl.textContent = format(remaining);

  if (remaining <= 0 && !currentSession.paused) {
    currentSession.active = false;
    currentSession.completed = true;
    chrome.storage.local.set({ session: currentSession });
    render();
  }
}

async function startFocus(mins) {
  const seconds = mins * 60;
  const now = Date.now();
  const targetEndTime = now + seconds * 1000;

  currentSession = {
    active: true,
    paused: false,
    plannedSeconds: seconds,
    remainingSeconds: seconds,
    targetEndTime,
    startedAt: now,
  };

  await chrome.storage.local.set({ session: currentSession });
  await chrome.alarms.create("tide-session-timer", { when: targetEndTime });
  chrome.action.setBadgeText({ text: `${mins}m` });

  render();
}

btnPause.addEventListener("click", async () => {
  if (!currentSession) return;

  if (currentSession.paused) {
    // Retomar
    const now = Date.now();
    currentSession.targetEndTime = now + currentSession.remainingSeconds * 1000;
    currentSession.paused = false;
    await chrome.alarms.create("tide-session-timer", { when: currentSession.targetEndTime });
  } else {
    // Pausar
    const msLeft = currentSession.targetEndTime - Date.now();
    currentSession.remainingSeconds = Math.max(0, Math.ceil(msLeft / 1000));
    currentSession.paused = true;
    await chrome.alarms.clear("tide-session-timer");
  }

  await chrome.storage.local.set({ session: currentSession });
  render();
});

btnFinish.addEventListener("click", async () => {
  if (currentSession) {
    currentSession.active = false;
    await chrome.alarms.clear("tide-session-timer");
    chrome.action.setBadgeText({ text: "" });
    await chrome.storage.local.set({ session: currentSession });
  }
  render();
});

setupControls.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mins = Number(btn.getAttribute("data-mins"));
    startFocus(mins);
  });
});

btnOpenOcean.addEventListener("click", () => {
  // Abre o app Mergulhe empacotado na extensão em uma nova aba
  chrome.tabs.create({ url: chrome.runtime.getURL("dist/index.html") });
});

loadSession();
