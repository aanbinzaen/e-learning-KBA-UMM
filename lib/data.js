import { supabasePublik } from "@/lib/supabase/public";
import { gabungHero } from "@/lib/hero";

// Data publik dengan cadangan (fallback) agar situs tetap tampil walau database belum diisi.
const CADANGAN_PENGAJAR = [
  { id: "1", nama: "Ustadz Bintang, S.Pd", foto_url: null, grup: [{ nama: "Imam Al Khalil Bin Ahmad Al Farahidi", tingkat: "Lanjutan", jenis_kelamin: "Ikhwan" }] },
  { id: "2", nama: "Ustadz Daffa, S.Pd", foto_url: null, grup: [{ nama: "Imam Sibawaih", tingkat: "Kelas Khusus", jenis_kelamin: "Ikhwan" }, { nama: "Imam Ibnu Hisyam", tingkat: "Lanjutan", jenis_kelamin: "Ikhwan" }] },
  { id: "3", nama: "Ustadz Aan, S.Pd", foto_url: null, grup: [{ nama: "Imam Abul Aswad Ad-Du'aliy", tingkat: "Pemula", jenis_kelamin: "Ikhwan" }] },
  { id: "4", nama: "Ustadz Haris Al Hafidz", foto_url: null, grup: [{ nama: "Imam Al Kisa'i", tingkat: "Pemula", jenis_kelamin: "Ikhwan" }] },
  { id: "5", nama: "Ustadzah Irbah, B.Sh.", foto_url: null, grup: [{ nama: "Kelas Lanjutan", tingkat: "Lanjutan", jenis_kelamin: "Akhwat" }, { nama: "Kelas Pemula", tingkat: "Pemula", jenis_kelamin: "Akhwat" }] },
];

export async function ambilPengajar() {
  const db = supabasePublik();
  if (!db) return CADANGAN_PENGAJAR;
  const { data, error } = await db
    .from("pengajar")
    .select("id,nama,nama_tampil,jabatan,foto_url,bio,urutan,grup(nama,kelas(tingkat,jenis_kelamin))")
    .eq("tampil_publik", true)
    .order("urutan")
    .order("nama");
  if (error || !data?.length) return CADANGAN_PENGAJAR;
  return data.map((p) => ({
    ...p,
    nama: p.nama_tampil || p.nama,
    grup: (p.grup || []).map((g) => ({ nama: g.nama, tingkat: g.kelas?.tingkat, jenis_kelamin: g.kelas?.jenis_kelamin })),
  }));
}

export async function ambilPendiri() {
  const db = supabasePublik();
  if (!db) return [];
  const { data } = await db.from("pendiri").select("id,nama,peran,biografi,foto_url").order("urutan");
  return data || [];
}

export async function ambilPengumuman(batas = 3) {
  const db = supabasePublik();
  if (!db) return [];
  const { data } = await db
    .from("pengumuman")
    .select("id,judul,isi,dibuat_pada")
    .eq("terbit", true)
    .order("dibuat_pada", { ascending: false })
    .limit(batas);
  return data || [];
}

export async function ambilJadwal(batas = 4) {
  const db = supabasePublik();
  if (!db) return [];
  const { data } = await db
    .from("jadwal")
    .select("id,judul,waktu_mulai,keterangan")
    .eq("tampil", true)
    .gte("waktu_mulai", new Date().toISOString())
    .order("waktu_mulai")
    .limit(batas);
  return data || [];
}

export async function ambilKonten(kunci, cadangan) {
  const db = supabasePublik();
  if (!db) return cadangan;
  const { data } = await db.from("konten_halaman").select("isi").eq("kunci", kunci).maybeSingle();
  return data?.isi || cadangan;
}

export function tanggalIndo(iso) {
  return new Date(iso).toLocaleString("id-ID", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
  }) + " WIB";
}

// Bagian-bagian tanggal (WIB) untuk lencana jadwal di Beranda.
export function bagianTanggal(iso) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(iso)).map((x) => [x.type, x.value])
  );
  return { hari: p.day, bulan: String(p.month).toUpperCase().replace(".", ""), namaHari: p.weekday, jam: `${p.hour}.${p.minute}` };
}

export function tanggalPendek(iso) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
}

export async function ambilFaidah(batas = 1) {
  const db = supabasePublik();
  if (!db) return [];
  const { data } = await db
    .from("faidah")
    .select("id,judul,teks_arab,isi,sumber,dibuat_pada")
    .eq("terbit", true)
    .order("dibuat_pada", { ascending: false })
    .limit(batas);
  return data || [];
}

export async function ambilHero() {
  return gabungHero(await ambilKonten("hero_beranda", ""));
}
