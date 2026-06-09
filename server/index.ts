import express from 'express';
import cors from 'cors';
import path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import referralRouter from './routes/referral';
import profileRouter from './routes/profile';
import matchRouter from './routes/match';
import archetypeRouter from './routes/archetype';
import emailRouter from './routes/email';

const app = express();
const PORT = parseInt(process.env.PORT || '5000');
const IS_PROD = process.env.NODE_ENV === 'production';
const METRO_PORT = parseInt(process.env.METRO_PORT || '8080');

app.use(cors());
app.use(express.json());

// ── API routes ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ ok: true, env: IS_PROD ? 'production' : 'development' });
});

app.use('/api/referral', referralRouter);
app.use('/api/profile', profileRouter);
app.use('/api/match', matchRouter);
app.use('/api/archetype', archetypeRouter);
app.use('/api/email', emailRouter);

// ── UI ──────────────────────────────────────────────────────────────────────
if (IS_PROD) {
  // Production: serve the exported static web bundle
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Development: proxy all non-API traffic to Metro's web bundler so the
  // Replit canvas preview shows the live app.
  // Real Expo Go users scan the QR code from the "Start frontend" console.
  app.use(
    '/',
    createProxyMiddleware({
      target: `http://localhost:${METRO_PORT}`,
      changeOrigin: true,
      ws: true,
      on: {
        error: (_err, _req, res) => {
          if (res && 'status' in res) {
            (res as express.Response).status(502).send(
              '<h3 style="font-family:monospace;padding:32px">Starting Expo bundler — refresh in a moment…</h3>'
            );
          }
        },
      },
    })
  );
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[rj-server] Listening on port ${PORT} (${IS_PROD ? 'production' : 'development'})`);
  if (!IS_PROD) console.log(`[rj-server] Canvas preview → http://localhost:${METRO_PORT}`);
});
