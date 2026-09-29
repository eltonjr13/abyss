# Landing do Mergulhe

Página de apresentação separada do aplicativo React/Vite. Usa a logo fornecida, Outfit local e os cenários reais do projeto. A tela inicial e a tela de foco são protótipos interativos com dados ilustrativos; não acessam o save ou a conta do aplicativo.

Prévia local: `node landing/serve.mjs` (porta 4317).

Build: `node landing/build.mjs`. A pasta `landing/dist` é a saída pública; não publicar `.env`, fontes do aplicativo ou arquivos do usuário. A identidade Sites está em `.openai/hosting.json` e o domínio pretendido é `mergulhe.cloud`.

Os links de lojas não existem nesta versão: Chrome está em preparação, Android/iPhone em breve. Não adicionar links inventados. As páginas de privacidade e informações desta landing descrevem apenas a apresentação; não substituem as políticas do aplicativo.

Verificação: sintaxe dos scripts, respostas HTTP para páginas e assets, links e âncoras locais, navegação entre biomas, timer/pausa/retorno e layout desktop/celular.
