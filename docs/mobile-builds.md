# Mergulhe no Android: primeira versão de teste

Este projeto já contém a plataforma `android/` do Capacitor. O identificador do app é `cloud.mergulhe.app`. O APK `debug` serve para instalar e testar em um celular Android; esta etapa não publica o app em nenhuma loja.

## Preparar o computador

- Instale Node.js e execute `npm ci` na raiz do repositório.
- Instale JDK 21 e Android SDK com Android Platform 36, Build Tools 36 e Platform Tools. Defina `JAVA_HOME` e `ANDROID_HOME` para esses diretórios.
- Crie `.env.local` a partir de `.env.example` com a URL e a chave **publishable** do projeto Supabase do Mergulhe. Defina `VITE_GOOGLE_AUTH_ENABLED=true` para incluir o login Google. As variáveis `VITE_*` entram no APK e não devem conter segredos.
- Para o login no celular, permita `cloud.mergulhe.app://auth/callback` em Supabase → Authentication → URL Configuration → Redirect URLs. Enquanto o consentimento Google estiver em modo de teste, use uma conta cadastrada como usuário de teste no Google Cloud.

## Gerar o APK no Windows

Na raiz do projeto:

```powershell
$env:ANDROID_USER_HOME = Join-Path (Get-Location) '.android-user'
npm run typecheck
npm run build
npx cap sync android
.\android\gradlew.bat -p android assembleDebug
New-Item -ItemType Directory -Force builds | Out-Null
Copy-Item android/app/build/outputs/apk/debug/app-debug.apk builds/Mergulhe-v1-android-teste.apk -Force
```

O Gradle gera `android/app/build/outputs/apk/debug/app-debug.apk`; a última linha copia o resultado para `builds/Mergulhe-v1-android-teste.apk`. O build web precisa ocorrer **antes** de `cap sync`, pois o Capacitor copia `dist/` para o projeto Android. Repita `build`, `sync` e `assembleDebug` após cada alteração do app.

## Instalar e validar no celular

Copie o APK para o Android e abra o arquivo no aparelho, autorizando a instalação dessa origem quando solicitado. Com depuração USB ativada, também é possível instalar por `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.

Valide a abertura, o cronômetro de foco, pausa e retomada ao minimizar, persistência do progresso após fechar e abrir, e a entrada e saída com Google. O login deve voltar do navegador para o Mergulhe; confira que a conta aparece na tela Perfil. O progresso permanece local ao dispositivo e não é sincronizado pelo login.

O APK de depuração é assinado automaticamente com uma chave local de desenvolvimento em `.android-user/debug.keystore` (ignorada pelo Git). Guarde essa chave para atualizar o app instalado sem reinstalar; uma chave diferente pode exigir desinstalar o app e perder dados locais. Preserve uma chave de lançamento separada quando houver uma versão de distribuição. Um build de iOS, assinatura de produção e envio às lojas são etapas futuras.

Em 29/09/2026, o build `assembleDebug` foi concluído e a assinatura foi verificada. O aparelho não estava conectado por USB, então abertura, desempenho e login Google ainda dependem de teste físico.
