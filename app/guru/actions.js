"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ambilSesi } from "@/lib/auth";
import { bersih } from "@/lib/validasi";
import { dariInputWIB } from "@/lib/waktu";
import { idYouTube } from "@/lib/youtube";
import { validasiSoal } from "@/lib/soal";
import { kirimPush } from "@/lib/push";
import { tanggalIndo } from "@/lib/data";

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
  if (fd.get("notif") === "on") {
    const { data: g } = await s.supabase.from("grup").select("nama").eq("id", grupId).maybeSingle();
    await kirimPush({ topik: "kelas", grupId, kecuali: s.user.id, judul: `Pertemuan baru: ${judul}`, isi: `${g?.nama || "Kelas"} · ${tanggalIndo(waktu)}`, url: `/dashboard/kelas/${data.id}` });
  }
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
  if (buka) {
    const { data: p } = await s.supabase.from("pertemuan").select("judul,grup_id").eq("id", pertemuanId).maybeSingle();
    if (p) await kirimPush({ topik: "kelas", grupId: p.grup_id, kecuali: s.user.id, judul: "Absensi dibuka", isi: `${p.judul} · ketuk untuk mengisi kehadiran`, url: "/dashboard/absensi" });
  }
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

// ---------------- Kuis ----------------
export async function buatKuis(pertemuanId, grupId, _prev, fd) {
  const s = await sesiGuru(); if (!s) return TIDAK;
  const judul = bersih(fd.get("judul"));
  if (!judul) return { galat: "Judul kuis wajib diisi." };
  const { data, error } = await s.supabase.from("kuis").insert({ pertemuan_id: pertemuanId, grup_id: grupId, judul }).select("id").single();
  if (error) return TIDAK;
  segarkan(pertemuanId);
  redirect(`/guru/kuis/${data.id}`);
}

export async function ubahKuis(kuisId, _prev, fd) {
  const s = await sesiGuru(); if (!s) return TIDAK;
  const judul = bersih(fd.get("judul")), terbit = fd.get("diterbitkan") === "on";
  if (!judul) return { galat: "Judul wajib diisi." };
  if (terbit) {
    const { count } = await s.supabase.from("soal").select("id", { count: "exact", head: true }).eq("kuis_id", kuisId);
    if (!count) return { galat: "Tambahkan minimal satu soal sebelum menerbitkan." };
  }
  const { data: lama } = await s.supabase.from("kuis").select("diterbitkan,grup_id").eq("id", kuisId).maybeSingle();
  const { error } = await s.supabase.from("kuis").update({ judul, diterbitkan: terbit, boleh_ulang: fd.get("boleh_ulang") === "on" }).eq("id", kuisId);
  if (error) return TIDAK;
  if (terbit && lama && !lama.diterbitkan) await kirimPush({ topik: "kuis", grupId: lama.grup_id, kecuali: s.user.id, judul: "Kuis baru", isi: judul, url: `/dashboard/kuis/${kuisId}` });
  revalidatePath(`/guru/kuis/${kuisId}`); revalidatePath("/dashboard/kelas");
  return { ok: terbit ? "Tersimpan. Kuis terlihat oleh peserta." : "Tersimpan sebagai draf (belum terlihat peserta)." };
}

export async function hapusKuis(kuisId, pertemuanId) {
  const s = await sesiGuru(); if (!s) return;
  await s.supabase.from("kuis").delete().eq("id", kuisId);
  segarkan(pertemuanId);
  redirect(`/guru/pertemuan/${pertemuanId}`);
}

function bacaSoal(fd) {
  const pasangan = [1, 2, 3, 4, 5].map((i) => [i, String(fd.get(`o${i}`) || "").trim()]).filter(([, t]) => t);
  const idx = pasangan.findIndex(([i]) => String(i) === String(fd.get("benar")));
  return validasiSoal({
    tipe: fd.get("tipe") === "esai" ? "esai" : "pilihan_ganda",
    pertanyaan: fd.get("pertanyaan"), bobot: fd.get("bobot"), pembahasan: fd.get("pembahasan"), kunci_esai: fd.get("kunci_esai"),
    opsi: pasangan.map(([, t]) => t), jawaban_benar: idx < 0 ? null : idx,
  });
}

export async function tambahSoal(kuisId, _prev, fd) {
  const s = await sesiGuru(); if (!s) return TIDAK;
  const b = bacaSoal(fd); if (b.galat) return b;
  const { count } = await s.supabase.from("soal").select("id", { count: "exact", head: true }).eq("kuis_id", kuisId);
  const { error } = await s.supabase.from("soal").insert({ kuis_id: kuisId, urutan: count || 0, ...b.nilai });
  if (error) return TIDAK;
  revalidatePath(`/guru/kuis/${kuisId}`);
  return { ok: "Soal ditambahkan." };
}

export async function ubahSoal(soalId, kuisId, _prev, fd) {
  const s = await sesiGuru(); if (!s) return TIDAK;
  const b = bacaSoal(fd); if (b.galat) return b;
  const { error } = await s.supabase.from("soal").update(b.nilai).eq("id", soalId);
  if (error) return TIDAK;
  revalidatePath(`/guru/kuis/${kuisId}`);
  return { ok: "Soal diperbarui." };
}

// Impor banyak soal sekaligus dari hasil pembacaan berkas/teks (divalidasi ulang di server).
export async function imporSoal(kuisId, daftar) {
  const s = await sesiGuru(); if (!s) return TIDAK;
  if (!Array.isArray(daftar) || !daftar.length || daftar.length > 200) return { galat: "Jumlah soal harus 1 sampai 200." };
  const baris = [];
  for (const [i, d] of daftar.entries()) {
    const v = validasiSoal(d || {});
    if (v.galat) return { galat: `Soal ke-${i + 1}: ${v.galat}` };
    baris.push(v.nilai);
  }
  const { count } = await s.supabase.from("soal").select("id", { count: "exact", head: true }).eq("kuis_id", kuisId);
  const { error } = await s.supabase.from("soal").insert(baris.map((b, i) => ({ kuis_id: kuisId, urutan: (count || 0) + i, ...b })));
  if (error) return TIDAK;
  revalidatePath(`/guru/kuis/${kuisId}`);
  return { ok: `${baris.length} soal berhasil ditambahkan.` };
}

// Pengajar menilai jawaban esai satu peserta. Perhitungan akhir dilakukan di database.
export async function nilaiEsai(percobaanId, kuisId, _prev, fd) {
  const s = await sesiGuru(); if (!s) return TIDAK;
  const { data: esai } = await s.supabase.from("soal").select("id,bobot").eq("kuis_id", kuisId).eq("tipe", "esai");
  const penilaian = {};
  for (const e of esai || []) {
    const mentah = String(fd.get(`skor_${e.id}`) ?? "").trim();
    if (mentah === "") continue;
    const skor = Number(mentah.replace(",", "."));
    if (!Number.isFinite(skor) || skor < 0 || skor > e.bobot) return { galat: `Skor harus antara 0 dan ${e.bobot}.` };
    penilaian[e.id] = { skor, catatan: String(fd.get(`catatan_${e.id}`) || "").trim().slice(0, 1000) };
  }
  const { data: sebelum } = await s.supabase.from("percobaan").select("profile_id,status").eq("id", percobaanId).maybeSingle();
  const { data, error } = await s.supabase.rpc("nilai_esai", { pid: percobaanId, penilaian });
  if (error || data?.galat) return TIDAK;
  if (sebelum?.status === "menunggu" && !data.menunggu) {
    const { data: ku } = await s.supabase.from("kuis").select("judul").eq("id", kuisId).maybeSingle();
    await kirimPush({ topik: "kuis", profilIds: [sebelum.profile_id], judul: "Nilai kuis sudah keluar", isi: `${ku?.judul || "Kuis"} · nilai ${data.nilai}`, url: `/dashboard/kuis/${kuisId}` });
  }
  revalidatePath(`/guru/kuis/${kuisId}/nilai`); revalidatePath(`/guru/kuis/${kuisId}`); revalidatePath("/guru/rekap"); revalidatePath("/dashboard/kelas");
  return { ok: data.menunggu ? "Tersimpan. Masih ada esai yang belum diberi skor." : `Tersimpan. Nilai akhir peserta: ${data.nilai}.` };
}

export async function hapusSoal(soalId, kuisId) {
  const s = await sesiGuru(); if (!s) return;
  await s.supabase.from("soal").delete().eq("id", soalId);
  revalidatePath(`/guru/kuis/${kuisId}`);
}

// Pengingat manual ke peserta satu grup untuk pertemuan tertentu
export async function kirimPengingat(pertemuanId, _prev) {
  const s = await sesiGuru(); if (!s) return TIDAK;
  const { data: p } = await s.supabase.from("pertemuan").select("judul,waktu,grup_id,grup(nama)").eq("id", pertemuanId).maybeSingle();
  if (!p) return TIDAK;
  const r = await kirimPush({ topik: "kelas", grupId: p.grup_id, kecuali: s.user.id, judul: `Pengingat: ${p.judul}`, isi: `${p.grup?.nama || "Kelas"} · ${tanggalIndo(p.waktu)}`, url: `/dashboard/kelas/${pertemuanId}` });
  if (r.galat) return { galat: "Notifikasi gagal dikirim. Pastikan SQL 11 sudah dijalankan." };
  return { ok: `Pengingat dikirim ke ${r.terkirim} perangkat peserta.` };
}
