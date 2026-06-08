// RJ-APP/lib/api.ts
import { supabase } from './supabase';

const WEB_BASE = process.env.EXPO_PUBLIC_WEB_BASE ?? '';

async function authedFetch(path: string, init: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers as HeadersInit | undefined);
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

export async function respondToMatch(
  matchId: string,
  response: 'yes' | 'no',
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await authedFetch('/api/match/respond', {
      method: 'POST',
      body: JSON.stringify({ matchId, response, note }),
    });
    if (!res.ok) {
      let error = 'Could not send response';
      try { error = (await res.json()).error ?? error; } catch { /* ignore */ }
      return { ok: false, error };
    }
    return { ok: true };
  } catch {
    // Fallback: write directly to Supabase if web backend unreachable
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { ok: false, error: 'Not authenticated' };
      const { data: match } = await supabase
        .from('matches')
        .select('user_a, user_b')
        .eq('id', matchId)
        .maybeSingle();
      if (match) {
        const col = (match as { user_a: string; user_b: string }).user_a === user.id ? 'a_response' : 'b_response';
        await supabase
          .from('matches')
          .update({ [col]: JSON.stringify({ choice: response, note, ts: new Date().toISOString() }) })
          .eq('id', matchId);
      }
      return { ok: true };
    } catch (e2) {
      return { ok: false, error: e2 instanceof Error ? e2.message : 'unknown' };
    }
  }
}
