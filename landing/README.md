# Landing do Mergulhe

Página de apresentação separada do aplicativo React/Vite. Usa a logo fornecida, Outfit local, os cenários reais e sprites/descrições exportados do jogo. A tela inicial, a tela de foco e a restauração de 15 segundos são demonstrações com dados ilustrativos; não acessam o save ou a conta do aplicativo.

A abertura combina água, luz, partículas e fauna em movimento. A rolagem acompanha a descida, destaca os passos e revela o conteúdo. A demonstração permite iniciar, pausar, continuar, reiniciar e ajustar a vida manualmente. Os seis biomas trocam cenário, luz, fauna e descoberta, com transição e reação ao ponteiro/toque. O áudio ambiente é sintetizado localmente e começa somente após a escolha do visitante.

`ocean.js` renderiza os sprites originais em resolução limitada, com um único ciclo de até 30 quadros/s para as cenas visíveis. Há menos criaturas e partículas em telas pequenas. Cenas e demonstração pausam fora da tela e com a aba oculta. A preferência por movimento reduzido mantém cenas estáticas e remove transições decorativas; os controles continuam funcionando.

Para sincronizar a fauna após mudanças no jogo, execute `node --import tsx scripts/export-landing-fauna.ts` na raiz do aplicativo. O resultado versionado é `landing/assets/fauna.json`; a landing e a publicação continuam sem dependências do aplicativo.

Prévia local: `node landing/serve.mjs` (porta 4317).

Build: `node landing/build.mjs`. A pasta `landing/dist` é a saída pública; não publicar `.env`, fontes do aplicativo ou arquivos do usuário. A identidade Sites está em `.openai/hosting.json` e o domínio pretendido é `mergulhe.cloud`.

Os links de lojas não existem nesta versão: Chrome está em preparação, Android/iPhone em breve. Não adicionar links inventados. As páginas de privacidade e informações desta landing descrevem apenas a apresentação; não substituem as políticas do aplicativo.

Verificação: sintaxe e build estático, referências/âncoras locais, fauna fiel aos dados do aplicativo, navegação e trocas rápidas entre biomas, demonstração/pausa/reinício/controle manual, som ligado/desligado, timer/pausa/retorno, cenas visíveis e layout desktop/celular. As verificações de navegador não substituem uma medição em aparelhos físicos.
