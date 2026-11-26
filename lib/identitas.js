// Mengenali apa yang diketik pengguna: kode peserta, email, atau nomor WhatsApp.
export function normalisasiWA(teks) {
  let d = String(teks).replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  return d;
}
export function kenaliIdentitas(masukan) {
  const t = String(masukan || "").trim();
  if (!t) return null;
  if (t.includes("@")) return { jenis: "email", nilai: t.toLowerCase() };
  if (/^[A-Za-z]+-\d+$/.test(t)) return { jenis: "kode", nilai: t.toUpperCase() };
  const wa = normalisasiWA(t);
  if (/^62\d{8,13}$/.test(wa)) return { jenis: "whatsapp", nilai: wa };
  return null;
}

// Awalan kode per peran di layar masuk
export const AWALAN_PERAN = { peserta: "BISMILLAH-", pengajar: "PGJ-", admin: "ADMIN-" };

// Peserta cukup menulis angka: BISMILLAH-12 → coba BISMILLAH-012 / KBUMM-012 (awalan lama tetap diterima).
export function kandidatKode(kode) {
  const m = String(kode).toUpperCase().match(/^([A-Z]+)-(\d+)$/);
  if (!m) return [String(kode).toUpperCase()];
  const [, p, n] = m, num = String(parseInt(n, 10)), pad = num.padStart(3, "0");
  const awalan = p === "BISMILLAH" || p === "KBUMM" ? ["BISMILLAH", "KBUMM"] : [p];
  const hasil = new Set();
  awalan.forEach((x) => { hasil.add(`${x}-${pad}`); hasil.add(`${x}-${num}`); hasil.add(`${x}-${n}`); });
  return [...hasil];
}
