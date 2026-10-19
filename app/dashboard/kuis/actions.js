"use server";
import { revalidatePath } from "next/cache";
import { ambilSesi } from "@/lib/auth";

const PESAN = {
  tidak_ada: "Kuis tidak tersedia.",
  bukan_anggota: "Kuis ini bukan untuk grup Anda.",
  sudah_mengerjakan: "Kuis ini hanya boleh dikerjakan satu kali.",
  kosong: "Kuis ini belum memiliki soal.",
};

// Nilai dihitung di database. Server hanya meneruskan jawaban: nomor pilihan 0-4 atau teks esai.
export async function kirimKuis(kuisId, jawaban) {
  const s = await ambilSesi();
  if (!s?.profil?.aktif) return { galat: "Silakan masuk kembali." };
  const bersih = {};
  for (const [k, v] of Object.entries(jawaban || {})) {
    if (!/^[0-9a-f-]{36}$/.test(k)) continue;
    if (Number.isInteger(v) && v >= 0 && v < 5) bersih[k] = v;                       // pilihan ganda
    else if (typeof v === "string" && v.trim()) bersih[k] = v.trim().slice(0, 4000);   // esai
  }
  const { data, error } = await s.supabase.rpc("kirim_kuis", { kid: kuisId, jawaban: bersih });
  if (error) return { galat: "Gagal mengirim jawaban. Coba lagi." };
  if (data?.galat) return { galat: PESAN[data.galat] || "Gagal mengirim jawaban." };
  revalidatePath("/dashboard"); revalidatePath("/dashboard/kelas");
  return data;
}
