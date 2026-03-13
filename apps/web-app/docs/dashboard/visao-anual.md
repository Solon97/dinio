# Visao Anual

Este documento detalha a visao Anual do dashboard.

## Objetivo

A visao anual mostra evolucao historica consolidada das financas.

## Componentes principais

- `YearlyView`
- `YearlyChart`
- cards de resumo anual

## Grafico anual

`YearlyChart` plota os meses do ano com metricas consolidadas.

Resumo por mes (conceitual):

- renda
- gastos fixos obrigatorios
- gastos fixos dispensaveis
- gastos diarios
- poupanca planejada
- poupanca real

## Cards de resumo

A visao exibe tres cards principais:

1. `Renda Anual Total`
2. `Gastos Totais`
3. `Saldo Acumulado`

Regras funcionais:

- `Gastos Totais` soma fixos (obrigatorios + dispensaveis) e gastos diarios
- `Saldo Acumulado` reflete o resultado real consolidado

## Estado sem dados

Quando nao ha dados anuais:

- a visao mostra `BudgetNotConfigured` com mensagem de ausencia de historico
- o usuario precisa ter ao menos um mes configurado para preencher a evolucao

## Navegacao anual

Regras:

- pode voltar para anos anteriores apenas quando ha dados
- nao permite avancar alem do ano atual

## Fonte de dados

A visao anual e alimentada por:

- `GET /api/budget/year?year=`

Os dados retornam prontos para renderizacao dos pontos e totais anuais.
