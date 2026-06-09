-- ═══════════════════════════════════════════════════════════════
-- Romeo & Juliet — Full Migration
-- Run ONCE in: Supabase Dashboard → SQL Editor → New query
-- Safe to run multiple times (uses IF NOT EXISTS / DROP IF EXISTS)
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Add missing profile columns ───────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS archetype        TEXT,
  ADD COLUMN IF NOT EXISTS archetype_reason TEXT,
  ADD COLUMN IF NOT EXISTS expo_push_token  TEXT;

-- ── 2. Expand phase enum to include all app phases ────────────────
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_phase_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_phase_check CHECK (
    phase IN (
      'REFERRAL', 'PROFILE', 'PENDING_APPROVAL', 'APPROVED',
      'CHATTING', 'QUESTIONNAIRE_DONE', 'WAITING',
      'LETTER_READY', 'COMPLETE', 'REJECTED'
    )
  );

-- ── 3. Fix matches: allow a_response / b_response to store JSON ───
-- The existing constraint (a_response_check) blocks all non-null values.
-- Replace it with one that allows NULL or any JSONB object.
ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_a_response_check;

ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_b_response_check;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_a_response_check
    CHECK (a_response IS NULL OR jsonb_typeof(a_response) = 'object');

ALTER TABLE public.matches
  ADD CONSTRAINT matches_b_response_check
    CHECK (b_response IS NULL OR jsonb_typeof(b_response) = 'object');

-- ── 4. Expand status enum to include response states ─────────────
-- Existing valid values: PROPOSED, EXPIRED, PENDING, MUTUAL
-- App also needs: ACCEPTED, DECLINED
ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_status_check;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_status_check CHECK (
    status IS NULL OR status IN (
      'PROPOSED', 'PENDING', 'MUTUAL',
      'ACCEPTED', 'DECLINED', 'EXPIRED'
    )
  );

-- ── 5. Verify ─────────────────────────────────────────────────────
SELECT 'profiles columns' AS check_type,
       string_agg(column_name, ', ' ORDER BY ordinal_position) AS result
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
UNION ALL
SELECT 'constraints on profiles',
       string_agg(constraint_name, ', ')
FROM information_schema.table_constraints
WHERE table_name = 'profiles' AND table_schema = 'public'
UNION ALL
SELECT 'constraints on matches',
       string_agg(constraint_name, ', ')
FROM information_schema.table_constraints
WHERE table_name = 'matches' AND table_schema = 'public';
