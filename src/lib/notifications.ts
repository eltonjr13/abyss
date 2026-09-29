/**
 * Gerenciador de Notificações do Mergulhe
 * Suporta Web Notifications API e vibração háptica para iOS, Android e Web.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") {
    return true;
  }
  if (Notification.permission !== "denied") {
    const result = await Notification.requestPermission();
    return result === "granted";
  }
  return false;
}

export function notifySessionComplete(biomeName: string, minutes: number) {
  // Vibração háptica no dispositivo móvel
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([150, 80, 200]);
    } catch {
      /* ignore */
    }
  }

  // Notificação visual do sistema
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification("Mergulhe — foco concluído!", {
        body: `Você permaneceu focado por ${minutes} min em ${biomeName}. Seu oceano recebeu nova vida!`,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "tide-focus-complete",
      });
    } catch {
      /* ignore */
    }
  }
}
