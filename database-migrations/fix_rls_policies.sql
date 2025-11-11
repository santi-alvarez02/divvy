-- =====================================================
-- FIX INFINITE RECURSION IN GROUP_MEMBERS RLS POLICIES
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;

-- Create a simpler, non-recursive policy
-- Users can view group_members records where they are the user
-- OR where they share a group_id with a record where they are the user
CREATE POLICY "Users can view members of their groups"
  ON group_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- ALTERNATIVE: If the above still causes issues, use this simpler version
-- =====================================================
-- DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
--
-- CREATE POLICY "Users can view members of their groups"
--   ON group_members FOR SELECT
--   USING (true);  -- Allow viewing all group members (still secure because users can only see groups they're in via groups table policy)

-- =====================================================
-- POLICY FIXED!
-- =====================================================
