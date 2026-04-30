# Agent Instructions — dinio-whatsapp-handler

## Project Scope

WhatsApp bot for Dinio — receives messages from the WhatsApp Cloud API, detects the
user's financial intent via LLM, and calls the dinio-app backend to fulfil it.

Stack: **Fastify 5**, **TypeScript 5**, **@openrouter/sdk**, **@upstash/redis**, **Zod 4**.

---

## Build And Test

```bash
npm install          # install deps
npm run dev          # compile + watch + restart
npm run build        # compile to dist/
npm run test         # build + run tests with c8
```

---

## Message Flow

```
POST /webhook
  └── extractIncomingMessage()
        └── routeMessage()
              ├── resolveUserByPhone()       → dinio-app backend
              ├── getSession(phone)          → Redis (1 read)
              ├── buildIntentContext(session, text)
              ├── parseIntent(context)       → OpenRouter LLM
              ├── dispatchIntent(intent, {userId}, reply)
              ├── appendToHistory(session, 'user', text)
              ├── appendToHistory(session, 'assistant', response)
              ├── clearOperationState(session)
              └── saveSession(phone, session) → Redis (1 write)
```

**Key invariant:** exactly one Redis read and one Redis write per inbound message.

---

## Session Memory System

All conversational state is stored in Upstash Redis, encrypted with AES-256-GCM.

### Redis key format

```
chat:session:{sha256(phone)[0:64]}
```

The phone number is never stored in plain text. Its SHA-256 hash is used as the key suffix.

### Session schema (`src/contexts/session/types.ts`)

```ts
interface ChatSession {
  history: HistoryMessage[]        // sliding window, max 15 messages
  state: ConversationState | null  // active step in a multi-turn flow
  operation: OperationContext | null  // partial structured data
  lastInteraction: number          // unix ms — updated on every save
}
```

TTL: **24 hours** — reset on every write.

### Key modules

| File | Responsibility |
|---|---|
| `src/contexts/session/types.ts` | Type definitions, `MAX_HISTORY_SIZE`, `SESSION_TTL_SECONDS` |
| `src/contexts/session/encryption.ts` | `encrypt(plaintext)` / `decrypt(payload)` — AES-256-GCM |
| `src/contexts/session/chatSessionStore.ts` | `getSession`, `saveSession`, `appendToHistory`, `clearOperationState` |
| `src/contexts/session/contextBuilder.ts` | `buildIntentContext`, `formatContextForPrompt` |

### Encryption format

The stored blob is a base64-encoded binary buffer structured as:

```
┌──────────────┬──────────────────┬──────────────────────┐
│  IV (12 B)   │  Auth tag (16 B) │  Ciphertext (var)    │
└──────────────┴──────────────────┴──────────────────────┘
```

The IV is random per write. The authentication tag detects any tampering.

### Environment variables (required)

| Variable | Description |
|---|---|
| `UPSTASH_REDIS_REST_URL` | REST endpoint from Upstash console |
| `UPSTASH_REDIS_REST_TOKEN` | REST token from Upstash console |
| `SESSION_ENCRYPTION_KEY` | 64-char hex string (32 bytes). Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

---

## LLM Usage Policy

The LLM is used **only for intent detection**. Never use it for:
- summarising conversation history
- rewriting or compressing messages
- any memory management task

All memory operations are deterministic (append, slice, clear).

Intent detection input is built by `formatContextForPrompt(context)`, which
formats history + active state + current message into a structured string.

### Control intents

- `cancel_operation`: aborts an in-progress multi-turn flow. The handler replies with confirmation; if there is no active flow, it replies that there is nothing to cancel.
- `clear_conversation_context`: clears `session.history` and any active operation state so the next turn starts from a clean context.

---

## Adding a New Intent

1. Add the new intent name to `IntentType` in `src/contexts/intents/types.ts`.
2. Add it to the Zod enum in `src/contexts/ai/intent-parser.ts`.
3. Create a handler in `src/contexts/intents/handlers/`.
4. Register it in `src/contexts/intents/intent-dispatcher.ts`.
5. If the intent is multi-step, set `session.state` and `session.operation` inside the handler — the next message will carry this context to the LLM automatically.

---

## Multi-Step Operations

To initiate a multi-step flow from a handler:

```ts
session.state = { intent: 'register_expense', step: 'waiting_category' }
session.operation = { type: 'register_expense', data: { amount: 50, description: 'mercado' } }
// Return without calling the dinio API — wait for next message.
```

On the next message, `buildIntentContext` includes the state and the LLM can
interpret the bare follow-up. After the flow completes, `clearOperationState(session)`
is called in `message-router.ts` before saving.

> Currently all intents are single-step. The state/operation fields are reserved for
> future multi-turn flows but are wired into the full pipeline already.

---

## Architecture Conventions

- `src/contexts/session/` — session memory layer (no HTTP, no Fastify)
- `src/contexts/ai/` — LLM access only; no business logic
- `src/contexts/intents/handlers/` — one file per intent; each handler is pure async
- `src/contexts/messaging/message-router.ts` — orchestration only; no business logic
- `src/contexts/dinio/` — dinio-app HTTP client; monetary values sent as reais

---

---

## dinio-shared

`dinio-shared` is installed. Import from `'dinio-shared'`.

### Current usage

| File | Imported symbols |
|---|---|
| `src/contexts/intents/handlers/helpers.ts` | `computeInvoiceDueMonthIdForDate`, `formatMonthIdLabel` |

### Rule

Never re-implement invoice cycle or month ID logic. If a needed function is missing, add it to `packages/shared/` and run `pnpm build` there — changes are available immediately via workspace.

---

## Common Pitfalls

- Never read session data inside a handler — handlers receive only what is passed to them.
- Never call the LLM outside of `intent-parser.ts`.
- Never store the raw phone number anywhere (Redis, logs, etc.) — always hash it first using `hashPhone` inside `chatSessionStore.ts`.
- `SESSION_ENCRYPTION_KEY` rotation will silently invalidate all existing sessions (graceful fallback to empty session is already implemented).
