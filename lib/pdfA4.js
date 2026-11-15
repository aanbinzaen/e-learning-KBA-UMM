// Penulis PDF minimal: tiap kanvas menjadi satu halaman A4 (JPEG tertanam). Berjalan di peramban.
const A4 = [595.28, 841.89];

const aBytes = (s) => { const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255; return u; };

export async function kanvasKePdf(daftarKanvas, { kualitas = 0.9, judul = "Rapor KBA-UMM" } = {}) {
  const bagian = []; let panjang = 0; const offset = [];
  const tulis = (x) => { const u = typeof x === "string" ? aBytes(x) : x; bagian.push(u); panjang += u.length; };
  const objek = (no, isi) => { offset[no] = panjang; tulis(`${no} 0 obj\n`); isi.forEach(tulis); tulis("\nendobj\n"); };
  const n = daftarKanvas.length;
  // nomor objek: 1 katalog, 2 daftar halaman, 3 info, lalu per halaman: halaman, isi, gambar
  tulis("%PDF-1.4\n%âãÏÓ\n");
  objek(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  objek(2, [`<< /Type /Pages /Count ${n} /Kids [${daftarKanvas.map((_, i) => `${4 + i * 3} 0 R`).join(" ")}] >>`]);
  objek(3, [`<< /Title (${judul.replace(/[^\x20-\x7e]/g, "").replace(/[()\\]/g, "")}) /Producer (KBA-UMM) >>`]);
  for (let i = 0; i < n; i++) {
    const k = daftarKanvas[i];
    const blob = await new Promise((ok) => k.toBlob(ok, "image/jpeg", kualitas));
    const jpg = new Uint8Array(await blob.arrayBuffer());
    const p = 4 + i * 3;
    objek(p, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4[0]} ${A4[1]}] /Resources << /XObject << /Im0 ${p + 2} 0 R >> >> /Contents ${p + 1} 0 R >>`]);
    const isi = `q ${A4[0]} 0 0 ${A4[1]} 0 0 cm /Im0 Do Q`;
    objek(p + 1, [`<< /Length ${isi.length} >>\nstream\n`, isi, "\nendstream"]);
    objek(p + 2, [`<< /Type /XObject /Subtype /Image /Width ${k.width} /Height ${k.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`, jpg, "\nendstream"]);
  }
  const total = 4 + n * 3, mulai = panjang;
  tulis(`xref\n0 ${total}\n0000000000 65535 f \n`);
  for (let i = 1; i < total; i++) tulis(`${String(offset[i]).padStart(10, "0")} 00000 n \n`);
  tulis(`trailer\n<< /Size ${total} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${mulai}\n%%EOF\n`);
  return new Blob(bagian, { type: "application/pdf" });
}
