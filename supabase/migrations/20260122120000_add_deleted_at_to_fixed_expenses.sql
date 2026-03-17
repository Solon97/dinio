-- Add deleted_at column to fixed_expenses for soft delete
ALTER TABLE fixed_expenses
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for efficient filtering of active expenses
CREATE INDEX idx_fixed_expenses_active 
ON fixed_expenses (user_id, month_id, deleted_at)
WHERE deleted_at IS NULL;

-- Create index for soft-deleted records (for audit queries)
CREATE INDEX idx_fixed_expenses_deleted
ON fixed_expenses (user_id, deleted_at)
WHERE deleted_at IS NOT NULL;

-- Update RLS policies to exclude soft-deleted records from normal queries
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own fixed expenses" ON fixed_expenses;
DROP POLICY IF EXISTS "Users can insert their own fixed expenses" ON fixed_expenses;
DROP POLICY IF EXISTS "Users can update their own fixed expenses" ON fixed_expenses;
DROP POLICY IF EXISTS "Users can delete their own fixed expenses" ON fixed_expenses;

-- Recreate policies with deleted_at filter
CREATE POLICY "Users can view their own active fixed expenses"
ON fixed_expenses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert their own fixed expenses"
ON fixed_expenses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fixed expenses"
ON fixed_expenses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft delete their own fixed expenses"
ON fixed_expenses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow viewing deleted records for audit purposes (optional - can be removed if not needed)
CREATE POLICY "Users can view their own deleted fixed expenses for audit"
ON fixed_expenses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND deleted_at IS NOT NULL);

COMMENT ON COLUMN fixed_expenses.deleted_at IS 'Soft delete timestamp - NULL means active, timestamp means deleted. Kept forever for audit trail.';
