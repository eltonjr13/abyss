# Coleção marinha

As 58 espécies existentes continuam gratuitas. O save `tide-save-v2` recebe campos opcionais na leitura (`targetSpecies` e `researchSeconds`), sem substituir descobertas, histórico ou sessões confirmadas. Saves antigos começam com pesquisa vazia e mantêm sua coleção.

## Jornada

1. A coleção mistura espécies descobertas e silhuetas, agrupadas nos seis habitats, com contadores, filtros e pistas clicáveis inclusive nas regiões fechadas.
2. “Quero descobrir” acompanha uma espécie. Início e preparação mostram o objetivo, o requisito de vida e a pesquisa. Trocar de objetivo preserva todas as pesquisas. Um objetivo em outra região oferece o caminho para o habitat ou mapa.
3. Foco concluído pesquisa todas as espécies ainda desconhecidas cujo habitat se tornou adequado. Apenas os segundos posteriores ao requisito de vida contam. Cada espécie recebe seus próprios minutos; acompanhar uma espécie não altera o resultado de sessões compartilhadas reproduzidas em outro dispositivo.
4. Novas descobertas passam por silhueta e revelação acionada pela pessoa. Lendários recebem uma apresentação própria. “Ver no meu oceano” seleciona o habitat e destaca os animais da espécie no cenário; o resumo também mostra pesquisa e conquistas.
5. Conquistas reconhecem cinco descobertas, o conjunto de raias, as baleias, cada habitat completo e a coleção inteira. São calculadas a partir das descobertas permanentes, reconhecem coleções anteriores e só são anunciadas na sessão que cruza a meta.

## Balanceamento inicial

| Raridade | Foco com habitat adequado para garantia | Chance em 25 min adequados |
| --- | --- | --- |
| Comum | 15 min | 35% |
| Incomum | 45 min | 18% |
| Rara | 90 min | 8% |
| Lendária | 180 min | 2% |

A chance é `1 - (1 - chance25min)^(segundosAdequados / 1500)`, por espécie. Dividir a mesma duração em sessões pequenas não aumenta a chance acumulada nem antecipa a garantia. Várias espécies podem chegar juntas numa sessão longa. Os primeiros cinco minutos acumulados garantem uma espécie comum disponível. Sessões com menos de um minuto continuam sem recompensa.

Pesquisa persiste entre sessões, recargas e dias sem foco. Importação usa o máximo por espécie, sem somar duas cópias do mesmo progresso. O objetivo fica no save de cada dispositivo; a pesquisa e as descobertas seguem a lógica determinística já usada na reprodução do histórico confirmado. Não há alteração de autenticação ou de banco de dados.

Variantes visuais e decoração de habitats ficam para uma expansão; nesta entrega o reconhecimento dos conjuntos é feito pelas conquistas visíveis. Os valores acima são parâmetros iniciais e ainda precisam de observação de uso para ajustar o ritmo de uma coleção completa.
