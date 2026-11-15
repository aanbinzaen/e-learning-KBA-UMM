"use client";
import { useState } from "react";

// Tombol unduh: gambar PNG/JPG (digambar di peramban), Word dan Excel (dibuat server), serta cetak/PDF.
export default function UnduhRapor({ jenis = "rapor", data, namaBerkas = "rapor", hrefDasar, bisaSembunyikanNama = false }) {
  const [sibuk, setSibuk] = useState("");
  const [galat, setGalat] = useState("");
  const [nama, setNama] = useState(true);
  const [hd, setHd] = useState(false);

  async function gambar(format) {
    setSibuk(format); setGalat("");
    try {
      const m = await import("@/lib/gambarRapor");
      const kanvas = jenis === "rapor" ? await m.gambarRapor(data, { piksel: hd ? 2 : 1 }) : await m.gambarLaporan(data, { tampilNama: nama, piksel: hd ? 2 : 1 });
      const blob = await new Promise((ok) => kanvas.toBlob(ok, format === "jpg" ? "image/jpeg" : "image/png", 0.92));
      if (!blob) throw new Error("kosong");
      const url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = `${namaBerkas}.${format}`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch { setGalat("Gambar gagal dibuat. Coba matikan opsi HD, atau gunakan komputer."); }
    setSibuk("");
  }
  const href = (f) => `${hrefDasar}${hrefDasar.includes("?") ? "&" : "?"}format=${f}${jenis === "laporan" ? `&nama=${nama ? 1 : 0}` : ""}`;
  const tombol = "btn !min-h-[46px] !px-5 text-sm border-2 border-hijau text-hijau hover:bg-hijau-muda";

  return (
    <section className="no-print kartu space-y-3" aria-label="Unduh">
      <h2 className="text-lg font-bold text-hijau-tua">Unduh dan bagikan</h2>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => gambar("png")} disabled={!!sibuk} className="btn-kuning !min-h-[46px] !px-5 text-sm disabled:opacity-60">{sibuk === "png" ? "Membuat…" : "Gambar PNG"}</button>
        <button type="button" onClick={() => gambar("jpg")} disabled={!!sibuk} className="btn-kuning !min-h-[46px] !px-5 text-sm disabled:opacity-60">{sibuk === "jpg" ? "Membuat…" : "Gambar JPG"}</button>
        <a href={href("docx")} className={tombol}>Word (.docx)</a>
        <a href={href("xlsx")} className={tombol}>Excel (.xlsx)</a>
        <button type="button" onClick={() => window.print()} className={tombol}>Cetak / PDF</button>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={hd} onChange={(e) => setHd(e.target.checked)} className="h-5 w-5 accent-[#1E7B34]" /> Kualitas HD (gambar 2×, lebih besar)</label>
        {bisaSembunyikanNama && <label className="flex items-center gap-2"><input type="checkbox" checked={nama} onChange={(e) => setNama(e.target.checked)} className="h-5 w-5 accent-[#1E7B34]" /> Sertakan nama peserta</label>}
      </div>
      {galat && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700">{galat}</p>}
    </section>
  );
}
