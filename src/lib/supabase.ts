// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.PUBLIC_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  'https://ouzxqyecszcmswahsynd.supabase.co';

const supabaseKey =
  import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.PUBLIC_SUPABASE_KEY ||
  import.meta.env.SUPABASE_KEY ||
  'sb_publishable_9k43Gml4WzB1Niuetp6p5w_L6jquJFp';

export function getSupabase() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseBrowser() {
  return createClient(supabaseUrl, supabaseKey);
}
