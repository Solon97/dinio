-- ============================================
-- REMOVE config_id FROM fixed_expenses AND incomes
-- ============================================
-- Now that we have user_id + month_id, config_id is redundant
-- This simplifies the schema and reinforces that monthly_budget is just a snapshot

-- ============================================
-- 1. REMOVE config_id FROM fixed_expenses
-- ============================================

-- Drop the foreign key constraint first
ALTER TABLE fixed_expenses 
DROP CONSTRAINT IF EXISTS fixed_expenses_config_id_fkey;

-- Drop the column
ALTER TABLE fixed_expenses 
DROP COLUMN IF EXISTS config_id;

COMMENT ON TABLE fixed_expenses IS 'Fixed expenses identified by user_id + month_id. No dependency on monthly_budgets existence.';

-- ============================================
-- 2. REMOVE config_id FROM incomes
-- ============================================

-- Drop the foreign key constraint first
ALTER TABLE incomes 
DROP CONSTRAINT IF EXISTS incomes_config_id_fkey;

-- Drop the column
ALTER TABLE incomes 
DROP COLUMN IF EXISTS config_id;

COMMENT ON TABLE incomes IS 'Income sources identified by user_id + month_id. No dependency on monthly_budgets existence.';

-- ============================================
-- 3. UPDATE COMMENTS TO REFLECT NEW MODEL
-- ============================================

COMMENT ON TABLE monthly_budgets IS 'Calculated budget snapshots per month. Created when user configures budget allocation. Expenses and incomes can exist without this.';
