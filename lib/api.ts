// RJ-APP/lib/api.ts
import { supabase } from './supabase';

const WEB_BASE = process.env.EXPO_PUBLIC_WEB_BASE ?? 'http://localhost:3000';

async function authedFetch(path: string, init: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  headers.set('Content-Type', 'application/json');
  return fetch(`${WEB_BASE}${path}`, { ...init, headers });
}

export async function redeemReferral(code: string): Promise<{ ok: boolean; error?: string }> {
  const res = await authedFetch('/api/referral', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    let error = 'Invalid code';
    try { error = (await res.json()).error ?? error; } catch { /* ignore parse errors */ }
    return { ok: false, error };
  }
  return { ok: true };
}

export async function saveProfile(input: {
  firstName: string;
  socialHandle?: string | null;
  photoUrls: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const res = await authedFetch('/api/profile', {
    method: 'POST',
    body: JSON.stringify({
      firstName: input.firstName,
      socialHandle: input.socialHandle ?? null,
      photoUrls: input.photoUrls,
    }),
  });
  if (!res.ok) {
    let error = 'Could not save profile';
    try { error = (await res.json()).error ?? error; } catch { /* ignore parse errors */ }
    return { ok: false, error };
  }
  return { ok: true };
}
