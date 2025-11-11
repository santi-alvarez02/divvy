-- =====================================================
-- ADD DEFAULT_CURRENCY COLUMN TO USERS TABLE
-- Run this SQL in Supabase SQL Editor
-- =====================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS default_currency VARCHAR(3) DEFAULT 'USD';

-- Add check constraint to ensure valid currency codes
ALTER TABLE users
ADD CONSTRAINT valid_currency_code CHECK (default_currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD'));
