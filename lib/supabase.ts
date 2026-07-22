import { createClient } from '@supabase/supabase-js';

// เปลี่ยนค่าเป็น URL และ Key โปรเจกต์ของคุณ
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aktyghpazejsihdbvrle.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'ใส่_ANON_KEY_ของคุณที่นี่';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
