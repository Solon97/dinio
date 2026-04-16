# Captura de Gastos

Este documento detalha o fluxo de captura de gastos no dashboard.

## Objetivo

Permitir registro rapido de movimentacoes sem sair da tela principal.

## Componente

- `CaptureMenu` (botao flutuante)

Ao abrir o modal:

- uma entrada inicial e criada automaticamente
- o usuario pode adicionar ate 10 entradas na mesma sessao
- cada entrada possui seletor proprio entre `Diario` e `Fixo / Parcelado`

## Modo Diario (por entrada)

Campos principais:

- valor
- descricao
- categoria
- data
- cartao de credito (opcional)
- fatura (obrigatoria quando cartao e selecionado)

Regra de reembolso/estorno:

- opcao `E um reembolso ou estorno?`
- quando marcada, o valor e registrado como negativo

Validacoes funcionais:

- valor deve ser maior que zero
- descricao deve ter tamanho minimo
- data obrigatoria
- se cartao for escolhido, fatura tambem deve ser escolhida

## Modo Fixo / Parcelado (por entrada)

Campos principais:

- nome
- valor
- tipo (`Obrigatorio` ou `Dispensavel`)
- forma de pagamento (`Debito / PIX` ou `Cartao de Credito`)
- cartao (obrigatorio quando forma for cartao)
- parcelamento (opcional)
- mes de inicio

Validacoes funcionais:

- nome obrigatorio com tamanho minimo
- valor maior que zero
- cartao obrigatorio quando pagamento por cartao
- quantidade minima quando parcelado

## Regras de periodo

- gastos fixos por esse fluxo sao criados para meses futuros (janela de meses disponivel no seletor)
- despesas diarias respeitam restricao de data minima baseada no estado de configuracao anterior

## Efeitos apos salvar

Fluxo de envio em batch:

- a validacao roda por entrada
- o envio e sequencial (na ordem da lista)
- se uma entrada falhar, o processo para nessa entrada
- entradas ja enviadas com sucesso ficam marcadas como enviadas e nao sao reenviadas

Despesa diaria:

- cria lancamento em `/api/expenses`
- invalida cache do periodo afetado e atualiza dados

Gasto fixo:

- cria lancamento em `/api/fixed-expenses`
- atualiza dados de planejamento associados ao mes alvo

## Relacao com outras visoes

Os registros criados em captura impactam:

- visao diaria: medias, saldo, historico e categorias
- visao mensal: lista de fixos, agenda e insights
- visao anual: consolidacao dos meses com dados
