import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const hasValidUrl =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id');

const hasValidKey =
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.trim().length > 20 &&
  !supabaseAnonKey.includes('your-supabase-anon-key');

export const isSupabaseConfigured = hasValidUrl && hasValidKey;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
