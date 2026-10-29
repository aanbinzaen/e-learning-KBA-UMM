"use server";
import { wajibAdmin } from "@/lib/auth";
import { kirimPush } from "@/lib/push";
import { supabaseAdmin } from "@/lib/supabase/server";
import { bersih } from "@/lib/validasi";

export async function siarkanNotifikasi(_prev, fd) {
  const { user } = await wajibAdmin();
  const judul = bersih(fd.get("judul")), isi = bersih(fd.get("isi"));
  if (!judul) return { galat: "Judul notifikasi wajib diisi." };
  let url = bersih(fd.get("url")) || "/";
  if (!url.startsWith("/")) url = "/";   // hanya halaman di situs ini
  const target = fd.get("target") === "pilih" ? "pilih" : "semua";
  let r, ringkas = "";
  if (target === "pilih") {
    const ids = [...new Set(fd.getAll("grup").map(String))].filter((x) => /^[0-9a-f-]{36}$/i.test(x));
    if (!ids.length) return { galat: "Pilih minimal satu kelas." };
    const db = supabaseAdmin();
    const { data: anggota } = await db.from("peserta_grup").select("profile_id").in("grup_id", ids);
    let profil = (anggota || []).map((x) => x.profile_id);
    if (fd.get("pengajar") === "on") {
      const { data: gr } = await db.from("grup").select("pengajar(profile_id)").in("id", ids);
      (gr || []).forEach((g) => { if (g.pengajar?.profile_id) profil.push(g.pengajar.profile_id); });
    }
    profil = [...new Set(profil)];
    if (!profil.length) return { galat: "Kelas yang dipilih belum memiliki peserta." };
    ringkas = ` (${profil.length} akun di ${ids.length} kelas)`;
    r = await kirimPush({ topik: "kelas", profilIds: profil, kecuali: user.id, judul, isi, url });
  } else {
    r = await kirimPush({ topik: "pengumuman", kecuali: user.id, judul, isi, url });
  }
  if (r.galat) return { galat: "Notifikasi gagal dikirim. Pastikan SQL 11 sudah dijalankan." };
  return { ok: r.tertunda ? "Pengiriman diproses; sebagian mungkin tiba beberapa saat lagi." : `Notifikasi dikirim ke ${r.terkirim} perangkat${ringkas}.` };
}
