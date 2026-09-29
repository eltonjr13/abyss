# Mergulhe 1.1 — extensão Chrome

O popup, a aba “Ver o Oceano” e o app Android usam uma sessão de foco por conta. Entre com a mesma conta Google nos dois aparelhos. Início, pausa, retomada e término são confirmados pelo Supabase; o relógio é calculado pelos horários da sessão.

## Gerar e carregar

1. Configure `.env.local` conforme `.env.example`, usando apenas URL e chave publishable. Defina `VITE_GOOGLE_AUTH_ENABLED=true`.
2. Execute `npm run build:extension`. O comando gera `extension/dist/` e `extension/generated/`.
3. Abra `chrome://extensions`, ative o modo de desenvolvedor e carregue a pasta `extension/` sem compactação. Se ela já estiver carregada, clique em atualizar.
4. Entre com Google pelo popup. Use a mesma conta do APK 1.1. O APK 1.0 mantém o timer local e precisa ser atualizado para conectar os timers.

O `key` público no manifesto fixa o ID de desenvolvimento em `kgjfmiccmbjnabmjknmgodickdhkbpji`. O callback permitido no Supabase é:

```text
https://kgjfmiccmbjnabmjknmgodickdhkbpji.chromiumapp.org/auth/callback
```

O Google continua usando o provider e o callback do Supabase já configurados. A extensão usa PKCE e `chrome.identity.launchWebAuthFlow`; não lê a conta do perfil do Chrome. Os tokens ficam em `chrome.storage.local`, restrito aos contextos da própria extensão. As páginas e o worker usam o mesmo armazenamento e um bloqueio entre contextos para renovar a sessão com a versão atual do SDK.

## Popup fechado e falta de internet

- Com o popup aberto, Realtime atualiza a sessão e uma consulta a cada 30 segundos recupera mudanças perdidas.
- Com o popup fechado, `chrome.alarms` consulta a conta a cada minuto. O horário de término também recebe um alarme próprio.
- Ao reiniciar o Chrome, os alarmes são reconstruídos e o estado é consultado novamente.
- Computador suspenso, Chrome fechado e falta de internet podem atrasar atualizações e notificações. O horário confirmado permite recuperar o relógio ao voltar.
- Offline, o último timer continua sendo exibido; comandos exigem uma nova confirmação do servidor. O badge `!` indica sincronização indisponível.
- Sair da conta limpa o cache e os alarmes da extensão, mantendo a sessão da conta disponível no celular.

Os botões de 15, 25, 45 minutos e “Sem timer” iniciam a sessão da conta. Não há um segundo cronômetro independente. Uma sessão antiga do app, iniciada sem conta, pode ser finalizada localmente antes de usar a sessão compartilhada.

As conclusões são registradas por ID e aplicadas uma vez em cada instalação do app. A sincronização completa do oceano e a validação de compras continuam sendo etapas próprias; o timer não copia nem concede Plus.

## Verificar e distribuir para teste

```sh
npm run typecheck
npm test
npm run test:extension
```

O último comando compila a extensão e simula reinício do worker, alarmes, pausa, falta de internet, notificação e saída da conta. Ele não substitui o teste de Google OAuth e de sincronização em Chrome real com um celular.

Para distribuir, compacte `manifest.json`, `popup.html`, `icons/`, `generated/` e `dist/`, com o manifesto na raiz do ZIP. Publicação na Chrome Web Store exige revisar o ID definitivo e permitir somente seu callback correspondente.
