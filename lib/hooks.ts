import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export type Phase =
  | 'REFERRAL'
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

  const fetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUserId(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    setUserId(user.id);
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
    if (!pollMs) return;
    const id = setInterval(fetch, pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  return {
    loading,
    phase: profile?.phase ?? 'REFERRAL',
    profile,
    userId,
    refresh: fetch,
  };
}
