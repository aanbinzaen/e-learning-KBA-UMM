// Pengaturan tampilan hero (bagian paling atas Beranda). Disimpan sebagai satu baris JSON di tabel konten_halaman (kunci: hero_beranda).
export const HERO_BAWAAN = {
  judul: "Kuliah Bahasa Arab Untuk Meraih Mahabatullah",
  subjudul: "Belajar Bahasa Arab bersama Rumah Dakwah Malang dan Pesantren Online, langsung dari HP Anda.",
  arab: "مَحَبَّةُ اللهِ",
  tombol1: "Masuk",
  tombol2: "Kenali pengajar",
  latar: "gradasi", // polos | gradasi | pola | foto
  foto_url: "",
  gelap: 60,        // kepekatan lapisan hijau di atas foto (20-90)
  tata: "kiri",     // kiri | tengah
};

const LATAR = ["polos", "gradasi", "pola", "foto"];
const TATA = ["kiri", "tengah"];
const potong = (t, n) => String(t ?? "").trim().slice(0, n);

export function gabungHero(mentah) {
  let o = {};
  try { o = JSON.parse(mentah || "{}") || {}; } catch { o = {}; }
  const h = { ...HERO_BAWAAN };
  for (const k of ["judul", "subjudul", "arab", "tombol1", "tombol2"]) if (typeof o[k] === "string") h[k] = potong(o[k], k === "subjudul" ? 300 : 150);
  if (LATAR.includes(o.latar)) h.latar = o.latar;
  if (TATA.includes(o.tata)) h.tata = o.tata;
  if (typeof o.foto_url === "string" && /^https:\/\//.test(o.foto_url)) h.foto_url = o.foto_url;
  const g = Number(o.gelap); if (Number.isFinite(g)) h.gelap = Math.min(90, Math.max(20, Math.round(g)));
  if (h.latar === "foto" && !h.foto_url) h.latar = "gradasi";
  return h;
}

const POLA = encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='88' height='88' viewBox='0 0 88 88'><g fill='none' stroke='#F5B800' stroke-opacity='.2' stroke-width='1.5'>" +
  "<path d='M44 5 L57 31 L83 44 L57 57 L44 83 L31 57 L5 44 L31 31 Z'/><circle cx='44' cy='44' r='10'/><path d='M0 0 L11 11 M88 0 L77 11 M0 88 L11 77 M88 88 L77 77'/></g></svg>"
);

export function gayaLatar(h) {
  const GRAD = "linear-gradient(135deg,#1E7B34 0%,#14582A 62%,#0F4420 100%)";
  if (h.latar === "polos") return { backgroundColor: "#1E7B34" };
  if (h.latar === "pola") return { backgroundColor: "#1E7B34", backgroundImage: `url("data:image/svg+xml,${POLA}"), ${GRAD}`, backgroundSize: "88px 88px, cover" };
  if (h.latar === "foto" && h.foto_url) {
    const a = (h.gelap ?? 60) / 100;
    return { backgroundColor: "#14582A", backgroundImage: `linear-gradient(rgba(15,68,32,${a}),rgba(15,68,32,${Math.min(0.95, a + 0.12)})), url("${h.foto_url}")`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  return { backgroundImage: GRAD };
}
