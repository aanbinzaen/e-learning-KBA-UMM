"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ambilSesi } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { bersih } from "@/lib/validasi";
import { kirimPush } from "@/lib/push";

// Semua penulisan memakai sesi pengguna sehingga aturan RLS database berlaku (hanya pengajar/admin).
async function sesiStaf() {
  const s = await ambilSesi();
  if (!s?.profil?.aktif || !["pengajar", "admin"].includes(s.profil.role)) return null;
  return s;
}
const TIDAK = { galat: "Hanya pengajar dan admin yang dapat memakai Ruang Pengajar." };
const KATEGORI = ["kitab", "materi", "lainnya"];
const potong = (t, n) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

async function namaPenyampai(s) {
  const { data } = await s.supabase.from("pengajar").select("nama,nama_tampil").eq("profile_id", s.user.id).maybeSingle();
  return data?.nama_tampil || data?.nama || s.profil.nama_lengkap;
}
async function idStaf() {
  const { data } = await supabaseAdmin().from("profiles").select("id").in("role", ["pengajar", "admin"]).eq("aktif", true);
  return (data || []).map((x) => x.id);
}
const segarkan = () => { revalidatePath("/guru/ruang"); revalidatePath("/guru/ruang/diskusi"); };

// ---------------- Perpustakaan ----------------
function bacaBahan(fd) {
  const judul = bersih(fd.get("judul"));
  if (!judul) return { galat: "Judul wajib diisi." };
  const k = String(fd.get("kategori"));
  return { nilai: { judul: judul.slice(0, 200), kategori: KATEGORI.includes(k) ? k : "materi", deskripsi: String(fd.get("deskripsi") || "").trim().slice(0, 2000) || null } };
}

export async function tambahTautan(_prev, fd) {
  const s = await sesiStaf(); if (!s) return TIDAK;
  const b = bacaBahan(fd); if (b.galat) return b;
  const tautan = bersih(fd.get("tautan"));
  if (!/^https?:\/\/\S+$/i.test(tautan) || tautan.length > 600) return { galat: "Tautan harus diawali http:// atau https://" };
  const { error } = await s.supabase.from("ruang_bahan").insert({ ...b.nilai, jenis: "tautan", tautan, penulis: await namaPenyampai(s) });
  if (error) return { galat: "Gagal menyimpan. Pastikan SQL 12 sudah dijalankan." };
  segarkan(); return { ok: "Tautan ditambahkan ke perpustakaan." };
}

// Dipanggil setelah berkas diunggah langsung dari peramban ke Supabase Storage
export async function simpanBerkas(path, namaBerkas, ukuran, judul, kategori, deskripsi) {
  const s = await sesiStaf(); if (!s) return TIDAK;
  const fd = new Map([["judul", judul], ["kategori", kategori], ["deskripsi", deskripsi]]);
  const b = bacaBahan({ get: (k) => fd.get(k) }); if (b.galat) { await s.supabase.storage.from("ruang-pengajar").remove([path]); return b; }
  if (!String(path).startsWith(`${s.user.id}/`)) return { galat: "Berkas tidak valid." };
  const { error } = await s.supabase.from("ruang_bahan").insert({
    ...b.nilai, jenis: "berkas", file_path: path, nama_berkas: bersih(namaBerkas).slice(0, 200), ukuran: Math.max(0, Math.min(Number(ukuran) || 0, 31457280)), penulis: await namaPenyampai(s),
  });
  if (error) { await s.supabase.storage.from("ruang-pengajar").remove([path]); return { galat: "Gagal menyimpan. Pastikan SQL 12 sudah dijalankan." }; }
  segarkan(); return { ok: "Berkas ditambahkan ke perpustakaan." };
}

export async function hapusBahan(id) {
  const s = await sesiStaf(); if (!s) return;
  const { data: b } = await s.supabase.from("ruang_bahan").select("jenis,file_path").eq("id", id).maybeSingle();
  const { error } = await s.supabase.from("ruang_bahan").delete().eq("id", id);
  if (!error && b?.jenis === "berkas" && b.file_path) await s.supabase.storage.from("ruang-pengajar").remove([b.file_path]);
  segarkan();
}

// ---------------- Diskusi ----------------
export async function bukaTopik(_prev, fd) {
  const s = await sesiStaf(); if (!s) return TIDAK;
  const judul = bersih(fd.get("judul")), isi = String(fd.get("isi") || "").trim();
  if (!judul || !isi) return { galat: "Judul dan pesan pertama wajib diisi." };
  if (isi.length > 3000) return { galat: "Pesan terlalu panjang (maks. 3000 karakter)." };
  const penulis = await namaPenyampai(s);
  const { data: t, error } = await s.supabase.from("ruang_topik").insert({ judul: judul.slice(0, 150), penulis }).select("id").single();
  if (error) return { galat: "Gagal membuka topik. Pastikan SQL 12 sudah dijalankan." };
  await s.supabase.from("ruang_pesan").insert({ topik_id: t.id, isi, penulis });
  await kirimPush({ profilIds: await idStaf(), kecuali: s.user.id, judul: "Diskusi pengajar baru", isi: `${penulis}: ${judul}`, url: `/guru/ruang/diskusi/${t.id}` });
  segarkan();
  redirect(`/guru/ruang/diskusi/${t.id}`);
}

export async function kirimPesan(topikId, _prev, fd) {
  const s = await sesiStaf(); if (!s) return TIDAK;
  const isi = String(fd.get("isi") || "").trim();
  if (!isi) return { galat: "Tulis pesan dulu." };
  if (isi.length > 3000) return { galat: "Pesan terlalu panjang (maks. 3000 karakter)." };
  const penulis = await namaPenyampai(s);
  const { error } = await s.supabase.from("ruang_pesan").insert({ topik_id: topikId, isi, penulis });
  if (error) return { galat: "Pesan gagal terkirim. Coba lagi." };
  const { data: t } = await s.supabase.from("ruang_topik").select("judul,dibuat_oleh").eq("id", topikId).maybeSingle();
  if (t?.dibuat_oleh && t.dibuat_oleh !== s.user.id) {
    await kirimPush({ profilIds: [t.dibuat_oleh], judul: `Balasan: ${potong(t.judul, 50)}`, isi: `${penulis}: ${potong(isi, 110)}`, url: `/guru/ruang/diskusi/${topikId}` });
  }
  revalidatePath(`/guru/ruang/diskusi/${topikId}`); revalidatePath("/guru/ruang/diskusi");
  return { ok: true };
}

export async function hapusPesan(id, topikId) {
  const s = await sesiStaf(); if (!s) return;
  await s.supabase.from("ruang_pesan").delete().eq("id", id);
  revalidatePath(`/guru/ruang/diskusi/${topikId}`);
}

export async function hapusTopik(id) {
  const s = await sesiStaf(); if (!s) return;
  await s.supabase.from("ruang_topik").delete().eq("id", id);
  segarkan();
  redirect("/guru/ruang/diskusi");
}
