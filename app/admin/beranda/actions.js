"use server";
import { revalidatePath } from "next/cache";
import { wajibAdmin } from "@/lib/auth";
import { bersih } from "@/lib/validasi";

const GAGAL = { galat: "Gagal menyimpan. Coba lagi." };

export async function simpanHero(_prev, fd) {
  const { supabase } = await wajibAdmin();
  const latar = ["polos", "gradasi", "pola", "foto"].includes(String(fd.get("latar"))) ? String(fd.get("latar")) : "gradasi";
  const tata = fd.get("tata") === "tengah" ? "tengah" : "kiri";
  const foto = bersih(fd.get("foto_url"));
  const judul = bersih(fd.get("judul"));
  if (!judul) return { galat: "Judul utama wajib diisi." };
  if (foto && !/^https:\/\//.test(foto)) return { galat: "Alamat foto tidak valid." };
  if (latar === "foto" && !foto) return { galat: "Unggah foto latar dulu, atau pilih gaya latar yang lain." };
  const g = Number(fd.get("gelap"));
  const isi = {
    judul: judul.slice(0, 150), subjudul: bersih(fd.get("subjudul")).slice(0, 300), arab: bersih(fd.get("arab")).slice(0, 80),
    tombol1: bersih(fd.get("tombol1")).slice(0, 30), tombol2: bersih(fd.get("tombol2")).slice(0, 30),
    latar, tata, foto_url: foto, gelap: Number.isFinite(g) ? Math.min(90, Math.max(20, Math.round(g))) : 60,
  };
  const { error } = await supabase.from("konten_halaman").upsert({ kunci: "hero_beranda", isi: JSON.stringify(isi) });
  if (error) return GAGAL;
  revalidatePath("/");
  return { ok: "Tampilan Beranda disimpan. Perubahan terlihat dalam sekitar satu menit." };
}

export async function aturUlangHero() {
  const { supabase } = await wajibAdmin();
  await supabase.from("konten_halaman").delete().eq("kunci", "hero_beranda");
  revalidatePath("/"); revalidatePath("/admin/beranda");
}
