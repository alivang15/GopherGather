import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Get the requester user id from headers/session (implement your auth logic)
  const requesterId = req.headers['x-user-id']; // Example: pass user id from frontend

  // 2. Check if requester is admin
  const { data: requester, error: requesterError } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', requesterId)
    .single();

  if (requesterError || !requester || requester.user_type !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  // 3. Grant club admin
  const { email, club_id } = req.body;
  const { error } = await supabase
    .from('users')
    .update({ user_type: 'club_admin', club_id })
    .eq('email', email);

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ success: true });
}
