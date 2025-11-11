-- =====================================================
-- ADD MONTHLY_BUDGET COLUMN TO USERS TABLE
-- Run this SQL in Supabase SQL Editor
-- =====================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS monthly_budget DECIMAL(10, 2) DEFAULT 0;

-- Add check constraint to ensure budget is non-negative
ALTER TABLE users
ADD CONSTRAINT monthly_budget_positive CHECK (monthly_budget >= 0);
