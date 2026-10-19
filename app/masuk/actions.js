"use server";
import { redirect } from "next/navigation";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { kenaliIdentitas } from "@/lib/identitas";

const GAGAL = "Kode, email/WhatsApp, atau password salah. Periksa lagi atau minta bantuan pengajar.";

export async function masuk(_prev, formData) {
  const id = kenaliIdentitas(formData.get("identitas"));
  const password = String(formData.get("password") || "");
  if (!id) return { galat: "Isi kode peserta (contoh: KBUMM-001), email, atau nomor WhatsApp." };
  if (password.length < 1) return { galat: "Password wajib diisi." };

  // Cari email internal akun (service role, hanya di server)
  const kolom = { kode: "kode", email: "email", whatsapp: "whatsapp" }[id.jenis];
  const { data: profil } = await supabaseAdmin()
    .from("profiles").select("auth_email,aktif,wajib_ganti_password")
    .eq(kolom, id.nilai).maybeSingle();
  if (!profil) return { galat: GAGAL };
  if (!profil.aktif) return { galat: "Akun ini dinonaktifkan. Hubungi admin." };

  const { error } = await supabaseServer().auth.signInWithPassword({ email: profil.auth_email, password });
  if (error) return { galat: GAGAL };
  redirect(profil.wajib_ganti_password ? "/ganti-password" : "/dashboard");
}

export async function keluar() {
  await supabaseServer().auth.signOut();
  redirect("/");
}
