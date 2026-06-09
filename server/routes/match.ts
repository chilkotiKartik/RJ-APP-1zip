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
      .select('id, user_a, user_b, a_response, b_response')
      .eq('id', matchId)
      .maybeSingle();

    if (matchErr || !match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    const isUserA = (match as any).user_a === req.user.id;
    const col     = isUserA ? 'a_response' : 'b_response';
    const otherCol = isUserA ? 'b_response' : 'a_response';

    // Store response as a proper JSONB object (not JSON.stringify)
    const responseObj = {
      choice: response,
      note: note ?? null,
      ts: new Date().toISOString(),
    };

    // Determine new match status
    const otherResponse = (match as any)[otherCol];
    const otherChoice = otherResponse?.choice ?? null;
    let newStatus: string;
    if (response === 'no') {
      newStatus = 'EXPIRED';
    } else if (otherChoice === 'yes') {
      newStatus = 'MUTUAL';  // Both said yes
    } else {
      newStatus = 'PROPOSED';  // Still waiting on other person
    }

    const { error: updateErr } = await supabase
      .from('matches')
      .update({
        [col]: responseObj,
        status: newStatus,
      })
      .eq('id', matchId);

    if (updateErr) {
      console.error('[match/respond] update error:', updateErr.message);
      res.status(500).json({ error: updateErr.message });
      return;
    }

    // If mutual match, advance both users' phases to CHATTING
    if (newStatus === 'MUTUAL') {
      await supabase.from('profiles')
        .update({ phase: 'APPROVED' })
        .in('user_id', [(match as any).user_a, (match as any).user_b]);
    }

    res.json({ ok: true, status: newStatus });
  } catch (err: any) {
    console.error('[match/respond] error:', err.message);
    res.status(500).json({ error: err.message ?? 'Server error' });
  }
});

export default router;
