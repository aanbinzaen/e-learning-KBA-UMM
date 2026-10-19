"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ambilSesi } from "@/lib/auth";
import { bersih } from "@/lib/validasi";
import { dariInputWIB } from "@/lib/waktu";
import { idYouTube } from "@/lib/youtube";

// Semua penulisan memakai sesi pengguna, jadi aturan RLS database tetap berlaku
// (pengajar hanya bisa mengubah grup yang diampunya).
async function sesiGuru() {
  const s = await ambilSesi();
  if (!s?.profil?.aktif || !["pengajar", "admin"].includes(s.profil.role)) return null;
  return s;
}
const TIDAK = { galat: "Anda tidak berhak mengubah grup ini." };
const segarkan = (id) => { revalidatePath("/guru"); revalidatePath(`/guru/pertemuan/${id}`); revalidatePath("/dashboard/kelas"); revalidatePath(`/dashboard/kelas/${id}`); };

export async function tambahPertemuan(grupId, _prev, fd) {
  const s = await sesiGuru(); if (!s) return TIDAK;
  const judul = bersih(fd.get("judul")), waktu = dariInputWIB(fd.get("waktu"));
  if (!judul) return { galat: "Judul pertemuan wajib diisi." };
  if (!waktu) return { galat: "Tanggal dan jam wajib diisi." };
  const { data, error } = await s.supabase.from("pertemuan")
    .insert({ grup_id: grupId, judul, waktu, keterangan: bersih(fd.get("keterangan")) || null }).select("id").single();
  if (error) return TIDAK;
  revalidatePath("/guru");
  redirect(`/guru/pertemuan/${data.id}`);
}

export async function ubahPertemuan(id, _prev, fd) {
  const s = await sesiGuru(); if (!s) return TIDAK;
  const judul = bersih(fd.get("judul")), waktu = dariInputWIB(fd.get("waktu"));
  if (!judul || !waktu) return { galat: "Judul dan waktu wajib diisi." };
  const { error } = await s.supabase.from("pertemuan").update({ judul, waktu, keterangan: bersih(fd.get("keterangan")) || null }).eq("id", id);
  if (error) return TIDAK;
  segarkan(id);
  return { ok: "Pertemuan disimpan." };
}

export async function hapusPertemuan(id) {
  const s = await sesiGuru(); if (!s) return;
  const { data: berkas } = await s.supabase.from("materi").select("file_path").eq("pertemuan_id", id).eq("jenis", "pdf");
  const { error } = await s.supabase.from("pertemuan").delete().eq("id", id);
  if (!error && berkas?.length) await s.supabase.storage.from("materi").remove(berkas.map((b) => b.file_path));
  revalidatePath("/guru");
  redirect("/guru");
}

export async function tambahCatatan(pertemuanId, grupId, _prev, fd) {
  const s = await sesiGuru(); if (!s) return TIDAK;
  const judul = bersih(fd.get("judul")), catatan = String(fd.get("catatan") || "").trim();
  if (!judul || !catatan) return { galat: "Judul dan isi catatan wajib diisi." };
  const { error } = await s.supabase.from("materi").insert({ pertemuan_id: pertemuanId, grup_id: grupId, jenis: "catatan", judul, catatan });
  if (error) return TIDAK;
  segarkan(pertemuanId);
  return { ok: "Catatan ditambahkan." };
}

// Dipanggil setelah berkas PDF diunggah langsung dari browser ke Supabase Storage.
export async function simpanMateriPdf(pertemuanId, grupId, judul, path) {
  const s = await sesiGuru(); if (!s) return TIDAK;
  if (!path.startsWith(`${grupId}/`) || !path.endsWith(".pdf")) return { galat: "Berkas tidak valid." };
  const { error } = await s.supabase.from("materi").insert({ pertemuan_id: pertemuanId, grup_id: grupId, jenis: "pdf", judul: bersih(judul), file_path: path });
  if (error) { await s.supabase.storage.from("materi").remove([path]); return TIDAK; }
  segarkan(pertemuanId);
  return { ok: "PDF ditambahkan." };
}

export async function hapusMateri(id, pertemuanId) {
  const s = await sesiGuru(); if (!s) return;
  const { data: m } = await s.supabase.from("materi").select("jenis,file_path").eq("id", id).maybeSingle();
  const { error } = await s.supabase.from("materi").delete().eq("id", id);
  if (!error && m?.jenis === "pdf" && m.file_path) await s.supabase.storage.from("materi").remove([m.file_path]);
  segarkan(pertemuanId);
}

export async function tambahRekaman(pertemuanId, grupId, _prev, fd) {
  const s = await sesiGuru(); if (!s) return TIDAK;
  const judul = bersih(fd.get("judul")), id = idYouTube(fd.get("link"));
  if (!judul) return { galat: "Judul rekaman wajib diisi." };
  if (!id) return { galat: "Tautan YouTube tidak dikenali. Salin dari tombol Bagikan di YouTube." };
  const { error } = await s.supabase.from("rekaman").insert({ pertemuan_id: pertemuanId, grup_id: grupId, judul, youtube_id: id });
  if (error) return TIDAK;
  segarkan(pertemuanId);
  return { ok: "Rekaman ditambahkan." };
}

export async function hapusRekaman(id, pertemuanId) {
  const s = await sesiGuru(); if (!s) return;
  await s.supabase.from("rekaman").delete().eq("id", id);
  segarkan(pertemuanId);
}

export async function ubahAbsensiBuka(pertemuanId, buka) {
  const s = await sesiGuru(); if (!s) return;
  await s.supabase.from("pertemuan").update({ absensi_buka: buka }).eq("id", pertemuanId);
  segarkan(pertemuanId);
  revalidatePath("/dashboard/absensi");
}

const STATUS = ["hadir", "izin", "sakit", "alpa"];
export async function simpanKehadiran(pertemuanId, _prev, fd) {
  const s = await sesiGuru(); if (!s) return TIDAK;
  const { data: p } = await s.supabase.from("pertemuan").select("grup_id").eq("id", pertemuanId).maybeSingle();
  if (!p) return TIDAK;
  const { data: anggota } = await s.supabase.rpc("anggota_grup_daftar", { gid: p.grup_id });
  const tulis = [], hapus = [];
  for (const a of anggota || []) {
    const v = String(fd.get(`s_${a.profile_id}`) || "");
    if (STATUS.includes(v)) tulis.push({ pertemuan_id: pertemuanId, profile_id: a.profile_id, status: v, dicatat_oleh: "pengajar" });
    else hapus.push(a.profile_id);
  }
  if (tulis.length) {
    const { error } = await s.supabase.from("absensi").upsert(tulis, { onConflict: "pertemuan_id,profile_id" });
    if (error) return { galat: "Gagal menyimpan kehadiran." };
  }
  if (hapus.length) await s.supabase.from("absensi").delete().eq("pertemuan_id", pertemuanId).in("profile_id", hapus);
  revalidatePath("/guru/rekap"); revalidatePath("/dashboard/absensi");
  return { ok: `Kehadiran tersimpan (${tulis.length} peserta dicatat).` };
}
