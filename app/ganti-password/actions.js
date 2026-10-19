"use server";
import { redirect } from "next/navigation";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";

export async function gantiPassword(_prev, formData) {
  const baru = String(formData.get("baru") || "");
  const ulang = String(formData.get("ulang") || "");
  if (baru.length < 8) return { galat: "Password baru minimal 8 karakter." };
  if (!/[A-Za-z]/.test(baru) || !/\d/.test(baru)) return { galat: "Gunakan kombinasi huruf dan angka." };
  if (baru !== ulang) return { galat: "Konfirmasi password tidak sama." };

  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");

  const { error } = await supabase.auth.updateUser({ password: baru });
  if (error) return { galat: "Password belum bisa diubah. Coba password lain atau ulangi masuk." };
  await supabaseAdmin().from("profiles").update({ wajib_ganti_password: false }).eq("id", user.id);
  redirect("/dashboard");
}
