-- =====================================================
-- FIX: Update RLS policies to allow signup
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create a more permissive insert policy that allows auth.users to create their profile
CREATE POLICY "Enable insert for authenticated users during signup"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also allow service role to insert (for any backend processes)
CREATE POLICY "Enable insert for service role"
  ON users FOR INSERT
  TO service_role
  WITH CHECK (true);
