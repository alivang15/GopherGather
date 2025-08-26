import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  
  // 1. Get the requester user id from headers/session (implement your auth logic)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { data: requester, error: requesterError } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (requesterError || !requester || requester.user_type !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { email, club_id } = req.body;
  const { error } = await supabase
    .from('users')
    .update({ user_type: 'club_admin', club_id })
    .eq('email', email);

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ success: true });
}
