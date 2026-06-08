import { createClient } from '@supabase/supabase-js';
import type { Request, Response, NextFunction } from 'express';

// The two EXPO_PUBLIC_ secrets are sometimes stored swapped in the Secrets UI.
// We detect which is which by checking which value starts with "https://".
const raw1 = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const raw2 = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseUrl = raw1.startsWith('https://') ? raw1 : raw2.startsWith('https://') ? raw2 : '';
const anonKey     = raw1.startsWith('https://') ? raw2 : raw2.startsWith('https://') ? raw1 : '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function getAdminClient() {
  const key = serviceRoleKey || anonKey;
  if (!supabaseUrl || !key) {
    throw new Error('Supabase credentials not configured. Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient(supabaseUrl, key);
}

export function getUserClient(token: string) {
  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase credentials not configured.');
  }
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7);

  if (!supabaseUrl || !anonKey) {
    res.status(503).json({ error: 'Backend not configured. Add Supabase credentials.' });
    return;
  }

  try {
    const client = createClient(supabaseUrl, anonKey);
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    (req as any).user = user;
    (req as any).token = token;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Auth check failed' });
  }
}
