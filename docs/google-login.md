# Contas TIDE: Google e perfil básico

O app continua utilizável sem conta. Entrar com Google cria um usuário no Supabase Auth e uma linha em `public.profiles` com `id`, nome de exibição e data de criação. O e-mail permanece no Auth; o progresso do oceano continua no dispositivo e **não é sincronizado pelo login**.

## Estado atual

- Projeto Supabase dedicado: **abyss**, organização **eltonjr13's Org**, referência `ukzixtqsdybeqrwsybqt`.
- A migração `20260928230052_tide_user_profiles.sql` foi aplicada pelo SQL Editor. Verificação no banco: RLS ativo, duas políticas, `anon` sem leitura, `authenticated` com leitura e inserção, sem atualização.
- Site URL `http://localhost:5173`; redirects `http://localhost:5173/**`, `http://127.0.0.1:5173/**` e `com.tide.oceanfocus://auth/callback` cadastrados.
- `.env.local` contém apenas a URL e a chave publishable do projeto, está ignorado pelo Git e mantém `VITE_GOOGLE_AUTH_ENABLED=false` até o Google estar configurado. O provedor Email foi desativado no Supabase; Google ainda está desativado.
- Como a migração foi executada no SQL Editor, ela não consta automaticamente no histórico do CLI. Antes do primeiro `supabase db push`, vincule o projeto e reconcilie esse histórico com `supabase migration repair --linked --status applied 20260928230052`.

## Ativar em um projeto Supabase exclusivo do TIDE

1. Crie o projeto na organização escolhida para o TIDE. Não use um banco de outro produto.
2. Aplique `supabase/migrations/20260928230052_tide_user_profiles.sql` pelo fluxo de migrações do Supabase. A tabela tem RLS: cada conta autenticada só pode ler e criar a própria linha.
3. No Google Cloud Console, configure a tela de consentimento OAuth e crie um **OAuth Client ID do tipo Web application**. Em *Authorized redirect URIs*, informe exatamente `https://<project-ref>.supabase.co/auth/v1/callback` (o callback exibido pelo Supabase). Enquanto a tela de consentimento estiver em modo de teste, adicione as contas de teste no Google Cloud.
4. Em Supabase → Authentication → Providers → Google, habilite Google e informe Client ID e Client Secret. Desabilite os provedores de login por e-mail, telefone e outros que não serão oferecidos nesta fase. O **Client Secret fica apenas no painel do Supabase**.
5. Em Supabase → Authentication → URL Configuration, configure a URL principal do site e inclua em Redirect URLs cada origem web usada, por exemplo `http://localhost:5173/**`, a URL de produção e `com.tide.oceanfocus://auth/callback` para os builds nativos.
6. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com a URL e a chave **publishable** do projeto. Essas variáveis são incluídas no bundle público; nunca coloque `service_role`, `secret key` ou o segredo OAuth no Vite. Defina `VITE_GOOGLE_AUTH_ENABLED=true` somente depois de ativar o Google no Supabase.
7. Inicie com `npm run dev`, entre na tela **Perfil** e use **Entrar com Google**. Confirme a sessão e a linha de perfil no projeto TIDE. Saia e entre novamente: o mesmo `id` deve continuar sendo usado. Teste com duas contas diferentes para confirmar que cada uma só vê seu próprio perfil.

## Retorno ao app instalado com Capacitor

O código já abre a autenticação no navegador do sistema e recebe o retorno `com.tide.oceanfocus://auth/callback` pela API `appUrlOpen` do Capacitor. Ao gerar os projetos `android/` e `ios/`, registre esse endereço nos projetos nativos antes de testar os builds:

- Android: em `android/app/src/main/AndroidManifest.xml`, dentro de `MainActivity`, adicione um `intent-filter` com `action` `android.intent.action.VIEW`, categorias `DEFAULT` e `BROWSABLE`, e `<data android:scheme="com.tide.oceanfocus" android:host="auth" android:path="/callback" />`.
- iOS: em `ios/App/App/Info.plist`, adicione `CFBundleURLTypes` com `CFBundleURLSchemes` contendo `com.tide.oceanfocus`.
- Depois de sincronizar os plugins (`npx cap sync`), valide em aparelhos Android e iOS o retorno do Google, a persistência da sessão após fechar o app e a saída da conta.

Ainda faltam as credenciais OAuth do Google, a URL web de produção e os projetos nativos para validar o login completo. Para publicar no iOS, também é necessário planejar uma opção de login equivalente que atenda à [diretriz 4.8 da Apple](https://developer.apple.com/app-store/review/guidelines/), além do fluxo de exclusão de conta.
