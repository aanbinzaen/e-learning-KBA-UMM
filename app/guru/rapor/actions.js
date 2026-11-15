"use server";
import { revalidatePath } from "next/cache";
import { ambilSesi } from "@/lib/auth";
import { kirimPush } from "@/lib/push";

async function staf() {
  const s = await ambilSesi();
  return s?.profil?.aktif && ["pengajar", "admin"].includes(s.profil.role) ? s : null;
}

// Catatan pengajar pada rapor. Pengajar hanya dapat menulis untuk peserta di grup yang diampu (dijaga RLS).
export async function simpanCatatan(profilId, _prev, fd) {
  const s = await staf(); if (!s) return { galat: "Tidak diizinkan." };
  const teks = String(fd.get("catatan") || "").trim();
  if (teks.length > 1500) return { galat: "Catatan terlalu panjang (maks. 1500 karakter)." };
  if (!teks) {
    const { error } = await s.supabase.from("rapor_catatan").delete().eq("profile_id", profilId);
    if (error) return { galat: "Gagal menghapus catatan. Pastikan SQL 13 sudah dijalankan." };
    revalidatePath(`/guru/rapor/${profilId}`); return { ok: "Catatan dihapus." };
  }
  const { data: pj } = await s.supabase.from("pengajar").select("nama,nama_tampil").eq("profile_id", s.user.id).maybeSingle();
  const penulis = pj?.nama_tampil || pj?.nama || s.profil.nama_lengkap;
  const { error } = await s.supabase.from("rapor_catatan").upsert({ profile_id: profilId, catatan: teks, penulis, diubah_oleh: s.user.id, diubah_pada: new Date().toISOString() });
  if (error) return { galat: "Gagal menyimpan catatan. Pastikan SQL 13 sudah dijalankan dan Anda mengampu grup peserta ini." };
  await kirimPush({ profilIds: [profilId], judul: "Catatan baru di rapor Anda", isi: `${penulis} menulis catatan pada rapor Anda.`, url: "/dashboard/rapor" });
  revalidatePath(`/guru/rapor/${profilId}`); revalidatePath("/dashboard/rapor");
  return { ok: "Catatan disimpan. Peserta dapat melihatnya di rapornya." };
}

// Bobot skor akhir (hanya admin; tabel pengaturan dilindungi RLS)
export async function simpanBobot(_prev, fd) {
  const s = await ambilSesi();
  if (!s?.profil?.aktif || s.profil.role !== "admin") return { galat: "Hanya admin yang dapat mengubah bobot." };
  const n = ["hadir", "kuis", "progres"].map((k) => Math.round(Number(fd.get(k))));
  if (n.some((x) => !Number.isFinite(x) || x < 0 || x > 100) || n.reduce((a, b) => a + b, 0) !== 100) return { galat: "Ketiga bobot harus berupa angka 0–100 dengan jumlah tepat 100." };
  const { error } = await s.supabase.from("pengaturan").upsert({ kunci: "rapor_bobot", nilai: n.join(",") });
  if (error) return { galat: "Gagal menyimpan bobot." };
  revalidatePath("/guru/laporan"); revalidatePath("/guru/rapor"); revalidatePath("/dashboard/rapor");
  return { ok: `Bobot disimpan: kehadiran ${n[0]}%, kuis ${n[1]}%, progres ${n[2]}%.` };
}
