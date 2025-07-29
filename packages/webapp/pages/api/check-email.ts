import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ exists: false, error: 'No email provided' });

  // Query the auth.users table using the admin API
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) return res.status(500).json({ exists: false, error: error.message });

  const exists = data?.users?.some((user) => user.email === email) ?? false;
  res.status(200).json({ exists });
}
