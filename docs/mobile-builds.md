# Mergulhe — Guia de Builds para iOS e Android

Este guia detalha os passos para compilar o **Mergulhe** como aplicativo nativo para **Android** (Google Play Store) e **iOS** (Apple App Store) utilizando o Capacitor. O identificador planejado é `cloud.mergulhe.app`; antes de gerar os projetos nativos, cadastre o retorno `cloud.mergulhe.app://auth/callback` no Supabase e configure os links nativos descritos em `docs/google-login.md`.

---

## 📱 1. Pré-requisitos

1. **Node.js** (v18+) e **npm**.
2. Para **Android**:
   - [Android Studio](https://developer.android.com/studio) com o Android SDK mais recente.
   - Java Development Kit (JDK 17 ou 21).
3. Para **iOS**:
   - Computador Mac com macOS mais recente.
   - [Xcode](https://developer.apple.com/xcode/) instalado via Mac App Store.
   - CocoaPods (`sudo gem install cocoapods`).

---

## 🚀 2. Instalação do Capacitor

No diretório raiz do projeto, instale os pacotes do Capacitor:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
```

---

## 🤖 3. Build para Android (Google Play)

1. **Gere o bundle de produção**:
   ```bash
   npm run build
   ```

2. **Adicione a plataforma Android (apenas na 1ª vez)**:
   ```bash
   npx cap add android
   ```

3. **Sincronize o código compilado com o Android**:
   ```bash
   npx cap sync android
   ```

4. **Abra o projeto no Android Studio**:
   ```bash
   npx cap open android
   ```

5. **Gerar o App Bundle (.aab) para a Google Play**:
   - No Android Studio, vá em `Build > Generate Signed Bundle / APK...`
   - Selecione **Android App Bundle**.
   - Crie ou selecione sua chave de assinatura (`keystore`).
   - Selecione a variante `release`.
   - O arquivo `.aab` gerado estará pronto para upload no Google Play Console.

---

## 🍎 4. Build para iOS (App Store)

1. **Gere o bundle de produção**:
   ```bash
   npm run build
   ```

2. **Adicione a plataforma iOS (apenas na 1ª vez)**:
   ```bash
   npx cap add ios
   ```

3. **Sincronize o código com o iOS**:
   ```bash
   npx cap sync ios
   ```

4. **Abra o projeto no Xcode**:
   ```bash
   npx cap open ios
   ```

5. **Configurar Assinatura e Distribuir**:
   - No Xcode, selecione o alvo `App` > aba `Signing & Capabilities`.
   - Selecione sua conta de desenvolvedor da Apple (Apple Developer Program).
   - Conecte um iPhone para teste físico ou selecione um simulador.
   - Para publicar: vá em `Product > Archive` e clique em `Distribute App` para enviar ao App Store Connect.

---

## ⚡ 5. Otimizações de Desempenho e Bateria Implementadas

- **Imagens Otimizadas**: Redução de 18,3 MB para ~600 KB total.
- **Carregamento Sob Demanda**: Imagens de biomas não são carregadas até que a pessoa entre neles.
- **Modo Economia de Bateria**: Limitação a 30 FPS e redução de partículas quando a bateria estiver baixa.
- **Pausa em Segundo Plano**: O canvas e o Web Audio suspendem imediatamente quando o app é minimizado ou a tela é desligada, economizando 100% de bateria do processador.
- **Notificações e Háptica**: Suporte a avisos com vibração ao término do foco.
