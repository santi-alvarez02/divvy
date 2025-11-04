-- =====================================================
-- CREATE EXPENSES AND EXPENSE_SPLITS TABLES
-- Phase 3: Expenses Backend
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. EXPENSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  category VARCHAR(100) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  icon VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_group ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view expenses in their groups
CREATE POLICY "Users can view group expenses"
  ON expenses FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Group members can create expenses
CREATE POLICY "Group members can create expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update their own expenses
CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = paid_by);

-- RLS Policy: Users can delete their own expenses
CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = paid_by);

-- =====================================================
-- 2. EXPENSE_SPLITS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_amount DECIMAL(10, 2) NOT NULL CHECK (share_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(expense_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_splits_expense ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_splits_user ON expense_splits(user_id);

-- Enable Row Level Security
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view splits for expenses they can see
CREATE POLICY "Users can view relevant splits"
  ON expense_splits FOR SELECT
  USING (
    expense_id IN (
      SELECT id FROM expenses WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policy: Group members can create splits
CREATE POLICY "Group members can create splits"
  ON expense_splits FOR INSERT
  WITH CHECK (
    expense_id IN (
      SELECT id FROM expenses WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policy: Users can update splits for their expenses
CREATE POLICY "Users can update splits for their expenses"
  ON expense_splits FOR UPDATE
  USING (
    expense_id IN (
      SELECT id FROM expenses WHERE paid_by = auth.uid()
    )
  );

-- RLS Policy: Users can delete splits for their expenses
CREATE POLICY "Users can delete splits for their expenses"
  ON expense_splits FOR DELETE
  USING (
    expense_id IN (
      SELECT id FROM expenses WHERE paid_by = auth.uid()
    )
  );

-- =====================================================
-- 3. UPDATED_AT TRIGGER FOR EXPENSES
-- =====================================================
-- Apply the existing update_updated_at_column function to expenses table
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLES CREATED SUCCESSFULLY!
-- =====================================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Verify tables appear in Supabase dashboard
-- 3. Test by creating a sample expense manually
-- =====================================================
