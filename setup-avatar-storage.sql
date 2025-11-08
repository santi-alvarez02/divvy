-- ================================================
-- Avatar Storage Setup for Divvy App
-- ================================================
-- This script creates the necessary storage bucket and RLS policies
-- for user avatar uploads.
--
-- Instructions:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Paste this entire script
-- 5. Run the query
-- 6. Then manually create the 'avatars' bucket in Storage tab
-- ================================================

-- Create RLS policies for the avatars bucket
-- Note: The bucket must be created manually in the Supabase Dashboard first
-- Go to Storage > Create a new bucket named 'avatars' with:
--   - Public bucket: YES
--   - File size limit: 2MB (2097152 bytes)
--   - Allowed MIME types: image/png, image/jpeg, image/jpg, image/webp, image/gif

-- Allow users to upload their own avatar
CREATE POLICY IF NOT EXISTS "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY IF NOT EXISTS "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY IF NOT EXISTS "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to avatars
CREATE POLICY IF NOT EXISTS "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
