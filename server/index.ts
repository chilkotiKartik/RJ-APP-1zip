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

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[rj-api] Listening on port ${PORT} (${IS_PROD ? 'production' : 'development'})`);
});
