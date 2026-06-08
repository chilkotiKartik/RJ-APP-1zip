// RJ-APP/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { storage } from './storage';

// The two EXPO_PUBLIC_ secrets are sometimes stored swapped in the Secrets UI.
// We detect which is which by checking which value starts with "https://".
const raw1 = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const raw2 = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const url  = raw1.startsWith('https://') ? raw1 : raw2.startsWith('https://') ? raw2 : '';
const anon = raw1.startsWith('https://') ? raw2 : raw2.startsWith('https://') ? raw1 : '';

if (!url || !anon) {
  console.warn(
    '[RJ] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
    'Auth and data features will not work until these are configured.'
  );
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', anon || 'placeholder', {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
