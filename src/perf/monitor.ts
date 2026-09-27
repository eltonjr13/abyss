/**
 * Monitor de Desempenho e Bateria (Performance & Battery Profiler)
 * Instrumenta o loop de animação do OceanEngine, o AudioEngine e o estado de bateria do dispositivo.
 */

export interface PerfMetrics {
  fps: number;
  frameTimeMs: number;
  simulateTimeMs: number;
  drawTimeMs: number;
  activeFish: number;
  activeBubbles: number;
  activeMotes: number;
  activePlants: number;
  activeDebris: number;
  activeRays: number;
  audioState: "running" | "suspended" | "closed" | "uninitialized";
  audioSampleRate: number;
  audioOutputLatencyMs: number;
  batteryLevel: number | null; // 0 a 100%
  batteryCharging: boolean | null;
  batteryDischargingHours: number | null;
  batterySupported: boolean;
  lowPowerMode: boolean;
  targetFps: number;
  droppedFrames: number;
}

export type PerfListener = (metrics: PerfMetrics) => void;

class PerformanceMonitor {
  private listeners = new Set<PerfListener>();
  private frameTimes: number[] = [];
  private lastTime = 0;
  private droppedFrames = 0;
  private lowPowerMode = false;
  private batterySupported = false;
  private batteryLevel: number | null = null;
  private batteryCharging: boolean | null = null;
  private batteryDischargingHours: number | null = null;

  // Métricas do OceanEngine
  private simulateTime = 0;
  private drawTime = 0;
  private fishCount = 0;
  private bubbleCount = 0;
  private moteCount = 0;
  private plantCount = 0;
  private debrisCount = 0;
  private rayCount = 0;

  // Métricas do AudioEngine
  private audioState: "running" | "suspended" | "closed" | "uninitialized" = "uninitialized";
  private audioSampleRate = 0;
  private audioOutputLatencyMs = 0;

  private notifyTimer: number | null = null;

  constructor() {
    this.initBattery();
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem("tide-low-power-mode");
      if (saved !== null) {
        this.lowPowerMode = saved === "true";
      }
    } catch {
      /* ignore */
    }
  }

  private async initBattery() {
    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      try {
        const nav = navigator as unknown as { getBattery: () => Promise<BatteryManager> };
        const battery = await nav.getBattery();
        this.batterySupported = true;
        this.updateBattery(battery);

        battery.addEventListener("levelchange", () => this.updateBattery(battery));
        battery.addEventListener("chargingchange", () => this.updateBattery(battery));
        battery.addEventListener("dischargingtimechange", () => this.updateBattery(battery));
      } catch {
        this.batterySupported = false;
      }
    }
  }

  private updateBattery(b: BatteryManager) {
    this.batteryLevel = Math.round(b.level * 100);
    this.batteryCharging = b.charging;
    this.batteryDischargingHours =
      Number.isFinite(b.dischargingTime) && b.dischargingTime > 0
        ? Math.round((b.dischargingTime / 3600) * 10) / 10
        : null;

    // Se a bateria cair abaixo de 20% e não estiver carregando, podemos sugerir economia
    this.scheduleNotify();
  }

  setLowPowerMode(enabled: boolean) {
    this.lowPowerMode = enabled;
    try {
      localStorage.setItem("tide-low-power-mode", String(enabled));
    } catch {
      /* ignore */
    }
    this.scheduleNotify();
  }

  isLowPowerMode(): boolean {
    return this.lowPowerMode;
  }

  getTargetFps(): number {
    return this.lowPowerMode ? 30 : 60;
  }

  // Instrumentação da Animação (OceanEngine)
  recordFrame(now: number, simulateMs: number, drawMs: number) {
    if (this.lastTime > 0) {
      const delta = now - this.lastTime;
      this.frameTimes.push(delta);
      if (this.frameTimes.length > 45) {
        this.frameTimes.shift();
      }
      // Se demorou mais de 2 quadros (> 35ms em 60fps), conta drop
      if (delta > 35) {
        this.droppedFrames++;
      }
    }
    this.lastTime = now;
    this.simulateTime = simulateMs;
    this.drawTime = drawMs;

    this.scheduleNotify();
  }

  updateEntityCounts(counts: {
    fish: number;
    bubbles: number;
    motes: number;
    plants: number;
    debris: number;
    rays: number;
  }) {
    this.fishCount = counts.fish;
    this.bubbleCount = counts.bubbles;
    this.moteCount = counts.motes;
    this.plantCount = counts.plants;
    this.debrisCount = counts.debris;
    this.rayCount = counts.rays;
  }

  // Instrumentação do AudioEngine
  updateAudioMetrics(metrics: {
    state: "running" | "suspended" | "closed" | "uninitialized";
    sampleRate: number;
    outputLatencyMs: number;
  }) {
    this.audioState = metrics.state;
    this.audioSampleRate = metrics.sampleRate;
    this.audioOutputLatencyMs = metrics.outputLatencyMs;
    this.scheduleNotify();
  }

  private scheduleNotify() {
    if (this.notifyTimer !== null) return;
    this.notifyTimer = window.setTimeout(() => {
      this.notifyTimer = null;
      if (this.listeners.size === 0) return;
      const metrics = this.getMetrics();
      this.listeners.forEach((fn) => fn(metrics));
    }, 250); // atualização suave a cada 250ms para não degradar a UI
  }

  getMetrics(): PerfMetrics {
    let avgDelta = 16.67;
    if (this.frameTimes.length > 0) {
      const sum = this.frameTimes.reduce((acc, v) => acc + v, 0);
      avgDelta = sum / this.frameTimes.length;
    }
    const fps = avgDelta > 0 ? Math.round(1000 / avgDelta) : 60;
    const frameTimeMs = Math.round((this.simulateTime + this.drawTime) * 100) / 100;

    return {
      fps: Math.min(120, Math.max(0, fps)),
      frameTimeMs,
      simulateTimeMs: Math.round(this.simulateTime * 100) / 100,
      drawTimeMs: Math.round(this.drawTime * 100) / 100,
      activeFish: this.fishCount,
      activeBubbles: this.bubbleCount,
      activeMotes: this.moteCount,
      activePlants: this.plantCount,
      activeDebris: this.debrisCount,
      activeRays: this.rayCount,
      audioState: this.audioState,
      audioSampleRate: this.audioSampleRate,
      audioOutputLatencyMs: Math.round(this.audioOutputLatencyMs * 10) / 10,
      batteryLevel: this.batteryLevel,
      batteryCharging: this.batteryCharging,
      batteryDischargingHours: this.batteryDischargingHours,
      batterySupported: this.batterySupported,
      lowPowerMode: this.lowPowerMode,
      targetFps: this.getTargetFps(),
      droppedFrames: this.droppedFrames,
    };
  }

  subscribe(listener: PerfListener): () => void {
    this.listeners.add(listener);
    listener(this.getMetrics());
    return () => {
      this.listeners.delete(listener);
    };
  }
}

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

export const perfMonitor = new PerformanceMonitor();
