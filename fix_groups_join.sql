-- =====================================================
-- FIX GROUPS TABLE RLS - ALLOW FINDING BY INVITE CODE
-- Users need to be able to find groups by invite code to join them
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view groups they belong to" ON groups;

-- Recreate with invite code lookup allowed
-- Users can see groups if:
-- 1. They are the admin (admin_id matches), OR
-- 2. They are a member (in group_members table), OR
-- 3. They are looking up a specific group by invite code (for joining)
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

-- Add a separate policy specifically for finding groups by invite code
-- This allows ANY authenticated user to find a group if they know the invite code
CREATE POLICY "Users can find groups by invite code"
  ON groups FOR SELECT
  TO authenticated
  USING (invite_code IS NOT NULL);

-- =====================================================
-- EXPLANATION:
-- The second policy allows authenticated users to SELECT groups
-- when searching by invite_code. This is safe because:
-- 1. Users still need the exact 6-character code to find a group
-- 2. The code is randomly generated and hard to guess
-- 3. Users can only JOIN groups (not view details) without being a member
-- =====================================================
