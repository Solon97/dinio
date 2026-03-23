# Agent Instructions - Dinio App

## Project Scope
- Dinio is a personal finance SaaS focused on monthly budget control and daily expense tracking.
- Core stack: Next.js 15 (App Router), React 19, TypeScript, Supabase, Stripe, Tailwind v4 + DaisyUI 5.
- For dashboard work, read `docs/dashboard.md` first.

## Build And Test
- Install deps: `npm install`
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Unit tests: `npm run test`
- E2E tests: `npm run test:e2e`
- Production build: `npm run build`
- Husky blocks commits when tests fail, so keep `npm run test` green before finishing a task.

## Architecture
- Budget backend follows Clean Architecture in `app/api/budget/`:
  - `presentation/`: HTTP handlers/controllers
  - `application/use-cases/`: orchestration and business flows
  - `application/services/`: synchronization logic
  - `domain/repositories/`: interfaces/contracts
  - `infrastructure/`: Supabase implementations
- Frontend dashboard UI lives in `components/app/dashboard/`.
- Global budget state and orchestration live in `contexts/BudgetContext.tsx`.
- Domain and API contracts are centered in `types/finance.ts`, `types/budget.ts`, and `types/monetary.ts`.

## Critical Conventions
- Frontend values are always in reais (decimal). Backend stores cents.
- `libs/api.ts` interceptors convert automatically:
  - request: reais -> cents using `REQUEST_CONFIGS` in `types/monetary.ts`
  - response: cents -> reais using `MONETARY_CONFIG` in `types/monetary.ts`
- Never handle cents directly in React components or `BudgetContext`.
- If you add a monetary field, update the matching config in `types/monetary.ts`.
- Temporary wizard IDs use `temp-{timestamp}-{random}` and are resolved server-side.

## Next.js 15 And Supabase Rules
- Always `await` Next.js async APIs in server code: `headers()`, `cookies()`, `params`.
- Dynamic route params must be typed as Promise and awaited.
- Server-side Supabase client must be awaited: `const supabase = await createClient()` from `@/libs/supabase/server`.
- Client-side Supabase client is synchronous: `createClient()` from `@/libs/supabase/client`.

## Styling Conventions
- Tailwind v4 is CSS-first: configure theme in `app/globals.css` via `@theme` and custom utilities via `@utility`.
- Do not move theme config to `tailwind.config.js`.

## Common Pitfalls
- Missing `await` for Next.js 15 APIs causes runtime/build issues.
- Incorrect params typing in dynamic routes causes type errors.
- Crossing Client/Server component boundaries incorrectly causes build failures.
- Missing env vars breaks auth, Supabase, or Stripe flows.

## Dashboard Onboarding Flow
- Do not run onboarding tours before budget setup.
- Do not run onboarding tours inside `BudgetSetupWizard`.
- New users see a checklist empty state in dashboard views (`week` and `month`) with this order:
  - connect WhatsApp
  - configure month
- After the month is configured, onboarding starts from post-setup phases only: daily -> monthly -> yearly.
- Reuse `getWhatsappBindLink` from `libs/whatsappLink.ts` for all WhatsApp bind CTAs.

## Acquisition Tracking Conventions
- Keep event names in `snake_case` and use `diagnosis_*` prefix for diagnosis funnel events.
- Use only `diagnosis_completed` (never `diagnostic_completed`).
- Do not use `qualified_lead` in acquisition funnel instrumentation.
- Include explicit `utm_source`, `utm_medium`, `utm_campaign`, and `utm_content` string properties on conversion events (`diagnosis_cta_clicked`, `checkout_initiated`, `trial_started`).
- Trigger Meta `CompleteRegistration` on diagnosis CTA click and Meta `Subscribe` only after successful trial start confirmation in Stripe webhook.

## Checkout Tracking Continuity
- For diagnosis -> signin -> checkout flows, persist checkout context using hybrid precedence: query params > transient cookie > sessionStorage.
- Context must include: `plan`, `funnel_id`, `utm_source`, `utm_medium`, `utm_campaign`, and `utm_content`.
- Forward these params through OAuth callback redirects and to `/checkout`.
- Include `funnel_id` in `diagnosis_cta_clicked`, `checkout_signin_viewed`, and `checkout_initiated`.
- Propagate `funnel_id` to Stripe checkout metadata and include it in webhook-side PostHog events (`trial_started`, `subscription_created`).
- Use PostHog API host (`NEXT_PUBLIC_POSTHOG_API_HOST`) for server-side event ingestion.

## dinio-shared

`dinio-shared` is installed and available. Import from `'dinio-shared'`.

- **Invoice cycle logic**: always use `dinio-shared` — `computeInvoiceDueMonthIdForDate`, `getEffectiveClosingDay`, `formatMonthIdLabel`.
- **Month ID arithmetic**: always use `dinio-shared` — `computeMonthId`, `addMonths`, `getCurrentMonthId`, etc.
- Never re-implement invoice cycle or month ID logic locally. If a needed function is missing, add it to `packages/shared/` and run `pnpm build` there — changes are available immediately via workspace.

## Key Reference Files
- `docs/dashboard.md`
- `libs/api.ts`
- `types/monetary.ts`
- `contexts/BudgetContext.tsx`
- `app/api/budget/`
- `libs/creditCardInvoice.ts` (invoice cycle helpers built on top of dinio-shared)