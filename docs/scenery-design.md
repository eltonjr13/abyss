# Cenários sem fauna pintada

Os dez fundos ativos foram redefinidos: recife restaurado, degradado e noturno;
kelp, manguezal, ilha, mar profundo, abismo, superfície e mapa. A composição
mantém espaço central para a interface e para as criaturas animadas. As imagens
foram inspecionadas visualmente, incluindo os animais pequenos e as silhuetas
que apareciam nas versões anteriores. Água, areia, rochas, vegetação e estruturas
do recife compõem a paisagem.

## Arquivos e geração

- Arte criada com o ImageGen integrado, sem CLI de geração.
- Dez arquivos ativos em `src/assets/images/scenery/*.webp`, preparados em
  1920 × 1080, qualidade WebP 90, total de aproximadamente 4,35 MiB.
- A geração retornou originais de 1672 × 940/941. Os arquivos foram padronizados
  em 16:9 para o app; essa preparação não adiciona detalhes à arte original.
- Os prompts completos, dimensões de origem/entrega, tamanhos e hashes estão
  em `docs/scenery-prompts.json`.
- As versões degradada e noturna derivam da mesma nova imagem de recife, mantendo
  a composição para a mistura entre estados. O mapa preserva a disposição das
  seis regiões usada pelos pontos de navegação.
- Os arquivos antigos permanecem disponíveis para comparação. Os imports ativos
  passam a apontar apenas para os novos fundos.

## Renderização

Antes, o fundo entrava no buffer de 480 × 270, perdendo detalhes antes de ser
ampliado. Agora a composição do cenário usa um canvas de 1920 × 1080, desenhado
diretamente na saída com suavização de alta qualidade. A camada transparente
das criaturas e efeitos mantém a resolução lógica de 480 × 270, as coordenadas
e os pixels definidos dos sprites. O mesmo recorte é aplicado às duas camadas.
O estado de restauração e a iluminação continuam afetando o ambiente.

Foi corrigida também a troca de habitat enquanto a imagem anterior ainda está
carregando: ao terminar, o carregador verifica se o habitat atual precisa de
outros arquivos. Erros de imagem continuam usando a cor de fundo do habitat.

## Prévia e validação

Com `npm run dev`, abra `/cenarios.html`. A prévia mostra as dez imagens e permite
trocar o habitat, a restauração e o horário. A opção de fauna vem desligada para
conferir o cenário; quando ligada, usa as mesmas criaturas do jogo. Essa página
de estudo não carrega contas nem modifica o progresso.

- TypeScript, build de produção e 23 testes aprovados.
- Os testes verificam os dez WebP, dimensões, integridade e imports ativos.
  A ausência de animais foi conferida visualmente; não é uma detecção automática.
- Prévia conferida nos seis habitats, recife degradado/noturno e fauna opcional.
- Mapa e prévia conferidos em largura de 390 pixels, sem overflow horizontal;
  os pontos de navegação e o bloqueio de regiões continuam funcionando.
- O build atual continua sendo um HTML único, de cerca de 7,16 MB (5,10 MB gzip),
  pois inclui as imagens. A maior definição aumenta o peso em relação aos fundos
  antigos; a decodificação no oceano permanece por habitat.
- Aparelhos Android físicos não foram medidos nesta alteração.
