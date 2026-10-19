import { createClient } from "@supabase/supabase-js";
// Klien tanpa cookie, hanya untuk data publik (halaman bisa di-cache).
export function supabasePublik() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
