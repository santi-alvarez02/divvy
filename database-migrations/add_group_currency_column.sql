-- =====================================================
-- ADD DEFAULT_CURRENCY COLUMN TO GROUPS TABLE
-- Run this SQL in Supabase SQL Editor
-- =====================================================

ALTER TABLE groups
ADD COLUMN IF NOT EXISTS default_currency VARCHAR(3) DEFAULT 'USD';

-- Add check constraint to ensure valid currency codes
ALTER TABLE groups
ADD CONSTRAINT group_valid_currency_code CHECK (default_currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD'));
