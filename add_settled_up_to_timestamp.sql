-- =====================================================
-- ADD SETTLED_UP_TO_TIMESTAMP COLUMN TO SETTLEMENTS TABLE
-- This tracks which expenses are covered by each settlement
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- Add the column to track the latest expense date included in this settlement
ALTER TABLE settlements
ADD COLUMN IF NOT EXISTS settled_up_to_timestamp TIMESTAMPTZ;

-- Add comment explaining the column
COMMENT ON COLUMN settlements.settled_up_to_timestamp IS
'Timestamp of the most recent expense included in this settlement. Expenses created before or at this timestamp are considered settled.';

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
-- This allows us to:
-- 1. Show only unsettled expenses in Active Balances
-- 2. Show only settled expenses in Settlement History detail view
-- 3. Properly track which expenses have been paid for
-- =====================================================
