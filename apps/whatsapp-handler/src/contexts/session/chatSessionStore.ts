import { Redis } from '@upstash/redis'
import { createHash } from 'node:crypto'
import { decrypt, encrypt } from './encryption'
import {
  type ChatSession,
  MAX_HISTORY_SIZE,
  SESSION_TTL_SECONDS,
} from './types'

// ---------------------------------------------------------------------------
// Redis client — lazy singleton, initialised on first use.
// ---------------------------------------------------------------------------

let _redis: Redis | null = null

function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) {
      throw new Error(
        'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables must be set',
      )
    }
    _redis = new Redis({ url, token })
  }
  return _redis
}

// ---------------------------------------------------------------------------
// Key helpers
// ---------------------------------------------------------------------------

/**
 * One-way hash of the phone number used as the Redis key suffix.
 * Prevents storing raw phone numbers in Redis.
 */
function hashPhone(phone: string): string {
  return createHash('sha256').update(phone).digest('hex')
}

function sessionKey(phoneHash: string): string {
  return `chat:session:${phoneHash}`
}

// ---------------------------------------------------------------------------
// Session factory
// ---------------------------------------------------------------------------

export function createEmptySession(): ChatSession {
  return {
    history: [],
    state: null,
    operation: null,
    lastInteraction: Date.now(),
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieves and decrypts the session for the given phone number.
 *
 * - Single Redis GET operation per call.
 * - Returns a fresh empty session when no record exists or when decryption
 *   fails (e.g. key rotation), so the conversation always continues gracefully.
 */
export async function getSession(phone: string): Promise<ChatSession> {
  const redis = getRedis()
  const key = sessionKey(hashPhone(phone))

  const raw = await redis.get<string>(key)
  if (!raw) return createEmptySession()

  try {
    const decrypted = decrypt(raw)
    return JSON.parse(decrypted) as ChatSession
  } catch {
    // Decryption failure (tampered data or key rotation) — start fresh.
    return createEmptySession()
  }
}

/**
 * Serialises, encrypts, and saves the session for the given phone number.
 *
 * - Resets TTL to 24 hours on every write.
 * - Single Redis SET operation per call.
 * - Mutates `session.lastInteraction` to the current timestamp before saving.
 */
export async function saveSession(
  phone: string,
  session: ChatSession,
): Promise<void> {
  const redis = getRedis()
  const key = sessionKey(hashPhone(phone))

  session.lastInteraction = Date.now()

  const encrypted = encrypt(JSON.stringify(session))
  await redis.set(key, encrypted, { ex: SESSION_TTL_SECONDS })
}

/**
 * Normalises legacy history entries that were persisted before the `role`
 * field was introduced. Treats any entry without `role` as `'user'`.
 *
 * Mutates the session in place — safe to call before any read of history roles.
 */
export function normalizeHistoryRoles(session: ChatSession): void {
  for (const entry of session.history) {
    if (!entry.role) {
      entry.role = 'user'
    }
  }
}

/**
 * Appends a message to the session history, enforcing the sliding window limit.
 *
 * @param role - `'user'` for inbound messages, `'assistant'` for bot responses.
 * @param text - Raw message text. Bot responses longer than 400 characters are
 *   truncated before storage to avoid consuming disproportionate context space.
 *   The text sent to WhatsApp is never affected.
 *
 * Mutates the session in place — call `saveSession()` afterwards to persist.
 */
export function appendToHistory(
  session: ChatSession,
  role: 'user' | 'assistant',
  text: string,
): void {
  const MAX_ASSISTANT_TEXT = 400
  const storedText =
    role === 'assistant' && text.length > MAX_ASSISTANT_TEXT
      ? text.slice(0, MAX_ASSISTANT_TEXT)
      : text

  session.history.push({ role, text: storedText, ts: Date.now() })
  if (session.history.length > MAX_HISTORY_SIZE) {
    session.history = session.history.slice(-MAX_HISTORY_SIZE)
  }
}

/**
 * Clears the active operation state once a multi-step flow completes.
 *
 * Mutates the session in place — call `saveSession()` afterwards to persist.
 */
export function clearOperationState(session: ChatSession): void {
  session.state = null
  session.operation = null
}
