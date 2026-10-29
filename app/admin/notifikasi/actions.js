"use server";
import { wajibAdmin } from "@/lib/auth";
import { kirimPush } from "@/lib/push";
import { bersih } from "@/lib/validasi";

export async function siarkanNotifikasi(_prev, fd) {
  const { user } = await wajibAdmin();
  const judul = bersih(fd.get("judul")), isi = bersih(fd.get("isi"));
  if (!judul) return { galat: "Judul notifikasi wajib diisi." };
  let url = bersih(fd.get("url")) || "/";
  if (!url.startsWith("/")) url = "/";   // hanya halaman di situs ini
  const target = String(fd.get("target") || "semua");
  const r = await kirimPush({ topik: "pengumuman", grupId: target === "semua" ? null : target, kecuali: user.id, judul, isi, url });
  if (r.galat) return { galat: "Notifikasi gagal dikirim. Pastikan SQL 11 sudah dijalankan." };
  return { ok: r.tertunda ? "Pengiriman diproses; sebagian mungkin tiba beberapa saat lagi." : `Notifikasi dikirim ke ${r.terkirim} perangkat.` };
}
