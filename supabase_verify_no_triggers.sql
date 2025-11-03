-- =====================================================
-- VERIFY NO AUTO-TRIGGERS ON AUTH.USERS
-- Run this in Supabase SQL Editor to check for triggers
-- =====================================================

-- 1. Check for any triggers on auth.users table
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';

-- 2. Check for any functions that might be auto-creating users
SELECT
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%user%'
AND routine_name LIKE '%handle%';

-- 3. If any triggers exist, drop them:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS handle_new_user();
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4. Verify users table RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users';

-- =====================================================
-- EXPECTED RESULT:
-- No triggers should be found on auth.users
-- Only manual user creation should be possible
-- =====================================================
