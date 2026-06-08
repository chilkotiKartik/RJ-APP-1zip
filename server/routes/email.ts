import { Router } from 'express';
import { Resend } from 'resend';
import { requireAuth } from '../auth';

const router = Router();

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');
  return new Resend(apiKey);
}

const FROM = `${process.env.EMAIL_FROM_NAME || 'Romeo & Juliet'} <${process.env.EMAIL_FROM || 'product@romeojuliet.love'}>`;
const APP_URL = process.env.APP_URL || 'https://romeojuliet.love';

router.post('/welcome', requireAuth, async (req: any, res) => {
  const { firstName, email } = req.body;
  if (!email || !firstName) {
    res.status(400).json({ error: 'email and firstName are required' });
    return;
  }

  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'You\'re in the room.',
      html: `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #2c2c2c; padding: 48px 24px;">
          <p style="font-size: 18px; line-height: 1.7; margin-bottom: 24px;">Dear ${firstName},</p>
          <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            Your profile has been received. Romeo is reviewing it now, in the way he reviews everything — carefully, and without rushing.
          </p>
          <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            If he finds someone worth introducing you to, you'll hear from us. Until then, we ask only that you wait with the same patience you'd want someone to extend to you.
          </p>
          <p style="font-size: 16px; line-height: 1.8; margin-bottom: 40px;">
            This is not a service for the restless. It is a service for the ready.
          </p>
          <p style="font-size: 16px; line-height: 1.8; color: #8b7355;">
            With care,<br/>
            <em>Romeo &amp; Juliet</em>
          </p>
          <hr style="border: none; border-top: 1px solid #e8e0d5; margin: 40px 0;" />
          <p style="font-size: 12px; color: #999; line-height: 1.6;">
            You're receiving this because you applied to Romeo &amp; Juliet at <a href="${APP_URL}" style="color: #8b7355;">${APP_URL}</a>.<br/>
            This is a private service. Please do not forward this email.
          </p>
        </div>
      `,
    });

    res.json({ ok: true });
  } catch (err: any) {
    console.error('[email/welcome] error:', err.message);
    res.status(500).json({ error: err.message ?? 'Failed to send email' });
  }
});

router.post('/match-notification', requireAuth, async (req: any, res) => {
  const { firstName, email, matchFirstName } = req.body;
  if (!email || !firstName || !matchFirstName) {
    res.status(400).json({ error: 'email, firstName, and matchFirstName are required' });
    return;
  }

  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Someone has been thinking of you.',
      html: `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #2c2c2c; padding: 48px 24px;">
          <p style="font-size: 18px; line-height: 1.7; margin-bottom: 24px;">Dear ${firstName},</p>
          <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            Romeo has made an introduction. ${matchFirstName} is waiting to meet you.
          </p>
          <p style="font-size: 16px; line-height: 1.8; margin-bottom: 32px;">
            Open the app to read their letter and decide how you'd like to respond.
          </p>
          <a href="${APP_URL}" style="display: inline-block; background: #8b2635; color: #f5f0e8; text-decoration: none; padding: 14px 32px; font-family: Georgia, serif; font-size: 15px; letter-spacing: 0.05em;">
            Open the door
          </a>
          <hr style="border: none; border-top: 1px solid #e8e0d5; margin: 40px 0;" />
          <p style="font-size: 12px; color: #999; line-height: 1.6;">
            Romeo &amp; Juliet · <a href="${APP_URL}" style="color: #8b7355;">${APP_URL}</a><br/>
            This introduction is private. Please do not forward.
          </p>
        </div>
      `,
    });

    res.json({ ok: true });
  } catch (err: any) {
    console.error('[email/match-notification] error:', err.message);
    res.status(500).json({ error: err.message ?? 'Failed to send email' });
  }
});

export default router;
