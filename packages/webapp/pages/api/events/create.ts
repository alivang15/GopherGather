import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requesterId = req.headers['x-user-id'];
  if (!requesterId || Array.isArray(requesterId)) {
    return res.status(400).json({ error: 'Missing requester id' });
  }

  // Verify requester role
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', requesterId)
    .single();

  if (userError || !user || !['admin', 'club_admin'].includes(user.user_type)) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const eventData = req.body;
  eventData.created_by = requesterId;

  const { data: inserted, error: insertError } = await supabase
    .from('events')
    .insert([eventData])
    .select('id')
    .single();

  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }

  // Log event creation
  await supabase.from('event_audit_logs').insert([
    {
      event_id: inserted.id,
      created_by: requesterId,
      action: 'create',
    },
  ]);

  return res.status(200).json({ success: true, event_id: inserted.id });
}
