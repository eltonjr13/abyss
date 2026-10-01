# Sessão de foco compartilhada — passos 1 a 5

## Contrato

Uma conta possui no máximo uma sessão ativa. App Android, popup e aba do oceano compartilham início, pausa, retomada e término. A duração pode ser de 1 a 180 minutos ou sem limite. Uma sessão concluída exige pelo menos um minuto de foco; encerrar antes disso a descarta. Iniciar um mergulho exige uma conta Google verificada, o histórico inicial carregado e a conexão com o timer pronta. Sem conta, a pessoa pode conhecer o oceano e acessar o convite de login, mas não inicia um timer nem ganha novas descobertas.

O save V2 antigo permanece preservado; seus timers locais não são retomados para gerar novas recompensas. Cada conta usa um cache próprio, identificado pelo dono, sem copiar automaticamente a coleção antiga sem dono. Ao sair ou trocar de conta, o timer é retirado da tela e a coleção da outra conta não é exibida. A sessão compartilhada continua no servidor. Sair de um aparelho não encerra o login dos outros.

Comandos de sessões compartilhadas precisam de internet. Sem conexão, o relógio continua a partir do último estado confirmado. Pausas feitas em outro aparelho só aparecem quando a conexão retorna. Não há fila automática de comandos offline: a pessoa recebe o estado atual e pode tentar novamente.

## Banco e concorrência

`public.focus_sessions` guarda dono, ID UUID, bioma, duração, estado, tempo acumulado, horário de retomada, origem, revisão e conclusão. RLS restringe leitura e escrita ao dono; anônimos não recebem acesso. Não há chave secreta ou service role no app ou na extensão.

`focus_command` é SECURITY INVOKER, aplica os horários do servidor e serializa comandos por conta com um bloqueio transacional. O índice parcial impede duas sessões ativas. Comandos com uma revisão antiga devolvem conflito e o estado atual. Inícios repetidos com o mesmo ID e conclusões repetidas não criam sessões extras. Ao consultar uma sessão com duração já vencida, o servidor a conclui no horário previsto.

O cliente usa uma fila para comandos e consultas, compensa a diferença entre relógios e recarrega após reconexão. Realtime é habilitado para `focus_sessions`; cada conta assina apenas seus eventos. Histórico de conclusões é paginado e aplicado por ID, persistido junto ao save para evitar recompensa duplicada após reiniciar. Histórico antigo recebido com atraso preserva a sequência e a contagem diária já existentes.

O oceano usa uma cópia local por conta. O histórico confirmado é aplicado em ordem cronológica, com sorteio determinístico por ID da sessão e controle de IDs já aplicados. Uma instalação nova recupera as conquistas geradas por esse histórico; reconectar e recarregar não premiam a mesma sessão duas vezes. Preferências, Plus, importações manuais e progresso anterior sem dono não são sincronizados por esse mecanismo. A definição de colecionáveis imutáveis e sua emissão no servidor continuam como trabalho futuro.

## Extensão

O login usa o worker para continuar mesmo quando o popup fecha. Os tokens ficam em `chrome.storage.local` com acesso restrito aos contextos confiáveis. Popup e oceano compartilham esse login. O build inclui o SDK localmente, como exige Manifest V3.

Com o popup fechado, o worker consulta o Supabase por alarme a cada minuto e programa outro alarme para o término. Armazena o último estado e o ID da última notificação. Reiniciar o worker não reinicia o relógio nem repete a notificação. Ao reiniciar o Chrome, os alarmes são reconstruídos. O Chrome e o computador precisam estar em funcionamento para receber atualizações.

## Evidências e próximo teste

- TypeScript, testes do jogo e da conexão compartilhada.
- `tests/shared-focus.sql`: comandos, revisão, duração mínima, término vencido, repetição, isolamento entre contas e bloqueio de acesso anônimo. O teste usa usuários temporários e ROLLBACK.
- `tests/extension-worker.test.mjs`: worker compilado com APIs Chrome e rede simuladas.
- Migrações aplicadas no projeto `ukzixtqsdybeqrwsybqt`, RLS e publicação Realtime verificados.
- Callback exato da extensão configurado no painel; screenshot de confirmação em `builds/supabase-extensao-callback.png`.
- Auditoria: nova tabela e RPC protegidas; acesso público à função interna `rls_auto_enable` removido sem desativar o gatilho. O aviso de [proteção de senhas vazadas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) permanece no projeto que usa Google.

O próximo teste físico usa o APK 1.1 e a extensão 1.1, ambos na mesma conta: iniciar no celular, observar no popup, pausar pela extensão, retomar no celular, fechar o popup, verificar o badge, reiniciar Chrome e interromper/restaurar a conexão. A configuração OAuth da extensão ainda precisa ser validada no Chrome real.
