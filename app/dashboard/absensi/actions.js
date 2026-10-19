"use server";
import { revalidatePath } from "next/cache";
import { ambilSesi } from "@/lib/auth";

const NAMA = { hadir: "Hadir", izin: "Izin", sakit: "Sakit" };
const GALAT = {
  tutup: "Absensi sudah ditutup oleh pengajar.",
  bukan_anggota: "Pertemuan ini bukan untuk grup Anda.",
  tidak_ada: "Pertemuan tidak ditemukan.",
  dikunci: "Kehadiran Anda sudah dicatat oleh pengajar dan tidak bisa diubah di sini.",
  status_salah: "Pilihan tidak valid.",
};

export async function isiAbsensi(pertemuanId, status) {
  const s = await ambilSesi();
  if (!s?.profil?.aktif) return { ok: false, pesan: "Silakan masuk kembali." };
  const { data, error } = await s.supabase.rpc("isi_absensi", { pid: pertemuanId, st: status });
  if (error) return { ok: false, pesan: "Gagal mencatat. Coba lagi." };
  revalidatePath("/dashboard/absensi"); revalidatePath("/dashboard");
  if (data === "ok") return { ok: true, status, pesan: `Tercatat: ${NAMA[status]}.` };
  return { ok: false, pesan: GALAT[data] || "Gagal mencatat." };
}
