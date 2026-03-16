-- ============================================
-- ADD CANONICAL MONTH_ID FIELD
-- ============================================
-- This migration introduces month_id (YYYYMM format) to decouple
-- financial events from the existence of a monthly_budget.
-- Allows users to create expenses/incomes freely without pre-configuring the month.

-- ============================================
-- 1. ADD month_id TO monthly_budgets
-- ============================================

-- Add the column (nullable initially for backfill)
ALTER TABLE monthly_budgets 
ADD COLUMN month_id INTEGER;

-- Backfill existing data: month_id = year * 100 + (month + 1)
-- Example: month=0 (January), year=2026 => 202601
UPDATE monthly_budgets 
SET month_id = (year * 100) + (month + 1);

-- Make it NOT NULL now that we have data
ALTER TABLE monthly_budgets 
ALTER COLUMN month_id SET NOT NULL;

-- Create unique constraint replacing old (user_id, month, year)
-- Drop old constraint first
ALTER TABLE monthly_budgets 
DROP CONSTRAINT IF EXISTS monthly_budgets_user_id_month_year_key;

-- Add new unique constraint on month_id
ALTER TABLE monthly_budgets 
ADD CONSTRAINT monthly_budgets_user_id_month_id_key 
UNIQUE (user_id, month_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_monthly_budgets_user_month_id 
ON monthly_budgets(user_id, month_id);

-- Add comment
COMMENT ON COLUMN monthly_budgets.month_id IS 'Canonical month identifier in YYYYMM format (e.g., 202601 for January 2026)';

-- ============================================
-- 2. ADD month_id TO daily_expenses
-- ============================================

-- Add the column (nullable initially for backfill)
ALTER TABLE daily_expenses 
ADD COLUMN month_id INTEGER;

-- Backfill from date field
-- Extract year and month from the date column
UPDATE daily_expenses 
SET month_id = (EXTRACT(YEAR FROM date)::INTEGER * 100) + EXTRACT(MONTH FROM date)::INTEGER;

-- Make it NOT NULL now that we have data
ALTER TABLE daily_expenses 
ALTER COLUMN month_id SET NOT NULL;

-- Create index for performance (combined with user_id for common queries)
CREATE INDEX IF NOT EXISTS idx_daily_expenses_user_month_id 
ON daily_expenses(user_id, month_id);

-- Add comment
COMMENT ON COLUMN daily_expenses.month_id IS 'Canonical month identifier in YYYYMM format, computed from date field';

-- ============================================
-- 3. ADD month_id TO fixed_expenses
-- ============================================

-- Add the column (nullable initially)
ALTER TABLE fixed_expenses 
ADD COLUMN month_id INTEGER;

-- Backfill from associated monthly_budgets
UPDATE fixed_expenses 
SET month_id = (
  SELECT mb.month_id 
  FROM monthly_budgets mb 
  WHERE mb.id = fixed_expenses.config_id
);

-- Make it NOT NULL now that we have data
ALTER TABLE fixed_expenses 
ALTER COLUMN month_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_month_id 
ON fixed_expenses(month_id);

-- Add comment
COMMENT ON COLUMN fixed_expenses.month_id IS 'Canonical month identifier in YYYYMM format';

-- ============================================
-- 4. ADD month_id TO incomes
-- ============================================

-- Add the column (nullable initially)
ALTER TABLE incomes 
ADD COLUMN month_id INTEGER;

-- Backfill from associated monthly_budgets
UPDATE incomes 
SET month_id = (
  SELECT mb.month_id 
  FROM monthly_budgets mb 
  WHERE mb.id = incomes.config_id
);

-- Make it NOT NULL now that we have data
ALTER TABLE incomes 
ALTER COLUMN month_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_incomes_month_id 
ON incomes(month_id);

-- Add comment
COMMENT ON COLUMN incomes.month_id IS 'Canonical month identifier in YYYYMM format';

-- ============================================
-- 5. ADD user_id TO CHILD TABLES FOR STANDALONE ACCESS
-- ============================================
-- This allows querying expenses/incomes without joining monthly_budgets

-- Fixed expenses: add user_id for standalone access
ALTER TABLE fixed_expenses 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill user_id from monthly_budgets
UPDATE fixed_expenses 
SET user_id = (
  SELECT mb.user_id 
  FROM monthly_budgets mb 
  WHERE mb.id = fixed_expenses.config_id
);

-- Make it NOT NULL
ALTER TABLE fixed_expenses 
ALTER COLUMN user_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_user 
ON fixed_expenses(user_id);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own expenses" ON fixed_expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON fixed_expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON fixed_expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON fixed_expenses;

-- Create new RLS policies based on user_id
CREATE POLICY "Users can view own fixed expenses"
ON fixed_expenses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fixed expenses"
ON fixed_expenses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fixed expenses"
ON fixed_expenses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fixed expenses"
ON fixed_expenses FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- Incomes: add user_id for standalone access
ALTER TABLE incomes 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill user_id from monthly_budgets
UPDATE incomes 
SET user_id = (
  SELECT mb.user_id 
  FROM monthly_budgets mb 
  WHERE mb.id = incomes.config_id
);

-- Make it NOT NULL
ALTER TABLE incomes 
ALTER COLUMN user_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_incomes_user 
ON incomes(user_id);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can insert own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can update own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can delete own incomes" ON incomes;

-- Create new RLS policies based on user_id
CREATE POLICY "Users can view own incomes"
ON incomes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own incomes"
ON incomes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incomes"
ON incomes FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own incomes"
ON incomes FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 7. ADD HELPER FUNCTION TO COMPUTE month_id
-- ============================================

-- Function to compute month_id from year and month (0-11)
CREATE OR REPLACE FUNCTION compute_month_id(p_year INTEGER, p_month INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- month is 0-based (0 = January, 11 = December)
  -- month_id is YYYYMM format (202601 = January 2026)
  RETURN (p_year * 100) + (p_month + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION compute_month_id IS 'Converts year and 0-based month to YYYYMM format';

-- Function to compute month_id from a date
CREATE OR REPLACE FUNCTION compute_month_id_from_date(p_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN (EXTRACT(YEAR FROM p_date)::INTEGER * 100) + EXTRACT(MONTH FROM p_date)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION compute_month_id_from_date IS 'Extracts YYYYMM month_id from a date';

-- ============================================
-- 8. ADD TRIGGERS TO AUTO-POPULATE month_id
-- ============================================

-- Trigger function for daily_expenses
CREATE OR REPLACE FUNCTION set_daily_expense_month_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-compute month_id from date if not provided
  IF NEW.month_id IS NULL THEN
    NEW.month_id := compute_month_id_from_date(NEW.date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_expenses_set_month_id
BEFORE INSERT OR UPDATE ON daily_expenses
FOR EACH ROW
EXECUTE FUNCTION set_daily_expense_month_id();

COMMENT ON TRIGGER daily_expenses_set_month_id ON daily_expenses IS 'Auto-populates month_id from date field';

-- ============================================
-- 9. DEPRECATION COMMENTS
-- ============================================

-- Mark old month/year columns as deprecated (but keep for backward compatibility)
COMMENT ON COLUMN monthly_budgets.month IS 'DEPRECATED: Use month_id instead. Kept for backward compatibility. 0-based (0=Jan, 11=Dec)';
COMMENT ON COLUMN monthly_budgets.year IS 'DEPRECATED: Use month_id instead. Kept for backward compatibility.';
