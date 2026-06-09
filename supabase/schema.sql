-- ═══════════════════════════════════════════════════════════════
-- Romeo & Juliet — Supabase Schema
-- Run this once in: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

-- ── 1. profiles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name    TEXT,
  social_handle TEXT,
  photo_urls    TEXT[],
  phase         TEXT NOT NULL DEFAULT 'REFERRAL',
  archetype     TEXT,
  archetype_reason TEXT,
  questionnaire_answers JSONB,
  expo_push_token TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. referral_codes ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT UNIQUE NOT NULL,
  used_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. matches ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.matches (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a     UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  user_b     UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status     TEXT DEFAULT 'active',
  a_response JSONB,
  b_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. letters ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.letters (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id  UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  body      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Auto-update updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 6. Auto-create profile on sign-up ────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, phase)
  VALUES (NEW.id, 'REFERRAL')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 7. Row-Level Security ─────────────────────────────────────────
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters        ENABLE ROW LEVEL SECURITY;

-- profiles: user reads/writes own; can read archetype of others in a match
CREATE POLICY "profiles: own read/write"
  ON public.profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles: read matched users"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE (m.user_a = auth.uid() OR m.user_b = auth.uid())
        AND (m.user_a = user_id OR m.user_b = user_id)
    )
  );

-- referral_codes: only service role (backend) can read/write
CREATE POLICY "referral_codes: service role only"
  ON public.referral_codes FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- matches: user can see matches they are part of
CREATE POLICY "matches: own read"
  ON public.matches FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "matches: service role write"
  ON public.matches FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- letters: user can see letters for their matches, and write their own
CREATE POLICY "letters: read own match"
  ON public.letters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
    )
  );

CREATE POLICY "letters: write own"
  ON public.letters FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- ── 8. Realtime ──────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
