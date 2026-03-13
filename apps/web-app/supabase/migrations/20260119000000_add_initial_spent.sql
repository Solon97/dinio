-- Add initial_spent column to monthly_budgets table
-- Stores amount (in cents) considered "already spent" when configuring mid-month
-- This allows adjusting the daily limit calculation for remaining days without altering total allocation

ALTER TABLE monthly_budgets
ADD COLUMN initial_spent INTEGER DEFAULT 0;

COMMENT ON COLUMN monthly_budgets.initial_spent IS 'Amount in cents considered spent before tracking began (for mid-month starts)';
