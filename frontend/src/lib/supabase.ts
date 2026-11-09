import { createClient } from '@supabase/supabase-js';

// Cấu hình URL và Key Supabase chính thức của dự án (kèm biến môi trường ưu tiên nếu có)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pkxvjllzkbblfnkswjth.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_kdXnjIivCAJPKkBzyqA_vA__NRfGHhS';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
