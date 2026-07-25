import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aktyghpazejsihdbvrle.supabase.co";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

// Service-role client — server-only, never expose this key to the browser.
// Bypasses Row Level Security, so every caller must be verified as admin first.
export function createServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in the server environment");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Anon-key client bound to the caller's access token — used to verify who is calling.
export function createCallerClient(accessToken: string) {
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHlnaHBhemVqc2loZGJ2cmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTExNjUsImV4cCI6MjA4NTg2NzE2NX0.xUW3xZ5RREFUSsya5Tyf6dhurRFTiCqMTx52xCte6ro";
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
