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

This repository contains two independent services and one shared package:

| Folder | Description |
|---|---|
| `dinio-web-app/` | The main Next.js web application — core product experience |
| `dinio-whatsapp-handler/` | Fastify service for WhatsApp integration via the Meta Graph API |
| `dinio-shared/` | Shared TypeScript utilities published to GitHub Packages as `@solon97/dinio-shared` |

---

## When To Use Each Set Of Instructions

### Working on `dinio-web-app/`
If the task involves any of the following, follow the instructions in `dinio-web-app/.github/copilot-instructions.md`:
- Next.js pages, layouts, or API routes
- React components (dashboard, marketing, shared)
- Supabase data access or authentication
- Stripe billing and subscription flows
- Budget, expense, or financial domain logic
- BudgetContext or any frontend state management
- Monetary conversion between reais and cents
- Tailwind / DaisyUI styling
- Unit tests under `dinio-web-app/` or E2E tests with Playwright

### Working on `dinio-whatsapp-handler/`
If the task involves any of the following, follow the instructions in `dinio-whatsapp-handler/.github/copilot-instructions.md`:
- WhatsApp webhook handling
- Fastify routes or plugins
- AI-powered intent parsing from natural language messages
- Session state management in Upstash Redis
- WhatsApp message formatting and UX
- Integration between WhatsApp and the Dinio main app API

### Working on `dinio-shared/`
If the task involves invoice cycle calculations, month ID arithmetic, or any logic that must be consistent across both services, edit `dinio-shared/` directly.
After changes: bump `version` in `dinio-shared/package.json`, run `npm run build`, push a `v*` tag to trigger the GitHub Actions publish. Both consuming services must update their installed version.

---

## dinio-shared Package

`dinio-shared` is a TypeScript utility package published to GitHub Packages. Both services import it via the alias `dinio-shared`.

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

### Publishing
- Registry: GitHub Packages (`https://npm.pkg.github.com`)
- Build: `npm run build` (tsc) inside `dinio-shared/`
- Release: push a `v*` tag — GitHub Actions publishes automatically
- Consumers require `GITHUB_TOKEN` in their environment to install the package

---

## Shared Principles

Regardless of which service you are working in:
- Dinio's brand voice is: direct, human, welcoming, judgment-free, and practically oriented.
- Financial logic is always the most critical path — correctness takes precedence over everything else.
- Both services are production systems used by real users. Treat changes with care.
- Follow the SOLID principles and clean code conventions described in each service's own instructions file.
