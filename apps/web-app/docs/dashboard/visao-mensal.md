# Visao Mensal

Este documento detalha a visao Mensal (planejamento) do dashboard.

## Objetivo

A visao mensal consolida alocacao, compromissos e situacao financeira do mes.

## Componentes principais

- `MonthlyView`
- `DistributionChart` (`Distribuicao Planejada`)
- `InsightsPanel` (titulo `Dinio Insights`)
- `FixedExpensesList`
- `FinancialAgenda`

## Distribuicao planejada

`DistributionChart` apresenta a alocacao:

- `Gastos Fixos`
- `Dia a Dia`
- `Reserva`

Regra funcional:

- valores e percentuais derivam da configuracao mensal ativa
- alteracoes no budget refletem neste bloco

## Insights mensais

`Dinio Insights` traz analises consolidadas do periodo, incluindo ritmo e projecoes.

Regra funcional:

- os insights sao calculados no backend e apenas exibidos no frontend

## Gastos fixos

`FixedExpensesList` mostra compromissos recorrentes com classificacao:

- `Obrigatorio`
- `Dispensavel`

Regras:

- lista ordenada por tipo/nome
- totalizadores separados por classificacao
- gastos parcelados podem exibir indicador de parcela atual/total

## Agenda financeira

`FinancialAgenda` agrupa eventos por dia de vencimento:

- faturas de cartao
- gastos fixos
- reembolsos a receber

## Regras de pagamento

Marcar como pago:

- fatura: controle visual
- gasto fixo: controle visual

Excecao de reembolso:

- ao marcar reembolso como recebido, o sistema cria entrada de receita
- apos isso, recalibra distribuicao entre `Dia a Dia` e `Reserva`

## Estado sem configuracao

Se o mes nao estiver configurado:

- a visao mostra `BudgetNotConfigured`
- o fluxo esperado e abrir o wizard

## Navegacao mensal

Regras:

- permite voltar apenas para meses anteriores configurados
- nao permite avancar alem do mes atual

## Edicao de budget pelo mensal

No mes atual, com configuracao existente:

- a visao mensal exibe acao para reabrir o wizard em modo edicao
