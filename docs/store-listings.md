# Mergulhe — textos de lançamento para as lojas

Rascunhos para revisão quando cada versão estiver pronta. Use capturas do produto real e confirme os recursos de cada plataforma antes de enviar. O domínio oficial será `https://mergulhe.cloud`.

## Google Play (futuro)

- **Nome:** `Mergulhe — Foco e Oceano`
- **Descrição curta:** `Concentre-se e veja um oceano virtual ganhar vida.`
- **Categoria sugerida:** Produtividade.

### Descrição

Seu foco dá vida ao seu oceano.

Mergulhe transforma sessões de estudo e trabalho em progresso num mundo marinho virtual. Escolha um tempo, concentre-se e acompanhe o recife ganhar cor conforme você avança.

- Timer com durações prontas, duração personalizada e modo sem timer.
- Seis biomas para explorar e dezenas de espécies para descobrir.
- Paisagens sonoras geradas pelo app e controles de áudio.
- Histórico de foco e progresso salvos no dispositivo.
- Backup e importação manual para levar o oceano a outro aparelho.

O essencial de foco, biomas e descobertas é gratuito. A compra Mergulhe Plus ainda não está disponível; não anuncie preço ou benefícios pagos como entregues antes da integração com as lojas.

## Apple App Store (futuro)

- **Nome:** `Mergulhe — Foco e Oceano`
- **Subtítulo:** `Seu foco dá vida ao oceano`
- **Categoria sugerida:** Produtividade.

### Descrição

Mergulhe é um espaço de foco com um oceano virtual que responde à sua constância. Inicie uma sessão, acompanhe o tempo e descubra novas formas de vida no seu mundo marinho.

Explore seis biomas, descubra espécies, ajuste a paisagem sonora e veja seu histórico. Seu progresso fica no aparelho; para levá-lo a outro, use o backup e a importação manual. Entrar com Google cria um perfil, mas ainda não sincroniza o progresso automaticamente.

Não prometer Dynamic Island, integração com tela bloqueada, sincronização automática ou efeitos terapêuticos sem implementação e testes nas versões nativas.

## Chrome Web Store (primeiro lançamento)

- **Nome:** `Mergulhe — foco e oceano`
- **Resumo:** `Timer de foco na barra do Chrome e um oceano virtual para explorar em uma nova aba.`
- **Categoria sugerida:** Produtividade.

### Descrição

Comece um período de foco em um clique, diretamente na barra do Chrome. Escolha 15, 25 ou 45 minutos; o timer rápido continua contando mesmo quando o popup é fechado e avisa quando termina.

O botão **Ver o Oceano Completo** abre, em outra aba, o app Mergulhe empacotado na extensão. Nele, você pode iniciar sessões próprias, explorar biomas e descobrir espécies. O timer rápido e o app completo têm estados separados: concluir o timer do popup não concede XP nem restaura o oceano no app. O progresso do app completo pode ser exportado e importado manualmente.

## Capturas e revisão antes da publicação

1. Mostrar o timer rápido da extensão e seu botão **Ver o Oceano Completo**.
2. Mostrar uma sessão real no app completo, sem compor uma interface inexistente.
3. Mostrar o recife e um segundo bioma em estados reais do produto.
4. Mostrar descoberta de espécie e histórico com dados de demonstração identificados como tal.
5. Revalidar declarações de dados, permissões, privacidade, preços e disponibilidade de cada loja com o build final.

O login Google usa Supabase Auth e guarda um perfil básico no banco; por isso, não declarar “nenhum dado coletado”. O progresso do oceano permanece local enquanto não existir sincronização automática implementada. Hospede as páginas públicas de privacidade e suporte em `mergulhe.cloud` antes de enviar as listagens.
