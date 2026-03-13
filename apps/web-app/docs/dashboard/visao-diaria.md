# Visao Diaria

Este documento detalha a visao Diario do dashboard.

## Objetivo

A visao diaria acompanha o ritmo de gastos no mes atual.

## Componentes principais

- `DailyView`
- `MonthBalanceProjectionChart`
- `CategoryChart`
- `InsightsPanel` (titulo `Insights do Dia`)
- `ExpenseList`

## KPIs exibidos

## Media Recomendada (Dia X)

Representa o limite recomendado para o dia atual.

Regra funcional:

- parte de uma referencia diaria do orcamento de `Dia a Dia`
- e recalculada com base no saldo restante e dias restantes do mes

## Media Atual

Mostra o ritmo medio de gasto diario ate o momento.

Regra funcional:

- compara o gasto medio real com a media recomendada
- destaca se o ritmo esta acima, abaixo ou no recomendado

## Saldo do Mes

Mostra o saldo remanescente do orcamento diario no mes.

Regra funcional:

- exibe valor em reais e barra de progresso
- reflete impacto acumulado dos lancamentos diarios

## Graficos

## Projecao do mes

`MonthBalanceProjectionChart` mostra evolucao projetada do saldo no mes.

## Categorias

`CategoryChart` mostra distribuicao dos gastos por categoria no periodo selecionado.

## Lista de despesas

`ExpenseList` exibe despesas do mes com paginacao.

Acoes:

- editar despesa
- excluir despesa

## Regras especificas da visao diaria

- o conceito de limite diario aparece como `Media Recomendada` na UI
- gastar abaixo da recomendacao tende a aliviar os proximos dias
- gastar acima da recomendacao reduz margem dos dias seguintes
- os calculos financeiros sao entregues prontos pela API

## Estado sem configuracao

Se o mes nao estiver configurado:

- a visao mostra `BudgetNotConfigured`
- o usuario deve abrir o wizard para configurar o periodo

## Navegacao

Na tela diaria:

- nao ha navegacao por setas de periodo no cabecalho
- o foco e operacional no mes em exibicao
