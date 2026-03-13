import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12  // 96-bit IV — NIST recommended length for GCM
const TAG_BYTES = 16 // 128-bit authentication tag

/**
 * Reads and validates SESSION_ENCRYPTION_KEY from the environment.
 * Expects a 64-character hex string representing 32 bytes.
 *
 * Generate a suitable key with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
function getKey(): Buffer {
  const hex = process.env.SESSION_ENCRYPTION_KEY
  if (!hex) {
    throw new Error('SESSION_ENCRYPTION_KEY environment variable is not set')
  }
  const key = Buffer.from(hex, 'hex')
  if (key.length !== 32) {
    throw new Error(
      'SESSION_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)',
    )
  }
  return key
}

/**
 * Encrypts a plaintext string using AES-256-GCM with a random 96-bit IV.
 *
 * Output format (base64-encoded binary blob):
 * ┌──────────────┬──────────────────┬──────────────┐
 * │  IV (12 B)   │  Auth tag (16 B) │  Ciphertext  │
 * └──────────────┴──────────────────┴──────────────┘
 *
 * The auth tag is bundled so that tampering with any byte of the payload
 * causes decryption to fail with an authentication error.
 */
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_BYTES)

  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

/**
 * Decrypts a base64-encoded AES-256-GCM payload produced by `encrypt`.
 *
 * Throws if:
 *  - the payload is shorter than iv + tag (malformed or truncated)
 *  - the authentication tag does not match (tampered or wrong key)
 */
export function decrypt(payload: string): string {
  const key = getKey()
  const buf = Buffer.from(payload, 'base64')

  if (buf.length < IV_BYTES + TAG_BYTES) {
    throw new Error('Invalid encrypted payload: too short')
  }

  const iv = buf.subarray(0, IV_BYTES)
  const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES)
  const ciphertext = buf.subarray(IV_BYTES + TAG_BYTES)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}
