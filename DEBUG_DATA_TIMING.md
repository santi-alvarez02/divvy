# Debugging: Data Being Saved Too Early

## Issue
User data is being saved to the database immediately after signup, before completing onboarding.

## Expected Flow
1. User signs up → Only creates auth.users record (Supabase Auth)
2. User completes onboarding → NOW save to public.users table
3. User redirected to dashboard

## Current Problem
Data is appearing in public.users table right after signup, not after onboarding.

## Possible Causes

### 1. Database Trigger (MOST LIKELY)
There might still be a trigger on `auth.users` that auto-creates records in `public.users`.

**To Check:**
1. Go to Supabase → Database → Triggers
2. Switch schema dropdown to "auth"
3. Look for any triggers on the "users" table
4. Check for triggers like:
   - `on_auth_user_created`
   - `handle_new_user`
   - Any trigger that mentions "user"

**To Fix:**
Run the SQL in `supabase_verify_no_triggers.sql` to check and remove any triggers.

### 2. RLS Policy Issue
The INSERT policy on `public.users` might be too permissive.

**Current Policy (from supabase_fix_policies.sql):**
```sql
CREATE POLICY "Enable insert for authenticated users during signup"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
```

This is correct - it only allows users to insert their own record. Not the issue.

### 3. Onboarding Code Issue
The `handleFinishOnboarding()` function in `src/pages/Onboarding.jsx` might be called prematurely.

**Current Implementation:**
- Step 1 (Profile Picture): Skip → Goes to Step 2 ✅
- Step 2 (Account Type): Solo → Calls `handleFinishOnboarding('solo')` ✅
- Step 2 (Account Type): Group → Goes to Step 3 ✅
- Step 3 (Group): Create/Join → Calls `handleFinishOnboarding()` ✅

This looks correct. Data should only be saved when:
- User selects Solo account
- User completes Create/Join group flow

## Testing Steps

### Test 1: Check for Triggers
1. Run `supabase_verify_no_triggers.sql` in Supabase SQL Editor
2. If any triggers are found, drop them using the commented SQL
3. Try signup again

### Test 2: Check Database Directly
1. Go to Supabase → Table Editor → users table
2. Delete all test records
3. Sign up with a new test account
4. **IMMEDIATELY check the users table** (before completing onboarding)
5. If a record appears → You have a trigger
6. If no record appears → Trigger is removed ✅

### Test 3: Complete Onboarding
1. After signing up, go through onboarding
2. Complete all steps
3. Check users table
4. Record should appear NOW (after onboarding)

## How to Fix

### If Trigger Exists:
```sql
-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user();
```

### If No Trigger Found:
The code is correct. The issue might be:
1. Browser cache (clear and reload)
2. Old test data (delete and test fresh)
3. Another function/webhook in Supabase

## Verification

After fixing, test the complete flow:
1. Sign up → Check DB → Should see NO record in public.users
2. Go to onboarding → Check DB → Should see NO record yet
3. Complete onboarding → Check DB → Should see record NOW

## Code Files to Review

- `src/contexts/AuthContext.jsx` → signUp() function (only does auth.signUp) ✅
- `src/pages/Signup.jsx` → handleSubmit() (only calls signUp, redirects) ✅
- `src/pages/Onboarding.jsx` → handleFinishOnboarding() (saves to DB) ✅

All frontend code is correct. The issue is in the database (trigger or function).
