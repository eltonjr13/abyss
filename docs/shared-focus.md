# Sessão de foco compartilhada — passos 1 a 5

## Contrato

Uma conta possui no máximo uma sessão ativa. App Android, popup e aba do oceano compartilham início, pausa, retomada e término. A duração pode ser de 1 a 180 minutos ou sem limite. Uma sessão concluída exige pelo menos um minuto de foco; encerrar antes disso a descarta. O usuário sem conta continua usando o timer local do app.

Uma sessão local existente não é substituída ao entrar na conta. Ela deve ser finalizada primeiro. A nova versão lê o save V2 existente e preserva os dados locais. Ao sair da conta, uma sessão compartilhada é retirada da tela, mas continua na conta. Sair de um aparelho não encerra o login dos outros.

Comandos de sessões compartilhadas precisam de internet. Sem conexão, o relógio continua a partir do último estado confirmado. Pausas feitas em outro aparelho só aparecem quando a conexão retorna. Não há fila automática de comandos offline: a pessoa recebe o estado atual e pode tentar novamente.

## Banco e concorrência

`public.focus_sessions` guarda dono, ID UUID, bioma, duração, estado, tempo acumulado, horário de retomada, origem, revisão e conclusão. RLS restringe leitura e escrita ao dono; anônimos não recebem acesso. Não há chave secreta ou service role no app ou na extensão.

`focus_command` é SECURITY INVOKER, aplica os horários do servidor e serializa comandos por conta com um bloqueio transacional. O índice parcial impede duas sessões ativas. Comandos com uma revisão antiga devolvem conflito e o estado atual. Inícios repetidos com o mesmo ID e conclusões repetidas não criam sessões extras. Ao consultar uma sessão com duração já vencida, o servidor a conclui no horário previsto.

O cliente usa uma fila para comandos e consultas, compensa a diferença entre relógios e recarrega após reconexão. Realtime é habilitado para `focus_sessions`; cada conta assina apenas seus eventos. Histórico de conclusões é paginado e aplicado por ID, persistido junto ao save para evitar recompensa duplicada após reiniciar. Histórico antigo recebido com atraso preserva a sequência e a contagem diária já existentes.

O oceano continua salvo por instalação. Uma conclusão compartilhada pode gerar progresso em cada instalação, uma vez em cada uma, mas isso não torna os saves completos idênticos. Nenhum campo Plus é transportado por esta integração.

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
