import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "crypto";

const PHONE_MIN_DIGITS = 10;
const PHONE_MAX_DIGITS = 15;
const AES_GCM_ALGO = "aes-256-gcm";
const IV_BYTE_LENGTH = 12;

function getPhoneHashSecret(): string {
  const secret = process.env.PHONE_HASH_SECRET;
  if (!secret) {
    throw new Error("Missing required env var: PHONE_HASH_SECRET");
  }

  return secret;
}

function decodeKey(rawKey: string): Buffer {
  const trimmed = rawKey.trim();

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }

  return Buffer.from(trimmed, "base64");
}

function getPhoneEncryptionKey(): Buffer {
  const rawKey = process.env.PHONE_ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error("Missing required env var: PHONE_ENCRYPTION_KEY");
  }

  const key = decodeKey(rawKey);
  if (key.length !== 32) {
    throw new Error("PHONE_ENCRYPTION_KEY must decode to 32 bytes");
  }

  return key;
}

export function normalizePhoneNumber(phoneRaw: string): string {
  const digits = phoneRaw.replace(/\D/g, "");

  if (digits.length < PHONE_MIN_DIGITS || digits.length > PHONE_MAX_DIGITS) {
    throw new Error("Invalid phone number format");
  }

  return `+${digits}`;
}

export function createPhoneHash(normalizedPhone: string): string {
  return createHmac("sha256", getPhoneHashSecret())
    .update(normalizedPhone)
    .digest("hex");
}

export function encryptPhoneNumber(normalizedPhone: string): string {
  const key = getPhoneEncryptionKey();
  const iv = randomBytes(IV_BYTE_LENGTH);
  const cipher = createCipheriv(AES_GCM_ALGO, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(normalizedPhone, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64url")}.${authTag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptPhoneNumber(payload: string): string {
  const [ivB64, authTagB64, encryptedB64] = payload.split(".");

  if (!ivB64 || !authTagB64 || !encryptedB64) {
    throw new Error("Invalid encrypted phone payload");
  }

  const key = getPhoneEncryptionKey();
  const decipher = createDecipheriv(
    AES_GCM_ALGO,
    key,
    Buffer.from(ivB64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTagB64, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedB64, "base64url")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function createPlainToken(): string {
  return randomBytes(32).toString("base64url");
}

export function createTokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
