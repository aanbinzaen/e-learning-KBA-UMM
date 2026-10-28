"use server";
import { revalidatePath } from "next/cache";
import { ambilSesi } from "@/lib/auth";
import { bersih } from "@/lib/validasi";

// Semua penulisan memakai sesi pengguna, jadi aturan RLS berlaku: pengajar hanya bisa mengubah faidah miliknya.
async function sesiGuru() {
  const s = await ambilSesi();
  if (!s?.profil?.aktif || !["pengajar", "admin"].includes(s.profil.role)) return null;
  return s;
}
const TIDAK = { galat: "Anda tidak berhak melakukan ini." };
const segarkan = () => ["/", "/faidah", "/guru/faidah", "/admin/faidah"].forEach((p) => revalidatePath(p));

function baca(fd) {
  const judul = bersih(fd.get("judul")), isi = String(fd.get("isi") || "").trim();
  if (!judul || !isi) return { galat: "Judul dan isi faidah wajib diisi." };
  if (judul.length > 150) return { galat: "Judul terlalu panjang (maks. 150 karakter)." };
  if (isi.length > 5000) return { galat: "Isi terlalu panjang (maks. 5000 karakter)." };
  return { nilai: {
    judul, isi, teks_arab: String(fd.get("teks_arab") || "").trim().slice(0, 2000) || null,
    sumber: bersih(fd.get("sumber")).slice(0, 300) || null, terbit: fd.get("terbit") === "on",
  } };
}

async function namaPenyampai(s) {
  const { data } = await s.supabase.from("pengajar").select("nama,nama_tampil").eq("profile_id", s.user.id).maybeSingle();
  return data?.nama_tampil || data?.nama || s.profil.nama_lengkap;
}

export async function tambahFaidahGuru(_prev, fd) {
  const s = await sesiGuru(); if (!s) return TIDAK;
  const b = baca(fd); if (b.galat) return b;
  const { error } = await s.supabase.from("faidah").insert({ ...b.nilai, penulis: await namaPenyampai(s) });
  if (error) return { galat: "Gagal menyimpan. Pastikan SQL 10 sudah dijalankan, lalu coba lagi." };
  segarkan(); return { ok: b.nilai.terbit ? "Faidah diterbitkan. Anda bisa mengunduh flyernya di bawah." : "Faidah disimpan sebagai draf." };
}

export async function ubahFaidahGuru(id, _prev, fd) {
  const s = await sesiGuru(); if (!s) return TIDAK;
  const b = baca(fd); if (b.galat) return b;
  const { error } = await s.supabase.from("faidah").update(b.nilai).eq("id", id);
  if (error) return { galat: "Gagal menyimpan perubahan." };
  segarkan(); return { ok: "Perubahan disimpan." };
}

export async function hapusFaidahGuru(id) {
  const s = await sesiGuru(); if (!s) return;
  await s.supabase.from("faidah").delete().eq("id", id);
  segarkan();
}
