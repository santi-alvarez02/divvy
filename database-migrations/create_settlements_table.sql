-- =====================================================
-- CREATE SETTLEMENTS TABLE
-- For tracking payments between group members
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- SETTLEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure from and to users are different
  CHECK (from_user_id != to_user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_settlements_group ON settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_settlements_from_user ON settlements(from_user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_to_user ON settlements(to_user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_created_at ON settlements(created_at DESC);

-- Enable Row Level Security
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view settlements in their groups
CREATE POLICY "Users can view group settlements"
  ON settlements FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Group members can create settlements
CREATE POLICY "Group members can create settlements"
  ON settlements FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
    AND from_user_id = auth.uid()
  );

-- RLS Policy: Users can update settlements they are involved in
CREATE POLICY "Users can update their settlements"
  ON settlements FOR UPDATE
  USING (
    (from_user_id = auth.uid() OR to_user_id = auth.uid())
    AND group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete pending settlements they created
CREATE POLICY "Users can delete their pending settlements"
  ON settlements FOR DELETE
  USING (
    from_user_id = auth.uid()
    AND status = 'pending'
  );

-- =====================================================
-- UPDATED_AT TRIGGER FOR SETTLEMENTS
-- =====================================================
-- Apply the existing update_updated_at_column function to settlements table
DROP TRIGGER IF EXISTS update_settlements_updated_at ON settlements;
CREATE TRIGGER update_settlements_updated_at
  BEFORE UPDATE ON settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTO-UPDATE COMPLETED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_settlement_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_settlement_completed_at_trigger ON settlements;
CREATE TRIGGER update_settlement_completed_at_trigger
  BEFORE UPDATE ON settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_settlement_completed_at();

-- =====================================================
-- TABLE CREATED SUCCESSFULLY!
-- =====================================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Verify table appears in Supabase dashboard
-- 3. Update frontend to use real database instead of mock data
-- =====================================================
