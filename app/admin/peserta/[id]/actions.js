"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { wajibAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { normalisasiWA } from "@/lib/identitas";
import { adalahEmail, bersih } from "@/lib/validasi";
import { buatPassword } from "@/lib/sandi";

export async function simpanPeserta(id, _prev, fd) {
  await wajibAdmin();
  const nama = bersih(fd.get("nama_lengkap"));
  const email = bersih(fd.get("email")).toLowerCase();
  const waMentah = bersih(fd.get("whatsapp"));
  const wa = waMentah ? normalisasiWA(waMentah) : "";
  const role = String(fd.get("role"));
  if (!nama) return { galat: "Nama wajib diisi." };
  if (email && !adalahEmail(email)) return { galat: "Format email salah." };
  if (wa && !/^62\d{8,13}$/.test(wa)) return { galat: "Format WhatsApp salah (contoh 0812xxxxxxx)." };
  if (!["peserta", "pengajar", "admin"].includes(role)) return { galat: "Role tidak valid." };
  const db = supabaseAdmin();
  const { error } = await db.from("profiles").update({
    nama_lengkap: nama, jenis_kelamin: fd.get("jenis_kelamin") || null, email: email || null, whatsapp: wa || null,
    role, aktif: fd.get("aktif") === "on",
  }).eq("id", id);
  if (error) return { galat: error.code === "23505" ? "Email atau WhatsApp itu sudah dipakai akun lain." : "Gagal menyimpan." };
  const grupId = String(fd.get("grup_id") || "");
  if (grupId) {
    const { error: e2 } = await db.from("peserta_grup").upsert({ profile_id: id, grup_id: grupId });
    if (e2) return { galat: "Data tersimpan, tetapi gagal memindahkan grup." };
  }
  revalidatePath("/admin/peserta");
  return { ok: "Perubahan disimpan." };
}

export async function resetPassword(id) {
  await wajibAdmin();
  const db = supabaseAdmin();
  const password = buatPassword();
  const { error } = await db.auth.admin.updateUserById(id, { password });
  if (error) return { galat: "Gagal mereset password." };
  await db.from("profiles").update({ wajib_ganti_password: true }).eq("id", id);
  await db.from("password_awal").upsert({ profile_id: id, password });
  return { password };
}
