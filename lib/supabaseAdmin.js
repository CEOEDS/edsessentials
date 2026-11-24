import { createClient } from '@supabase/supabase-js';

// SERVER ONLY. Uses the secret service-role key, which must never reach the browser.
export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server is not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
