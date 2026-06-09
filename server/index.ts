import express from 'express';
import cors from 'cors';
import referralRouter from './routes/referral';
import profileRouter from './routes/profile';
import matchRouter from './routes/match';
import archetypeRouter from './routes/archetype';
import emailRouter from './routes/email';

const app = express();
const PORT = parseInt(process.env.PORT || '5000');
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, env: IS_PROD ? 'production' : 'development' });
});

app.use('/api/referral', referralRouter);
app.use('/api/profile', profileRouter);
app.use('/api/match', matchRouter);
app.use('/api/archetype', archetypeRouter);
app.use('/api/email', emailRouter);

app.get('/', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Romeo &amp; Juliet API</title>
<style>body{font-family:Georgia,serif;background:#fbf2e3;color:#2c2c2c;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
div{text-align:center}h1{font-size:2em;margin-bottom:.5em}p{color:#8b7355}</style></head>
<body><div>
  <h1>Romeo &amp; Juliet</h1>
  <p>API server is running.</p>
  <p style="font-size:.85em;margin-top:2em"><a href="/health" style="color:#8b7355">/health</a></p>
</div></body></html>`);
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[rj-api] Listening on port ${PORT} (${IS_PROD ? 'production' : 'development'})`);
});
