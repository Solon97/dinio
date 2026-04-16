# Architecture

**Pattern:** Modular monorepo with two production services + one shared domain package.

## High-Level Structure

- `apps/web-app`: Next.js App Router application (marketing + authenticated app + API routes).
- `apps/whatsapp-handler`: Fastify service dedicated to WhatsApp inbound/outbound automation.
- `packages/shared`: Shared financial domain utilities used by both services.
- `supabase`: Infrastructure-as-SQL with versioned migrations and CLI config.

## Identified Patterns

### Monorepo Workspace Boundaries

**Location:** root `pnpm-workspace.yaml`, `turbo.json`, and package manifests.
**Purpose:** keep services independent but synchronized in one codebase.
**Implementation:** each app has own scripts/deps; root orchestrates build/dev.
**Example:** root `package.json` scripts call `turbo run build` and `turbo run dev`.

### Clean Architecture Slice for Budget Domain

**Location:** `apps/web-app/app/api/budget/`.
**Purpose:** isolate business rules from transport and persistence details.
**Implementation:** `presentation -> application/use-cases + services -> domain/repositories -> infrastructure`.
**Example:** controller logic in `presentation/controllers/BudgetController.ts` with repository contracts under `domain/repositories/`.

### Service-Oriented WhatsApp Pipeline

**Location:** `apps/whatsapp-handler/src/contexts/**` and `src/routes/webhook/`.
**Purpose:** parse natural language intents and execute deterministic financial actions.
**Implementation:** webhook route -> message router -> session context builder -> LLM intent parser -> intent dispatcher -> handler -> session persist.
**Example:** intent parser in `src/contexts/ai/intent-parser.ts`, handler dispatch in `src/contexts/intents/intent-dispatcher.ts`.

## Data Flow

### Stripe Checkout and Trial Activation

1. User starts checkout in web app.
2. Stripe sends webhook events to `app/api/webhook/stripe/route.ts`.
3. Route validates signature, updates profile/subscription state in Supabase.
4. Welcome trial email is sent via `libs/emails/welcomeTrialEmail.tsx` with dedupe based on profile fields.
5. Conversion events emitted to analytics (PostHog/Meta integration path).

### Email Cron Dispatch and Processing

1. Dispatch endpoint (`app/api/cron/email/dispatch/route.ts`) selects eligible users.
2. Jobs are enqueued to QStash queues via `app/api/cron/email/queue.ts`.
3. Processor endpoint (`app/api/cron/email/process/route.ts`) receives queued jobs.
4. Processor sends transactional email through Resend and marks sent timestamps.

### WhatsApp Conversational Processing

1. Webhook receives message in `apps/whatsapp-handler/src/routes/webhook/route.ts`.
2. Handler resolves Dinio user by phone and loads encrypted Redis session.
3. Intent parser (`OpenRouter`) classifies message and entities.
4. Dispatcher calls intent handler (`register_expense`, `simulate_expense`, etc).
5. Response sent to WhatsApp API; session history updated and saved with TTL.

## Code Organization

**Approach:** Hybrid domain/layered split.

- In `web-app`, API code is domain-oriented (`budget`, `expenses`, `notifications`) while UI is component-oriented (`components/app`, `components/marketing`, `components/shared`).
- In `whatsapp-handler`, contexts are capability-based (`session`, `ai`, `intents`, `messaging`, `dinio`, `whatsapp`).
- In `packages/shared`, utilities are grouped by invariant domain concerns (`invoice-cycle`, `month-id`).

## Module Boundaries

- Web app owns end-user UX, billing UX, and core API surface.
- WhatsApp handler owns message ingestion, intent interpretation, and bot orchestration.
- Shared package owns cross-service deterministic date/cycle rules.
- Supabase migrations own schema evolution for both services.
