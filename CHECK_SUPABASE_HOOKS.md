# How to Check for Supabase Hooks

The data is being created automatically despite no database triggers. This means there might be **Auth Hooks** or **Database Webhooks** configured in Supabase.

## Check #1: Auth Hooks (Most Likely)

Auth Hooks trigger on authentication events like signup, login, etc.

**Steps:**
1. Go to your Supabase Dashboard
2. Click on **"Authentication"** in the left sidebar
3. Scroll down to **"Hooks"** section
4. Look for any hooks configured, especially:
   - `user_created` hook
   - `user_signed_up` hook
   - Any custom SQL function hooks

**If you find any hooks:**
- Note what they do
- Disable or delete them
- The user creation should happen in your frontend code during onboarding, not via hooks

## Check #2: Database Webhooks

Database webhooks trigger on table changes.

**Steps:**
1. Go to **"Database"** → **"Webhooks"** in Supabase
2. Check if there are any webhooks listening to the `auth.users` table
3. Check if any webhooks are inserting into the `public.users` table

**If you find any webhooks:**
- Disable them
- User creation should be manual via your onboarding flow

## Check #3: Edge Functions

Supabase Edge Functions can be triggered on auth events.

**Steps:**
1. Go to **"Edge Functions"** in Supabase
2. Check if there are any functions deployed
3. Look for functions related to user creation or signup

**If you find any:**
- Check what they do
- Disable/remove if they're auto-creating users

## Check #4: Database Functions with Security Definer

Sometimes there are database functions that run with elevated permissions.

**Run this SQL:**
```sql
-- Check for functions with SECURITY DEFINER that might auto-create users
SELECT
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%users%'
AND pg_get_functiondef(p.oid) ILIKE '%insert%'
AND p.prosecdef = true;  -- SECURITY DEFINER functions
```

## Most Likely Culprit: Auth Hook

Based on the symptoms (data appears immediately after signup), this is **most likely an Auth Hook** configured in Supabase that triggers when a new user signs up.

**Look for:**
- **Authentication** → **Hooks** → Any enabled hooks
- Specifically `user_created` or `user_signed_up` hooks

**What you should see:**
- ✅ NO hooks configured
- ✅ NO webhooks configured
- ✅ NO edge functions for user creation

**What to do if you find something:**
1. Take a screenshot/note of what it is
2. Disable or delete it
3. Test signup again - data should NOT appear until onboarding completes
