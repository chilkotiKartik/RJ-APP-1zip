// RJ-APP/lib/auth.ts
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle(): Promise<{ ok: boolean; error?: string }> {
  const redirectTo = AuthSession.makeRedirectUri({ scheme: 'rj-app', path: 'auth/callback' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) return { ok: false, error: error?.message ?? 'OAuth init failed' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) return { ok: false, error: 'Cancelled' };

  const parsed = new URL(result.url);
  const params = parsed.hash ? new URLSearchParams(parsed.hash.slice(1)) : parsed.searchParams;
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return { ok: false, error: 'No tokens in callback URL' };

  const { error: sessionErr } = await supabase.auth.setSession({ access_token, refresh_token });
  if (sessionErr) return { ok: false, error: sessionErr.message };
  return { ok: true };
}
