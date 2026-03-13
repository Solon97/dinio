-- Migration: Add installment expenses support
-- This migration creates the installment_expenses table and extends fixed_expenses
-- to support parceladas (installment purchases)

-- ==========================================
-- 1. Create installment_expenses table
-- ==========================================
-- This table represents the parent/source of an installment purchase
-- Each record spawns multiple fixed_expenses (parcelas) across future months

CREATE TABLE installment_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
  total_amount INTEGER NOT NULL CHECK (total_amount > 0), -- In cents
  total_installments INTEGER NOT NULL CHECK (total_installments >= 1 AND total_installments <= 48),
  start_installment INTEGER NOT NULL DEFAULT 1 CHECK (start_installment >= 1 AND start_installment <= total_installments),
  starts_at_month_id INTEGER NOT NULL CHECK (starts_at_month_id >= 202001 AND starts_at_month_id <= 210012),
  ends_at_month_id INTEGER NOT NULL CHECK (ends_at_month_id >= 202001 AND ends_at_month_id <= 210012),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure start_installment doesn't exceed total
  CONSTRAINT valid_start_installment CHECK (start_installment <= total_installments),
  
  -- Ensure end month is after or equal to start month
  CONSTRAINT valid_month_range CHECK (ends_at_month_id >= starts_at_month_id)
);

-- Create indexes for performance
CREATE INDEX idx_installment_expenses_user ON installment_expenses(user_id);
CREATE INDEX idx_installment_expenses_credit_card ON installment_expenses(credit_card_id);
CREATE INDEX idx_installment_expenses_month_range ON installment_expenses(starts_at_month_id, ends_at_month_id);

-- Enable RLS
ALTER TABLE installment_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own installment expenses"
  ON installment_expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own installment expenses"
  ON installment_expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own installment expenses"
  ON installment_expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own installment expenses"
  ON installment_expenses FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- 2. Extend fixed_expenses table
-- ==========================================
-- Add columns to link parcelas to their parent installment

ALTER TABLE fixed_expenses
  ADD COLUMN installment_expense_id UUID REFERENCES installment_expenses(id) ON DELETE CASCADE,
  ADD COLUMN is_installment BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN current_installment INTEGER,
  ADD COLUMN total_installments INTEGER;

-- Add constraints for installment data integrity
ALTER TABLE fixed_expenses
  ADD CONSTRAINT valid_installment_data CHECK (
    (is_installment = FALSE AND installment_expense_id IS NULL AND current_installment IS NULL AND total_installments IS NULL)
    OR
    (is_installment = TRUE AND installment_expense_id IS NOT NULL AND current_installment IS NOT NULL AND total_installments IS NOT NULL AND current_installment >= 1 AND current_installment <= total_installments)
  );

-- Create index for installment lookups
CREATE INDEX idx_fixed_expenses_installment ON fixed_expenses(installment_expense_id);

-- Add comment for clarity
COMMENT ON TABLE installment_expenses IS 'Parent table for installment purchases - each record generates multiple fixed_expenses (parcelas)';
COMMENT ON COLUMN fixed_expenses.installment_expense_id IS 'Links this parcela to its parent installment purchase';
COMMENT ON COLUMN fixed_expenses.is_installment IS 'TRUE if this expense is a parcela of an installment';
COMMENT ON COLUMN fixed_expenses.current_installment IS 'Which installment number this is (e.g., 3 of 12)';
COMMENT ON COLUMN fixed_expenses.total_installments IS 'Total number of installments in the purchase';
