-- ═══════════════════════════════════════════════════════════════
-- Romeo & Juliet — Demo Seed Data
-- Run AFTER schema.sql in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── Referral codes (10 available for testing) ────────────────────
INSERT INTO public.referral_codes (code) VALUES
  ('ROMEO2025'),
  ('JULIET2025'),
  ('VERONA001'),
  ('VERONA002'),
  ('VERONA003'),
  ('VERONA004'),
  ('VERONA005'),
  ('ROSALINE1'),
  ('MERCUTIO1'),
  ('BENVOLIO1')
ON CONFLICT (code) DO NOTHING;
