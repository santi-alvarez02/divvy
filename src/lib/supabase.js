import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that environment variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase credentials missing!');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local');
}

// Create Supabase client with optimized settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage, // Explicitly use localStorage for persistence
    storageKey: 'divvy-auth-token', // Custom key for auth storage
    flowType: 'pkce' // More secure auth flow
  }
});
