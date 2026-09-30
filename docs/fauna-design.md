# Fauna: arte e movimento

As 58 espécies usam a mesma arte no oceano, no códice e nos cartões de descoberta.
Os desenhos têm uma grade de 48 × 32 pixels, sete cores da paleta de cada espécie
e oito poses por ciclo. Contornos, luz, escamas, casco e marcas distinguem as formas.
Algumas espécies que compartilham uma forma recebem detalhes próprios, como o
peixe-cirurgião, o isópode, o peixe-pelicano e a estrela-girassol.

Caudas e nadadeiras se articulam; raias batem as asas; águas-vivas contraem a
campânula; braços e tentáculos ondulam com fases diferentes. Os perfis de movimento
separam nado, propulsão, planar, caminhar, superfície e fundo. Corais, estrelas,
ouriços, ostras e peixe-trípode ficam no fundo. A arte continua em pixel art.

## Prévia local

Com o servidor de desenvolvimento iniciado (`npm run dev`), abra `/fauna.html`.
A página mostra as 58 espécies com nomes e um oceano com seletor de seis habitats,
sem carregar contas ou progresso do jogador. É uma página de estudo local;
o build normal continua usando `index.html`.

## Custo e acessibilidade

As poses são rasterizadas no primeiro uso e guardadas em um cache limitado a 1.024
sprites. Retratos e oceano compartilham desenhos na resolução nativa. Os retratos
usam um único relógio de 10 Hz, e param fora da tela ou quando a página está oculta.
Espécies desconhecidas mantêm uma silhueta estática. A preferência do sistema por
movimento reduzido congela a articulação e a inclinação; o oceano conserva seu
deslocamento lento. Alterações dessa preferência são acompanhadas em tempo real.

## Validação

- TypeScript, build de produção e 21 testes aprovados.
- Os testes percorrem todas as espécies e poses, verificam as paletas, a repetição
  dos ciclos, a articulação e os perfis de fundo/movimento reduzido.
- Catálogo conferido no navegador: 58 retratos e seis habitats.
- Jogo e catálogo conferidos em desktop e largura de 390 pixels, sem overflow
  horizontal; silhuetas conferidas no códice.
- Desempenho e apresentação em aparelhos Android físicos não foram medidos nesta
  alteração.
