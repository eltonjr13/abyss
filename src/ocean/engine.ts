import { IMAGES, getBiomeImageSources } from "../assets/images";
import { BIOMES } from "../data/biomes";
import { SPECIES } from "../data/species";
import type { BiomeId, ShapeId, TimeOfDay } from "../types";
import { getSpriteCanvas } from "./sprites";
import { creaturePose, locomotion } from "./creature-motion";
import { habitatBlend, submergedPalette, waterCurrent, waterLight } from "./atmosphere";
import { perfMonitor } from "../perf/monitor";

export interface OceanConfig {
  biome: BiomeId;
  life: number;
  timeOfDay: TimeOfDay;
  intensity: number;
  showCreatures?: boolean;
}

interface Fish {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseY: number;
  phase: number;
  amp: number;
  scale: number;
  shape: ShapeId;
  speciesId: string;
  palette: string[];
  flip: boolean;
  z: number;
  speed: number;
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  vy: number;
  phase: number;
}

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  s: number;
  a: number;
  z: number;
}

interface Plant {
  x: number;
  h: number;
  phase: number;
  w: number;
  kind: number;
}

interface Debris {
  x: number;
  y: number;
  vx: number;
  kind: number;
  a: number;
}

interface Ray {
  x: number;
  w: number;
  a: number;
  phase: number;
}

const W = 480;
const H = 270;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("img"));
    img.src = src;
  });
}

const imageCache = new Map<string, HTMLImageElement>();

export class OceanEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private buffer: HTMLCanvasElement;
  private bctx: CanvasRenderingContext2D;
  private raf = 0;
  private running = false;
  private t = 0;
  private last = 0;
  private config: OceanConfig;
  private fish: Fish[] = [];
  private bubbles: Bubble[] = [];
  private motes: Mote[] = [];
  private plants: Plant[] = [];
  private debris: Debris[] = [];
  private rays: Ray[] = [];
  private reduced = false;
  private lowPower = false;
  private motionQuery: MediaQueryList;
  private bgCanvas: HTMLCanvasElement | null = null;
  private lightCanvas: HTMLCanvasElement;
  private lctx: CanvasRenderingContext2D;
  private transition: { image: HTMLCanvasElement; elapsed: number; ready: boolean } | null = null;
  private hidden = false;
  private loadingImages = false;

  constructor(canvas: HTMLCanvasElement, config: OceanConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.buffer = document.createElement("canvas");
    this.buffer.width = W;
    this.buffer.height = H;
    this.bctx = this.buffer.getContext("2d")!;
    this.lightCanvas = document.createElement("canvas");
    this.lightCanvas.width = W;
    this.lightCanvas.height = H;
    this.lctx = this.lightCanvas.getContext("2d")!;
    this.config = config;
    this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reduced = this.motionQuery.matches;
    this.resize();
  }

  async init() {
    this.rebuild();
    this.start();
    await this.ensureBiomeImages();
  }

  private async ensureBiomeImages() {
    if (this.loadingImages) return;
    const needed = getBiomeImageSources(this.config.biome, this.config.timeOfDay);
    const toLoad = needed.filter((src) => !imageCache.has(src));
    if (toLoad.length === 0) {
      this.composeBackground();
      if (this.transition) this.transition.ready = true;
      return;
    }

    this.loadingImages = true;
    try {
      await Promise.all(
        toLoad.map(async (src) => {
          try {
            const img = await loadImage(src);
            imageCache.set(src, img);
          } catch {
            /* gradient fallback */
          }
        }),
      );
    } finally {
      this.loadingImages = false;
    }
    this.composeBackground();
    // A habitat selected during an in-flight load still needs its own scenery.
    const currentSources = getBiomeImageSources(this.config.biome, this.config.timeOfDay);
    if (this.running && currentSources.join("|") !== needed.join("|")) await this.ensureBiomeImages();
    else if (this.transition) this.transition.ready = true;
  }

  setConfig(partial: Partial<OceanConfig>) {
    const next = { ...this.config, ...partial };
    const biomeChanged = next.biome !== this.config.biome;
    const lifeChanged = Math.abs(next.life - this.config.life) > 0.5;
    const todChanged = next.timeOfDay !== this.config.timeOfDay;
    const creaturesChanged = next.showCreatures !== this.config.showCreatures;
    if ((biomeChanged || todChanged) && this.bgCanvas) {
      // Capture what is actually visible, including an interrupted crossfade.
      const image = document.createElement("canvas");
      image.width = this.canvas.width;
      image.height = this.canvas.height;
      image.getContext("2d")!.drawImage(this.canvas, 0, 0);
      this.transition = { image, elapsed: 0, ready: false };
    }
    this.config = next;
    if (biomeChanged || lifeChanged || todChanged || creaturesChanged) this.rebuild();
    else if (!this.bgCanvas) this.composeBackground();
    if (biomeChanged || todChanged) void this.ensureBiomeImages();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(r.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(r.height * dpr));
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    let accumulatedMs = 0;

    const loop = (now: number) => {
      if (!this.running) return;
      const targetFps = perfMonitor.getTargetFps();
      const frameInterval = 1000 / targetFps;

      const rawDt = (now - this.last) / 1000;
      this.last = now;
      accumulatedMs += rawDt * 1000;

      if (!this.hidden && accumulatedMs >= frameInterval * 0.85) {
        const dt = Math.min(0.05, accumulatedMs / 1000);
        accumulatedMs = 0;
        this.tick(dt, now);
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", this.onVis);
    this.motionQuery.addEventListener("change", this.onMotion);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    document.removeEventListener("visibilitychange", this.onVis);
    this.motionQuery.removeEventListener("change", this.onMotion);
    this.transition = null;
  }

  private onMotion = () => { this.reduced = this.motionQuery.matches; };

  private onVis = () => {
    this.hidden = document.hidden;
    this.last = performance.now();
  };

  private rebuild(preserveFauna = false) {
    const previousFish = this.fish;
    this.composeBackground();
    const { biome, life, timeOfDay } = this.config;
    const rng = mulberry32(biome.length * 97 + Math.floor(life) * 13);
    const night = timeOfDay === "night";

    const plantCount = Math.floor(3 + (life / 100) * 18);
    this.plants = [];
    for (let i = 0; i < plantCount; i++) {
      this.plants.push({
        x: 8 + rng() * (W - 16),
        h: 18 + rng() * (biome === "kelp" ? 90 : 48),
        phase: rng() * Math.PI * 2,
        w: biome === "kelp" ? 2 + rng() * 2 : 1 + rng(),
        kind: Math.floor(rng() * 3),
      });
    }

    const trashCount = Math.max(0, Math.floor((40 - life) / 7));
    this.debris = [];
    for (let i = 0; i < trashCount; i++) {
      this.debris.push({
        x: rng() * W,
        y: 80 + rng() * (H - 100),
        vx: (rng() - 0.5) * 4,
        kind: Math.floor(rng() * 3),
        a: 0.5 + rng() * 0.4,
      });
    }

    const eligible = SPECIES.filter((s) => s.biome === biome && life >= s.minLife);
    const extras = SPECIES.filter((s) => s.biome === biome && life >= s.minLife * 0.7);
    const pool = eligible.length ? eligible : extras.slice(0, 2);
    const fishCount = this.config.showCreatures === false ? 0 : Math.floor(2 + (life / 100) * (night ? 10 : 16));
    this.fish = [];
    for (let i = 0; i < fishCount; i++) {
      const spec = pool.length ? pool[Math.floor(rng() * pool.length)]! : SPECIES[0]!;
      const dir = rng() > 0.5 ? 1 : -1;
      const z = rng();
      const mode = locomotion(spec.shape, spec.id);
      const bottom = mode === "anchored" || mode === "crawl";
      const baseY = bottom ? H - 19 - rng() * 8 : mode === "surface" ? 20 + rng() * 15 : 40 + rng() * (H - 100);
      this.fish.push({
        x: rng() * W,
        y: baseY,
        baseY,
        vx: dir * (mode === "anchored" ? 0 : mode === "crawl" ? 1.5 : mode === "pulse" ? 3 + rng() * 5 : 6 + rng() * 14) * (0.5 + z),
        vy: 0,
        phase: rng() * Math.PI * 2,
        amp: 3 + rng() * 8,
        scale: z > 0.7 ? 2 : 1,
        shape: spec.shape,
        speciesId: spec.id,
        palette: submergedPalette(spec.palette, biome, timeOfDay, z, ["jelly", "lantern", "angler", "unknown"].includes(spec.shape)),
        flip: dir < 0,
        z,
        speed: 0.6 + rng() * 1.4,
      });
    }

    const isLowPower = perfMonitor.isLowPowerMode();
    this.lowPower = isLowPower;
    if (preserveFauna) this.fish = previousFish;
    this.bubbles = [];
    const bcount = Math.floor((14 + Math.floor(life / 10)) * (isLowPower ? 0.6 : 1));
    for (let i = 0; i < bcount; i++) {
      this.bubbles.push({
        x: rng() * W,
        y: rng() * H,
        r: 0.6 + rng() * 1.8,
        vy: 8 + rng() * 16,
        phase: rng() * Math.PI * 2,
      });
    }

    this.motes = [];
    const baseMcount = night ? 50 : 28;
    const mcount = Math.floor(baseMcount * (isLowPower ? 0.45 : 1));
    for (let i = 0; i < mcount; i++) {
      this.motes.push({
        x: rng() * W,
        y: rng() * H,
        vx: (rng() - 0.5) * 0.5,
        vy: (rng() - 0.5) * 0.7,
        s: rng() > 0.8 ? 2 : 1,
        a: 0.15 + rng() * 0.45,
        z: rng(),
      });
    }

    this.rays = [];
    const rcount = waterLight(biome, timeOfDay).strength > 0 ? (isLowPower ? 3 : 5) : 0;
    for (let i = 0; i < rcount; i++) {
      this.rays.push({
        x: (i + 0.3 + rng() * 0.4) * W / rcount,
        w: 18 + rng() * 25,
        a: 0.04 + rng() * 0.05,
        phase: rng() * Math.PI * 2,
      });
    }

    perfMonitor.updateEntityCounts({
      fish: this.fish.length,
      bubbles: this.bubbles.length,
      motes: this.motes.length,
      plants: this.plants.length,
      debris: this.debris.length,
      rays: this.rays.length,
    });
  }

  private tick(dt: number, now: number) {
    if (this.lowPower !== perfMonitor.isLowPowerMode()) this.rebuild(true);
    const speed = (this.reduced ? 0.35 : 1) * (this.config.intensity || 1);
    this.t += dt * speed;
    if (this.transition?.ready) this.transition.elapsed += dt;

    const t0 = performance.now();
    this.simulate(dt * speed);
    const t1 = performance.now();
    this.draw();
    const t2 = performance.now();

    perfMonitor.recordFrame(now, t1 - t0, t2 - t1);
  }

  private simulate(dt: number) {
    for (const f of this.fish) {
      const pose = creaturePose(f.shape, this.t, f.phase, f.speed, this.reduced, f.speciesId);
      f.x += f.vx * pose.surge * dt;
      f.y = f.baseY + pose.bob * f.amp;
      if (f.x > W + 64) {
        f.x = -64;
      }
      if (f.x < -64) {
        f.x = W + 64;
      }
    }
    for (const b of this.bubbles) {
      const flow = waterCurrent(this.config.biome, this.reduced ? 0 : this.t, b.y);
      b.y -= b.vy * dt;
      b.x += (flow.x + Math.sin(this.t * 0.6 + b.phase) * 0.7) * dt;
      if (b.x > W + 4) b.x = -4;
      if (b.y < -4) {
        b.y = H + 4;
        b.x = Math.random() * W;
      }
    }
    for (const m of this.motes) {
      const flow = waterCurrent(this.config.biome, this.reduced ? 0 : this.t, m.y);
      const depth = 0.4 + m.z * 0.6;
      m.x += (flow.x * depth + m.vx) * dt;
      m.y += (flow.y * depth + m.vy) * dt;
      if (m.x < 0) m.x += W;
      if (m.x > W) m.x -= W;
      if (m.y < 0) m.y += H;
      if (m.y > H) m.y -= H;
    }
    for (const d of this.debris) {
      const flow = waterCurrent(this.config.biome, this.reduced ? 0 : this.t, d.y);
      d.x += (flow.x + d.vx * 0.15) * dt;
      d.y += flow.y * dt;
      if (d.x > W + 10) d.x = -10;
      if (d.x < -10) d.x = W + 10;
    }
  }

  private composeBackground() {
    const { biome, life, timeOfDay } = this.config;
    const get = (src: string) => imageCache.get(src) ?? null;
    if (!this.bgCanvas) {
      this.bgCanvas = document.createElement("canvas");
      this.bgCanvas.width = 1920;
      this.bgCanvas.height = 1080;
    }
    const bgW = this.bgCanvas.width;
    const bgH = this.bgCanvas.height;
    const x = this.bgCanvas.getContext("2d")!;
    x.imageSmoothingEnabled = true;
    x.imageSmoothingQuality = "high";
    x.clearRect(0, 0, bgW, bgH);

    if (biome === "reef") {
      const dead = get(IMAGES.reefDead);
      const alive = get(IMAGES.reefAlive);
      const night = get(IMAGES.reefNight);
      const t = Math.min(1, Math.max(0, life / 100));
      if (dead) x.drawImage(dead, 0, 0, bgW, bgH);
      else {
        x.fillStyle = "#0b1a24";
        x.fillRect(0, 0, bgW, bgH);
      }
      if (alive) {
        x.globalAlpha = 0.15 + t * 0.85;
        x.drawImage(alive, 0, 0, bgW, bgH);
        x.globalAlpha = 1;
      }
      if (timeOfDay === "night" && night) {
        x.globalAlpha = 0.55 + (1 - t) * 0.2;
        x.drawImage(night, 0, 0, bgW, bgH);
        x.globalAlpha = 1;
      }
      return;
    }

    const map: Record<BiomeId, string> = {
      reef: IMAGES.reefAlive,
      kelp: IMAGES.kelp,
      mangrove: IMAGES.mangrove,
      island: IMAGES.island,
      deep: IMAGES.deep,
      abyss: IMAGES.abyss,
    };
    const img = get(map[biome]);
    if (img) x.drawImage(img, 0, 0, bgW, bgH);
    else {
      x.fillStyle = BIOMES[biome].palette.deep;
      x.fillRect(0, 0, bgW, bgH);
    }
    // Saturation affects the scenery before the transparent fauna layer.
    x.save();
    x.globalCompositeOperation = "saturation";
    x.fillStyle = `rgba(128,128,128,${0.65 * (1 - life / 100)})`;
    x.fillRect(0, 0, bgW, bgH);
    x.restore();
  }

  private drawLight() {
    const b = this.lctx;
    b.clearRect(0, 0, W, H);
    const light = waterLight(this.config.biome, this.config.timeOfDay);
    if (light.strength === 0) return;
    const time = this.reduced ? 0 : this.t;
    const rgb = light.color.join(",");
    for (const r of this.rays) {
      const ox = r.x + Math.sin(time * 0.12 + r.phase) * 9;
      const pulse = 0.85 + Math.sin(time * 0.28 + r.phase) * 0.15;
      const alpha = r.a * light.strength * pulse;
      b.save();
      b.translate(ox, 0);
      b.rotate(-0.12);
      const gradient = b.createLinearGradient(-r.w, 0, r.w, 0);
      gradient.addColorStop(0, `rgba(${rgb},0)`);
      gradient.addColorStop(0.45, `rgba(${rgb},${alpha})`);
      gradient.addColorStop(0.55, `rgba(${rgb},${alpha})`);
      gradient.addColorStop(1, `rgba(${rgb},0)`);
      b.fillStyle = gradient;
      b.fillRect(-r.w, -10, r.w * 2, H + 30);
      b.restore();
    }
    b.save();
    b.globalCompositeOperation = "destination-in";
    const falloff = b.createLinearGradient(0, 0, 0, H);
    falloff.addColorStop(0, "rgba(0,0,0,1)");
    falloff.addColorStop(1, "rgba(0,0,0,0.12)");
    b.fillStyle = falloff;
    b.fillRect(0, 0, W, H);
    b.restore();
    if (light.strength < 0.1) return;
    // Sparse moving reflections, kept out of deep habitats and subdued in focus mode.
    const count = perfMonitor.isLowPowerMode() ? 3 : 6;
    for (let i = 0; i < count; i++) {
      const x = (i + 0.5) * W / count + Math.sin(time * 0.2 + i * 2.1) * 10;
      const y = H * 0.82 + Math.sin(time * 0.16 + i) * 12;
      b.save();
      b.translate(x, y);
      b.scale(1, 0.22);
      // Transform the gradient along with the ellipse, rather than stretching a pixel grid.
      const reflection = b.createRadialGradient(0, 0, 0, 0, 0, 38);
      reflection.addColorStop(0, `rgba(${rgb},${light.strength * 0.055})`);
      reflection.addColorStop(1, `rgba(${rgb},0)`);
      b.fillStyle = reflection;
      b.fillRect(-38, -38, 76, 76);
      b.restore();
    }
  }

  private draw() {
    if (this.transition && !this.transition.ready) {
      this.ctx.drawImage(this.transition.image, 0, 0, this.canvas.width, this.canvas.height);
      return;
    }
    const { biome, life, timeOfDay } = this.config;
    const b = this.bctx;
    b.imageSmoothingEnabled = false;
    b.clearRect(0, 0, W, H);

    const tLife = life / 100;
    if (biome !== "reef") {
      b.fillStyle = `rgba(6, 12, 18, ${0.55 * (1 - tLife)})`;
      b.fillRect(0, 0, W, H);
    }

    const todTint: Record<TimeOfDay, string> = {
      dawn: "rgba(255, 150, 90, 0.10)",
      day: "rgba(255, 255, 220, 0.00)",
      dusk: "rgba(210, 80, 50, 0.12)",
      night: "rgba(4, 10, 28, 0.38)",
    };
    b.fillStyle = todTint[timeOfDay];
    b.fillRect(0, 0, W, H);

    this.drawPlants(b, false);
    this.drawDebris(b);

    const far = this.fish.filter((f) => f.z < 0.45);
    const mid = this.fish.filter((f) => f.z >= 0.45 && f.z < 0.75);
    const near = this.fish.filter((f) => f.z >= 0.75);

    this.drawFish(b, far);
    this.drawPlants(b, true);
    this.drawFish(b, mid);
    this.drawFish(b, near);

    for (const m of this.motes) {
      const glow = timeOfDay === "night";
      b.fillStyle = glow
        ? `rgba(140, 230, 220, ${m.a * (0.4 + m.z * 0.6)})`
        : `rgba(210, 230, 230, ${m.a * (0.18 + m.z * 0.37)})`;
      b.fillRect(m.x | 0, m.y | 0, m.s, m.s);
    }

    for (const bubble of this.bubbles) {
      const x = bubble.x | 0;
      const y = bubble.y | 0;
      const r = Math.max(1, bubble.r | 0);
      b.fillStyle = "rgba(210, 235, 240, 0.22)";
      b.fillRect(x, y, r, r);
      b.fillStyle = "rgba(255, 255, 255, 0.45)";
      b.fillRect(x, y, 1, 1);
    }

    const g = b.createLinearGradient(0, 0, 0, H);
    if (biome === "abyss" || biome === "deep") {
      g.addColorStop(0, "rgba(0,0,0,0.25)");
      g.addColorStop(0.5, "rgba(0,0,0,0.05)");
      g.addColorStop(1, "rgba(0,0,0,0.55)");
    } else {
      g.addColorStop(0, "rgba(180, 220, 230, 0.08)");
      g.addColorStop(0.45, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(4, 12, 18, 0.45)");
    }
    b.fillStyle = g;
    b.fillRect(0, 0, W, H);

    b.fillStyle = "rgba(0,0,0,0.28)";
    b.fillRect(0, 0, W, 8);
    b.fillRect(0, H - 8, W, 8);
    b.fillRect(0, 0, 8, H);
    b.fillRect(W - 8, 0, 8, H);

    const out = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const scale = Math.max(cw / W, ch / H);
    const dw = W * scale;
    const dh = H * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    out.fillStyle = BIOMES[biome].palette.deep;
    out.fillRect(0, 0, cw, ch);
    // Draw the HD plate directly; only sprites/effects use the 480 × 270 buffer.
    out.imageSmoothingEnabled = true;
    out.imageSmoothingQuality = "high";
    if (this.bgCanvas) out.drawImage(this.bgCanvas, dx, dy, dw, dh);
    out.imageSmoothingEnabled = false;
    out.drawImage(this.buffer, dx, dy, dw, dh);
    this.drawLight();
    // The same soft light reaches both the scenery and the already submerged sprites.
    out.imageSmoothingEnabled = true;
    out.save();
    out.globalAlpha = Math.min(1, Math.max(0, this.config.intensity));
    out.drawImage(this.lightCanvas, dx, dy, dw, dh);
    out.restore();
    if (this.transition) {
      const blend = habitatBlend(this.transition.elapsed, this.reduced);
      if (blend >= 1) this.transition = null;
      else {
        out.save();
        out.globalAlpha = 1 - blend;
        out.drawImage(this.transition.image, 0, 0, cw, ch);
        out.restore();
      }
    }
  }

  private drawFish(b: CanvasRenderingContext2D, list: Fish[]) {
    for (const f of list) {
      const pose = creaturePose(f.shape, this.t, f.phase, f.speed, this.reduced, f.speciesId);
      const spr = getSpriteCanvas(f.shape, f.palette, false, 1, pose.frame, f.speciesId);
      const width = spr.width * f.scale / 2;
      const height = spr.height * f.scale / 2;
      b.save();
      b.globalAlpha = 0.4 + f.z * 0.6;
      b.translate(Math.round(f.x), Math.round(f.y));
      b.rotate(pose.tilt);
      b.scale(f.vx < 0 ? -1 : 1, 1);
      b.drawImage(spr, -width / 2, -height / 2, width, height);
      b.restore();
    }
  }

  private drawPlants(b: CanvasRenderingContext2D, foreground: boolean) {
    const { biome, life } = this.config;
    if (life < 6) return;
    const pal = BIOMES[biome].palette;
    for (const p of this.plants) {
      const isFore = p.x % 2 < 1;
      if (foreground !== isFore) continue;
      const h = p.h * (0.45 + (life / 100) * 0.55);
      const time = this.reduced ? 0 : this.t;
      const flow = waterCurrent(biome, time, H - h * 0.5);
      for (let i = 0; i < h; i++) {
        const sway = (flow.x + Math.sin(time * 0.4 + p.phase + i * 0.07) * 2) * (i / h);
        const x = (p.x + sway) | 0;
        const y = (H - 6 - i) | 0;
        const leaf = i % 5 === 0;
        b.fillStyle = leaf ? pal.light : pal.accent;
        b.globalAlpha = 0.55 + (i / h) * 0.35;
        b.fillRect(x, y, p.w | 0 || 1, 1);
        if (biome === "kelp" && leaf) {
          b.fillRect(x + (i % 2 === 0 ? 2 : -2), y, 2, 1);
        }
      }
      b.globalAlpha = 1;
    }
  }

  private drawDebris(b: CanvasRenderingContext2D) {
    for (const d of this.debris) {
      b.save();
      b.globalAlpha = d.a;
      b.fillStyle = d.kind === 0 ? "#8aa0aa" : d.kind === 1 ? "#c8d0c4" : "#6a5a48";
      const x = d.x | 0;
      const y = d.y | 0;
      if (d.kind === 0) {
        b.fillRect(x, y, 5, 8);
        b.fillStyle = "#b8c8c8";
        b.fillRect(x + 1, y + 1, 3, 2);
      } else if (d.kind === 1) {
        b.fillRect(x, y, 7, 6);
        b.fillRect(x + 2, y - 2, 3, 2);
      } else {
        b.fillRect(x, y, 4, 6);
        b.fillStyle = "#8a3a2a";
        b.fillRect(x + 1, y + 1, 2, 2);
      }
      b.restore();
    }
  }
}
