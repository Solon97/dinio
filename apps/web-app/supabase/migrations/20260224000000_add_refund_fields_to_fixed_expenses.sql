-- Add refund support to fixed_expenses
-- is_refundable: flags if the expense should be reimbursed
-- refund_income_id: FK to incomes; presence means the refund was already received.
--   ON DELETE SET NULL ensures that if the linked income is deleted, the flag resets cleanly.

ALTER TABLE fixed_expenses
  ADD COLUMN IF NOT EXISTS is_refundable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS refund_income_id uuid NULL
    REFERENCES incomes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_fixed_expenses_refund_income_id
  ON fixed_expenses (refund_income_id)
  WHERE refund_income_id IS NOT NULL;
