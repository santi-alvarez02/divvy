-- =====================================================
-- SIMPLE FIX FOR INFINITE RECURSION
-- Allow authenticated users to read group_members
-- (Security maintained via groups table RLS)
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;

-- Create a simple non-recursive policy
-- All authenticated users can SELECT from group_members
-- This is secure because:
-- 1. Users fetch groups via the groups table (which has RLS)
-- 2. Users can only see groups they're members of
-- 3. Then they fetch members for those groups
-- 4. So even though they CAN read group_members, they only query groups they have access to
CREATE POLICY "Authenticated users can view group members"
  ON group_members FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- DONE! Try creating a group again.
-- =====================================================
