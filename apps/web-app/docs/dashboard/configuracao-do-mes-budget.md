# Configuracao do Mes (Budget)

Este documento detalha as regras da configuracao mensal de orcamento no dashboard.

## Objetivo

A configuracao mensal define toda a base de calculo das visoes Diario, Mensal e Anual.

Sem configuracao do mes:

- o dashboard mostra `BudgetNotConfigured`
- as visoes Diario e Mensal nao exibem dados financeiros

## Quando o usuario configura

A configuracao acontece no `BudgetSetupWizard`:

- de forma inicial, quando o mes nao esta configurado
- em modo edicao, no mes atual, pela visao Mensal (botao de editar)

## Etapas do wizard

## 1. Receitas Fixas

Titulo na interface: `1. Receitas Fixas`.

Regras:

- cada receita tem nome e valor
- o total de receitas do mes e calculado a partir da soma das fontes
- a etapa exige valores validos para avancar

## 2. Cartoes de Credito

Titulo na interface: `2. Cartoes de Credito`.

Regras:

- cada cartao possui nome, dia de vencimento e cor
- cartoes sem nome bloqueiam o avancar

Regra do primeiro mes de uso:

- quando nao existe mes anterior configurado, aparece a secao `Total da fatura a pagar neste mes`
- esse valor representa saldo acumulado anterior ao uso do Dinio
- o sistema compoe esse saldo no planejamento do mes

## 3. Gastos Fixos

Titulo na interface: `3. Gastos Fixos`.

Regras:

- gastos podem ser vinculados a cartao ou ser avulsos (`Debito / Boleto / PIX`)
- classificacao de tipo: `Obrigatorio` ou `Dispensavel`
- existe importacao em massa (`Adicionar Varios`) com parser de linhas
- parcelamentos sao suportados com metadados de parcela atual e total

## 4. Distribuicao

Titulo na interface: `4. Distribuicao`.

Regras:

- `Gastos Fixos` ficam bloqueados como parte automatica
- o usuario ajusta o equilibrio entre `Dia a Dia` e `Reserva` via slider
- os percentuais finais sempre representam distribuicao completa da renda

Regra de mes parcial:

- em configuracao inicial no meio do mes, o fluxo permite definir quanto ainda deseja gastar ate o fim do periodo
- o sistema transforma esse alvo em referencia diaria para os dias restantes

## Regras de alocacao

A renda e distribuida em tres blocos:

- `Gastos Fixos`
- `Dia a Dia`
- `Reserva`

Saude financeira (gastos fixos / renda):

- menor que 50%: saudavel
- entre 50% e 70%: atencao
- maior que 70%: critico

## Persistencia e atualizacao

Fluxo funcional de dados:

- criar configuracao: `POST /api/budget`
- atualizar configuracao existente: `PUT /api/budget`
- carregar configuracao do periodo: `GET /api/budget?month=&year=`

Cache:

- o frontend usa cache em `localStorage` com TTL
- ao salvar configuracao, o cache mensal e anual relacionado e invalidado

## Dependencias para outras visoes

A configuracao do mes alimenta:

- visao diaria: medias, saldo, historico e insights
- visao mensal: distribuicao, gastos fixos, agenda e insights
- visao anual: consolidacoes por mes e totais do ano
