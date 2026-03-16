-- Temporary tokens used to link WhatsApp phone to Dinio account.
-- Stores only token hash and encrypted phone representation.

CREATE TABLE whatsapp_link_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL,
  phone_hash TEXT NOT NULL,
  phone_encrypted TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT whatsapp_link_tokens_token_hash_key UNIQUE (token_hash)
);

CREATE INDEX idx_whatsapp_link_tokens_lookup
  ON whatsapp_link_tokens (token_hash, expires_at);

CREATE INDEX idx_whatsapp_link_tokens_phone_hash
  ON whatsapp_link_tokens (phone_hash);

ALTER TABLE whatsapp_link_tokens ENABLE ROW LEVEL SECURITY;