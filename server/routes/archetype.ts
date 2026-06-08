import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth, getAdminClient } from '../auth';

const router = Router();

const ARCHETYPE_IDS = ['curious', 'grounded', 'intellectual', 'magnetic', 'playful', 'romantic', 'slow'] as const;
type ArchetypeId = typeof ARCHETYPE_IDS[number];

const ARCHETYPE_DESCRIPTIONS: Record<ArchetypeId, string> = {
  curious:      'The Curious Explorer — restless, generous, alive to the new. Driven by wonder and a need to understand.',
  grounded:     'The Grounded Builder — patient, devoted, quietly capable. Values stability, consistency, and showing up.',
  intellectual: 'The Intellectual Connector — sharp, attentive, a finder of patterns. Connection through ideas and depth.',
  magnetic:     'The Magnetic Force — present, electric, hard to look away from. Naturally draws people in.',
  playful:      'The Playful Spark — light, mischievous, unafraid of joy. Keeps things alive with spontaneity and laughter.',
  romantic:     'The Romantic Idealist — tender, attentive, a believer in the beautiful. Seeks meaningful, intentional love.',
  slow:         'The Slow Burner — considered, deep-rooted, late to bloom. Takes time to open up, but devoted once they do.',
};

const SYSTEM_PROMPT = `You are a thoughtful relationship psychologist and archetype classifier for a private romantic matchmaking service called Romeo & Juliet. Your job is to read someone's questionnaire answers and assign them one of seven archetypes based on how they express themselves — their word choices, what they value, and what they reveal about how they love and connect.

The seven archetypes are:
${ARCHETYPE_IDS.map(id => `- ${id}: ${ARCHETYPE_DESCRIPTIONS[id]}`).join('\n')}

Rules:
- Read between the lines. Short or guarded answers often signal "slow" or "grounded". Vivid, expressive answers often signal "romantic" or "curious".
- Weight the open-text answers (misunderstood, moved, romeo_note) most heavily — they reveal true voice.
- Return ONLY a JSON object: { "archetype": "<id>", "reason": "<one sentence, warm and human>" }
- The reason should feel like something a perceptive friend would say, not a clinical assessment.
- Never mention the archetype name in the reason — describe the quality you saw.`;

router.post('/classify', requireAuth, async (req: any, res) => {
  const { answers } = req.body;

  if (!answers || typeof answers !== 'object') {
    res.status(400).json({ error: 'answers object is required' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'Anthropic API key not configured' });
    return;
  }

  const answersText = Object.entries(answers)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join('\n\n');

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Here are the questionnaire answers:\n\n${answersText}\n\nAssign one archetype.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';

    let parsed: { archetype: string; reason: string };
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      console.error('[archetype/classify] Failed to parse Anthropic response:', text);
      res.status(500).json({ error: 'Failed to parse classifier response' });
      return;
    }

    const archetype = parsed.archetype as ArchetypeId;
    if (!ARCHETYPE_IDS.includes(archetype)) {
      console.error('[archetype/classify] Unknown archetype returned:', archetype);
      res.status(500).json({ error: 'Classifier returned unknown archetype' });
      return;
    }

    const supabase = getAdminClient();
    const { error: dbErr } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: req.user.id,
          archetype,
          archetype_reason: parsed.reason,
          phase: 'PENDING_APPROVAL',
        },
        { onConflict: 'user_id' }
      );

    if (dbErr) {
      console.error('[archetype/classify] DB error:', dbErr.message);
      res.status(500).json({ error: dbErr.message });
      return;
    }

    res.json({ ok: true, archetype, reason: parsed.reason });
  } catch (err: any) {
    console.error('[archetype/classify] error:', err.message);
    res.status(500).json({ error: err.message ?? 'Server error' });
  }
});

export default router;
