// Validasi dan pembaca soal. Dipakai di peramban (pratinjau) DAN di server (validasi ulang sebelum disimpan).
const bersih = (t) => String(t ?? "").replace(/\r/g, "").trim();
const HURUF = ["A", "B", "C", "D", "E"];

export function validasiSoal(raw) {
  const tipe = raw.tipe === "esai" ? "esai" : "pilihan_ganda";
  const pertanyaan = bersih(raw.pertanyaan);
  if (!pertanyaan) return { galat: "Pertanyaan kosong." };
  if (pertanyaan.length > 2000) return { galat: "Pertanyaan terlalu panjang (maks. 2000 karakter)." };
  const mentahBobot = raw.bobot === null || raw.bobot === undefined || raw.bobot === "" ? 1 : Number(raw.bobot);
  if (!Number.isInteger(mentahBobot) || mentahBobot < 1 || mentahBobot > 100) return { galat: "Bobot harus bilangan bulat 1 sampai 100." };
  const pembahasan = bersih(raw.pembahasan).slice(0, 2000) || null;

  if (tipe === "esai") {
    return { nilai: { tipe, pertanyaan, opsi: null, jawaban_benar: null, bobot: mentahBobot, pembahasan, kunci_esai: bersih(raw.kunci_esai).slice(0, 2000) || null } };
  }
  const opsi = (raw.opsi || []).map(bersih);
  if (opsi.length < 2 || opsi.length > 5 || opsi.some((o) => !o)) return { galat: "Pilihan ganda butuh 2 sampai 5 pilihan yang terisi." };
  if (opsi.some((o) => o.length > 500)) return { galat: "Salah satu pilihan terlalu panjang (maks. 500 karakter)." };
  const b = raw.jawaban_benar;
  if (!Number.isInteger(b) || b < 0 || b >= opsi.length) return { galat: "Jawaban benar belum ditentukan atau tidak sesuai pilihan." };
  return { nilai: { tipe, pertanyaan, opsi, jawaban_benar: b, bobot: mentahBobot, pembahasan, kunci_esai: null } };
}

// Format teks (tempel dari Word atau berkas .txt):
//   1. Pertanyaan?
//   A. pilihan   B. pilihan  *C. pilihan benar  (atau baris "Jawaban: C")
//   Pembahasan: ...
//   2. [Esai] Pertanyaan uraian
//   Kunci: contoh jawaban (opsional)   Bobot: 5 (opsional)
export function parseTeks(teks) {
  const baris = String(teks || "").replace(/\r/g, "").split("\n");
  const semua = [];
  let cur = null, bagian = "pertanyaan";
  const baru = (judul) => ({ pertanyaan: judul, opsi: [], huruf: [], benar: null, kunci: "", pembahasan: "", bobot: null, esai: false });
  const tambah = (t) => {
    if (!cur) return;
    if (bagian === "pertanyaan") cur.pertanyaan += (cur.pertanyaan ? "\n" : "") + t;
    else if (bagian === "opsi") cur.opsi[cur.opsi.length - 1] += " " + t;
    else if (bagian === "kunci") cur.kunci += (cur.kunci ? "\n" : "") + t;
    else if (bagian === "pembahasan") cur.pembahasan += (cur.pembahasan ? "\n" : "") + t;
  };
  for (const mentah of baris) {
    const t = mentah.trim();
    if (!t) continue;
    let m;
    if ((m = t.match(/^(\d+)\s*[.)]\s*(.*)$/))) {
      if (cur) semua.push(cur);
      cur = baru(m[2]); bagian = "pertanyaan";
      const tag = cur.pertanyaan.match(/^\[(esai|essay|uraian|pg|pilihan ganda)\]\s*/i);
      if (tag) { cur.esai = /esai|essay|uraian/i.test(tag[1]); cur.pertanyaan = cur.pertanyaan.slice(tag[0].length); }
      continue;
    }
    if (!cur) continue;
    if ((m = t.match(/^(\*)?\s*([A-Ea-e])\s*[.)]\s*(.*)$/))) {
      cur.opsi.push(m[3]); cur.huruf.push(m[2].toUpperCase());
      if (m[1]) cur.benar = m[2].toUpperCase();
      bagian = "opsi"; continue;
    }
    if ((m = t.match(/^(jawaban|kunci)\s*[:：]\s*(.*)$/i))) {
      if (/^[A-Ea-e]$/.test(m[2].trim()) && cur.opsi.length) { cur.benar = m[2].trim().toUpperCase(); bagian = "selesai"; }
      else { cur.kunci = m[2]; bagian = "kunci"; }
      continue;
    }
    if ((m = t.match(/^pembahasan\s*[:：]\s*(.*)$/i))) { cur.pembahasan = m[1]; bagian = "pembahasan"; continue; }
    if ((m = t.match(/^bobot\s*[:：]\s*(\d+)/i))) { cur.bobot = Number(m[1]); continue; }
    tambah(t);
  }
  if (cur) semua.push(cur);

  return semua.map((s, i) => {
    const esai = s.esai || s.opsi.length === 0;
    const raw = esai
      ? { tipe: "esai", pertanyaan: s.pertanyaan, pembahasan: s.pembahasan, bobot: s.bobot, kunci_esai: s.kunci }
      : { tipe: "pilihan_ganda", pertanyaan: s.pertanyaan, opsi: s.opsi, jawaban_benar: s.benar ? s.huruf.indexOf(s.benar) : null, pembahasan: s.pembahasan, bobot: s.bobot };
    if (!esai && raw.jawaban_benar === -1) raw.jawaban_benar = null;
    return { nomor: i + 1, pratinjau: s.pertanyaan.slice(0, 140), tipe: raw.tipe, ...validasiSoal(raw) };
  });
}

// Baris dari CSV/Excel. Kolom: tipe, pertanyaan, a, b, c, d, e, jawaban, bobot, pembahasan
export function dariBaris(rows) {
  return rows.map((r, i) => {
    const g = (k) => bersih(r[k]);
    const pil = ["a", "b", "c", "d", "e"].map((h) => ({ h, t: g(h) || g(`opsi_${h}`) })).filter((o) => o.t);
    const tipeTeks = g("tipe").toLowerCase();
    const esai = /esai|essay|uraian/.test(tipeTeks) || (!tipeTeks && pil.length === 0);
    const dasar = { nomor: i + 2, pratinjau: (g("pertanyaan") || g("soal")).slice(0, 140) };
    const raw = { pertanyaan: g("pertanyaan") || g("soal"), pembahasan: g("pembahasan"), bobot: g("bobot") || null };
    if (esai) return { ...dasar, tipe: "esai", ...validasiSoal({ ...raw, tipe: "esai", kunci_esai: g("jawaban") || g("kunci") }) };
    const idx = pil.findIndex((o) => o.h === g("jawaban").toLowerCase());
    return { ...dasar, tipe: "pilihan_ganda", ...validasiSoal({ ...raw, tipe: "pilihan_ganda", opsi: pil.map((o) => o.t), jawaban_benar: idx < 0 ? null : idx }) };
  });
}

export const CONTOH_TEKS = `1. Apa arti kata كِتَابٌ?
A. Pena
B. Meja
*C. Buku
D. Pintu
Pembahasan: Kitab berarti buku.

2. Manakah yang termasuk isim?
A. ذَهَبَ
B. مُحَمَّدٌ
C. فِي
Jawaban: B
Bobot: 2

3. [Esai] Jelaskan perbedaan isim dan fi'il!
Kunci: Isim menunjukkan nama, fi'il menunjukkan pekerjaan dan waktu.
Bobot: 5`;
export const KOLOM_TEMPLATE = ["tipe", "pertanyaan", "a", "b", "c", "d", "e", "jawaban", "bobot", "pembahasan"];
export const CONTOH_BARIS = [
  ["pilihan_ganda", "Apa arti kata كِتَابٌ?", "Pena", "Buku", "Meja", "Pintu", "", "b", "1", "Kitab berarti buku."],
  ["esai", "Jelaskan perbedaan isim dan fi'il!", "", "", "", "", "", "Isim menunjukkan nama, fi'il menunjukkan pekerjaan.", "5", ""],
];
