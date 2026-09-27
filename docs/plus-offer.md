# P1 — O que o TIDE vende

## Decisão

**TIDE Plus será uma compra única, não consumível e permanente para os três extras abaixo.** Não haverá assinatura. O preço ainda não está definido: a tela de compra deverá ler o valor e a moeda da loja, sem preço fixo no código. A compra só poderá ser oferecida depois que os três extras e a verificação de compra estiverem prontos. Hoje a tela no Perfil é uma prévia sem checkout.

Permanente significa que a mesma conta da loja poderá restaurar o produto depois de reinstalar o aplicativo ou trocar de aparelho **na mesma loja**. Compra na App Store não libera automaticamente a versão da Google Play, nem vice-versa; acesso entre lojas ou na web exigiria identidade e validação próprias, ainda não planejadas para o primeiro lançamento.

## Matriz de acesso

| Recurso | Grátis | Plus | Futuro, fora da oferta atual |
| --- | --- | --- | --- |
| Foco | Sessões com duração predefinida, personalizada ou sem timer; pausa, conclusão e progresso | Nenhum bloqueio ou vantagem de progressão | — |
| Oceano | Todos os 6 biomas, restauração e exploração | Nenhum bioma exclusivo | — |
| Descobertas | Todas as espécies e cartões atuais do códice, com as mesmas regras de descoberta | Nenhuma espécie exclusiva nem aumento de chance | — |
| Áudio | Paisagem procedural atual e controles de música, ambiente e efeitos | `soundscapes_extended`: chuva suave e marulho de praia, cada um com controle de volume próprio | Batimentos binaurais e novas atmosferas, sujeitos a decisão e implementação posteriores |
| Contemplação | Exploração normal do oceano | `sanctuary_mode`: visualização do bioma atual em tela cheia, sem cronômetro, navegação ou indicadores; saída sempre acessível | Temas visuais adicionais |
| Histórico | Totais, sequência, sessões e gráfico semanal atuais | `deep_metrics`: mapa de dias com tempo de foco dos últimos 365 dias, incluindo dias sem sessão | Análises por horário, que exigiriam dados de cada sessão |
| Códice ampliado | Cartões atuais de todas as espécies descobertas | — | Caderno do Naturalista com imagens exportáveis, após existir acervo apropriado |
| Dados | Backup e importação do progresso, sem cobrança | A compra é restaurada pela loja, separada do backup | Sincronização de compras entre lojas, se houver conta e serviço de validação |

## Contrato verificável dos três benefícios pagos

| ID no código | Superfície e desbloqueio após compra validada | Condição de aceite |
| --- | --- | --- |
| `soundscapes_extended` | No painel de áudio, liberar dois canais extras: **chuva suave** e **marulho de praia**, cada um com volume de 0 a 100%. Disponíveis nos 6 biomas; os canais atuais continuam grátis. | Com Plus validado, ambos podem ser ligados e ajustados de forma independente; sem Plus, não tocam. Pausar o app pausa os canais. |
| `sanctuary_mode` | Na Exploração, liberar **Entrar no Santuário** para mostrar somente o bioma atual em tela cheia. Um controle **Sair do Santuário** deve permanecer acessível por toque, teclado e leitor de tela. Não inicia nem conclui sessão. | Com Plus validado, entrar e sair preserva bioma e progresso; sem Plus, a Exploração continua disponível e o modo não abre. |
| `deep_metrics` | No Perfil, liberar mapa diário de **365 dias corridos**, com minutos focados por data local e zero nos dias sem sessão. Os totais e o gráfico semanal existentes continuam grátis. | Com Plus validado, o mapa mostra até 365 datas com dados salvos; sem Plus, o mapa não é exibido. A implementação precisa persistir 365 dias, pois o salvamento atual conserva apenas 60. Não prometer recuperar dias antigos já descartados. |

Um único direito de acesso, **`tide_plus_lifetime`** (identificador de produto a configurar nas lojas), libera exatamente os três IDs acima. Não há benefícios por bioma, compra separada por recurso nem consumíveis. `tide_atmospheres` e `naturalist_cards`, já mencionados em tipos do projeto, ficam fora do direito de acesso contratado nesta versão; só devem entrar numa oferta após especificação, implementação e revisão da comunicação.

## Compra, restauração e dados locais

1. A loja nativa apresenta o produto não consumível e seu preço localizado. Cancelamento ou falha não alteram o acesso.
2. Após confirmação, validar o direito de acesso com a loja ou serviço de validação confiável; só então habilitar os três IDs. Uma flag local, ID inventado no cliente, código de backup ou importação de progresso não servem como prova de compra.
3. Na abertura do app e em **Restaurar compra**, consultar a loja da plataforma atual. Produto ativo reabilita os mesmos três IDs sem cobrar novamente; ausência de compra mantém Grátis. Reembolso ou revogação removem somente os extras Plus, preservando foco, biomas, descobertas e progresso.
4. Reiniciar o oceano não apaga uma compra validada. Reinstalação depende de nova consulta à loja. Sem conexão, uma validação previamente confiável pode manter acesso local em cache; a primeira liberação e a restauração em aparelho novo requerem confirmação da loja.
5. O estado `plus` atualmente salvo no progresso e propagado por backup/importação é legado e não constitui recibo. Na integração de pagamentos, migrar o direito de acesso para armazenamento separado do progresso e impedir que `mergeGameStates`, `hydrate` ou `unlockPlus` concedam Plus por dados autocriados. Não descartar o progresso existente nessa migração.

## Tela de oferta

Entrada: cartão **TIDE Plus · Compra única** no Perfil. A tela apresenta, nesta ordem: título, compromisso de que foco/6 biomas/descobertas são grátis, os três extras com resultados concretos, **Compra única · acesso permanente**, preço retornado pela loja, botão de compra, **Restaurar compra** e **Continuar gratuitamente**. O fechamento deve ser possível sem perda de progresso. Após validação, o estado comprado deve listar os mesmos três extras e permitir restauração; não mostrar um segundo botão de compra.

No P1, a tela é uma prévia: mostra **Compra disponível em breve**, sem preço numérico e sem simular compra/restauração. Quando o checkout estiver integrado, habilitar os botões somente com produto configurado, preço carregado e validação funcional. Não anunciar recursos futuros como se estivessem incluídos na compra atual.

## Critérios de saída para habilitar vendas

- Os três benefícios passam nos critérios da tabela em um aparelho Grátis e em um aparelho com compra validada.
- Compra, cancelamento, restauração, reinstalação, reembolso e reinício do oceano passam por testes na App Store e Google Play, conforme as plataformas publicadas.
- Backup importado ou a flag `plus` legada não desbloqueiam extras; progresso gratuito permanece intacto.
- O preço exibido corresponde ao retorno da loja; cada plataforma usa o próprio produto não consumível e sua própria restauração.
