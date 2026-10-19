import { redirect } from "next/navigation";
import { ambilSesi } from "@/lib/auth";

const KOLOM = "id,nama,kelas(jenis_kelamin,tingkat)";

export async function grupDiampu(supabase, profil) {
  if (profil.role === "admin") {
    const { data } = await supabase.from("grup").select(KOLOM).order("nama");
    return data || [];
  }
  const { data: pj } = await supabase.from("pengajar").select("id").eq("profile_id", profil.id).maybeSingle();
  if (!pj) return [];
  const { data } = await supabase.from("grup").select(KOLOM).eq("pengajar_id", pj.id).order("nama");
  return data || [];
}

export async function wajibGuru() {
  const s = await ambilSesi();
  if (!s) redirect("/masuk");
  if (!s.profil || !s.profil.aktif || !["pengajar", "admin"].includes(s.profil.role)) redirect("/dashboard");
  if (s.profil.wajib_ganti_password) redirect("/ganti-password");
  return { ...s, grup: await grupDiampu(s.supabase, s.profil) };
}
