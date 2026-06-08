import { Router } from 'express';
import { requireAuth, getAdminClient } from '../auth';

const router = Router();

router.post('/', requireAuth, async (req: any, res) => {
  const { firstName, socialHandle, photoUrls } = req.body;

  if (!firstName || typeof firstName !== 'string') {
    res.status(400).json({ error: 'First name is required' });
    return;
  }
  if (!Array.isArray(photoUrls) || photoUrls.length < 1) {
    res.status(400).json({ error: 'At least one photo URL is required' });
    return;
  }

  try {
    const supabase = getAdminClient();

    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: req.user.id,
          first_name: firstName.trim(),
          social_handle: socialHandle?.trim() || null,
          photo_urls: photoUrls,
          phase: 'PENDING_APPROVAL',
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('[profile] upsert error:', error.message);
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error('[profile] error:', err.message);
    res.status(500).json({ error: err.message ?? 'Server error' });
  }
});

export default router;
