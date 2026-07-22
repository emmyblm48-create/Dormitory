import { createClient } from '@supabase/supabase-js';

// ตัด /rest/v1/ ออกให้เหลือแค่ https://aktyghpazejsihdbvrle.supabase.co
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aktyghpazejsihdbvrle.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHlnaHBhemVqc2loZGJ2cmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTExNjUsImV4cCI6MjA4NTg2NzE2NX0.xUW3xZ5RREFUSsya5Tyf6dhurRFTiCqMTx52xCte6ro';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
