// A quiet water texture synthesized locally. No audio loads or starts before consent.
export class OceanAmbient {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.depth = 0;
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx || !this.enabled) return;
      const promise = document.hidden ? this.ctx.suspend() : this.ctx.resume();
      promise.catch(() => {});
    });
  }

  async start() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error('Áudio indisponível neste navegador.');
    if (!this.ctx) {
      this.ctx = new Audio();
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 5, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let previous = 0;
      for (let i = 0; i < data.length; i++) {
        previous = (previous + (Math.random() * 2 - 1) * .02) / 1.02;
        data[i] = previous * 3.5;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.gain = this.ctx.createGain();
      this.gain.gain.value = 0;
      const swell = this.ctx.createOscillator();
      swell.frequency.value = .1;
      const swellGain = this.ctx.createGain();
      swellGain.gain.value = .018;
      swell.connect(swellGain).connect(this.gain.gain);
      noise.connect(this.filter).connect(this.gain).connect(this.ctx.destination);
      noise.start();
      swell.start();
    }
    await this.ctx.resume();
    this.enabled = true;
    this.gain.gain.setTargetAtTime(.07, this.ctx.currentTime, .4);
    this.setDepth(this.depth);
  }

  async stop() {
    this.enabled = false;
    if (this.ctx) await this.ctx.suspend();
  }

  setDepth(depth) {
    this.depth = depth;
    if (this.filter) this.filter.frequency.setTargetAtTime(750 - depth * 550, this.ctx.currentTime, 1);
  }
}
