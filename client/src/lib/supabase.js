// client/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing from client environments.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    heartbeatIntervalMs: 15000,
    reconnectAfterMs: (tries) => Math.min(tries * 1000, 10000)
  }
});

// Gracefully handle browser Back-Forward Cache (bfcache) transitions
if (typeof window !== 'undefined') {
  window.addEventListener('pageshow', (event) => {
    if (event.persisted && supabase?.realtime) {
      try {
        supabase.realtime.connect();
      } catch (_) {}
    }
  });
}
