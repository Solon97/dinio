# Concerns

## High Priority

### 1. Monetary conversion depends on manual config updates

**Evidence:** `apps/web-app/types/monetary.ts` maps request/response fields via static config objects.
**Risk:** new monetary fields can bypass conversion if config not updated.
**Impact:** wrong persisted values (reais vs cents mismatch) and subtle financial regressions.
**Suggested fix:** add guard tests that fail when route payload includes monetary field not mapped in conversion config.

### 2. Shared package workflow has stale-build risk

**Evidence:** `packages/shared` requires explicit `pnpm build`; consumers rely on generated `dist` exports.
**Risk:** developer changes source but forgets rebuild before running dependent apps.
**Impact:** local behavior diverges from source expectations.
**Suggested fix:** add watch/build helper script and pre-dev warning in root workflow docs.

### 3. Bot internal auth uses single shared secret scope

**Evidence:** bot routes under `apps/web-app/app/api/bot/**` gate by shared internal secret.
**Risk:** one leaked secret enables broad access to all bot operations.
**Impact:** high blast radius across expense simulation/registration and user resolution endpoints.
**Suggested fix:** split scopes per endpoint group or add signed short-lived token + request auditing.

## Medium Priority

### 4. Test coverage enforcement is weak in critical finance paths

**Evidence:** no explicit thresholds found for Vitest and c8; no dedicated test suite for `packages/shared`.
**Risk:** regressions in month-id/invoice-cycle and budget calculations can pass CI without visibility.
**Impact:** incorrect balances/invoice attribution in production.
**Suggested fix:** define minimum coverage thresholds and add shared-package unit tests.

### 5. QStash queue constraint easy to regress

**Evidence:** queue code warns delay/notBefore cannot be used with enqueue flow.
**Risk:** future refactors can reintroduce invalid enqueue options.
**Impact:** batch enqueue failures (HTTP 400) and lost email sends.
**Suggested fix:** encapsulate enqueue payload in helper with forbidden fields excluded at type level.

### 6. Session encryption key rotation strategy absent

**Evidence:** whatsapp handler requires fixed 64-char `SESSION_ENCRYPTION_KEY`; decrypt failures fallback to new empty session.
**Risk:** rotating key invalidates all active conversations immediately.
**Impact:** UX interruption and potential multi-step flow resets.
**Suggested fix:** implement dual-key decrypt during rotation window.

## Low Priority

### 7. Supabase migration workflow isolated from app code changes

**Evidence:** `supabase-migrations` CI runs only when `supabase/**` changes.
**Risk:** app code can depend on schema assumptions not validated by migration workflow in same PR.
**Impact:** integration drift between code and schema until merged.
**Suggested fix:** add optional app-level checks that validate required schema artifacts in CI.

### 8. Locale hardcoding in user-facing errors

**Evidence:** multiple API errors in Portuguese literals.
**Risk:** harder internationalization path if product expands language support.
**Impact:** future refactor cost.
**Suggested fix:** centralize messages in locale-aware layer when i18n becomes roadmap item.
