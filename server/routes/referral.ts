import { Router } from 'express';
import { requireAuth, getAdminClient } from '../auth';

const router = Router();

router.post('/', requireAuth, async (req: any, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Referral code is required' });
    return;
  }

  const normalised = code.trim().toUpperCase();

  try {
    const supabase = getAdminClient();

    const { data: referral, error: lookupErr } = await supabase
      .from('referral_codes')
      .select('id, code, used_by')
      .eq('code', normalised)
      .maybeSingle();

    if (lookupErr) {
      console.error('[referral] lookup error:', lookupErr.message);
      res.status(500).json({ error: 'Could not validate code' });
      return;
    }

    if (!referral) {
      res.status(400).json({ error: 'That code was not found' });
      return;
    }

    if (referral.used_by && referral.used_by !== req.user.id) {
      res.status(400).json({ error: 'That code has already been used' });
      return;
    }

    await supabase
      .from('referral_codes')
      .update({ used_by: req.user.id, used_at: new Date().toISOString() })
      .eq('code', normalised);

    await supabase
      .from('profiles')
      .upsert(
        { user_id: req.user.id, phase: 'PROFILE' },
        { onConflict: 'user_id' }
      );

    res.json({ ok: true });
  } catch (err: any) {
    console.error('[referral] error:', err.message);
    res.status(500).json({ error: err.message ?? 'Server error' });
  }
});

export default router;
