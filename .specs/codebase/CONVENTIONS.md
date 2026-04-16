# Code Conventions

## Naming Conventions

**Files:**
- Route handlers: `route.ts` under App Router folders (`app/api/**`).
- React components: PascalCase filenames (`ButtonCheckout.tsx`, `NotificationBell.tsx`).
- Utility modules: camelCase filenames (`checkoutTracking.ts`, `creditCardInvoice.ts`).
- Tests: mostly `*.test.ts`; Playwright uses `*.spec.ts`.

**Functions/Methods:**
- Verb-oriented camelCase (`computeInvoiceDueMonthIdForDate`, `requireBotInternalSecret`, `buildIntentContext`).
- Parsing/validation helpers are explicit (`safeParse`, `superRefine`, `isValidMonthId`).

**Variables:**
- camelCase for mutable and local values.
- Descriptive domain terms (`invoiceDueMonthId`, `welcomeEmailSentAt`, `remainingDailyBudget`).

**Constants:**
- UPPER_SNAKE_CASE for immutable runtime/config constants (`SESSION_TTL_SECONDS`, `MAX_HISTORY_SIZE`).
- Config maps in uppercase objects (`REQUEST_CONFIGS`, `MONETARY_CONFIG`).

## Code Organization

**Imports:**
- Web app prefers alias import root `@/` for internal modules.
- External deps imported first, then internal modules.

**File structure pattern:**
- Route files: schema/guards -> auth -> use-case call -> typed response.
- Context/service files: helper declarations -> core function exports -> private helpers.

## Type Safety and Contracts

- Strong TypeScript typing across repo.
- Zod used for request validation in both services.
- Monetary fields rely on typed conversion config in `apps/web-app/types/monetary.ts`.
- Shared package exposes typed utilities via explicit `exports` map in `packages/shared/package.json`.

## Error Handling

- API handlers use `try/catch` with explicit HTTP status returns (400/401/404/422/500).
- Validation errors return flattened payloads for client handling.
- WhatsApp flow falls back gracefully when session decrypt fails (new session path).

## Domain Conventions

- Frontend values in reais (decimal); persistence in cents (integer).
- Month IDs are canonical `YYYYMM` and should come from `dinio-shared` utilities.
- Financial correctness prioritized over UI convenience.

## Comments and Documentation

- Comments are sparse and mostly explain non-obvious constraints.
- Architecture and pitfalls documented in `CLAUDE.md` and `.github/copilot-instructions.md` files.
- Migration history in `supabase/migrations/` is source of truth for schema evolution.
