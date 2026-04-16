# Project State

**Last updated:** 2026-04-16

## Decisions

- Projeto inicializado como brownfield seguindo fluxo spec-driven: mapeamento de codebase + docs de projeto.
- Monorepo tratado como produto unico com tres blocos de ownership: `web-app`, `whatsapp-handler`, `packages/shared`.
- M1 focado em confiabilidade e corretude financeira antes de expansao funcional.

## Blockers

- Nenhum blocker tecnico bloqueando inicializacao de planejamento.

## Lessons

- Risco de regressao financeira concentra em interfaces entre conversao monetaria, ciclo de fatura e payloads de API.
- Fluxos assincronos (QStash + webhooks) precisam contratos mais rigidos para evitar falha silenciosa.

## TODOs

- Criar primeira feature spec em `.specs/features/` para "Monetary and Invoice Correctness Guardrails".
- Definir baseline de cobertura e comandos de gate obrigatorios por area.
- Priorizar mitigacoes dos concerns de alto risco documentados em `.specs/codebase/CONCERNS.md`.

## Deferred Ideas

- i18n de mensagens de erro.
- Escopo de auth granular para bot APIs.
- Pipeline dedicado para validacao de drift schema/codigo.

## Preferences

- User language preference: portugues (pt-BR).
