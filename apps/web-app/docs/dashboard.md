# Dashboard — Visao Geral

O dashboard e a tela principal do Dinio para planejar o mes, acompanhar gastos no dia a dia e analisar evolucao anual.

Este arquivo e um guia de contexto geral. As regras detalhadas ficam nos arquivos especificos de cada area funcional.

---

## Conceitos Gerais

O dashboard e organizado em tres visoes de interface:

- `Diario`
- `Mensal`
- `Anual`

Conceitos centrais compartilhados:

- o mes precisa estar configurado para liberar o ciclo completo de acompanhamento
- a renda mensal e distribuida entre `Gastos Fixos`, `Dia a Dia` e `Reserva`
- o frontend trabalha em reais, com conversao automatica de centavos na camada de API
- os calculos financeiros sao retornados prontos pelo backend

---

## Quando Ler Cada Documento

Leia o documento de acordo com o contexto da tarefa.

## Configuracao do mes (Budget)

Arquivo: `docs/dashboard/configuracao-do-mes-budget.md`

Leia quando precisar:

- entender o wizard de configuracao mensal
- revisar regras de primeiro mes, alocacao e mes parcial
- validar fluxo de criacao/edicao de budget

## Visao Diaria

Arquivo: `docs/dashboard/visao-diaria.md`

Leia quando precisar:

- analisar KPIs diarios (`Media Recomendada`, `Media Atual`, `Saldo do Mes`)
- entender projecao diaria, categorias e lista de despesas
- validar comportamento operacional de acompanhamento do mes

## Visao Mensal

Arquivo: `docs/dashboard/visao-mensal.md`

Leia quando precisar:

- revisar distribuicao planejada e insights mensais
- entender regras de gastos fixos e agenda financeira
- validar regras de marcacao de pagos e reembolsos

## Visao Anual

Arquivo: `docs/dashboard/visao-anual.md`

Leia quando precisar:

- analisar consolidacao anual
- validar grafico e cards de resumo
- revisar regras de navegacao anual e estado sem dados

## Captura de gastos

Arquivo: `docs/dashboard/captura-de-gastos.md`

Leia quando precisar:

- entender o modal de captura (`Diario` e `Fixo / Parcelado`)
- revisar validacoes e regras de entrada
- validar impacto dos lancamentos nas demais visoes

---

## Fluxo Geral de Dados

```text
Dashboard
  |
  |-- BudgetContext
  |     |-- GET /api/budget?month=&year=
  |     |-- POST/PUT /api/budget
  |     |-- POST /api/expenses
  |     `-- GET /api/budget/year?year=
  |
  `-- apiClient
        |-- request interceptor (reais -> centavos)
        `-- response interceptor (centavos -> reais)
```

---

## Componentes Macro

Componentes de orquestracao do dashboard:

- `ViewToggle`
- `MonthNavigator`
- `DailyView`
- `MonthlyView`
- `YearlyView`
- `BudgetSetupWizard`
- `CaptureMenu`
- `BudgetNotConfigured`
