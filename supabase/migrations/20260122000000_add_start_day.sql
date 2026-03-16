-- Add start_day column to monthly_budgets
-- This column stores the day of the month when the budget was configured (1-31).
-- Used to calculate daily limits and history starting from the configuration day,
-- ensuring consistent calculations regardless of when the budget is viewed.

ALTER TABLE monthly_budgets
ADD COLUMN start_day INTEGER DEFAULT 1;

-- Populate existing records with day 1 (assumes budgets were configured at month start)
UPDATE monthly_budgets 
SET start_day = 1 
WHERE start_day IS NULL;

-- Make the column NOT NULL after populating existing data
ALTER TABLE monthly_budgets
ALTER COLUMN start_day SET NOT NULL;

-- Add column comment for documentation
COMMENT ON COLUMN monthly_budgets.start_day IS 
'Day of the month when the budget was configured (1-31). Used to calculate daily limits and history only from this day forward, ensuring precision for mid-month setups.';
