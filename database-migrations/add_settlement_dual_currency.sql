-- =====================================================
-- ADD DUAL CURRENCY SUPPORT TO SETTLEMENTS TABLE
-- Session 52: Fix settlement currency display bug
-- =====================================================
-- Problem: When Santiago (USD) pays Liam (EUR), the settlement
-- shows $61.98 to Liam instead of €53.44 (the actual debt).
-- Solution: Store both payer's and receiver's amounts/currencies.
-- =====================================================

-- Add new columns for receiver's perspective
ALTER TABLE settlements
ADD COLUMN IF NOT EXISTS from_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS from_currency VARCHAR(3),
ADD COLUMN IF NOT EXISTS to_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS to_currency VARCHAR(3);

-- Update existing column comment for clarity
COMMENT ON COLUMN settlements.amount IS 'Deprecated: Use from_amount instead';

-- Add check constraints for new columns
ALTER TABLE settlements
ADD CONSTRAINT check_from_amount_positive CHECK (from_amount IS NULL OR from_amount > 0),
ADD CONSTRAINT check_to_amount_positive CHECK (to_amount IS NULL OR to_amount > 0);

-- =====================================================
-- MIGRATION FUNCTION FOR EXISTING DATA
-- =====================================================
-- This function will migrate existing settlements to use the new dual-currency format
-- Run this AFTER adding the columns to populate existing data

CREATE OR REPLACE FUNCTION migrate_existing_settlements()
RETURNS void AS $$
BEGIN
  -- For existing settlements, copy amount to both from_amount and to_amount
  -- and set currencies to 'USD' (default)
  -- This is a best-effort migration - manual review may be needed
  UPDATE settlements
  SET
    from_amount = amount,
    from_currency = 'USD',
    to_amount = amount,
    to_currency = 'USD'
  WHERE from_amount IS NULL OR to_amount IS NULL;

  RAISE NOTICE 'Migrated existing settlements to dual-currency format';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RUN MIGRATION (Comment out after first run)
-- =====================================================
-- SELECT migrate_existing_settlements();

-- =====================================================
-- NOTES FOR DEVELOPERS
-- =====================================================
-- from_amount: Amount in payer's currency (e.g., $61.98 for Santiago)
-- from_currency: Payer's currency code (e.g., 'USD')
-- to_amount: Amount in receiver's currency (e.g., €53.44 for Liam)
-- to_currency: Receiver's currency code (e.g., 'EUR')
--
-- The old 'amount' column is deprecated but kept for backwards compatibility
-- New code should use from_amount/to_amount instead
--
-- Example:
-- Santiago (USD) owes Liam (EUR) €53.44
-- When Santiago marks as paid:
--   from_user_id = santiago_id
--   from_amount = 61.98
--   from_currency = 'USD'
--   to_user_id = liam_id
--   to_amount = 53.44
--   to_currency = 'EUR'
--
-- When displaying to Liam: show to_amount (€53.44)
-- When displaying to Santiago: show from_amount ($61.98)
-- =====================================================

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify the new columns exist
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'settlements'
-- ORDER BY ordinal_position;
-- =====================================================
