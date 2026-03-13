-- Rename initial_spent to remaining_daily_budget
-- This column now stores the fixed remaining budget amount (in cents) for mid-month configurations
-- instead of the amount already spent before budget setup.
-- When set, this value overrides percentage-based daily budget calculations,
-- ensuring allocation changes don't affect the daily ceiling after mid-month setup.

ALTER TABLE monthly_budgets
RENAME COLUMN initial_spent TO remaining_daily_budget;

COMMENT ON COLUMN monthly_budgets.remaining_daily_budget IS 
  'Fixed remaining daily budget in cents for mid-month configurations. When non-zero, this value is used instead of calculating from daily_percent, ensuring allocation changes do not affect the daily ceiling. Set to 0 for full-month (day 1) configurations that use percentage-based calculations.';
