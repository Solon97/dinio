# Agent Instructions - Dinio

## What Is Dinio

Dinio is a personal finance SaaS built for Brazilians, focused on monthly budget control and daily expense tracking.

The core product helps users:
- Configure monthly income, fixed expenses, and reserve goals
- Track daily spending with minimum friction
- Understand their real available balance at any point in the month
- Interact with their finances through WhatsApp for quick, low-friction actions

Dinio is built around the idea that financial control should be simple, human, and non-judgmental.

## Monorepo Structure

This repository is a pnpm + Turborepo monorepo. It contains two independent services and one shared package:

| Folder | Description |
|---|---|
| `apps/web-app/` | The main Next.js web application — core product experience |
| `apps/whatsapp-handler/` | Fastify service for WhatsApp integration via the Meta Graph API |
| `packages/shared/` | Shared TypeScript utilities published to GitHub Packages as `@solon97/dinio-shared` |
| `supabase/` | Supabase CLI config (`config.toml`), database migrations, and SQL snippets — shared infrastructure |

Root files: `pnpm-workspace.yaml`, `turbo.json`, `package.json`.

## CI/CD

### Supabase Migrations — `.github/workflows/supabase-migrations.yml`

- Runs on push to `main` or `develop`, **only when files inside `supabase/` change** (`paths: supabase/**`).
- Changes to `apps/web-app/`, `apps/whatsapp-handler/`, or `packages/` do **not** trigger this workflow.
- Environments: `main` → `Production`, `develop` → `Preview`.
- Secrets required: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_ID`.
- After `supabase db push`, notifies Vercel via `vercel/repository-dispatch/actions/status@v1`.

---

## When To Use Each Set Of Instructions

### Working on `apps/web-app/`
If the task involves any of the following, follow the instructions in `apps/web-app/.github/copilot-instructions.md`:
- Next.js pages, layouts, or API routes
- React components (dashboard, marketing, shared)
- Supabase data access or authentication
- Stripe billing and subscription flows
- Budget, expense, or financial domain logic
- BudgetContext or any frontend state management
- Monetary conversion between reais and cents
- Tailwind / DaisyUI styling
- Unit tests under `apps/web-app/` or E2E tests with Playwright

### Working on `apps/whatsapp-handler/`
If the task involves any of the following, follow the instructions in `apps/whatsapp-handler/.github/copilot-instructions.md`:
- WhatsApp webhook handling
- Fastify routes or plugins
- AI-powered intent parsing from natural language messages
- Session state management in Upstash Redis
- WhatsApp message formatting and UX
- Integration between WhatsApp and the Dinio main app API

### Working on `packages/shared/`
If the task involves invoice cycle calculations, month ID arithmetic, or any logic that must be consistent across both services, edit `packages/shared/` directly.
After changes: run `pnpm build` inside `packages/shared/`. Both consuming services reference it via `workspace:*` and pick up changes immediately — no publish or version bump needed.

---

## dinio-shared Package

`dinio-shared` is a local workspace package (`packages/shared/`). Both services import it via the alias `dinio-shared` using `workspace:*` — no external registry involved.

### Purpose

Centralises logic that must behave identically in both services — primarily invoice cycle calculations and month ID (YYYYMM) arithmetic.

### Exports (imported as `'dinio-shared'`)

**Invoice cycle:**

| Export | Description |
|---|---|
| `computeInvoiceDueMonthIdForDate(date, dueDay, closingDay)` | YYYYMM of the invoice cycle an expense belongs to |
| `getEffectiveClosingDay(closingDay, dueDay)` | Closing day with fallback (dueDay − 7) |
| `formatMonthIdLabel(monthId)` | `"Janeiro 2026"` from YYYYMM |

**Month ID utilities:**

| Export | Description |
|---|---|
| `computeMonthId(year, month)` | YYYYMM from year + 0-based month |
| `computeMonthIdFromDate(date)` | YYYYMM from `Date` |
| `computeMonthIdFromString(dateString)` | YYYYMM from `"YYYY-MM-DD"` |
| `parseMonthId(monthId)` | `{ year, month }` from YYYYMM |
| `getCurrentMonthId()` | Current month as YYYYMM |
| `addMonths(monthId, n)` | Add or subtract months |
| `getPreviousMonthId(monthId)` / `getNextMonthId(monthId)` | Adjacent months |
| `isMonthInPast` / `isCurrentMonth` / `isMonthInFuture` | Month comparisons |
| `isValidMonthId(monthId)` | Validate YYYYMM (years 2020–2100) |

Sub-entry `'dinio-shared/invoice-cycle'` re-exports all of the above.

### Build
- Run `pnpm build` (tsc) inside `packages/shared/` after any source change
- Consuming apps resolve the package locally via the pnpm workspace — no publish step needed

---

## Shared Principles

Regardless of which service you are working in:
- Dinio's brand voice is: direct, human, welcoming, judgment-free, and practically oriented.
- Financial logic is always the most critical path — correctness takes precedence over everything else.
- Both services are production systems used by real users. Treat changes with care.
- Follow the SOLID principles and clean code conventions described in each service's own instructions file.

---

## Mandatory: Keep Instructions Up to Date

**After completing any task, you must update the relevant instruction files if the task introduced changes to architecture, conventions, file structure, or workflows.**

Files to keep current:
- `CLAUDE.md` (root) and `.github/copilot-instructions.md` (root) — monorepo structure, shared package, cross-service conventions
- `apps/web-app/CLAUDE.md` and `apps/web-app/.github/copilot-instructions.md` — web app architecture, patterns, pitfalls
- `apps/whatsapp-handler/CLAUDE.md` and `apps/whatsapp-handler/.github/copilot-instructions.md` — WhatsApp service architecture, flows, pitfalls
- `packages/shared/README.md` — shared package publishing and development workflow

When to update:
- New architectural pattern or layer introduced
- New convention established (naming, file placement, data flow)
- Existing convention changed or removed
- New pitfall discovered during the task
- File structure changed
- Build, test, or deploy workflow changed
