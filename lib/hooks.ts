// RJ-APP/lib/hooks.ts
import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';

export type Phase =
  | 'REFERRAL'
  | 'PROFILE'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'CHATTING'
  | 'QUESTIONNAIRE_DONE'
  | 'WAITING'
  | 'LETTER_READY'
  | 'COMPLETE'
  | 'REJECTED';

export type Profile = {
  user_id: string;
  phase: Phase;
  first_name: string | null;
  social_handle: string | null;
  photo_urls: string[] | null;
  archetype: string | null;
  questionnaire_answers: Record<string, unknown> | null;
  expo_push_token?: string | null;
};

export type StatusResult = {
  loading: boolean;
  phase: Phase;
  profile: Profile | null;
  userId: string | null;
  refresh: () => Promise<void>;
};

export function useStatus(pollMs = 5000): StatusResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const userIdRef = useRef<string | null>(null);

  const fetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUserId(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    setUserId(user.id);
    userIdRef.current = user.id;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setProfile((data as Profile | null) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    fetch();

    // Try Supabase Realtime first
    let realtimeFailed = false;
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ch = supabase
        .channel(`profile-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setProfile((payload.new as Profile) ?? null);
          },
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            realtimeFailed = true;
          }
        });

      channelRef.current = ch;
    };

    setupRealtime().catch(() => { realtimeFailed = true; });

    // Fall back to polling if realtime fails (after 3s) or pollMs explicitly set
    let pollId: ReturnType<typeof setInterval> | null = null;
    const startPoll = () => {
      if (pollMs && !pollId) {
        pollId = setInterval(fetch, pollMs);
      }
    };

    const fallbackCheck = setTimeout(() => {
      if (realtimeFailed && pollMs) startPoll();
      else if (pollMs) startPoll();
    }, 3000);

    return () => {
      clearTimeout(fallbackCheck);
      if (pollId) clearInterval(pollId);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [pollMs]);

  return {
    loading,
    phase: profile?.phase ?? 'REFERRAL',
    profile,
    userId,
    refresh: fetch,
  };
}

export type MatchProfile = { first_name: string | null; archetype?: string | null } | null;
export type MatchRow = {
  id: string;
  user_a: string | null;
  user_b: string | null;
  status: string | null;
  a_response: string | null;
  b_response: string | null;
  created_at: string | null;
  profile_a: MatchProfile;
  profile_b: MatchProfile;
};

export type MatchesResult = {
  matches: MatchRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useMatches(userId: string | null): MatchesResult {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    if (!userId) {
      setMatches([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error: err } = await supabase
        .from('matches')
        .select(
          '*, profile_a:profiles!user_a(first_name), profile_b:profiles!user_b(first_name)'
        )
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .order('created_at', { ascending: false });
      if (err) {
        const fb = await supabase
          .from('matches')
          .select('*')
          .or(`user_a.eq.${userId},user_b.eq.${userId}`)
          .order('created_at', { ascending: false });
        if (fb.error) {
          setError(fb.error.message);
          setMatches([]);
        } else {
          setMatches(((fb.data ?? []) as Omit<MatchRow, 'profile_a' | 'profile_b'>[]).map(m => ({
            ...m, profile_a: null, profile_b: null,
          })));
          setError(null);
        }
      } else {
        setMatches((data ?? []) as MatchRow[]);
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [userId]);

  return { matches, loading, error, refresh: fetch };
}

export function otherUserName(m: MatchRow, userId: string | null): string {
  const otherProfile = m.user_a === userId ? m.profile_b : m.profile_a;
  return otherProfile?.first_name ?? 'Someone';
}
