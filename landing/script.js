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
  reef: ['Recife de Coral', 'Onde a cor aprende a voltar.', 'reef-alive.jpg'],
  kelp: ['Floresta de Kelp', 'Catedrais verdes que balançam com a maré.', 'kelp.jpg'],
  mangrove: ['Manguezal', 'Raízes que respiram entre dois mundos.', 'mangrove.jpg'],
  island: ['Ilha Tropical', 'Um pedaço de terra que o foco fez emergir.', 'island.jpg'],
  deep: ['Mar Profundo', 'O azul que engole o resto da luz.', 'deep.jpg'],
  abyss: ['Abismo', 'Quase nada. Quase tudo. Quase silêncio.', 'abyss.jpg'],
};
const biomeButtons = [...document.querySelectorAll('[data-biome]')];
biomeButtons.forEach((button, index) => button.addEventListener('click', () => {
  const [name, description, file] = biomes[button.dataset.biome];
  biomeButtons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
  document.querySelector('#biome-title').textContent = name;
  document.querySelector('#biome-description').textContent = description;
  document.querySelector('#biome-count').textContent = `${String(index + 1).padStart(2, '0')} / 06`;
  const image = document.querySelector('#biome-image');
  image.src = `assets/${file}`;
  image.alt = `${name}: cenário do aplicativo em pixels`;
}));
