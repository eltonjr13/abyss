import { OceanWorld, spriteFor } from './ocean.js';
import { OceanAmbient } from './ambient.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const ambient = new OceanAmbient();
let world;
let fauna;
const startButton = document.querySelector('#preview-start');
const homeView = document.querySelector('#preview-home');
const focusView = document.querySelector('#preview-focus');
const appNav = document.querySelector('#app-nav');
const pauseButton = document.querySelector('#preview-pause');
const exitButton = document.querySelector('#preview-exit');
const timerLabel = document.querySelector('#preview-timer');
let remaining = 25 * 60;
let deadline = 0;
let running = false;
let ticker;

function renderTimer() {
  if (running) remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  timerLabel.textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  if (remaining === 0) {
    clearInterval(ticker);
    running = false;
    pauseButton.textContent = 'Recomeçar prévia';
  }
}
function resume() {
  running = true;
  deadline = Date.now() + remaining * 1000;
  pauseButton.textContent = 'Pausar';
  clearInterval(ticker);
  ticker = setInterval(renderTimer, 250);
  renderTimer();
}
startButton.addEventListener('click', () => {
  homeView.hidden = true;
  appNav.hidden = true;
  focusView.hidden = false;
  remaining = 25 * 60;
  resume();
  pauseButton.focus({preventScroll: true});
});
pauseButton.addEventListener('click', () => {
  if (running) {
    renderTimer();
    running = false;
    clearInterval(ticker);
    pauseButton.textContent = 'Retomar';
  } else {
    if (!remaining) remaining = 25 * 60;
    resume();
  }
});
exitButton.addEventListener('click', () => {
  running = false;
  clearInterval(ticker);
  focusView.hidden = true;
  homeView.hidden = false;
  appNav.hidden = false;
  startButton.focus({preventScroll: true});
});

const biomes = {
  reef: ['Recife de Coral', 'Onde a cor aprende a voltar.', 'reef-alive.jpg', 'LUZ DA SUPERFÍCIE', '#7ec8c8', .25],
  kelp: ['Floresta de Kelp', 'Catedrais verdes que balançam com a maré.', 'kelp.jpg', 'ENTRE FLORESTAS SUBMERSAS', '#c4b06a', .15],
  mangrove: ['Manguezal', 'Raízes que respiram entre dois mundos.', 'mangrove.jpg', 'ONDE AS RAÍZES ENCONTRAM A MARÉ', '#c9a86c', .12],
  island: ['Ilha Tropical', 'Um pedaço de terra que o foco fez emergir.', 'island.jpg', 'UMA PAUSA AO SOL', '#f0e2b6', .3],
  deep: ['Mar Profundo', 'O azul que engole o resto da luz.', 'deep.jpg', 'OS ÚLTIMOS RAIOS DE LUZ', '#86a7d1', .06],
  abyss: ['Abismo', 'Quase nada. Quase tudo. Quase silêncio.', 'abyss.jpg', 'VIDA QUE BRILHA NO ESCURO', '#9b93dd', 0],
};
const biomeButtons = [...document.querySelectorAll('[data-biome]')];
let currentBiome = 'reef';
let biomeRequest = 0;
let imageTransition;
let swapTimer;

function showDiscovery(id) {
  const species = fauna?.[id]?.species[0];
  if (!species) return;
  document.querySelector('#species-name').textContent = species.name;
  document.querySelector('#species-blurb').textContent = species.blurb;
  const canvas = document.querySelector('#species-sprite');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const sprite = spriteFor(species);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  const scale = Math.min(4, Math.floor(Math.min(88 / sprite.width, 64 / sprite.height)));
  ctx.drawImage(sprite, (96 - sprite.width * scale) / 2, (72 - sprite.height * scale) / 2, sprite.width * scale, sprite.height * scale);
}

biomeButtons.forEach((button, index) => button.addEventListener('click', async () => {
  const request = ++biomeRequest;
  const id = button.dataset.biome;
  const [name, description, file, atmosphere, accent, light] = biomes[id];
  const candidate = new Image();
  candidate.src = `assets/${file}`;
  try { await candidate.decode(); }
  catch {
    if (request === biomeRequest) document.querySelector('#biome-feedback').textContent = 'Este cenário não carregou. Tente selecionar o bioma novamente.';
    return;
  }
  if (request !== biomeRequest) return;
  const image = document.querySelector('#biome-image');
  const next = document.querySelector('#biome-next');
  // Commit an interrupted transition before beginning another, so rapid choices stay consistent.
  clearTimeout(swapTimer);
  if (imageTransition) { image.src = next.src; imageTransition.cancel(); }
  next.src = candidate.src;
  if (!reducedMotion.matches) {
    imageTransition = next.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 650, fill: 'forwards' });
    swapTimer = setTimeout(() => {
      image.src = candidate.src;
      imageTransition?.cancel();
      imageTransition = null;
    }, 650);
  } else { image.src = candidate.src; imageTransition = null; }
  image.alt = `${name}: cenário do aplicativo em pixels`;
  currentBiome = id;
  biomeButtons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
  document.querySelector('#biome-title').textContent = name;
  document.querySelector('#biome-description').textContent = description;
  document.querySelector('#biome-count').textContent = `${String(index + 1).padStart(2, '0')} / 06`;
  document.querySelector('#biome-atmosphere').textContent = atmosphere;
  document.querySelector('#biome-feedback').textContent = '';
  document.querySelector('#oceano').style.setProperty('--biome-accent', accent);
  document.querySelector('#biome-scene').style.setProperty('--biome-light', light);
  world?.setBiome('biome', id);
  ambient.setDepth(index / 5);
  showDiscovery(id);
}));

// The demo clock advances only while this scene is visible. No game rewards or account data.
const card = document.querySelector('#restoration-card');
const range = document.querySelector('#restore-range');
const demoButton = document.querySelector('#demo-start');
const demoStatus = document.querySelector('#demo-status');
let demoProgress = 0;
let demoRunning = false;
let demoVisible = false;
let demoFrame = 0;
let demoLast = 0;
let demoStage = -1;

function renderDemo(value) {
  demoProgress = Math.max(0, Math.min(100, value));
  card.style.setProperty('--restoration', String(demoProgress / 100));
  const rounded = Math.round(demoProgress);
  range.value = String(rounded);
  range.setAttribute('aria-valuetext', `${rounded}% de vida`);
  document.querySelector('#demo-life').textContent = rounded;
  document.querySelector('#demo-time').textContent = `00:${String(Math.ceil((100 - demoProgress) * .15)).padStart(2, '0')}`;
  const stage = demoProgress >= 100 ? 3 : demoProgress >= 60 ? 2 : demoProgress >= 25 ? 1 : 0;
  const messages = ['Um mundo esperando por você.', 'A cor encontra o caminho de volta.', 'Pequenas descobertas. Um oceano vivo.', 'Seu tempo deixa uma marca.'];
  document.querySelector('#demo-stage').textContent = messages[stage];
  if (stage !== demoStage) { demoStatus.textContent = messages[stage]; demoStage = stage; }
  world?.setLife(demoProgress / 100);
}

function scheduleDemo() {
  cancelAnimationFrame(demoFrame);
  demoFrame = 0;
  demoLast = 0;
  if (demoRunning && demoVisible && !document.hidden) demoFrame = requestAnimationFrame(tickDemo);
}

function tickDemo(now) {
  if (!demoRunning || !demoVisible || document.hidden) return;
  const dt = demoLast ? Math.min(now - demoLast, 100) : 0;
  if (!demoLast || dt >= 50) {
    demoLast = now;
    renderDemo(demoProgress + dt / 150);
  }
  if (demoProgress >= 100) {
    demoRunning = false;
    demoButton.textContent = 'Ver novamente';
    demoStatus.textContent = 'Demonstração concluída. O recife chegou a 100% de vida.';
  } else demoFrame = requestAnimationFrame(tickDemo);
}

demoButton.addEventListener('click', () => {
  if (demoRunning) {
    demoRunning = false;
    demoButton.textContent = 'Continuar o mergulho';
    demoStatus.textContent = 'Demonstração pausada.';
  } else {
    if (demoProgress >= 100) renderDemo(0);
    demoRunning = true;
    demoButton.textContent = 'Pausar demonstração';
    demoStatus.textContent = 'Demonstração iniciada. A transformação dura 15 segundos.';
  }
  scheduleDemo();
});

range.addEventListener('input', () => {
  demoRunning = false;
  renderDemo(Number(range.value));
  demoButton.textContent = demoProgress >= 100 ? 'Ver novamente' : 'Continuar o mergulho';
  scheduleDemo();
});
document.querySelector('#demo-reset').addEventListener('click', () => {
  demoRunning = false;
  renderDemo(0);
  demoButton.textContent = 'Ver a vida voltar';
  demoStatus.textContent = 'Demonstração reiniciada.';
  scheduleDemo();
});
new IntersectionObserver(entries => {
  demoVisible = entries[0].isIntersecting;
  scheduleDemo();
}, { threshold: .15 }).observe(card);
document.addEventListener('visibilitychange', scheduleDemo);
renderDemo(0);

const motionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  entry.target.classList.toggle('motion-paused', !entry.isIntersecting);
}));
document.querySelectorAll('.hero,.restoration-card,.biome-image-wrap').forEach(element => motionObserver.observe(element));

const reveals = [...document.querySelectorAll('.ocean-heading,.quiet-section h2,.quiet-rows,.platform-section .section,.faq-section>div')];
const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.remove('is-awaiting'); revealObserver.unobserve(entry.target); }
}), { threshold: .08 });
reveals.forEach(element => {
  element.classList.add('reveal');
  if (!reducedMotion.matches && element.getBoundingClientRect().top > innerHeight) element.classList.add('is-awaiting');
  revealObserver.observe(element);
});

let scrollQueued = false;
function updateDescent() {
  scrollQueued = false;
  const height = document.documentElement.scrollHeight - innerHeight;
  const progress = height > 0 ? Math.min(1, scrollY / height) : 0;
  document.querySelector('#depth-progress').style.height = `${progress * 100}%`;
  document.querySelector('.hero').style.setProperty('--hero-shift', reducedMotion.matches ? '0px' : `${Math.min(scrollY, 360)}px`);
  const steps = [...document.querySelectorAll('.journey-step')];
  const closest = steps.reduce((best, step) => Math.abs(step.getBoundingClientRect().top - innerHeight * .45) < Math.abs(best.getBoundingClientRect().top - innerHeight * .45) ? step : best, steps[0]);
  steps.forEach(step => step.classList.toggle('is-current', step === closest));
}
addEventListener('scroll', () => {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateDescent); }
}, { passive: true });
addEventListener('resize', updateDescent);
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) reveals.forEach(element => element.classList.remove('is-awaiting'));
  updateDescent();
});
updateDescent();

const soundButton = document.querySelector('#sound-toggle');
soundButton.addEventListener('click', async () => {
  soundButton.disabled = true;
  try {
    if (ambient.enabled) await ambient.stop(); else await ambient.start();
    soundButton.setAttribute('aria-pressed', String(ambient.enabled));
    document.querySelector('#sound-label').textContent = ambient.enabled ? 'Silenciar oceano' : 'Ativar som do oceano';
    document.querySelector('#sound-status').textContent = ambient.enabled ? 'Som do oceano ativado.' : 'Som do oceano desligado.';
  } catch {
    document.querySelector('#sound-status').textContent = 'Não foi possível ativar o som neste navegador. Você pode continuar explorando.';
    document.querySelector('#sound-label').textContent = 'Tentar ativar som';
  } finally { soundButton.disabled = false; }
});

fetch('assets/fauna.json').then(response => {
  if (!response.ok) throw new Error('Fauna unavailable');
  return response.json();
}).then(data => {
  fauna = data;
  world = new OceanWorld(fauna);
  world.setBiome('biome', currentBiome);
  world.setLife(demoProgress / 100);
  showDiscovery(currentBiome);
}).catch(() => {
  document.querySelector('#biome-feedback').textContent = 'As paisagens continuam disponíveis. A fauna animada não carregou desta vez.';
});
