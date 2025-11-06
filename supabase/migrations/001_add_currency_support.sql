-- Migration: Add currency support for per-user display currency
-- Date: 2025-11-06
-- Description: Add currency column to expenses table and create exchange_rates table

-- Step 1: Add currency column to expenses table
-- This stores the original currency the expense was entered in
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD' NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN expenses.currency IS 'The currency the expense was originally entered in (ISO 4217 code)';

-- Step 2: Create exchange_rates table for caching daily rates
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(10, 6) NOT NULL CHECK (rate > 0),
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure we only have one rate per currency pair
  UNIQUE(from_currency, to_currency)
);

-- Add comments
COMMENT ON TABLE exchange_rates IS 'Stores cached exchange rates updated daily from exchangerate-api.com';
COMMENT ON COLUMN exchange_rates.from_currency IS 'Source currency (ISO 4217 code)';
COMMENT ON COLUMN exchange_rates.to_currency IS 'Target currency (ISO 4217 code)';
COMMENT ON COLUMN exchange_rates.rate IS 'Exchange rate: 1 from_currency = rate * to_currency';
COMMENT ON COLUMN exchange_rates.updated_at IS 'Last time this rate was updated';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies
ON exchange_rates(from_currency, to_currency);

-- Create index for checking freshness of rates
CREATE INDEX IF NOT EXISTS idx_exchange_rates_updated_at
ON exchange_rates(updated_at DESC);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for exchange_rates

-- Policy 1: Everyone (authenticated) can read exchange rates
CREATE POLICY "Anyone can view exchange rates"
  ON exchange_rates
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Only allow service role to insert/update rates
-- (This will be done by our edge function or manual admin updates)
CREATE POLICY "Service role can insert rates"
  ON exchange_rates
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update rates"
  ON exchange_rates
  FOR UPDATE
  TO service_role
  USING (true);

-- Step 5: Create function to update exchange rate
-- This function ensures we upsert (insert or update) rates
CREATE OR REPLACE FUNCTION upsert_exchange_rate(
  p_from_currency VARCHAR(3),
  p_to_currency VARCHAR(3),
  p_rate DECIMAL(10, 6)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO exchange_rates (from_currency, to_currency, rate, updated_at)
  VALUES (p_from_currency, p_to_currency, p_rate, NOW())
  ON CONFLICT (from_currency, to_currency)
  DO UPDATE SET
    rate = EXCLUDED.rate,
    updated_at = NOW();
END;
$$;

-- Grant execute permission to authenticated users (for manual testing)
GRANT EXECUTE ON FUNCTION upsert_exchange_rate TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_exchange_rate TO service_role;

-- Step 6: Insert some initial rates (USD as base currency)
-- These will be updated by the API, but good to have defaults
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
  ('USD', 'USD', 1.000000),
  ('USD', 'EUR', 0.930000),
  ('USD', 'GBP', 0.790000),
  ('USD', 'JPY', 149.500000),
  ('USD', 'CAD', 1.360000),
  ('USD', 'AUD', 1.520000),
  ('USD', 'CHF', 0.880000),
  ('USD', 'CNY', 7.240000),
  ('USD', 'INR', 83.120000),
  ('USD', 'MXN', 17.050000)
ON CONFLICT (from_currency, to_currency) DO NOTHING;

-- Migration complete
-- Next steps:
-- 1. Run this migration in Supabase SQL editor
-- 2. Test by querying: SELECT * FROM exchange_rates;
-- 3. Test upsert function: SELECT upsert_exchange_rate('USD', 'EUR', 0.93);
