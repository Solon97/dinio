# External Integrations

## Database and Identity

**Service:** Supabase
**Purpose:** authentication, relational data storage, and RPC access for finance domain.
**Implementation:** `apps/web-app/libs/supabase/`, Next.js API routes under `apps/web-app/app/api/**`, schema in `supabase/migrations/`.
**Configuration:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
**Authentication:** Supabase Auth session and service-role key for privileged server operations.

## Billing and Subscription

**Service:** Stripe
**Purpose:** checkout, trial/subscription lifecycle, webhook-driven entitlement updates.
**Implementation:** `apps/web-app/libs/stripe.ts`, checkout page in `apps/web-app/app/(app)/checkout/`, webhook in `apps/web-app/app/api/webhook/stripe/route.ts`.
**Configuration:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and price IDs in app config.
**Authentication:** API key + webhook signature validation.

## Email Delivery

**Service:** Resend
**Purpose:** transactional lifecycle emails (welcome trial, reactivation, auth-related notifications).
**Implementation:** `apps/web-app/libs/emails/`, `apps/web-app/libs/resend.ts`, cron processing route in `app/api/cron/email/process/route.ts`.
**Configuration:** `RESEND_API_KEY` plus sender/reply-to config.
**Authentication:** Resend API key.

## Queue and Cron Orchestration

**Service:** Upstash QStash
**Purpose:** asynchronous queueing for batched email workloads.
**Implementation:** `apps/web-app/app/api/cron/email/queue.ts`, dispatch route `app/api/cron/email/dispatch/route.ts`, process route `app/api/cron/email/process/route.ts`.
**Configuration:** `QSTASH_TOKEN`, signing keys, base domain env.
**Authentication:** QStash signature verification (`verifySignatureAppRouter`) with controlled local fallback.

## Analytics and Attribution

### PostHog

**Purpose:** product and acquisition funnel analytics.
**Location:** `apps/web-app/libs/posthog.ts`, `apps/web-app/libs/posthogServer.ts`.
**Authentication:** API key and host configuration.

### Meta Conversions/Pixel

**Purpose:** paid channel conversion tracking for diagnosis/checkout/trial milestones.
**Location:** `apps/web-app/libs/meta.ts`, webhook + checkout flow integration points.
**Authentication:** pixel id and access token.

## Messaging and AI

### WhatsApp Cloud API (Meta Graph)

**Purpose:** inbound webhook reception and outbound message replies.
**Location:** `apps/whatsapp-handler/src/routes/webhook/` and `src/contexts/whatsapp/`.
**Authentication:** webhook verification token and API credentials.

### OpenRouter

**Purpose:** intent classification for natural language messages.
**Location:** `apps/whatsapp-handler/src/contexts/ai/openrouter-client.ts` and `intent-parser.ts`.
**Authentication:** `OPENROUTER_API_KEY`.

### Upstash Redis

**Purpose:** encrypted chat session memory with TTL.
**Location:** `apps/whatsapp-handler/src/contexts/session/`.
**Authentication:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `SESSION_ENCRYPTION_KEY`.

## Customer Support

**Service:** Crisp
**Purpose:** web support chat channel.
**Implementation:** web-app config + support UI components.
**Configuration:** app config field for Crisp id.

## API Integrations (Internal)

### Dinio Bot Internal APIs

**Purpose:** allow whatsapp-handler to resolve user identity and perform finance actions on behalf of user.
**Location:** `apps/web-app/app/api/bot/**` consumed by `apps/whatsapp-handler/src/contexts/dinio/`.
**Authentication:** shared internal bot secret/bearer validation.

## Webhooks

### Stripe Webhook

**Purpose:** reflect subscription state and trigger onboarding side effects.
**Location:** `apps/web-app/app/api/webhook/stripe/route.ts`.
**Events:** checkout/subscription lifecycle events (including trial starts).

### WhatsApp Webhook

**Purpose:** receive user messages and metadata from Meta Graph.
**Location:** `apps/whatsapp-handler/src/routes/webhook/route.ts`.
**Events:** inbound messages and status callbacks.

## Background Jobs

**Queue system:** Upstash QStash.
**Location:** `apps/web-app/app/api/cron/email/`.
**Jobs:** welcome email dispatch, reactivation email dispatch, queued email processing.
