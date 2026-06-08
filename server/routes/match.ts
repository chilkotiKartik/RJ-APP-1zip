import { Router } from 'express';
import { requireAuth, getAdminClient } from '../auth';

const router = Router();

router.post('/respond', requireAuth, async (req: any, res) => {
  const { matchId, response, note } = req.body;

  if (!matchId || typeof matchId !== 'string') {
    res.status(400).json({ error: 'matchId is required' });
    return;
  }
  if (response !== 'yes' && response !== 'no') {
    res.status(400).json({ error: 'response must be "yes" or "no"' });
    return;
  }

  try {
    const supabase = getAdminClient();

    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('id, user_a, user_b')
      .eq('id', matchId)
      .maybeSingle();

    if (matchErr || !match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    const isUserA = (match as any).user_a === req.user.id;
    const col = isUserA ? 'a_response' : 'b_response';

    const { error: updateErr } = await supabase
      .from('matches')
      .update({
        [col]: JSON.stringify({
          choice: response,
          note: note ?? null,
          ts: new Date().toISOString(),
        }),
      })
      .eq('id', matchId);

    if (updateErr) {
      console.error('[match/respond] update error:', updateErr.message);
      res.status(500).json({ error: updateErr.message });
      return;
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error('[match/respond] error:', err.message);
    res.status(500).json({ error: err.message ?? 'Server error' });
  }
});

export default router;
