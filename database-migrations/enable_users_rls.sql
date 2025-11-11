-- Enable Row Level Security on users table
-- This is CRITICAL for security - ensures users can only access their own data

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Verify RLS policies exist (should already be there)
-- Users can view own data
-- Users can insert own data
-- Users can update own data
-- Users can delete own data

-- Test that RLS is enabled
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'users' AND relnamespace = 'public'::regnamespace) THEN
    RAISE EXCEPTION 'RLS is not enabled on users table!';
  ELSE
    RAISE NOTICE 'RLS successfully enabled on users table';
  END IF;
END $$;
