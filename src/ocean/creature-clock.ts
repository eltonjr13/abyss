/** One low-frequency clock for all visible discovery portraits. */
const listeners = new Set<(seconds: number) => void>();
let timer: ReturnType<typeof setInterval> | undefined;

export function observeCreatureAnimation(draw: (seconds: number) => void) {
  listeners.add(draw);
  if (!timer) timer = setInterval(() => {
    if (document.hidden) return;
    const seconds = performance.now() / 1000;
    for (const listener of listeners) listener(seconds);
  }, 100);
  return () => {
    listeners.delete(draw);
    if (listeners.size === 0) { clearInterval(timer); timer = undefined; }
  };
}
