import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;
const requests: Record<string, { count: number; start: number }> = {};

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = requests[ip];
  if (!entry) {
    requests[ip] = { count: 1, start: now };
    return false;
  }

  if (now - entry.start > RATE_LIMIT_WINDOW_MS) {
    requests[ip] = { count: 1, start: now };
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  entry.count += 1;
  return false;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : undefined;

  if (token !== process.env.ADMIN_API_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
  if (isRateLimited(ip.toString())) {
    return res.status(429).json({ message: 'Too Many Requests' });
  }

  const { email } = req.body as { email?: string };
  if (!email) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error, data } = await supabase.auth.admin.listUsers();
  if (error) {
    return res.status(500).json({ message: 'Request failed' });
  }

  // Check for existence internally without exposing the result
  const _exists = data?.users?.some((u) => u.email === email);
  void _exists; // explicitly ignore

  return res
    .status(200)
    .json({ message: 'If this email is registered, you will receive a response shortly.' });
}
