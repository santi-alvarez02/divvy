import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that environment variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase credentials missing!');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local');
}

// Create Supabase client with optimized settings for persistent sessions
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage, // Explicitly use localStorage for persistence
    storageKey: 'divvy-auth-token', // Custom key for auth storage
    flowType: 'implicit', // Use implicit flow for email confirmations (works across devices)
    debug: false // Set to true for debugging auth issues
  },
  global: {
    headers: {
      'X-Client-Info': 'divvy-pwa'
    }
  },
  db: {
    schema: 'public'
  },
  // Ensure proper session handling on app resume/reload
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
