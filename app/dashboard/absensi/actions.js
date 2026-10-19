"use server";
import { revalidatePath } from "next/cache";
import { ambilSesi } from "@/lib/auth";

const PESAN = {
  ok: { ok: true, pesan: "Alhamdulillah, kehadiran Anda tercatat." },
  sudah: { ok: true, pesan: "Kehadiran Anda sudah tercatat sebelumnya." },
  tutup: { ok: false, pesan: "Absensi sudah ditutup oleh pengajar." },
  bukan_anggota: { ok: false, pesan: "Pertemuan ini bukan untuk grup Anda." },
  tidak_ada: { ok: false, pesan: "Pertemuan tidak ditemukan." },
};

export async function isiHadir(pertemuanId) {
  const s = await ambilSesi();
  if (!s?.profil?.aktif) return { ok: false, pesan: "Silakan masuk kembali." };
  const { data, error } = await s.supabase.rpc("isi_hadir", { pid: pertemuanId });
  if (error) return { ok: false, pesan: "Gagal mencatat kehadiran. Coba lagi." };
  revalidatePath("/dashboard/absensi"); revalidatePath("/dashboard");
  return PESAN[data] || { ok: false, pesan: "Gagal mencatat kehadiran." };
}
