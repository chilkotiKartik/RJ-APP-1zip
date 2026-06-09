/**
 * Romeo & Juliet — Demo Data Seeder
 * Run with: npx tsx scripts/seed-demo.ts
 *
 * Creates:
 *  • 10 referral codes (ready to use in-app)
 *  • 4 demo accounts at different phases
 *  • 1 live match (Sophia ↔ Luca)
 */
import { createClient } from '@supabase/supabase-js';

const raw1 = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const raw2 = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_URL = raw1.startsWith('https://') ? raw1 : raw2.startsWith('https://') ? raw2 : '';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SERVICE_KEY — check Replit secrets.');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function upsertUser(email: string, password: string): Promise<string> {
  const { data, error } = await sb.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (data?.user) return data.user.id;
  if (error?.message?.includes('already') || error?.message?.includes('registered')) {
    const { data: list } = await sb.auth.admin.listUsers();
    const found = list?.users?.find(u => u.email === email);
    if (found) return found.id;
  }
  throw new Error(`Cannot create/find ${email}: ${error?.message}`);
}

// Probe which columns exist on profiles
async function getProfileCols(): Promise<Set<string>> {
  const { data } = await sb.from('profiles').select('*').limit(1);
  if (data && data.length > 0) return new Set(Object.keys(data[0]));
  // Empty table — probe by inserting a full row then checking error message
  return new Set(['user_id','phase','first_name','social_handle','photo_urls','questionnaire_answers']);
}

async function seed() {
  console.log('\n🌹 Romeo & Juliet — Demo Seeder');
  console.log('   Supabase:', SUPABASE_URL.slice(0, 45) + '...\n');

  // ── Schema check ─────────────────────────────────────────────
  const { error: schemaErr } = await sb.from('profiles').select('user_id').limit(1);
  if (schemaErr) {
    console.error('❌  Run supabase/schema.sql first in Supabase SQL Editor.');
    process.exit(1);
  }
  console.log('✓  Schema OK');

  const existingCols = await getProfileCols();
  const hasArchetype = existingCols.has('archetype');

  // Probe whether expanded phase enum is live
  const { data: users0 } = await sb.auth.admin.listUsers();
  const probeUid = users0?.users?.[0]?.id ?? null;
  let hasLetterReady = false;
  if (probeUid) {
    // Temporarily probe LETTER_READY on any existing profile row (upsert, then revert)
    const { data: orig } = await sb.from('profiles').select('phase').eq('user_id', probeUid).maybeSingle();
    const { error: phaseTest } = await sb.from('profiles')
      .upsert({ user_id: probeUid, phase: 'LETTER_READY' }, { onConflict: 'user_id' });
    hasLetterReady = !phaseTest;
    // Revert phase
    if (!phaseTest && orig?.phase) {
      await sb.from('profiles').upsert({ user_id: probeUid, phase: orig.phase }, { onConflict: 'user_id' });
    }
  }

  const migNote = !hasArchetype || !hasLetterReady
    ? '⚠️  Run supabase/migrate-add-columns.sql to unlock all phases + archetypes'
    : '✓ Migration applied';
  console.log(`   ${migNote}`);

  // ── Referral codes ────────────────────────────────────────────
  const codes = ['ROMEO2025','JULIET2025','VERONA001','VERONA002','VERONA003',
                 'VERONA004','VERONA005','ROSALINE1','MERCUTIO1','BENVOLIO1'];
  const { error: rcErr } = await sb
    .from('referral_codes')
    .upsert(codes.map(c => ({ code: c })), { onConflict: 'code', ignoreDuplicates: true });
  if (rcErr) console.error('  referral_codes error:', rcErr.message);
  else console.log(`✓  ${codes.length} referral codes upserted`);

  // ── Demo users ────────────────────────────────────────────────
  console.log('\n→  Creating demo accounts…');

  const sophiaId   = await upsertUser('sophia@demo.rj',   'demo1234');
  const lucaId     = await upsertUser('luca@demo.rj',     'demo1234');
  const isabellaId = await upsertUser('isabella@demo.rj', 'demo1234');
  const testId     = await upsertUser('test@demo.rj',     'demo1234');

  console.log(`   sophia@demo.rj    → ${sophiaId.slice(0,8)}`);
  console.log(`   luca@demo.rj      → ${lucaId.slice(0,8)}`);
  console.log(`   isabella@demo.rj  → ${isabellaId.slice(0,8)}`);
  console.log(`   test@demo.rj      → ${testId.slice(0,8)}`);

  // ── Profiles (base columns that always exist) ─────────────────
  type ProfileRow = {
    user_id: string;
    first_name: string | null;
    social_handle: string | null;
    photo_urls: null;
    phase: string;
    questionnaire_answers: Record<string, string> | null;
    archetype?: string | null;
    archetype_reason?: string | null;
  };

  const baseProfiles: ProfileRow[] = [
    {
      user_id: sophiaId,
      first_name: 'Sophia',
      social_handle: '@sophia.letters',
      photo_urls: null,
      phase: hasLetterReady ? 'LETTER_READY' : 'WAITING',
      questionnaire_answers: {
        q1: 'I re-read messages looking for the thing beneath the thing.',
        q2: 'A warm room, a book I have already read, someone who knows when not to talk.',
        q3: 'The first five minutes of a really good conversation.',
        q4: 'Slowly. And then all at once.',
        q5: 'I write letters I never send.',
      },
    },
    {
      user_id: lucaId,
      first_name: 'Luca',
      social_handle: '@luca.verona',
      photo_urls: null,
      phase: 'WAITING',
      questionnaire_answers: {
        q1: 'I look for the one word they chose over all the others.',
        q2: 'Quiet. The kind that means something is being thought through.',
        q3: 'The moment a theory breaks open into something personal.',
        q4: 'I need to understand something before I trust it.',
        q5: 'I have strong opinions about sentence structure.',
      },
    },
    {
      user_id: isabellaId,
      first_name: 'Isabella',
      social_handle: '@isabella.m',
      photo_urls: null,
      phase: 'PENDING_APPROVAL',
      questionnaire_answers: null,
    },
    {
      user_id: testId,
      first_name: null,
      social_handle: null,
      photo_urls: null,
      phase: 'REFERRAL',
      questionnaire_answers: null,
    },
  ];

  // Add archetype columns if they exist on the table
  const profilesWithArchetype: ProfileRow[] = baseProfiles.map(p => {
    if (!hasArchetype) return p;
    const archetypeMap: Record<string, string> = {
      [sophiaId]: 'romantic',
      [lucaId]:   'intellectual',
    };
    const reasonMap: Record<string, string> = {
      [sophiaId]: 'Sophia leads with feeling — she stays in the conversation long after it ends.',
      [lucaId]:   'Luca builds arguments the way an architect builds houses — carefully.',
    };
    return {
      ...p,
      archetype: archetypeMap[p.user_id] ?? null,
      archetype_reason: reasonMap[p.user_id] ?? null,
    };
  });

  const { error: profErr } = await sb
    .from('profiles')
    .upsert(profilesWithArchetype, { onConflict: 'user_id' });
  if (profErr) console.error('  profiles error:', profErr.message);
  else console.log(`✓  ${profilesWithArchetype.length} profiles upserted`);

  // ── Match: Sophia ↔ Luca ──────────────────────────────────────
  const { data: existing } = await sb.from('matches')
    .select('id')
    .or(`user_a.eq.${sophiaId},user_b.eq.${sophiaId}`)
    .limit(1);

  let matchId = 'n/a';
  if (existing && existing.length > 0) {
    matchId = existing[0].id;
    console.log(`✓  Match already exists: ${matchId.slice(0,8)}…`);
  } else {
    // Insert match with proposed_at set (required by DB constraint)
    // Do NOT set status — let the DB default (NULL) satisfy the check constraint
    const { data: newMatch, error: mErr } = await sb.from('matches').insert({
      user_a: sophiaId,
      user_b: lucaId,
      proposed_at: new Date().toISOString(),
    }).select('id').single();

    if (mErr) {
      console.error('  match error:', mErr.message);
    } else {
      matchId = newMatch.id;
      console.log(`✓  Match created: ${matchId.slice(0,8)}…`);
    }
  }

  // ── Final summary ─────────────────────────────────────────────
  const needsMig = !hasArchetype || !hasLetterReady;
  const finalMigNote = needsMig ? '\n  ⚠️  Run supabase/migrate-add-columns.sql to unlock all features.\n' : '';
  const sophiaPhase = hasLetterReady ? 'LETTER_READY' : 'WAITING (upgrade: run migration)';

  console.log(`
═══════════════════════════════════════════════════════
  ✅  Demo data ready!
${finalMigNote}
  DEMO ACCOUNTS  (password for all: demo1234)
  ┌──────────────────────────────────────────────────
  │ sophia@demo.rj      ${sophiaPhase}
  │ luca@demo.rj        WAITING        ← sent his letter
  │ isabella@demo.rj    PENDING_APPROVAL
  │ test@demo.rj        REFERRAL       ← try the sign-up flow
  └──────────────────────────────────────────────────

  REFERRAL CODES (use with test@demo.rj or new accounts):
  ROMEO2025  JULIET2025  VERONA001  VERONA002  VERONA003
  VERONA004  VERONA005  ROSALINE1  MERCUTIO1  BENVOLIO1

  MATCH:  Sophia ↔ Luca  (id: ${matchId.slice(0,8)}…)
═══════════════════════════════════════════════════════
`);
}

seed().catch(err => { console.error('Fatal:', err); process.exit(1); });
