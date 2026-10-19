"use server";
import { revalidatePath } from "next/cache";
import { wajibAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { bersih } from "@/lib/validasi";
import { buatPassword, AUTH_DOMAIN } from "@/lib/sandi";

const seg = () => { revalidatePath("/admin/grup"); revalidatePath("/pengajar"); };

export async function simpanGrup(formData) {
  await wajibAdmin();
  const db = supabaseAdmin();
  const id = String(formData.get("id"));
  const link = bersih(formData.get("link"));
  await db.from("grup").update({ nama: bersih(formData.get("nama")), pengajar_id: formData.get("pengajar_id") || null }).eq("id", id);
  if (link) await db.from("grup_tautan").upsert({ grup_id: id, link });
  else await db.from("grup_tautan").delete().eq("grup_id", id);
  seg();
}

export async function tambahGrup(formData) {
  await wajibAdmin();
  const nama = bersih(formData.get("nama"));
  if (!nama) return;
  await supabaseAdmin().from("grup").insert({ nama, kelas_id: formData.get("kelas_id"), pengajar_id: formData.get("pengajar_id") || null });
  seg();
}

export async function tambahPengajar(formData) {
  await wajibAdmin();
  const nama = bersih(formData.get("nama"));
  if (!nama) return;
  await supabaseAdmin().from("pengajar").insert({ nama });
  seg();
}

// Membuat SATU akun login untuk pengajar (tidak ganda: pengajar.profile_id unik).
export async function buatAkunPengajar(formData) {
  await wajibAdmin();
  const db = supabaseAdmin();
  const id = String(formData.get("id"));
  const { data: p } = await db.from("pengajar").select("id,nama,profile_id").eq("id", id).maybeSingle();
  if (!p || p.profile_id) return;
  const { data: kode } = await db.rpc("kode_berikutnya", { prefix: "PGJ" });
  const password = buatPassword();
  const authEmail = `${kode.toLowerCase()}@${AUTH_DOMAIN}`;
  const { data: u, error } = await db.auth.admin.createUser({ email: authEmail, password, email_confirm: true });
  if (error) return;
  const jk = /^ustadzah/i.test(p.nama) ? "Akhwat" : "Ikhwan";
  const { error: e2 } = await db.from("profiles").insert({ id: u.user.id, kode, auth_email: authEmail, nama_lengkap: p.nama, jenis_kelamin: jk, role: "pengajar" });
  if (e2) { await db.auth.admin.deleteUser(u.user.id); return; }
  await db.from("password_awal").insert({ profile_id: u.user.id, password });
  await db.from("pengajar").update({ profile_id: u.user.id }).eq("id", id);
  seg();
}
