# Luz e movimento na água

O cenário e a fauna recebem uma iluminação comum. A distância altera a cor e o
contraste dos sprites, e uma corrente lenta conduz partículas, bolhas, detritos
e a inclinação da vegetação. Nenhuma fauna foi acrescentada aos fundos.

## Aparência

- Recife e ilha têm mais luz; kelp e mangue filtram a iluminação.
- O mar profundo recebe apenas um resíduo de luz, sem reflexos no fundo.
- No abismo e à noite, a camada de raios solares fica desligada.
- Amanhecer e entardecer mudam a temperatura da luz.
- Raios têm bordas suaves, oscilação lenta e atenuação com a profundidade.
- Reflexos suaves se deslocam sobre o fundo dos habitats rasos.
- A água atenua cores e contraste em três faixas de distância; os acentos
  luminosos de águas-vivas e criaturas abissais são preservados.
- A intensidade menor usada no foco também reduz a contribuição da luz.

## Transições

Na mudança de habitat ou horário, o motor guarda uma única cópia da cena
visível. Ela continua na tela enquanto as imagens necessárias carregam. Depois
ocorre uma mistura com início e fim suaves, durante 1,4 segundos.

Uma nova seleção durante a transição parte do quadro já misturado. Mudanças
rápidas durante o carregamento continuam atendendo à última seleção. Falhas de
imagem liberam a transição para o fundo de segurança, sem bloquear a tela.
A cópia temporária é liberada ao concluir a transição ou parar o motor.

## Desempenho e movimento reduzido

O fundo mantém a composição em 1920 × 1080. Sprites continuam no buffer de
480 × 270; luz usa um segundo buffer reutilizado, ampliado com suavização.
Não há filtros ou processamento de pixels por peixe a cada quadro: a paleta
submersa é preparada ao reconstruir a população e reutiliza o cache de sprites.

O modo economia limita a 30 FPS, reduz bolhas e partículas, usa três raios e
três reflexos em vez de cinco e seis. A alteração se aplica no próximo quadro,
preservando a posição dos peixes. O modo normal mantém o alvo de 60 FPS.

Com `prefers-reduced-motion`, a luz e a vegetação ficam em poses fixas,
o deslocamento existente da fauna e das partículas fica mais lento, e a mistura
entre cenas termina em 0,24 segundo. Não há paralaxe ou movimento da câmera.

## Conferência

Abra `/cenarios.html` no servidor de desenvolvimento. Os controles permitem
alternar habitats, horários e fauna. O painel de diagnóstico também está
disponível nessa prévia para conferir os alvos de FPS e a redução de entidades.

Foram conferidos no navegador: dia/noite, abismo sem raios, trocas rápidas dos
seis habitats, economia de energia e tela de 390 × 844 sem overflow. O painel
mostrou 60 FPS no modo normal e 30 FPS após estabilizar a economia; esses valores
são observações locais, não uma medição sustentada em Android físico.

Os testes verificam a ausência de luz solar à noite/no abismo, a continuidade
da corrente, paletas válidas para todas as espécies, preservação dos acentos
luminosos e duração/limites das transições. TypeScript e build de produção
também fazem parte da validação.
