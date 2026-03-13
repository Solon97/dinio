-- Add invoice-related fields to daily_expenses
-- credit_card_id: which card was used for this expense
-- invoice_due_month_id: YYYYMM of the invoice period this expense belongs to
ALTER TABLE daily_expenses
  ADD COLUMN credit_card_id UUID NULL REFERENCES credit_cards(id) ON DELETE SET NULL,
  ADD COLUMN invoice_due_month_id INTEGER NULL;

-- Index for aggregating expenses by card + invoice month (used in invoices query)
CREATE INDEX idx_daily_expenses_invoice
  ON daily_expenses (user_id, credit_card_id, invoice_due_month_id)
  WHERE credit_card_id IS NOT NULL;

-- Add invoice_due_month_id to fixed_expenses
-- credit_card_id already exists on fixed_expenses
ALTER TABLE fixed_expenses
  ADD COLUMN invoice_due_month_id INTEGER NULL;

-- Index for aggregating fixed expenses by card + invoice month
CREATE INDEX idx_fixed_expenses_invoice
  ON fixed_expenses (user_id, credit_card_id, invoice_due_month_id)
  WHERE credit_card_id IS NOT NULL AND deleted_at IS NULL;
