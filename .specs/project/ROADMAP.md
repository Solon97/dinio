# Roadmap

**Current Milestone:** M1 - Reliability and Core Flow Hardening
**Status:** Planning

---

## M1 - Reliability and Core Flow Hardening

**Goal:** Garantir consistencia financeira ponta-a-ponta (web, bot, billing, cron) com observabilidade e testes suficientes para evolucao segura.
**Target:** Milestone concluido quando funis criticos tiverem cobertura adequada e concerns de alto risco mitigados.

### Features

**Monetary and Invoice Correctness Guardrails** - PLANNED

- Fortalecer testes para conversao monetaria e invariantes de ciclo de fatura.
- Cobrir regras de `dinio-shared` com suite dedicada.
- Evitar drift entre payloads de API e configs monetarias.

**Checkout and Subscription Continuity** - PLANNED

- Preservar contexto de atribuicao no fluxo diagnostico -> signin -> checkout.
- Garantir webhook Stripe idempotente e resiliente.
- Consolidar sinais de trial_started para analytics e onboarding.

**WhatsApp Session and Intent Robustness** - PLANNED

- Validar intents centrais com cenarios de erro e ambiguidade.
- Endurecer operacao de sessao (TTL, rotacao de chave, fallback seguro).
- Melhorar rastreabilidade de falhas em handler/dispatch.

**Email Queue Reliability** - PLANNED

- Proteger contrato de enqueue QStash sem delay/notBefore.
- Verificar deduplicacao e limites de lote em dispatch/process.
- Ampliar testes de elegibilidade welcome/reactivacao.

---

## M2 - Product Expansion and UX Momentum

**Goal:** Aumentar valor percebido no uso diario com experiencias mais inteligentes no dashboard e no WhatsApp.

### Features

**Advanced Financial Insights** - PLANNED
**Guided Monthly Planning Flows** - PLANNED
**Faster WhatsApp Multi-step Operations** - PLANNED

---

## Future Considerations

- Internacionalizacao do produto.
- Politicas de auth internas mais granulares para bot APIs.
- Automatizacao de validacao de schema x codigo em CI.
