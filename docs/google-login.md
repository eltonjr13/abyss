# Contas TIDE: Google e perfil básico

O app continua utilizável sem conta. Entrar com Google cria um usuário no Supabase Auth e uma linha em `public.profiles` com `id`, nome de exibição e data de criação. O e-mail permanece no Auth; o progresso do oceano continua no dispositivo e **não é sincronizado pelo login**.

## Ativar em um projeto Supabase exclusivo do TIDE

1. Crie o projeto na organização escolhida para o TIDE. Não use um banco de outro produto.
2. Aplique `supabase/migrations/20260928230052_tide_user_profiles.sql` pelo fluxo de migrações do Supabase. A tabela tem RLS: cada conta autenticada só pode ler e criar a própria linha.
3. No Google Cloud Console, configure a tela de consentimento OAuth e crie um **OAuth Client ID do tipo Web application**. Em *Authorized redirect URIs*, informe exatamente `https://<project-ref>.supabase.co/auth/v1/callback` (o callback exibido pelo Supabase). Enquanto a tela de consentimento estiver em modo de teste, adicione as contas de teste no Google Cloud.
4. Em Supabase → Authentication → Providers → Google, habilite Google e informe Client ID e Client Secret. Desabilite os provedores de login por e-mail, telefone e outros que não serão oferecidos nesta fase. O **Client Secret fica apenas no painel do Supabase**.
5. Em Supabase → Authentication → URL Configuration, configure a URL principal do site e inclua em Redirect URLs cada origem web usada, por exemplo `http://localhost:5173/**`, a URL de produção e `com.tide.oceanfocus://auth/callback` para os builds nativos.
6. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com a URL e a chave **publishable** do projeto. Essas variáveis são incluídas no bundle público; nunca coloque `service_role`, `secret key` ou o segredo OAuth no Vite.
7. Inicie com `npm run dev`, entre na tela **Perfil** e use **Entrar com Google**. Confirme a sessão e a linha de perfil no projeto TIDE. Saia e entre novamente: o mesmo `id` deve continuar sendo usado. Teste com duas contas diferentes para confirmar que cada uma só vê seu próprio perfil.

## Retorno ao app instalado com Capacitor

O código já abre a autenticação no navegador do sistema e recebe o retorno `com.tide.oceanfocus://auth/callback` pela API `appUrlOpen` do Capacitor. Ao gerar os projetos `android/` e `ios/`, registre esse endereço nos projetos nativos antes de testar os builds:

- Android: em `android/app/src/main/AndroidManifest.xml`, dentro de `MainActivity`, adicione um `intent-filter` com `action` `android.intent.action.VIEW`, categorias `DEFAULT` e `BROWSABLE`, e `<data android:scheme="com.tide.oceanfocus" android:host="auth" android:path="/callback" />`.
- iOS: em `ios/App/App/Info.plist`, adicione `CFBundleURLTypes` com `CFBundleURLSchemes` contendo `com.tide.oceanfocus`.
- Depois de sincronizar os plugins (`npx cap sync`), valide em aparelhos Android e iOS o retorno do Google, a persistência da sessão após fechar o app e a saída da conta.

Ainda faltam o projeto Supabase TIDE, as credenciais Google, as URLs finais e os projetos nativos para validar o login completo. Para publicar no iOS, também é necessário planejar uma opção de login equivalente que atenda à [diretriz 4.8 da Apple](https://developer.apple.com/app-store/review/guidelines/), além do fluxo de exclusão de conta.
