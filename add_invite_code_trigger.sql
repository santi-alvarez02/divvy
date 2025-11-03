-- =====================================================
-- AUTO-GENERATE INVITE CODE TRIGGER FOR GROUPS TABLE
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- Drop existing function if it exists (to avoid type conflicts)
DROP FUNCTION IF EXISTS generate_invite_code();

-- Create function to generate random invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate a random 6-character uppercase code
  NEW.invite_code = UPPER(substring(md5(random()::text) from 1 for 6));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call function before insert
DROP TRIGGER IF EXISTS set_invite_code ON groups;
CREATE TRIGGER set_invite_code
  BEFORE INSERT ON groups
  FOR EACH ROW
  WHEN (NEW.invite_code IS NULL)
  EXECUTE FUNCTION generate_invite_code();

-- =====================================================
-- TRIGGER CREATED!
-- Now groups will auto-generate invite codes
-- =====================================================
