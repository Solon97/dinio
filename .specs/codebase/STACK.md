# Tech Stack

**Analyzed:** 2026-04-16

## Core

- Framework orchestration: Turborepo (`turbo run build`, `turbo run dev`)
- Language: TypeScript 5.9.x across services
- Runtime: Node.js (required by Next.js 15 and Fastify 5)
- Package manager: pnpm 10.32.1 (workspace monorepo)

## Frontend (apps/web-app)

- UI framework: Next.js 15.4.10 + React 19
- Styling: Tailwind CSS 4.1.10 + DaisyUI 5.0.5
- State management: React Context (`contexts/BudgetContext.tsx`, `contexts/UserContext.tsx`)
- Forms and validation: Zod 3.24.1 in API routes
- Charts and UI libs: Recharts, Headless UI, Lucide, React Hot Toast

## Backend

- Web app API style: Next.js App Router route handlers (REST-like endpoints in `app/api/**`)
- WhatsApp handler API style: Fastify routes (`src/routes/**`)
- Database and auth: Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- ORM/query layer: Supabase client + SQL/RPC via migrations and route-level access

## Shared Package

- Package: `@solon97/dinio-shared` (workspace alias `dinio-shared`)
- Purpose: month-id arithmetic and credit card invoice cycle consistency
- Build: `tsc` in `packages/shared`

## Testing

- Unit (web): Vitest 4.1.0
- E2E (web): Playwright 1.58.1
- Unit/integration (whatsapp-handler): Node test runner + c8 coverage

## External Services

- Billing: Stripe
- Analytics: PostHog, Meta events
- Email: Resend
- Queue/cron: Upstash QStash
- Messaging: WhatsApp Cloud API (Meta Graph)
- LLM routing: OpenRouter
- Session store: Upstash Redis
- Support chat: Crisp

## Development Tools

- Linting: `next lint` in web-app
- Build: `next build` (web), `tsc` (whatsapp-handler/shared), `turbo run build` (root)
- Local dev: `next dev`, Fastify watch flow via `concurrently` + TypeScript watch
- Git hooks: Husky in web-app
