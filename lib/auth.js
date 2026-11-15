import { redirect } from "next/navigation";
import { cache } from "react";
import { supabaseServer } from "@/lib/supabase/server";

// Dihitung sekali per permintaan (layout + halaman + komponen berbagi hasil yang sama).
export const ambilSesi = cache(async () => {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profil } = await supabase.from("profiles")
    .select("id,kode,nama_lengkap,role,aktif,wajib_ganti_password").eq("id", user.id).maybeSingle();
  return { supabase, user, profil };
});

export async function wajibAdmin() {
  const s = await ambilSesi();
  if (!s) redirect("/masuk");
  if (!s.profil || !s.profil.aktif || s.profil.role !== "admin") redirect("/dashboard");
  return s;
}
