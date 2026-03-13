-- Migration: Allow negative amounts (refunds) and add cursor-based pagination index
-- Date: 2026-02-10

-- 1. Remove the old CHECK constraint that forces amount > 0
--    This allows negative values for refunds/reimbursements
ALTER TABLE daily_expenses DROP CONSTRAINT IF EXISTS daily_expenses_amount_check;

-- 2. Add new CHECK constraint: amount must not be zero (positive = expense, negative = refund)
ALTER TABLE daily_expenses ADD CONSTRAINT daily_expenses_amount_nonzero CHECK (amount != 0);

-- 3. Add index for cursor-based pagination (user_id, date DESC, time DESC NULLS LAST, id DESC)
CREATE INDEX IF NOT EXISTS idx_daily_expenses_cursor
  ON daily_expenses (user_id, date DESC, time DESC NULLS LAST, id DESC);
