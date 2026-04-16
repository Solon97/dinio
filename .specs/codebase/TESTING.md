# Testing Infrastructure

## Test Frameworks

- Unit/Integration (web-app): Vitest 4.1.0
- E2E (web-app): Playwright 1.58.1
- Unit/Integration (whatsapp-handler): Node test runner + c8
- Coverage tooling: c8 in whatsapp-handler; no explicit threshold gate in web-app Vitest config

## Test Organization

**Location:**
- Web app unit tests are mostly co-located (`*.test.ts`) plus domain tests under `app/api/budget/**`.
- Web app E2E tests in `apps/web-app/tests/e2e/`.
- WhatsApp handler tests in `apps/whatsapp-handler/test/**/*.test.ts`.

**Naming:**
- Unit: `*.test.ts`
- E2E: `*.spec.ts` (Playwright)

**Structure:**
- Unit tests focus on helpers, domain services/use-cases, and selected UI calculations.
- E2E validates auth/bootstrap paths.
- WhatsApp tests target contexts/plugins and intent handlers.

## Testing Patterns

### Unit Tests

**Approach:** deterministic business logic tests with explicit fixtures and expected outputs.
**Location:** `apps/web-app/libs/*.test.ts`, `apps/web-app/app/api/budget/application/**/*.test.ts`, `apps/whatsapp-handler/test/contexts/**/*.test.ts`.

### Integration Tests

**Approach:** mixed in Node tests for whatsapp-handler contexts and API-bound logic; some web tests touch route/use-case boundaries.
**Location:** same folders above; no dedicated integration-only directory.

### E2E Tests

**Approach:** Playwright browser scenarios.
**Location:** `apps/web-app/tests/e2e/`.

## Test Execution

**Commands:**
- Root: `pnpm build` and `pnpm dev` (no root test script).
- Web app: `npm run test`, `npm run test:e2e`, `npm run test:e2e:ui`, `npm run test:e2e:headed`.
- WhatsApp handler: `npm run test` (build + TS compile test project + c8 node test).

**Configuration:**
- Vitest config in `apps/web-app/vitest.config.ts`.
- Playwright config in `apps/web-app/playwright.config.ts`.
- WhatsApp test compilation config in `apps/whatsapp-handler/test/tsconfig.json`.

## Coverage Targets

- Current: coverage command exists only in whatsapp-handler via c8; no enforced thresholds discovered.
- Goals: not declared in repository-level docs.
- Enforcement: Husky note in web-app instructions requires `npm run test` green before commit.

## Test Coverage Matrix

| Code Layer | Required Test Type | Location Pattern | Run Command |
| ---------- | ------------------ | ---------------- | ----------- |
| Shared month/invoice utilities | unit | `packages/shared/src/**/*.ts` (currently no dedicated tests found) | `pnpm --filter @solon97/dinio-shared build` (build-only today) |
| Web business logic (budget/services/helpers) | unit | `apps/web-app/app/api/budget/**/*.test.ts`, `apps/web-app/libs/*.test.ts` | `cd apps/web-app && npm run test` |
| Web UI calculations and component helpers | unit | `apps/web-app/components/**/*.test.ts` | `cd apps/web-app && npm run test` |
| Web route handler behavior | unit/integration | `apps/web-app/app/api/**/*.test.ts` | `cd apps/web-app && npm run test` |
| Web end-to-end flows | e2e | `apps/web-app/tests/e2e/**/*.spec.ts` | `cd apps/web-app && npm run test:e2e` |
| WhatsApp intent/session/messaging | unit/integration | `apps/whatsapp-handler/test/**/*.test.ts` | `cd apps/whatsapp-handler && npm run test` |
| Supabase SQL migration safety | none (automated tests not found) | `supabase/migrations/*.sql` | manual/CI migration workflow |

## Parallelism Assessment

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
| --------- | -------------- | --------------- | -------- |
| Playwright E2E | Yes (local default), reduced in CI | Browser/context isolation per worker | `apps/web-app/playwright.config.ts` (`fullyParallel: true`, CI workers=1) |
| Vitest unit | Likely yes for pure modules; not explicitly configured | File-based execution with mocked deps | `apps/web-app/vitest.config.ts` + co-located unit tests |
| Node test + c8 (whatsapp-handler) | Partial | Depends on shared env/config; no explicit worker strategy | `apps/whatsapp-handler/package.json` test script |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Change in single web module with unit tests | `cd apps/web-app && npm run test` |
| Full | Change touching UI flow or whatsapp handler | `cd apps/web-app && npm run test && npm run test:e2e` and/or `cd apps/whatsapp-handler && npm run test` |
| Build | Before merge/release branch | `pnpm build` (+ service-specific tests above) |
