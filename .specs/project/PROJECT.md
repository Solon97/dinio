# Dinio

**Vision:** Construir controle financeiro mensal simples, humano e sem julgamento para brasileiros, com visao clara de saldo disponivel real no dia a dia.
**For:** Pessoas no Brasil que querem organizar renda, gastos fixos e gastos diarios com baixa friccao.
**Solves:** Falta de visibilidade pratica do dinheiro disponivel ao longo do mes e dificuldade de manter disciplina financeira em fluxo cotidiano.

## Goals

- Atingir confiabilidade alta no calculo de saldo e projecao mensal (meta: zero bugs criticos de conversao monetaria e ciclo de fatura em releases).
- Reduzir friccao de uso diario por multicanal (web + WhatsApp) com operacoes principais em poucos passos (meta: registrar gasto/simular gasto rapidamente sem abandonar contexto).
- Sustentar crescimento com aquisicao e billing rastreaveis (meta: eventos de funil completos de diagnostico ate trial iniciado).

## Tech Stack

**Core:**

- Framework web: Next.js 15 + React 19
- Service bot: Fastify 5
- Language: TypeScript 5.9
- Database/Auth: Supabase
- Billing: Stripe

**Key dependencies:**

- `@supabase/supabase-js`, `@supabase/ssr`
- `stripe`
- `@upstash/qstash` e `@upstash/redis`
- `@openrouter/sdk`
- `zod`

## Scope

**v1 inclui:**

- Dashboard web com orcamento mensal, gastos diarios e gastos fixos.
- Fluxo de checkout/trial com Stripe e sincronizacao de acesso.
- Integracao WhatsApp para intents financeiras (registrar gasto, simular, consultar agenda/limite diario).
- Rotinas de email transacional (welcome/reactivacao) com processamento em fila.
- Base compartilhada de regras de mes/ciclo de fatura em `dinio-shared`.

**Explicitamente fora de escopo (agora):**

- Suporte multi-idioma completo.
- Multi-tenant enterprise, RBAC avancado e permissoes granulares por equipe.
- Motor de recomendacao financeira sofisticado com ML proprietario.

## Constraints

- Timeline: produto ja em producao; mudancas precisam ser incrementais e seguras.
- Technical: corretude financeira e conversao reais<->centavos nao podem regredir.
- Resources: monorepo com dois servicos em producao exige coordenacao entre web, bot e migrations.
