import type { AudioSettings, BiomeId } from "../types";

type PadHandle = { stop: (at?: number) => void };

const SCALES: Record<BiomeId, number[]> = {
  reef: [196.0, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0],
  kelp: [196.0, 233.08, 261.63, 293.66, 349.23, 392.0],
  mangrove: [174.61, 196.0, 220.0, 261.63, 293.66, 349.23],
  island: [174.61, 220.0, 261.63, 329.63, 349.23, 440.0],
  deep: [110.0, 146.83, 164.81, 220.0, 246.94],
  abyss: [73.42, 98.0, 110.0, 155.56, 207.65],
};

const PAD_FREQ: Record<BiomeId, [number, number]> = {
  reef: [130.81, 196.0],
  kelp: [98.0, 146.83],
  mangrove: [110.0, 164.81],
  island: [146.83, 220.0],
  deep: [55.0, 82.41],
  abyss: [36.71, 55.0],
};

export class TideAudio {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private pad: PadHandle | null = null;
  private noise: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noteTimer = 0;
  private bubbleTimer = 0;
  private whaleTimer = 0;
  private raf = 0;
  private running = false;
  private biome: BiomeId = "reef";
  private volumes: AudioSettings = { music: 0.42, ambient: 0.5, sfx: 0.38 };
  private last = 0;

  async ensure() {
    if (!this.ctx) {
      const ctx = new AudioContext();
      this.ctx = ctx;
      const master = ctx.createGain();
      master.gain.value = 0.85;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 12;
      comp.ratio.value = 2.4;
      master.connect(comp);
      comp.connect(ctx.destination);

      const music = ctx.createGain();
      const ambient = ctx.createGain();
      const sfx = ctx.createGain();
      music.gain.value = this.volumes.music;
      ambient.gain.value = this.volumes.ambient;
      sfx.gain.value = this.volumes.sfx;

      const verb = ctx.createDelay(1.8);
      verb.delayTime.value = 0.42;
      const verbFb = ctx.createGain();
      verbFb.gain.value = 0.28;
      const verbLp = ctx.createBiquadFilter();
      verbLp.type = "lowpass";
      verbLp.frequency.value = 1600;
      verb.connect(verbLp);
      verbLp.connect(verbFb);
      verbFb.connect(verb);
      const verbOut = ctx.createGain();
      verbOut.gain.value = 0.22;
      verbLp.connect(verbOut);
      verbOut.connect(master);

      music.connect(master);
      music.connect(verb);
      ambient.connect(master);
      sfx.connect(master);

      this.musicGain = music;
      this.ambientGain = ambient;
      this.sfxGain = sfx;
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  setVolumes(v: AudioSettings) {
    this.volumes = v;
    const t = this.ctx?.currentTime ?? 0;
    this.musicGain?.gain.setTargetAtTime(v.music, t, 0.08);
    this.ambientGain?.gain.setTargetAtTime(v.ambient, t, 0.08);
    this.sfxGain?.gain.setTargetAtTime(v.sfx, t, 0.08);
  }

  async start(biome: BiomeId) {
    await this.ensure();
    if (this.running) {
      this.setBiome(biome);
      return;
    }
    this.biome = biome;
    this.running = true;
    this.startNoise();
    this.crossPad(biome);
    this.last = performance.now();
    this.noteTimer = 4;
    this.bubbleTimer = 2;
    this.whaleTimer = 18 + Math.random() * 20;
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.tick(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  setBiome(biome: BiomeId) {
    if (biome === this.biome) return;
    this.biome = biome;
    if (!this.running) return;
    this.crossPad(biome);
    this.tuneNoise(biome);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.pad?.stop();
    this.pad = null;
    try {
      this.noise?.stop();
    } catch {
      /* already */
    }
    this.noise = null;
  }

  chime() {
    if (!this.ctx || !this.sfxGain) return;
    const notes = [392.0, 493.88, 587.33];
    notes.forEach((f, i) => this.tone(f, 0.06, 1.8 + i * 0.12, 0.08, i * 0.22));
  }

  bubble() {
    if (!this.ctx || !this.sfxGain) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    o.type = "sine";
    const start = 700 + Math.random() * 500;
    o.frequency.setValueAtTime(start, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(140 + Math.random() * 80, ctx.currentTime + 0.18);
    f.type = "lowpass";
    f.frequency.value = 1800;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    o.connect(f);
    f.connect(g);
    g.connect(this.sfxGain);
    o.start();
    o.stop(ctx.currentTime + 0.24);
  }

  private tick(dt: number) {
    this.noteTimer -= dt;
    this.bubbleTimer -= dt;
    this.whaleTimer -= dt;
    if (this.noteTimer <= 0) {
      this.playScaleNote();
      this.noteTimer = 5.5 + Math.random() * 8;
      if (this.biome === "abyss") this.noteTimer += 4;
      if (this.biome === "island") this.noteTimer -= 1.5;
    }
    if (this.bubbleTimer <= 0) {
      if (Math.random() < 0.7) this.bubble();
      this.bubbleTimer = 1.6 + Math.random() * 4;
    }
    if (this.whaleTimer <= 0) {
      if (this.biome === "deep" || this.biome === "abyss" || this.biome === "island") {
        this.whale();
      }
      this.whaleTimer = 28 + Math.random() * 40;
    }
  }

  private playScaleNote() {
    const scale = SCALES[this.biome];
    const f = scale[Math.floor(Math.random() * scale.length)]!;
    const octave = Math.random() > 0.7 ? 0.5 : 1;
    this.tone(f * octave, 0.045, 3.2, 0.12);
  }

  private tone(freq: number, gain: number, dur: number, attack: number, delay = 0) {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    o1.type = "sine";
    o2.type = "triangle";
    o1.frequency.value = freq;
    o2.frequency.value = freq * 2.003;
    f.type = "lowpass";
    f.frequency.value = this.biome === "abyss" ? 700 : 1400;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o1.connect(f);
    o2.connect(f);
    f.connect(g);
    g.connect(this.musicGain);
    o1.start(t0);
    o2.start(t0);
    o1.stop(t0 + dur + 0.05);
    o2.stop(t0 + dur + 0.05);
  }

  private whale() {
    if (!this.ctx || !this.sfxGain) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    o.type = "sine";
    o.frequency.setValueAtTime(90, ctx.currentTime);
    o.frequency.linearRampToValueAtTime(140, ctx.currentTime + 2.2);
    o.frequency.linearRampToValueAtTime(70, ctx.currentTime + 5.5);
    f.type = "lowpass";
    f.frequency.value = 480;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 6);
    o.connect(f);
    f.connect(g);
    g.connect(this.sfxGain);
    o.start();
    o.stop(ctx.currentTime + 6.2);
  }

  private startNoise() {
    if (!this.ctx || !this.ambientGain) return;
    const ctx = this.ctx;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    this.tuneNoiseFilter(filter, this.biome);
    const g = ctx.createGain();
    g.gain.value = 0.18;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.ambientGain);
    src.start();
    this.noise = src;
    this.noiseFilter = filter;
  }

  private tuneNoise(biome: BiomeId) {
    if (this.noiseFilter) this.tuneNoiseFilter(this.noiseFilter, biome);
  }

  private tuneNoiseFilter(filter: BiquadFilterNode, biome: BiomeId) {
    const table: Record<BiomeId, [number, number]> = {
      reef: [700, 0.8],
      kelp: [500, 0.7],
      mangrove: [420, 0.9],
      island: [900, 1.1],
      deep: [280, 0.6],
      abyss: [160, 0.5],
    };
    const [freq, q] = table[biome];
    const t = this.ctx?.currentTime ?? 0;
    filter.frequency.setTargetAtTime(freq, t, 1.2);
    filter.Q.setTargetAtTime(q, t, 1.2);
  }

  private crossPad(biome: BiomeId) {
    const prev = this.pad;
    this.pad = this.makePad(biome);
    prev?.stop();
  }

  private makePad(biome: BiomeId): PadHandle {
    const ctx = this.ctx!;
    const music = this.musicGain!;
    const [f1, f2] = PAD_FREQ[biome];
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const o3 = ctx.createOscillator();
    o1.type = "sine";
    o2.type = "sine";
    o3.type = "triangle";
    o1.frequency.value = f1;
    o2.frequency.value = f2;
    o3.frequency.value = f1 * 1.5;
    o2.detune.value = 6;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = biome === "abyss" ? 320 : biome === "deep" ? 420 : 640;
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.04;
    lfoG.gain.value = 80;
    lfo.connect(lfoG);
    lfoG.connect(f.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 3.5);
    o1.connect(f);
    o2.connect(f);
    o3.connect(f);
    f.connect(g);
    g.connect(music);
    o1.start();
    o2.start();
    o3.start();
    lfo.start();
    return {
      stop: () => {
        try {
          g.gain.cancelScheduledValues(ctx.currentTime);
          g.gain.setTargetAtTime(0.0001, ctx.currentTime, 1.4);
          window.setTimeout(() => {
            try {
              o1.stop();
              o2.stop();
              o3.stop();
              lfo.stop();
            } catch {
              /* already */
            }
          }, 2200);
        } catch {
          /* already */
        }
      },
    };
  }
}

let singleton: TideAudio | null = null;

export function getAudio(): TideAudio {
  if (!singleton) singleton = new TideAudio();
  return singleton;
}
