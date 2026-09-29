# Política de Privacidade — Mergulhe

**Última atualização:** 28 de setembro de 2026  
**Versão:** 1.0  
**Identificador do Aplicativo:** `cloud.mergulhe.app`  

O **Mergulhe** é um aplicativo de foco, produtividade e bem-estar que une técnicas de concentração (como o método Pomodoro) à restauração interativa de um ecossistema oceânico virtual.

Esta Política de Privacidade descreve de forma clara, transparente e acessível como tratamos os seus dados pessoais, em total conformidade com a **Lei Geral de Proteção de Dados Pessoais do Brasil (LGPD — Lei nº 13.709/2018)**, o **Regulamento Geral sobre a Proteção de Dados da União Europeia (GDPR — Regulamento 2016/679)** e as diretrizes de privacidade das plataformas **Google Play** e **Apple App Store**.

Ao utilizar o Mergulhe, você concorda com as práticas descritas neste documento. Caso não concorde, recomendamos não utilizar os serviços do aplicativo.

---

## 1. Princípios de Privacidade (Privacy by Design)

O Mergulhe foi projetado com o princípio da **minimização de dados** e da **privacidade em primeiro lugar**:
- O aplicativo pode ser utilizado de forma **100% anônima e local**, sem a necessidade de criar uma conta ou fornecer nome e e-mail.
- Seu progresso de foco e as descobertas das espécies marinhas são armazenados prioritariamente no seu próprio dispositivo.
- **Não vendemos, não alugamos e não compartilhamos seus dados pessoais** com empresas de publicidade ou corretores de dados (*data brokers*).
- Não utilizamos anúncios de terceiros nem rastreadores invasivos de comportamento de navegação.

---

## 2. Dados Coletados e Finalidades do Tratamento

Dependendo de como você decide utilizar o Mergulhe, diferentes categorias de dados podem ser tratadas:

### 2.1. Modo Padrão (Uso Local e Anônimo)
Se você utilizar o aplicativo sem se conectar a uma conta:
- **Dados tratados:** Tempo de foco, histórico de sessões diárias, nível de XP, biomas desbloqueados, espécies marinhas catalogadas e preferências de som/interface.
- **Onde são armazenados:** Exclusivamente no armazenamento local do seu navegador ou dispositivo (`localStorage`).
- **Acesso:** Apenas o aplicativo rodando no seu próprio aparelho tem acesso a esses dados. Nenhum dado de progresso é enviado a servidores remotos a menos que você decida exportá-lo manualmente.

### 2.2. Autenticação Opcional (Entrar com o Google)
O Mergulhe oferece a opção de autenticação via conta Google (operada através da infraestrutura segura do **Supabase**):
- **Dados coletados:** 
  - Identificador único de autenticação (`UUID`).
  - Endereço de e-mail associado à sua conta Google.
  - Nome de exibição (`display_name`) fornecido pelo Google.
  - Data e hora de criação da conta.
- **Finalidade:** Identificação de perfil, verificação de segurança da sessão e eventual recuperação de acesso ou ativação de compras de recursos adicionais.
- **Nota sobre o progresso:** A autenticação com o Google cria seu perfil no app, mas não publica nem expõe publicamente seu histórico de sessões.

### 2.3. Compras no Aplicativo (Mergulhe Plus)
O Mergulhe disponibiliza a opção de compra única do **Mergulhe Plus** (desbloqueio de recursos extras como modos de contemplação estendidos e histórico detalhado):
- **Processamento de pagamentos:** As transações são realizadas integralmente pelas lojas oficiais de distribuição de aplicativos (**Google Play Store** e **Apple App Store**).
- **Dados financeiros:** O Mergulhe **não coleta, não processa e não armazena** dados de cartão de crédito, contas bancárias ou informações financeiras. Apenas recebemos das lojas a confirmação criptografada da compra para desbloquear o recurso no app.

### 2.4. Recursos e Permissões do Dispositivo
Para que as funcionalidades de foco e imersão funcionem adequadamente, o aplicativo pode solicitar acesso a recursos locais do seu aparelho:
- **Notificações:** Utilizadas unicamente para alertar você no momento em que uma sessão de foco terminar. Você pode revogar essa permissão a qualquer momento nas configurações do sistema operacional ou do navegador.
- **Vibração / Resposta Háptica (`navigator.vibrate`):** Utilizada exclusivamente como alerta tátil discreto ao final do cronômetro de foco. Nenhum dado é coletado.
- **Áudio (Web Audio API):** Utilizada para sintetizar e reproduzir paisagens sonoras oceânicas locais (ruído de água, chuva e músicas relaxantes).
- **Indicador de Bateria (Battery Status API):** Utilizado de forma opcional e local para acionar o *Modo Economia de Energia* (limitando animações a 30 FPS para poupar consumo de carga). A informação de bateria não é transmitida a servidores externos.
- **Área de Transferência (Clipboard):** Utilizada apenas quando você clica voluntariamente no botão de copiar ou colar o código de sincronização manual de backup entre dispositivos.

---

## 3. Base Legal para o Tratamento de Dados (LGPD e GDPR)

O tratamento dos dados pessoais pelo Mergulhe é fundamentado nas seguintes bases legais:
1. **Consentimento (Art. 7º, I da LGPD / Art. 6º, 1, a do GDPR):** Para o login voluntário através da conta Google e envio de notificações locais.
2. **Execução de Contrato e Termos de Uso (Art. 7º, V da LGPD / Art. 6º, 1, b do GDPR):** Para entrega dos serviços solicitados pelo usuário e liberação dos benefícios do Mergulhe Plus.
3. **Legítimo Interesse (Art. 7º, IX da LGPD / Art. 6º, 1, f do GDPR):** Para prevenção de fraudes, manutenção da estabilidade do software e suporte técnico ao usuário.

---

## 4. Compartilhamento de Dados com Terceiros

O Mergulhe **não comercializa** dados pessoais de seus usuários sob nenhuma hipótese. O compartilhamento ocorre estritamente com provedores de infraestrutura técnica necessários para a operação do aplicativo:

| Provedor / Parceiro | Finalidade | Política de Privacidade |
|---|---|---|
| **Supabase Inc.** | Banco de dados na nuvem e autenticação segura com criptografia | [Política do Supabase](https://supabase.com/privacy) |
| **Google LLC (OAuth / Google Play)** | Autenticação unificada de usuários e processamento de compras no Android | [Privacidade do Google](https://policies.google.com/privacy) |
| **Apple Inc. (App Store)** | Distribuição do aplicativo e processamento de compras no iOS | [Privacidade da Apple](https://www.apple.com/legal/privacy/) |

Todos os prestadores de serviço terceirizados são contratualmente obrigados a proteger seus dados e mantê-los sob sigilo e padrões avançados de segurança técnica.

---

## 5. Armazenamento e Segurança dos Dados

Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acessos não autorizados, destruição, perda ou alteração ilícita:
- **Criptografia em Trânsito:** Toda comunicação com servidores de autenticação ocorre via conexões seguras criptografadas (HTTPS / TLS 1.3).
- **Segurança a Nível de Linha (Row Level Security - RLS):** No banco de dados, políticas estritas garantem que nenhum usuário tenha permissão para ler, alterar ou excluir dados pertencentes a outro usuário.
- **Minimização de Retenção:** Dados locais permanecem no dispositivo até que você decida limpar os dados do navegador ou clicar na opção *"Recomeçar do zero"* dentro do app.

---

## 6. Direitos do Usuário (LGPD e GDPR)

Em conformidade com o Artigo 18 da LGPD e os Artigos 15 a 22 do GDPR, você possui os seguintes direitos:
1. **Confirmação e Acesso:** Obter a confirmação de que seus dados estão sendo tratados e acessar seus dados cadastrais.
2. **Correção:** Solicitar a correção de dados incompletos, inexatos ou desatualizados.
3. **Portabilidade:** Exportar livremente todo o seu histórico de foco e progresso do oceano através da funcionalidade de **Backup em JSON** disponível no menu de configurações do app.
4. **Exclusão de Dados e da Conta:** Solicitar a exclusão definitiva da sua conta e de todos os dados pessoais associados.
5. **Revogação do Consentimento:** Desconectar sua conta a qualquer momento utilizando o botão *"Sair da conta"* no aplicativo.

### Como solicitar a exclusão da sua conta:
Você pode solicitar a exclusão completa e irrevogável da sua conta Google associada ao Mergulhe enviando um e-mail para **privacidade@mergulhe.app** (ou através do canal de contato do aplicativo). Ao recebermos sua solicitação, todos os registros de perfil armazenados no banco de dados serão eliminados definitivamente em até 15 (quinze) dias úteis.

---

## 7. Crianças e Adolescentes

O Mergulhe não coleta intencionalmente dados pessoais de crianças menores de 13 anos (ou a idade mínima legal de consentimento aplicável no seu país) sem a expressa autorização de seus pais ou responsáveis legais. Se você identificar que uma criança nos forneceu informações pessoais indevidamente, entre em contato conosco para que possamos remover imediatamente tais informações.

---

## 8. Transferência Internacional de Dados

Servidores de infraestrutura na nuvem (como o Supabase e o Google) podem estar localizados fora do território brasileiro. Essas transferências internacionais de dados ocorrem em conformidade com as legislações pertinentes, adotando cláusulas contratuais padrão e níveis equivalentes de conformidade e segurança da informação.

---

## 9. Alterações nesta Política de Privacidade

Podemos atualizar esta Política de Privacidade periodicamente para refletir melhorias no aplicativo, novas funcionalidades ou exigências legais. Quando alterações relevantes forem realizadas, a data da "Última atualização" no início deste documento será modificada e, quando apropriado, disponibilizaremos um aviso destacado dentro do aplicativo.

---

## 10. Contato e Encarregado pelo Tratamento de Dados (DPO)

Para exercer seus direitos de privacidade, tirar dúvidas ou apresentar sugestões sobre o tratamento de seus dados pessoais, entre em contato conosco:

- **E-mail de Contato / DPO:** `privacidade@mergulhe.app`  
- **Aplicativo:** Mergulhe (`cloud.mergulhe.app`)  
- **País:** Brasil  
