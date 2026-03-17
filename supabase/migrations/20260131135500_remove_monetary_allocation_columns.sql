-- Migration: Remove redundant monetary allocation columns from monthly_budgets
-- Author: Dinio Team
-- Date: 2026-01-31
-- Description: Remove total_fixed, daily_budget, and reserve_amount columns since
--              these values can be calculated from percentages and total_income.
--              This ensures data consistency and eliminates sync issues.

-- ============================================
-- 1. Drop redundant monetary allocation columns
-- ============================================

ALTER TABLE monthly_budgets
  DROP COLUMN IF EXISTS total_fixed,
  DROP COLUMN IF EXISTS daily_budget,
  DROP COLUMN IF EXISTS reserve_amount;

-- ============================================
-- 2. Add database constraints for percentages
-- ============================================

-- Ensure percentages are within valid range
ALTER TABLE monthly_budgets
  ADD CONSTRAINT check_fixed_percent_range 
    CHECK (fixed_percent >= 0 AND fixed_percent <= 100);

ALTER TABLE monthly_budgets
  ADD CONSTRAINT check_daily_percent_range 
    CHECK (daily_percent >= 0 AND daily_percent <= 100);

ALTER TABLE monthly_budgets
  ADD CONSTRAINT check_reserve_percent_range 
    CHECK (reserve_percent >= 0 AND reserve_percent <= 100);

-- Ensure total income is positive
ALTER TABLE monthly_budgets
  ADD CONSTRAINT check_total_income_positive 
    CHECK (total_income > 0);

-- Ensure allocation percentages sum to approximately 100%
-- Allow ±0.1% tolerance for rounding (99.9% - 100.1%)
ALTER TABLE monthly_budgets
  ADD CONSTRAINT check_allocation_sum 
    CHECK (
      (fixed_percent + daily_percent + reserve_percent) >= 99.9 
      AND 
      (fixed_percent + daily_percent + reserve_percent) <= 100.1
    );

-- ============================================
-- 3. Add performance indexes
-- ============================================

-- Index for fetching budget by user and specific month
CREATE INDEX IF NOT EXISTS idx_monthly_budgets_user_month_year 
  ON monthly_budgets(user_id, month, year);

-- Index for fetching yearly summaries
CREATE INDEX IF NOT EXISTS idx_monthly_budgets_user_year 
  ON monthly_budgets(user_id, year);

-- Index for month_id queries (already used extensively)
CREATE INDEX IF NOT EXISTS idx_monthly_budgets_month_id 
  ON monthly_budgets(month_id);

-- ============================================
-- NOTES:
-- ============================================
-- After this migration:
-- - total_fixed = ROUND(total_income * (fixed_percent / 100))
-- - daily_budget = ROUND(total_income * (daily_percent / 100))
-- - reserve_amount = ROUND(total_income * (reserve_percent / 100))
--
-- These values are now calculated dynamically in the application layer.
-- The `initial_spent` and `start_day` columns remain for mid-month setup adjustment.
