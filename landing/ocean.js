const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const compact = matchMedia('(max-width: 600px)');
const sprites = new Map();

export function spriteFor(species) {
  if (sprites.has(species.id)) return sprites.get(species.id);
  const canvas = document.createElement('canvas');
  canvas.width = species.pixels[0].length;
  canvas.height = species.pixels.length;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  species.pixels.forEach((row, y) => [...row].forEach((pixel, x) => {
    if (pixel === '.') return;
    ctx.fillStyle = species.palette[Number(pixel)];
    ctx.fillRect(x, y, 1, 1);
  }));
  sprites.set(species.id, canvas);
  return canvas;
}

export class OceanWorld {
  constructor(fauna) {
    this.fauna = fauna;
    this.scenes = [...document.querySelectorAll('[data-scene]')].map(canvas => ({
      canvas, ctx: canvas.getContext('2d'), name: canvas.dataset.scene, visible: false,
      biome: 'reef', life: canvas.dataset.scene === 'restoration' ? 0 : 1,
      width: 0, height: 0, fish: [], time: 0, pointer: null,
    })).filter(scene => scene.ctx);
    this.raf = 0;
    this.last = 0;
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const scene = this.scenes.find(item => item.canvas === entry.target);
        scene.visible = entry.isIntersecting;
        if (scene.visible) this.draw(scene, 0);
      });
      this.schedule();
    });
    this.resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
        const scene = this.scenes.find(item => item.canvas === entry.target);
        this.resize(scene);
      });
      this.schedule();
    });
    this.scenes.forEach(scene => {
      this.populate(scene);
      this.resize(scene);
      this.observer.observe(scene.canvas);
      this.resizeObserver.observe(scene.canvas);
      if (scene.name === 'biome') {
        const region = scene.canvas.parentElement;
        region.addEventListener('pointermove', event => {
          const rect = region.getBoundingClientRect();
          scene.pointer = { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
        }, { passive: true });
        region.addEventListener('pointerleave', () => { scene.pointer = null; });
        region.addEventListener('pointerup', () => {
          setTimeout(() => { scene.pointer = null; }, 800);
        });
      }
    });
    document.addEventListener('visibilitychange', () => this.schedule());
    reducedMotion.addEventListener('change', () => {
      this.scenes.forEach(scene => this.draw(scene, 0));
      this.schedule();
    });
    compact.addEventListener('change', () => {
      this.scenes.forEach(scene => { this.populate(scene); this.resize(scene); });
      this.schedule();
    });
  }

  populate(scene) {
    const species = this.fauna[scene.biome].species;
    const count = compact.matches ? 4 : scene.name === 'hero' ? 7 : 9;
    scene.fish = Array.from({ length: count }, (_, i) => ({
      species: species[i % species.length], x: (i * .217 + .13) % 1,
      y: .19 + ((i * .173) % .52), direction: i % 2 ? -1 : 1,
      speed: .014 + (i % 3) * .005, phase: i * 1.7, retreat: 0,
    }));
  }

  resize(scene) {
    const rect = scene.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    // Low-resolution compositing preserves the actual pixel sprites and limits GPU work.
    scene.width = Math.min(Math.round(rect.width), compact.matches ? 480 : 960);
    scene.height = Math.max(1, Math.round(rect.height * scene.width / rect.width));
    scene.canvas.width = scene.width;
    scene.canvas.height = scene.height;
    this.draw(scene, 0);
  }

  setBiome(name, biome) {
    const scene = this.scenes.find(item => item.name === name);
    if (!scene) return;
    scene.biome = biome;
    this.populate(scene);
    this.draw(scene, 0);
    this.schedule();
  }

  setLife(life) {
    const scene = this.scenes.find(item => item.name === 'restoration');
    if (!scene) return;
    scene.life = life;
    this.draw(scene, 0);
  }

  schedule() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.last = 0;
    if (document.hidden || reducedMotion.matches || !this.scenes.some(scene => scene.visible)) return;
    this.raf = requestAnimationFrame(now => this.tick(now));
  }

  tick(now) {
    const elapsed = this.last ? now - this.last : 34;
    if (elapsed >= 32) {
      this.last = now;
      this.scenes.filter(scene => scene.visible).forEach(scene => this.draw(scene, Math.min(elapsed / 1000, .08)));
    }
    this.raf = requestAnimationFrame(time => this.tick(time));
  }

  draw(scene, dt) {
    const { ctx, width: w, height: h } = scene;
    if (!w || !h) return;
    scene.time += dt;
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    scene.fish.forEach((fish, i) => {
      const appear = Math.max(0, Math.min(1, (scene.life - .12 - i * .045) * 4));
      if (!appear) return;
      fish.x += dt * fish.speed * fish.direction;
      if (fish.x > 1.12) fish.x = -.12;
      if (fish.x < -.12) fish.x = 1.12;
      const near = scene.pointer && Math.hypot(fish.x - scene.pointer.x, fish.y - scene.pointer.y) < .2;
      fish.retreat += ((near ? -.06 : 0) - fish.retreat) * Math.min(1, dt * 4);
      const sprite = spriteFor(fish.species);
      const scale = Math.max(2, Math.round(w / (scene.name === 'hero' ? 360 : 220)));
      const x = fish.x * w;
      const y = (fish.y + fish.retreat + Math.sin(scene.time * .8 + fish.phase) * .022) * h;
      ctx.save();
      ctx.globalAlpha = appear * (scene.name === 'hero' ? .48 : .85);
      ctx.translate(x, y);
      ctx.scale(fish.direction, 1);
      ctx.drawImage(sprite, -sprite.width * scale / 2, -sprite.height * scale / 2, sprite.width * scale, sprite.height * scale);
      ctx.restore();
    });
    const particles = compact.matches ? 9 : 22;
    for (let i = 0; i < particles; i++) {
      const x = ((i * .191 + Math.sin(scene.time * .12 + i) * .015) % 1) * w;
      const y = (1 - ((i * .147 + scene.time * .015) % 1)) * h;
      ctx.fillStyle = `rgba(190,233,237,${(.1 + (i % 3) * .06) * Math.max(.15, scene.life)})`;
      ctx.fillRect(Math.round(x), Math.round(y), i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
    }
    ctx.globalAlpha = 1;
  }
}
