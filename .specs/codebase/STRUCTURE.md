# Project Structure

**Root:** `/home/solon97/projects/dinio`

## Directory Tree

```text
dinio/
+-- apps/
|   +-- web-app/
|   |   +-- app/
|   |   +-- components/
|   |   +-- contexts/
|   |   +-- libs/
|   |   +-- tests/
|   |   `-- types/
|   `-- whatsapp-handler/
|       +-- src/
|       +-- test/
|       `-- prompts/
+-- packages/
|   `-- shared/
|       `-- src/
+-- supabase/
|   +-- migrations/
|   `-- snippets/
+-- package.json
+-- pnpm-workspace.yaml
`-- turbo.json
```

## Module Organization

### apps/web-app

**Purpose:** Product experience (marketing, dashboard, checkout, API).
**Location:** `apps/web-app`
**Key files:** `app/api/webhook/stripe/route.ts`, `contexts/BudgetContext.tsx`, `libs/api.ts`, `middleware.ts`.

### apps/whatsapp-handler

**Purpose:** WhatsApp bot integration and conversational intent orchestration.
**Location:** `apps/whatsapp-handler`
**Key files:** `src/routes/webhook/route.ts`, `src/contexts/ai/intent-parser.ts`, `src/contexts/session/chatSessionStore.ts`.

### packages/shared

**Purpose:** Shared deterministic financial utilities consumed by both services.
**Location:** `packages/shared`
**Key files:** `src/invoice-cycle/index.ts`, `src/invoice-cycle/month-id.ts`, `src/index.ts`.

### supabase

**Purpose:** Shared database infra and migration history.
**Location:** `supabase`
**Key files:** `config.toml`, `migrations/*.sql`.

## Where Things Live

**Expense lifecycle:**
- UI: `apps/web-app/components/app/dashboard/`
- API: `apps/web-app/app/api/expenses/`
- Types: `apps/web-app/types/finance.ts`

**Budget configuration and projections:**
- API domain slice: `apps/web-app/app/api/budget/`
- Client state: `apps/web-app/contexts/BudgetContext.tsx`

**Checkout and subscription:**
- Checkout page and flow: `apps/web-app/app/(app)/checkout/`
- Stripe integration: `apps/web-app/libs/stripe.ts`
- Stripe webhook: `apps/web-app/app/api/webhook/stripe/`

**WhatsApp conversational flow:**
- Incoming webhook: `apps/whatsapp-handler/src/routes/webhook/`
- Router + intents: `apps/whatsapp-handler/src/contexts/messaging/` and `src/contexts/intents/`
- Session memory: `apps/whatsapp-handler/src/contexts/session/`

**Notifications and cron email jobs:**
- API routes: `apps/web-app/app/api/notifications/`
- Cron dispatch/process: `apps/web-app/app/api/cron/email/`

## Special Directories

**`apps/web-app/docs/`**
- Purpose: product and dashboard behavior references.
- Examples: `dashboard.md`.

**`apps/whatsapp-handler/prompts/`**
- Purpose: LLM prompt templates for intent parsing.
- Examples: `whatsapp-intent-parser.txt`.

**`supabase/snippets/`**
- Purpose: ad-hoc SQL snippets for manual diagnostics.
- Examples: `Delete All.sql`.
