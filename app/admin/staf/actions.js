"use server";
import { revalidatePath } from "next/cache";
import { wajibAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { normalisasiWA } from "@/lib/identitas";
import { adalahEmail, bersih } from "@/lib/validasi";
import { buatPassword, AUTH_DOMAIN } from "@/lib/sandi";

// Akun master = akun ber-role admin: mengelola semua dan dapat membuka semua kelas.
export async function buatMaster(_prev, fd) {
  await wajibAdmin();
  const nama = bersih(fd.get("nama_lengkap"));
  const email = bersih(fd.get("email")).toLowerCase();
  const waMentah = bersih(fd.get("whatsapp"));
  const wa = waMentah ? normalisasiWA(waMentah) : "";
  if (!nama) return { galat: "Nama lengkap wajib diisi." };
  if (email && !adalahEmail(email)) return { galat: "Format email salah." };
  if (wa && !/^62\d{8,13}$/.test(wa)) return { galat: "Format WhatsApp salah (contoh 0812xxxxxxx)." };
  const jk = fd.get("jenis_kelamin") === "Akhwat" ? "Akhwat" : "Ikhwan";

  const db = supabaseAdmin();
  const { data: ada } = await db.from("profiles").select("kode").like("kode", "MASTER-%");
  const maks = Math.max(0, ...(ada || []).map((x) => parseInt(String(x.kode).split("-")[1], 10) || 0));
  const kode = `MASTER-${String(maks + 1).padStart(3, "0")}`;
  const password = buatPassword();
  const authEmail = `${kode.toLowerCase()}@${AUTH_DOMAIN}`;

  const { data: u, error } = await db.auth.admin.createUser({ email: authEmail, password, email_confirm: true });
  if (error) return { galat: "Akun gagal dibuat. Coba lagi." };
  const { error: e2 } = await db.from("profiles").insert({
    id: u.user.id, kode, auth_email: authEmail, nama_lengkap: nama, jenis_kelamin: jk, role: "admin",
    email: email || null, whatsapp: wa || null, wajib_ganti_password: true,
  });
  if (e2) { await db.auth.admin.deleteUser(u.user.id); return { galat: e2.code === "23505" ? "Email atau WhatsApp itu sudah dipakai akun lain." : "Akun gagal dibuat." }; }
  await db.from("password_awal").insert({ profile_id: u.user.id, password });
  revalidatePath("/admin/staf");
  return { ok: `Akun dibuat. Kode: ${kode} · Password awal: ${password}. Catat dan sampaikan langsung kepada yang bersangkutan; ia diminta menggantinya saat masuk pertama.` };
}

export async function resetSandiMaster(id, _prev) {
  await wajibAdmin();
  const db = supabaseAdmin();
  const { data: p } = await db.from("profiles").select("id,role").eq("id", id).maybeSingle();
  if (!p || p.role !== "admin") return { galat: "Akun tidak ditemukan." };
  const password = buatPassword();
  const { error } = await db.auth.admin.updateUserById(id, { password });
  if (error) return { galat: "Gagal mereset password." };
  await db.from("profiles").update({ wajib_ganti_password: true }).eq("id", id);
  await db.from("password_awal").upsert({ profile_id: id, password });
  return { ok: `Password sementara: ${password}` };
}

export async function ubahAktifMaster(id, aktif) {
  const { user } = await wajibAdmin();
  if (id === user.id) return;   // tidak boleh menonaktifkan akun sendiri
  const db = supabaseAdmin();
  await db.from("profiles").update({ aktif }).eq("id", id).eq("role", "admin");
  revalidatePath("/admin/staf");
}
