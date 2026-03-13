-- ============================================
-- CHANGE MONETARY VALUES FROM DECIMAL TO INTEGER
-- ============================================
-- This migration converts all monetary fields from DECIMAL(12,2) to INTEGER
-- Values are stored as cents (e.g., R$ 100.50 becomes 10050)

-- ============================================
-- 1. MONTHLY_BUDGETS TABLE
-- ============================================

-- Convert existing decimal values to cents before changing type
UPDATE monthly_budgets SET
  total_income = ROUND(total_income * 100),
  total_fixed = ROUND(total_fixed * 100),
  daily_budget = ROUND(daily_budget * 100),
  reserve_amount = ROUND(reserve_amount * 100);

-- Alter column types to INTEGER
ALTER TABLE monthly_budgets
  ALTER COLUMN total_income TYPE INTEGER USING ROUND(total_income),
  ALTER COLUMN total_fixed TYPE INTEGER USING ROUND(total_fixed),
  ALTER COLUMN daily_budget TYPE INTEGER USING ROUND(daily_budget),
  ALTER COLUMN reserve_amount TYPE INTEGER USING ROUND(reserve_amount);

-- Update defaults
ALTER TABLE monthly_budgets
  ALTER COLUMN total_income SET DEFAULT 0,
  ALTER COLUMN total_fixed SET DEFAULT 0,
  ALTER COLUMN daily_budget SET DEFAULT 0,
  ALTER COLUMN reserve_amount SET DEFAULT 0;

-- ============================================
-- 2. INCOMES TABLE
-- ============================================

-- Convert existing values to cents
UPDATE incomes SET amount = ROUND(amount * 100);

-- Alter column type
ALTER TABLE incomes
  ALTER COLUMN amount TYPE INTEGER USING ROUND(amount);

-- Update default
ALTER TABLE incomes
  ALTER COLUMN amount SET DEFAULT 0;

-- ============================================
-- 3. FIXED_EXPENSES TABLE
-- ============================================

-- Convert existing values to cents
UPDATE fixed_expenses SET amount = ROUND(amount * 100);

-- Alter column type
ALTER TABLE fixed_expenses
  ALTER COLUMN amount TYPE INTEGER USING ROUND(amount);

-- Update default
ALTER TABLE fixed_expenses
  ALTER COLUMN amount SET DEFAULT 0;

-- ============================================
-- 4. CREDIT_CARDS TABLE
-- ============================================

-- Convert existing values to cents
UPDATE credit_cards SET credit_limit = ROUND(credit_limit * 100);

-- Alter column type
ALTER TABLE credit_cards
  ALTER COLUMN credit_limit TYPE INTEGER USING ROUND(credit_limit);

-- Update default
ALTER TABLE credit_cards
  ALTER COLUMN credit_limit SET DEFAULT 0;

-- ============================================
-- 5. DAILY_EXPENSES TABLE
-- ============================================

-- Convert existing values to cents
UPDATE daily_expenses SET amount = ROUND(amount * 100);

-- Alter column type
ALTER TABLE daily_expenses
  ALTER COLUMN amount TYPE INTEGER USING ROUND(amount);

-- Remove CHECK constraint if exists, then add new one for INTEGER
ALTER TABLE daily_expenses DROP CONSTRAINT IF EXISTS daily_expenses_amount_check;
ALTER TABLE daily_expenses ADD CONSTRAINT daily_expenses_amount_check CHECK (amount > 0);

COMMENT ON COLUMN monthly_budgets.total_income IS 'Total income in cents';
COMMENT ON COLUMN monthly_budgets.total_fixed IS 'Total fixed expenses in cents';
COMMENT ON COLUMN monthly_budgets.daily_budget IS 'Daily budget in cents';
COMMENT ON COLUMN monthly_budgets.reserve_amount IS 'Reserve amount in cents';
COMMENT ON COLUMN incomes.amount IS 'Income amount in cents';
COMMENT ON COLUMN fixed_expenses.amount IS 'Expense amount in cents';
COMMENT ON COLUMN credit_cards.credit_limit IS 'Credit limit in cents';
COMMENT ON COLUMN daily_expenses.amount IS 'Expense amount in cents';
