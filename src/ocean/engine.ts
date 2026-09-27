import { IMAGES } from "../assets/images";
import { BIOMES } from "../data/biomes";
import { SPECIES } from "../data/species";
import type { BiomeId, ShapeId, TimeOfDay } from "../types";
import { getSpriteCanvas } from "./sprites";

export interface OceanConfig {
  biome: BiomeId;
  life: number;
  timeOfDay: TimeOfDay;
  intensity: number;
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
const pixelCache = new Map<string, HTMLCanvasElement>();

function pixelate(img: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const key = `${img.src}|${w}|${h}`;
  const hit = pixelCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, w, h);
  pixelCache.set(key, c);
  return c;
}

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
  private bgCanvas: HTMLCanvasElement | null = null;
  private hidden = false;

  constructor(canvas: HTMLCanvasElement, config: OceanConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.buffer = document.createElement("canvas");
    this.buffer.width = W;
    this.buffer.height = H;
    this.bctx = this.buffer.getContext("2d")!;
    this.config = config;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.resize();
  }

  async init() {
    this.rebuild();
    this.start();
    const srcs = Object.values(IMAGES);
    await Promise.all(
      srcs.map(async (src) => {
        if (imageCache.has(src)) return;
        try {
          const img = await loadImage(src);
          imageCache.set(src, img);
        } catch {
          /* gradient fallback */
        }
      }),
    );
    this.rebuild();
  }

  setConfig(partial: Partial<OceanConfig>) {
    const next = { ...this.config, ...partial };
    const biomeChanged = next.biome !== this.config.biome;
    const lifeChanged = Math.abs(next.life - this.config.life) > 0.5;
    const todChanged = next.timeOfDay !== this.config.timeOfDay;
    this.config = next;
    if (biomeChanged || lifeChanged || todChanged) this.rebuild();
    else if (!this.bgCanvas) this.composeBackground();
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
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      if (!this.hidden) this.tick(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", this.onVis);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    document.removeEventListener("visibilitychange", this.onVis);
  }

  private onVis = () => {
    this.hidden = document.hidden;
    this.last = performance.now();
  };

  private rebuild() {
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
    const fishCount = Math.floor(2 + (life / 100) * (night ? 10 : 16));
    this.fish = [];
    for (let i = 0; i < fishCount; i++) {
      const spec = pool.length ? pool[Math.floor(rng() * pool.length)]! : SPECIES[0]!;
      const dir = rng() > 0.5 ? 1 : -1;
      const z = rng();
      this.fish.push({
        x: rng() * W,
        y: 30 + rng() * (H - 70),
        baseY: 30 + rng() * (H - 70),
        vx: dir * (6 + rng() * 14) * (0.5 + z),
        vy: 0,
        phase: rng() * Math.PI * 2,
        amp: 3 + rng() * 8,
        scale: z > 0.7 ? 2 : 1,
        shape: spec.shape,
        palette: spec.palette,
        flip: dir < 0,
        z,
        speed: 0.6 + rng() * 1.4,
      });
    }

    this.bubbles = [];
    const bcount = 14 + Math.floor(life / 10);
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
    const mcount = night ? 50 : 28;
    for (let i = 0; i < mcount; i++) {
      this.motes.push({
        x: rng() * W,
        y: rng() * H,
        vx: (rng() - 0.5) * 4,
        vy: (rng() - 0.5) * 6,
        s: rng() > 0.8 ? 2 : 1,
        a: 0.15 + rng() * 0.45,
      });
    }

    this.rays = [];
    const rcount = timeOfDay === "night" ? 2 : timeOfDay === "dusk" ? 3 : 5;
    for (let i = 0; i < rcount; i++) {
      this.rays.push({
        x: rng() * W,
        w: 8 + rng() * 18,
        a: 0.04 + rng() * 0.06,
        phase: rng() * Math.PI * 2,
      });
    }
  }

  private tick(dt: number) {
    const speed = (this.reduced ? 0.35 : 1) * (this.config.intensity || 1);
    this.t += dt * speed;
    this.simulate(dt * speed);
    this.draw();
  }

  private simulate(dt: number) {
    for (const f of this.fish) {
      f.x += f.vx * dt;
      f.y = f.baseY + Math.sin(this.t * f.speed + f.phase) * f.amp;
      if (f.x > W + 28) {
        f.x = -28;
        f.baseY = 30 + Math.random() * (H - 70);
      }
      if (f.x < -28) {
        f.x = W + 28;
        f.baseY = 30 + Math.random() * (H - 70);
      }
    }
    for (const b of this.bubbles) {
      b.y -= b.vy * dt;
      b.x += Math.sin(this.t * 0.8 + b.phase) * 6 * dt;
      if (b.y < -4) {
        b.y = H + 4;
        b.x = Math.random() * W;
      }
    }
    for (const m of this.motes) {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.x < 0) m.x += W;
      if (m.x > W) m.x -= W;
      if (m.y < 0) m.y += H;
      if (m.y > H) m.y -= H;
    }
    for (const d of this.debris) {
      d.x += d.vx * dt;
      d.y += Math.sin(this.t * 0.4 + d.x) * 2 * dt;
      if (d.x > W + 10) d.x = -10;
      if (d.x < -10) d.x = W + 10;
    }
  }

  private composeBackground() {
    const { biome, life, timeOfDay } = this.config;
    const get = (src: string) => imageCache.get(src) ?? null;
    if (!this.bgCanvas) {
      this.bgCanvas = document.createElement("canvas");
      this.bgCanvas.width = W;
      this.bgCanvas.height = H;
    }
    const x = this.bgCanvas.getContext("2d")!;
    x.imageSmoothingEnabled = false;
    x.clearRect(0, 0, W, H);

    if (biome === "reef") {
      const dead = get(IMAGES.reefDead);
      const alive = get(IMAGES.reefAlive);
      const night = get(IMAGES.reefNight);
      const t = Math.min(1, Math.max(0, life / 100));
      if (dead) x.drawImage(pixelate(dead, W, H), 0, 0);
      else {
        x.fillStyle = "#0b1a24";
        x.fillRect(0, 0, W, H);
      }
      if (alive) {
        x.globalAlpha = 0.15 + t * 0.85;
        x.drawImage(pixelate(alive, W, H), 0, 0);
        x.globalAlpha = 1;
      }
      if (timeOfDay === "night" && night) {
        x.globalAlpha = 0.55 + (1 - t) * 0.2;
        x.drawImage(pixelate(night, W, H), 0, 0);
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
    if (img) x.drawImage(pixelate(img, W, H), 0, 0);
    else {
      x.fillStyle = BIOMES[biome].palette.deep;
      x.fillRect(0, 0, W, H);
    }
  }

  private draw() {
    const { biome, life, timeOfDay } = this.config;
    const b = this.bctx;
    b.imageSmoothingEnabled = false;
    b.clearRect(0, 0, W, H);

    if (this.bgCanvas) b.drawImage(this.bgCanvas, 0, 0, W, H);
    else {
      b.fillStyle = BIOMES[biome].palette.deep;
      b.fillRect(0, 0, W, H);
    }

    const tLife = life / 100;
    if (biome !== "reef") {
      b.fillStyle = `rgba(6, 12, 18, ${0.55 * (1 - tLife)})`;
      b.fillRect(0, 0, W, H);
      b.save();
      b.globalCompositeOperation = "saturation";
      b.fillStyle = `rgba(128,128,128,${0.65 * (1 - tLife)})`;
      b.fillRect(0, 0, W, H);
      b.restore();
    }

    const todTint: Record<TimeOfDay, string> = {
      dawn: "rgba(255, 150, 90, 0.10)",
      day: "rgba(255, 255, 220, 0.00)",
      dusk: "rgba(210, 80, 50, 0.12)",
      night: "rgba(4, 10, 28, 0.38)",
    };
    b.fillStyle = todTint[timeOfDay];
    b.fillRect(0, 0, W, H);

    for (const r of this.rays) {
      const ox = r.x + Math.sin(this.t * 0.15 + r.phase) * 12;
      b.fillStyle = `rgba(220, 235, 255, ${r.a * (timeOfDay === "night" ? 0.35 : 1)})`;
      b.beginPath();
      b.moveTo(ox, 0);
      b.lineTo(ox + r.w, 0);
      b.lineTo(ox + r.w * 1.6, H);
      b.lineTo(ox - r.w * 0.4, H);
      b.closePath();
      b.fill();
    }

    this.drawPlants(b, false);
    this.drawDebris(b);

    const far = this.fish.filter((f) => f.z < 0.45);
    const mid = this.fish.filter((f) => f.z >= 0.45 && f.z < 0.75);
    const near = this.fish.filter((f) => f.z >= 0.75);

    this.drawFish(b, far, 1);
    this.drawPlants(b, true);
    this.drawFish(b, mid, 1);
    this.drawFish(b, near, 2);

    for (const m of this.motes) {
      const glow = timeOfDay === "night";
      b.fillStyle = glow
        ? `rgba(140, 230, 220, ${m.a})`
        : `rgba(210, 230, 230, ${m.a * 0.55})`;
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
    out.imageSmoothingEnabled = false;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const scale = Math.max(cw / W, ch / H);
    const dw = W * scale;
    const dh = H * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    out.fillStyle = "#061018";
    out.fillRect(0, 0, cw, ch);
    out.drawImage(this.buffer, dx, dy, dw, dh);
  }

  private drawFish(b: CanvasRenderingContext2D, list: Fish[], scaleBoost: number) {
    for (const f of list) {
      const sc = Math.max(1, Math.round(f.scale * scaleBoost));
      const spr = getSpriteCanvas(f.shape, f.palette, f.vx < 0, sc);
      b.globalAlpha = 0.55 + f.z * 0.45;
      b.drawImage(spr, (f.x | 0) - spr.width / 2, (f.y | 0) - spr.height / 2);
      b.globalAlpha = 1;
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
      for (let i = 0; i < h; i++) {
        const sway = Math.sin(this.t * 0.7 + p.phase + i * 0.12) * (i / h) * 5;
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
