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
