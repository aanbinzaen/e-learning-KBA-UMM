"use server";
import { ambilSesi } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { normalisasiWA } from "@/lib/identitas";
import { adalahEmail, bersih } from "@/lib/validasi";

export async function simpanKontak(_prev, fd) {
  const s = await ambilSesi();
  if (!s?.profil) return { galat: "Silakan masuk lagi." };
  const email = bersih(fd.get("email")).toLowerCase();
  const waMentah = bersih(fd.get("whatsapp"));
  const wa = waMentah ? normalisasiWA(waMentah) : "";
  if (email && !adalahEmail(email)) return { galat: "Format email salah." };
  if (wa && !/^62\d{8,13}$/.test(wa)) return { galat: "Format WhatsApp salah (contoh 0812xxxxxxx)." };
  const { error } = await supabaseAdmin().from("profiles").update({ email: email || null, whatsapp: wa || null }).eq("id", s.user.id);
  if (error) return { galat: error.code === "23505" ? "Email atau WhatsApp itu sudah dipakai akun lain." : "Gagal menyimpan." };
  return { ok: "Tersimpan. Anda kini bisa masuk dengan email atau WhatsApp tersebut." };
}
