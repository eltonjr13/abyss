# Contas Mergulhe: Google e perfil básico

O app continua utilizável sem conta. Entrar com Google cria um usuário no Supabase Auth e uma linha em `public.profiles` com `id`, nome de exibição e data de criação. O e-mail permanece no Auth; o progresso do oceano continua no dispositivo e **não é sincronizado pelo login**.

## Estado atual

- Projeto Supabase dedicado: **abyss**, organização **eltonjr13's Org**, referência `ukzixtqsdybeqrwsybqt`.
- A migração `20260928230052_tide_user_profiles.sql` foi aplicada pelo SQL Editor. Verificação no banco: RLS ativo, duas políticas, `anon` sem leitura, `authenticated` com leitura e inserção, sem atualização.
- Na última verificação do painel, Site URL `http://localhost:5173`; redirects `http://localhost:5173/**`, `http://127.0.0.1:5173/**` e o antigo `com.tide.oceanfocus://auth/callback` cadastrados. O novo retorno nativo `cloud.mergulhe.app://auth/callback` ainda precisa ser cadastrado antes dos builds.
- Na última verificação, o Google Cloud usava o projeto **TIDE Ocean Focus** (`tide-ocean-focus`) e o cliente OAuth web **TIDE via Supabase**, com callback `https://ukzixtqsdybeqrwsybqt.supabase.co/auth/v1/callback`. Esses nomes externos ainda precisam ser atualizados para **Mergulhe** no Google Auth Platform. A tela de consentimento estava em modo **Testando**, com a conta do proprietário como usuária de teste.
- No Supabase, Google está habilitado com o Client ID e o Client Secret desse cliente OAuth. Email e Phone estão desabilitados. O Client Secret foi cadastrado apenas no painel do Supabase e não está no repositório.
- `.env.local` contém a URL e a chave publishable do projeto, está ignorado pelo Git e usa `VITE_GOOGLE_AUTH_ENABLED=true` no ambiente local.
- Em 28/09/2026, o login web em `http://127.0.0.1:5173/` retornou ao app com a conta Google. O usuário apareceu em Supabase Auth e o registro correspondente foi confirmado em `public.profiles`.
- Como a migração foi executada no SQL Editor, ela não consta automaticamente no histórico do CLI. Antes do primeiro `supabase db push`, vincule o projeto e reconcilie esse histórico com `supabase migration repair --linked --status applied 20260928230052`.

## Reproduzir a configuração em outro ambiente

1. Use o projeto Supabase exclusivo do Mergulhe. Não use um banco de outro produto.
2. Aplique `supabase/migrations/20260928230052_tide_user_profiles.sql` pelo fluxo de migrações do Supabase. A tabela tem RLS: cada conta autenticada só pode ler e criar a própria linha.
3. No Google Cloud Console, configure a tela de consentimento OAuth e crie um **OAuth Client ID do tipo Web application**. Em *Authorized redirect URIs*, informe exatamente `https://<project-ref>.supabase.co/auth/v1/callback` (o callback exibido pelo Supabase). Enquanto a tela de consentimento estiver em modo de teste, adicione as contas de teste no Google Cloud.
4. Em Supabase → Authentication → Providers → Google, habilite Google e informe Client ID e Client Secret. Desabilite os provedores de login por e-mail, telefone e outros que não serão oferecidos nesta fase. O **Client Secret fica apenas no painel do Supabase**.
5. Em Supabase → Authentication → URL Configuration, configure a URL principal de produção e inclua em Redirect URLs cada origem web usada, por exemplo `http://localhost:5173/**` e `cloud.mergulhe.app://auth/callback` para os builds nativos. Como `mergulhe.cloud` será uma landing page e não abrirá o app nesta fase, não use o domínio como redirect de login sem uma rota funcional de retorno.
6. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com a URL e a chave **publishable** do projeto. Essas variáveis são incluídas no bundle público; nunca coloque `service_role`, `secret key` ou o segredo OAuth no Vite. Defina `VITE_GOOGLE_AUTH_ENABLED=true` somente depois de ativar o Google no Supabase.
7. Inicie com `npm run dev`, entre na tela **Perfil** e use **Entrar com Google**. Confirme a sessão e a linha de perfil no projeto Mergulhe. Saia e entre novamente: o mesmo `id` deve continuar sendo usado. Teste com duas contas diferentes para confirmar que cada uma só vê seu próprio perfil.

## Retorno ao app instalado com Capacitor

O código já abre a autenticação no navegador do sistema e espera o retorno `cloud.mergulhe.app://auth/callback` pela API `appUrlOpen` do Capacitor. O projeto `android/` já foi gerado e registra esse retorno no manifesto. Ao gerar o projeto `ios/`, registre o mesmo endereço antes de testar o build:

- Android: `android/app/src/main/AndroidManifest.xml` já contém o `intent-filter` com `action` `android.intent.action.VIEW`, categorias `DEFAULT` e `BROWSABLE`, e `<data android:scheme="cloud.mergulhe.app" android:host="auth" android:path="/callback" />`.
- iOS: em `ios/App/App/Info.plist`, adicione `CFBundleURLTypes` com `CFBundleURLSchemes` contendo `cloud.mergulhe.app`.
- Depois de sincronizar os plugins (`npx cap sync`), valide em aparelhos Android e iOS o retorno do Google, a persistência da sessão após fechar o app e a saída da conta.

Para abrir o login a outras pessoas, é preciso concluir o branding do OAuth com `https://mergulhe.cloud`, páginas públicas de privacidade e termos, verificar o domínio e publicar a tela de consentimento no Google Cloud. O callback do cliente Google continua sendo o URL do Supabase; a landing page não substitui esse callback. O redirect Android ainda precisa ser cadastrado no Supabase e testado em aparelho; o projeto iOS ainda precisa ser gerado. Para publicar no iOS, também é necessário planejar uma opção de login equivalente que atenda à [diretriz 4.8 da Apple](https://developer.apple.com/app-store/review/guidelines/), além do fluxo de exclusão de conta.

O build `npm run build:extension` desativa o login Google apenas dentro da extensão: ainda não há um redirect OAuth da extensão publicado e testado. O app completo empacotado nela continua utilizável sem conta, e o progresso fica no armazenamento local da extensão.
