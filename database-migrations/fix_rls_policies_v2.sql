-- =====================================================
-- FIX INFINITE RECURSION IN GROUP_MEMBERS RLS POLICIES (V2)
-- This approach completely disables RLS recursion
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- Step 1: Drop ALL existing policies on group_members
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Admins can remove members" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;

-- Step 2: Create a SECURITY DEFINER function to check group membership
-- This function runs with elevated privileges and bypasses RLS
CREATE OR REPLACE FUNCTION is_group_member(p_user_id UUID, p_group_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE user_id = p_user_id AND group_id = p_group_id
  );
END;
$$;

-- Step 3: Recreate policies using the function (avoids recursion)
CREATE POLICY "Users can view members of their groups"
  ON group_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    is_group_member(auth.uid(), group_id)
  );

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can remove members"
  ON group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.admin_id = auth.uid()
    )
  );

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- ALTERNATIVE SIMPLE APPROACH (If above still fails)
-- Temporarily make group_members readable by all authenticated users
-- Security is still maintained because users can only see groups
-- they belong to via the groups table RLS policy
-- =====================================================
-- DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
--
-- CREATE POLICY "Authenticated users can view group members"
--   ON group_members FOR SELECT
--   TO authenticated
--   USING (true);

-- =====================================================
-- POLICIES FIXED!
-- =====================================================
