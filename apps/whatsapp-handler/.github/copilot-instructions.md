# Agent Instructions - Dinio WhatsApp Handler

## Dinio Context In The Ecosystem
- Dinio is a personal finance product focused on monthly budget control and daily expense tracking.
- The main Dinio app remains the central product experience.
- In the main app, users:
  - configure monthly income and fixed expenses
  - set reserve goals
  - complete monthly budget setup
  - view dashboards, projections, and full budget details

## Purpose Of This Repository
- This repository contains a separate service responsible for Dinio's WhatsApp integration.
- It exists to let users interact with Dinio through WhatsApp, one of the most used apps in Brazil.
- This service is a conversational interaction channel, not a replacement for the main app.
- The WhatsApp channel is optimized for quick, low-friction day-to-day actions.

## User Experience Through WhatsApp
- After users configure the month in the main Dinio app, they can use WhatsApp for quick interactions.
- Main interactions include:
  - registering daily expenses
  - checking how much they can spend today
  - checking available month balance
  - checking how much they have already spent
  - checking financial agenda commitments
- Goal: reduce friction and make logging expenses take only a few seconds.
- Typical user messages:
  - `uber 28`
  - `pizza 60`
  - `gastei 45 no mercado`

## AI Role In This Service
- AI is used only to interpret user messages.
- Message interpretation should identify:
  - user intent
  - monetary values
  - expense description
  - likely category
- This interpretation turns short natural language messages into structured actions in Dinio.

### Conversation control intents
- The parser also supports two control intents:
  - `cancel_operation`: user asks to cancel/stop the current operation.
  - `clear_conversation_context`: user asks to clear/reset chat context/history.
- For both control intents, handlers must be deterministic and not call Dinio financial APIs.

## Relationship With The Main Dinio App
- The main app remains the source of truth and complete financial management surface.
- WhatsApp is a complementary channel focused on speed and convenience.
- Use WhatsApp primarily for quick registration and quick lookups.
- Keep setup, detailed analysis, and full planning workflows in the main app.

## Future Direction
- The WhatsApp integration should evolve to support:
  - complete expense registration flows
  - fast financial queries
  - reminders and notifications
  - nudges that bring users back to the main app when deeper actions are needed
- Product intent: reduce expense logging friction and increase consistency of Dinio usage.

## Service Scope
- Fastify + TypeScript service handling WhatsApp webhook traffic.
- Main structure:
  - `src/app.ts`: bootstrap, logger config, plugin/route autoload
  - `src/routes/`: HTTP route plugins
  - `src/plugins/`: shared Fastify plugins/decorators
  - `src/contexts/`: conversational orchestration (AI parsing, intent dispatch, message routing)
  - `src/lib/`: integration utilities and external API boundaries

## Build And Test
- Install dependencies: `npm install`
- Build: `npm run build`
- Dev mode: `npm run dev`
- Start production server: `npm start`
- Test suite (build + type-check tests + coverage): `npm run test`

## Architecture And Patterns
- Routes and plugins are loaded by `@fastify/autoload` from `src/routes` and `src/plugins`.
- Every route/plugin module should export a default `FastifyPluginAsync`.
- Keep cross-cutting behavior in plugins and business/integration logic in contexts/lib modules.
- Prefer strongly typed route contracts using Fastify generics (`Body`, `Querystring`, etc.).

## Webhook Conventions
- `src/routes/webhook.ts` is the main reference for WhatsApp integration.
- Validate required environment variables early and fail fast.
- For inbound webhook POSTs, return success quickly and process heavier work asynchronously to avoid retries/timeouts.
- On inbound user messages, send an immediate acknowledgment message before heavy processing (for example: confirming receipt and that processing is starting).
- Use `src/contexts/whatsapp/whatsapp-client.ts` as the integration boundary for Graph API calls.

## WhatsApp Response UX Conventions
- Always provide fast feedback: when a message is received, first send a short acknowledgment that the request was received and is being processed.
- Acknowledgment should be friendly, concise, and action-oriented (for example: "Recebi sua mensagem! Vou processar agora e ja te respondo 🙂").
- Final responses must follow Dinio brand voice: direto, humano, acolhedor, sem julgamento e com orientacao pratica.
- WhatsApp messages should use light, friendly emojis where natural to reinforce warmth and clarity, without excess.
- Keep message language simple, everyday, and focused on immediate next action for the user.

## Testing Conventions

### Test Runner & Setup
  - **Test Framework**: Node.js native `node:test` (no external test runner required)
  - **Assertions**: `node:assert` module (use `assert.strictEqual()`, `assert.deepStrictEqual()`, etc.)
  - **Coverage**: `c8` CLI tool (automatically tracked during `npm test`)
  - **Run all tests**: `npm test` (builds, type-checks, runs tests with coverage)

### Test Structure & Organization
  ```
  test/
  ├── helper.ts           # Shared utilities for creating app instances
  ├── routes/             # HTTP route integration tests
  ├── plugins/            # Fastify plugin tests
  ├── contexts/           # Context module unit tests (logic, AI parsing, formatting)
  └── tsconfig.json       # TypeScript config for tests
  ```

### Writing Context Tests (Unit Tests)
  For logic-heavy modules like AI parsing, intent dispatching, and session handling:

  ```typescript
  import { describe, it } from 'node:test'
  import assert from 'node:assert'
  import { isMessageRelevant } from '../../src/contexts/messaging/relevance-filter'
  import { pino } from 'pino'

  const log = pino({ level: 'silent' })

  describe('Relevance Filter', () => {
    describe('relevant messages', () => {
      it('should accept messages with expense keywords', () => {
        assert.strictEqual(isMessageRelevant('gastei 50', log), true)
      })
    })

    describe('irrelevant messages', () => {
      it('should reject greetings', () => {
        assert.strictEqual(isMessageRelevant('oi tudo bem?', log), false)
      })
    })
  })
  ```

### Writing Route/Plugin Tests (Integration Tests)
  Use `test/helper.ts` `build(t)` to create a Fastify app instance:

  ```typescript
  import { test } from 'node:test'
  import assert from 'node:assert'
  import { build } from '../helper'

  test('GET /health returns 200', async (t) => {
    const app = await build(t)
    const result = await app.inject({
      method: 'GET',
      url: '/health',
    })
    assert.strictEqual(result.statusCode, 200)
  })
  ```

### Key Testing Principles
  - **Unit tests for contexts**: Pure logic (parsing, filtering, formatting) → fast, deterministic
  - **Integration tests for routes/plugins**: HTTP contracts, middleware chain → test real flows
  - **Keep tests close to code**: Mirror `src/` folder structure in `test/` folder
  - **Use descriptive test names**: `it('should reject completely unrelated messages', ...)`
  - **Silent loggers in tests**: Pass `pino({ level: 'silent' })` to avoid noise during test runs
  - **Prefer `assert.strictEqual()`**: More explicit than loose equality
  - **Test edge cases**: Empty inputs, boundary values, mixed case, whitespace, numbers without context

### Coverage & Cleanup
  - Coverage reports are generated automatically during `npm test` in the `coverage/` folder
  - Aim for >80% coverage on critical paths (AI parsing, session handling, relevance filtering)
  - Failing tests block the build — fix before committing
## dinio-shared

`dinio-shared` is installed. Import from `'dinio-shared'`.

### Current usage

| File | Imported symbols |
|---|---|
| `src/contexts/intents/handlers/helpers.ts` | `computeInvoiceDueMonthIdForDate`, `formatMonthIdLabel` |

### Rules
- Never re-implement invoice cycle or month ID logic — always use `dinio-shared`.
- If a needed function is missing, add it to `packages/shared/` and run `pnpm build` there — changes are available immediately via workspace.

## Common Pitfalls
- Treating WhatsApp as a replacement for the main app instead of a complementary channel.
- Letting AI output bypass validation before executing financial actions.
- Delaying webhook acknowledgment and causing provider retries.
- Missing default export in route/plugin files, which breaks autoload registration.
- Missing module augmentation for decorators, which breaks TypeScript typing.
- Editing generated `dist/` artifacts directly; always edit `src/`.

## Session Memory System

The service maintains per-user conversational state in Upstash Redis, encrypted at rest
with AES-256-GCM. Each user has a single Redis key with their full session blob.

### Redis key

```
chat:session:{sha256(phone)}
```

The raw phone number is never stored in Redis — only its SHA-256 hash.

### Session structure

```ts
interface ChatSession {
  history: HistoryMessage[]        // last 15 messages (sliding window)
  state: ConversationState | null  // active step in a multi-turn flow
  operation: OperationContext | null  // accumulated partial data
  lastInteraction: number          // unix ms
}
```

TTL is reset to 24 hours on every write.

### Performance model

Every inbound message triggers exactly:
- **1 `GET`** — `getSession(phone)` at the start of `routeMessage`
- **1 `SET`** — `saveSession(phone, session)` after the handler replies

No additional Redis calls occur during normal processing.

### Session modules (`src/contexts/session/`)

| File | Exports |
|---|---|
| `types.ts` | `ChatSession`, `HistoryMessage`, `ConversationState`, `OperationContext`, constants |
| `encryption.ts` | `encrypt(plaintext)`, `decrypt(payload)` |
| `chatSessionStore.ts` | `getSession`, `saveSession`, `appendToHistory`, `clearOperationState` |
| `contextBuilder.ts` | `buildIntentContext`, `formatContextForPrompt`, `IntentDetectionContext` |

### Intent detection context

`parseIntent` now receives an `IntentDetectionContext` (history + state + current message)
instead of a bare string. The context is formatted by `formatContextForPrompt` and injected
into the LLM input, giving the model awareness of the ongoing conversation.

The LLM is still used **only for intent detection** — never for memory management.

### Required environment variables

| Variable | Description |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |
| `SESSION_ENCRYPTION_KEY` | 64-char hex (32 bytes). Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

### Multi-step operations (future)

To start a multi-turn flow from inside a handler, set `session.state` and
`session.operation` before returning. On the next message, the context builder
will include this state so the LLM can interpret follow-up messages correctly.
Call `clearOperationState(session)` when the flow finishes (already done
automatically in `message-router.ts` after every dispatch).

## Key Reference Files
- `src/app.ts`
- `src/routes/webhook.ts`
- `src/contexts/ai/intent-parser.ts`
- `src/contexts/intents/intent-dispatcher.ts`
- `src/contexts/intents/handlers/helpers.ts`
- `src/contexts/whatsapp/whatsapp-client.ts`
- `src/contexts/session/chatSessionStore.ts`
- `src/contexts/session/contextBuilder.ts`
- `src/plugins/sensible.ts`
- `test/helper.ts`
