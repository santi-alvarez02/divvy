-- =====================================================
-- FIX GROUPS TABLE RLS POLICY
-- Allow users to see groups they created (admin_id)
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view groups they belong to" ON groups;

-- Recreate with admin_id check added
-- Users can see groups if:
-- 1. They are the admin (admin_id matches), OR
-- 2. They are a member (in group_members table)
CREATE POLICY "Users can view groups they belong to"
  ON groups FOR SELECT
  USING (
    admin_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

-- =====================================================
-- DONE! Try creating a group again.
-- =====================================================
