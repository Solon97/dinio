-- Stores WhatsApp Meta account linkage used by bot endpoints.
CREATE TABLE bot_whatsapp_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meta_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bot_whatsapp_links_user_id_key UNIQUE (user_id),
  CONSTRAINT bot_whatsapp_links_meta_user_id_key UNIQUE (meta_user_id)
);

CREATE INDEX idx_bot_whatsapp_links_meta_user_id
  ON bot_whatsapp_links (meta_user_id);

ALTER TABLE bot_whatsapp_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own WhatsApp links"
  ON bot_whatsapp_links FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own WhatsApp links"
  ON bot_whatsapp_links FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own WhatsApp links"
  ON bot_whatsapp_links FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own WhatsApp links"
  ON bot_whatsapp_links FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
