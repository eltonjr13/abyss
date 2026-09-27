# TIDE — Extensão Google Chrome (Manifest V3)

Esta extensão oferece uma **experiência rápida de foco** diretamente na barra de ferramentas do Google Chrome, mantendo o timer **completamente independente** da janela do popup e oferecendo um modo imersivo de "Ver o Oceano".

---

## 🌊 Funcionalidades

1. **Timer Independente (Background Service Worker)**:
   - O cronômetro utiliza a API nativa `chrome.alarms` e `chrome.storage.local`.
   - Se você fechar o popup, o timer **continua rodando com precisão**.
   - O tempo restante em minutos é exibido no **badge do ícone** da extensão (ex: `24m`, `15m`, `✓`).
2. **Notificações Nativas do Sistema**:
   - Quando o tempo encerra, o Chrome emite uma notificação nativa avisando sobre a conclusão da sessão e recompensas do oceano.
3. **Modo Rápido de Foco**:
   - Início com 1 clique (15 min, 25 min, 45 min).
   - Pausa e retomada sem perda de tempo decorrido.
4. **Modo "Ver o Oceano"**:
   - Botão para abrir o TIDE em tela cheia numa nova aba, permitindo contemplar os biomas, peixes e paisagens sonoras completas.

---

## 🛠️ Como Carregar no Google Chrome (Modo Desenvolvedor)

1. No Chrome, abra a barra de endereços e acesse:
   ```text
   chrome://extensions
   ```
2. No canto superior direito, ative a chave **"Modo do desenvolvedor"** (Developer mode).
3. Clique no botão **"Carregar sem compactação"** (Load unpacked).
4. Selecione a pasta deste projeto:
   ```text
   abyss/extension
   ```
5. Pronto! O ícone do TIDE aparecerá na sua barra de extensões. Fixe-o na barra de ferramentas para acesso rápido.

---

## 📦 Como Publicar na Chrome Web Store

1. Execute o build da aplicação:
   ```bash
   npm run build
   ```
2. Compacte o conteúdo da pasta `extension` juntamente com a pasta `dist` gerada em um arquivo `.zip`.
3. Acesse o [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
4. Faça upload do arquivo `.zip` e configure as descrições e capturas de tela preparadas na pasta `docs/store-listings.md`.
