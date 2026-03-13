-- Create credit_card_invoices table
-- Represents a billing period for a specific credit card.
-- Expenses are NOT linked directly to an invoice, but to a due_month_id.
-- When an invoice is created, it consolidates all expenses matching that month.
CREATE TABLE credit_card_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  due_month_id INTEGER NOT NULL, -- YYYYMM format
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_credit_card_invoices_card_month UNIQUE (credit_card_id, due_month_id)
);

-- Index for fast lookups by user + month (main query pattern)
CREATE INDEX idx_credit_card_invoices_user_month
  ON credit_card_invoices (user_id, due_month_id);

-- Auto-update updated_at on row changes
CREATE TRIGGER set_credit_card_invoices_updated_at
  BEFORE UPDATE ON credit_card_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE credit_card_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices"
  ON credit_card_invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
  ON credit_card_invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
  ON credit_card_invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
