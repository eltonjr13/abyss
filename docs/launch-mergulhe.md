# Lançamento de Mergulhe em mergulhe.cloud

## Posicionamento

**Marca:** Mergulhe. **Endereço:** `mergulhe.cloud`. **Frase central:** “Seu foco dá vida ao seu oceano.” O oceano é virtual; a comunicação não deve sugerir recuperação ambiental real, benefício terapêutico ou sincronização automática.

**Público inicial:** estudantes e pessoas que trabalham no computador e querem transformar blocos de foco em uma experiência visual tranquila. **Demonstração principal:** recife silencioso → sessão de foco no app completo → recife com mais vida. Mostrar gravação do produto real.

## Papel do domínio e das plataformas

| Canal | Papel no lançamento | Destino do botão |
| --- | --- | --- |
| `mergulhe.cloud` | Landing page, explicação, dúvidas, privacidade e suporte | Chrome Web Store quando a extensão estiver publicada |
| Extensão Chrome | Timer rápido no popup; botão para abrir o app completo empacotado | Listagem na Chrome Web Store |
| Google Play | App Android após build e revisão | Listagem real quando publicada |
| Apple App Store | App iOS após build, login e revisão | Listagem real quando publicada |

A landing page não é o app. Não anunciar botões de loja como disponíveis antes de haver listagem. Antes disso, use “Em breve para Android/iPhone” como informação, sem botão falso. O `.cloud` faz parte do endereço, mas o progresso do jogo permanece local.

## Estrutura da página

1. Hero com nome, frase central, uma frase explicativa e CTA para instalar a extensão pela Chrome Web Store.
2. Demonstração curta do ciclo “escolher tempo → focar → ver o oceano virtual ganhar vida”, com captura verdadeira do app.
3. Blocos breves: timer rápido do Chrome; experiência completa em nova aba; seis biomas, descobertas e áudio; progresso e backup manual.
4. Escolha de plataforma: Chrome disponível após publicação; Android e iPhone claramente “em breve”.
5. FAQ: o que é grátis; como funciona a extensão; diferença entre timer rápido e app completo; se precisa de conta; onde fica o progresso; se funciona sem internet; Plus ainda indisponível.
6. Rodapé com `/privacidade`, `/termos` e `/suporte` públicos e coerentes com Google OAuth e as lojas.

## Sequência de lançamento

1. Fechar a marca em interface, metadados, ícone, listagens e configuração OAuth. Verificar disponibilidade da marca antes de investimento relevante em mídia.
2. Publicar `mergulhe.cloud` com HTTPS, página de privacidade e suporte, sem links vazios. A homepage precisa explicar o produto para o branding do Google OAuth.
3. Testar e publicar a extensão na Chrome Web Store. Confirmar o timer, notificação, botão “Ver o Oceano”, ícone e pacote de distribuição. Só então ativar o CTA de instalação na landing page.
4. Fazer campanha inicial com vídeos curtos mostrando a passagem do recife silencioso ao oceano vivo. Criativos separados para estudo e trabalho, sempre com captura verdadeira e uma proposta clara.
5. Medir visitas à landing por campanha/UTM, clique para a loja, instalações informadas pela loja, primeira sessão concluída quando mensurável e retorno após sete dias. Não usar métricas inventadas ou promessas de resultado.
6. Publicar Android e iOS quando builds, login, privacidade, listagens e testes de loja estiverem prontos. Atualizar a página com links reais e comunicação por plataforma.

## Dependências externas ainda pendentes

- Hospedagem e DNS de `mergulhe.cloud`, certificado HTTPS e páginas públicas.
- Branding do Google Auth Platform como Mergulhe, domínio autorizado/verificado, URLs de privacidade e termos, publicação da tela de consentimento. O callback do cliente web continua no Supabase.
- Redirect nativo `cloud.mergulhe.app://auth/callback` no Supabase antes dos builds; testar em aparelhos. O identificador antigo pode ficar temporariamente permitido para builds de desenvolvimento existentes.
- URL da Chrome Web Store e, futuramente, URLs das lojas móveis. Não há links para configurar enquanto as listagens não existem.
- Revisão das declarações de dados. Login Google/Supabase guarda perfil básico; o progresso do oceano não é sincronizado automaticamente.
