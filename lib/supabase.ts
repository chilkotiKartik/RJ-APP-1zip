// RJ-APP/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { storage } from './storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!url || !anon) {
  console.warn(
    '[RJ] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
    'Auth and data features will not work until these are configured.'
  );
}

// Use placeholder values so the client can be constructed without crashing.
// All requests will fail gracefully when credentials are missing.
export const supabase = createClient(url || 'https://placeholder.supabase.co', anon || 'placeholder', {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
