-- =====================================================
-- ADD RECURRING EXPENSE SUPPORT
-- Session 48: Implement Recurring Expenses
-- =====================================================

-- Add is_recurring column to expenses table
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Add last_recurring_date to track when this expense was last auto-created
-- This helps prevent duplicate creation and tracks the last occurrence
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS last_recurring_date DATE;

-- Add index for efficient querying of recurring expenses
CREATE INDEX IF NOT EXISTS idx_expenses_recurring
ON expenses(is_recurring, last_recurring_date)
WHERE is_recurring = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN expenses.is_recurring IS 'Whether this expense should automatically recur every month';
COMMENT ON COLUMN expenses.last_recurring_date IS 'The last date this recurring expense was automatically created';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
