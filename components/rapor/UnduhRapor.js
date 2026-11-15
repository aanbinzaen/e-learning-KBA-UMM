"use client";
import { useState } from "react";

// Tombol unduh: PDF A4 dan gambar PNG/JPG per halaman A4 (digambar di peramban), Word dan Excel (dibuat server).
export default function UnduhRapor({ jenis = "rapor", data, namaBerkas = "rapor", hrefDasar, bisaSembunyikanNama = false }) {
  const [sibuk, setSibuk] = useState("");
  const [galat, setGalat] = useState("");
  const [nama, setNama] = useState(true);
  const [hd, setHd] = useState(false);

  function simpan(blob, nm) {
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = nm; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  const keBlob = (k, format) => new Promise((ok) => k.toBlob(ok, format === "jpg" ? "image/jpeg" : "image/png", 0.92));

  // Halaman A4: satu halaman jadi satu berkas; lebih dari satu halaman dikemas dalam zip.
  async function buatHalaman() {
    const m = await import("@/lib/gambarRapor");
    const op = { piksel: hd ? 2 : 1 };
    return jenis === "rapor" ? m.gambarRapor(data, op) : m.gambarLaporan(data, { tampilNama: nama, ...op });
  }
  async function gambar(format) {
    setSibuk(format); setGalat("");
    try {
      const hal = await buatHalaman();
      if (hal.length === 1) { const blob = await keBlob(hal[0], format); if (!blob) throw new Error("kosong"); simpan(blob, `${namaBerkas}.${format}`); }
      else {
        const JSZip = (await import("jszip")).default, zip = new JSZip();
        for (let i = 0; i < hal.length; i++) { const blob = await keBlob(hal[i], format); if (!blob) throw new Error("kosong"); zip.file(`${namaBerkas}-hal-${i + 1}.${format}`, blob); }
        simpan(await zip.generateAsync({ type: "blob" }), `${namaBerkas}-${format}.zip`);
      }
    } catch { setGalat("Gambar gagal dibuat. Coba matikan opsi HD, atau gunakan komputer."); }
    setSibuk("");
  }
  async function pdf() {
    setSibuk("pdf"); setGalat("");
    try {
      const hal = await buatHalaman(), { kanvasKePdf } = await import("@/lib/pdfA4");
      simpan(await kanvasKePdf(hal, { judul: namaBerkas }), `${namaBerkas}.pdf`);
    } catch { setGalat("PDF gagal dibuat. Coba matikan opsi HD, atau gunakan komputer."); }
    setSibuk("");
  }
  const href = (f) => `${hrefDasar}${hrefDasar.includes("?") ? "&" : "?"}format=${f}${jenis === "laporan" ? `&nama=${nama ? 1 : 0}` : ""}`;
  const tombol = "btn !min-h-[46px] !px-5 text-sm border-2 border-hijau text-hijau hover:bg-hijau-muda";

  return (
    <section className="no-print kartu space-y-3" aria-label="Unduh">
      <h2 className="text-lg font-bold text-hijau-tua">Unduh dan bagikan</h2>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={pdf} disabled={!!sibuk} className="btn-kuning !min-h-[46px] !px-5 text-sm disabled:opacity-60">{sibuk === "pdf" ? "Membuat…" : "PDF (A4)"}</button>
        <button type="button" onClick={() => gambar("png")} disabled={!!sibuk} className="btn-kuning !min-h-[46px] !px-5 text-sm disabled:opacity-60">{sibuk === "png" ? "Membuat…" : "Gambar PNG (A4)"}</button>
        <button type="button" onClick={() => gambar("jpg")} disabled={!!sibuk} className="btn-kuning !min-h-[46px] !px-5 text-sm disabled:opacity-60">{sibuk === "jpg" ? "Membuat…" : "Gambar JPG (A4)"}</button>
        <a href={href("docx")} className={tombol}>Word (.docx)</a>
        <a href={href("xlsx")} className={tombol}>Excel (.xlsx)</a>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={hd} onChange={(e) => setHd(e.target.checked)} className="h-5 w-5 accent-[#1E7B34]" /> Kualitas HD (2×, berkas lebih besar)</label>
        {bisaSembunyikanNama && <label className="flex items-center gap-2"><input type="checkbox" checked={nama} onChange={(e) => setNama(e.target.checked)} className="h-5 w-5 accent-[#1E7B34]" /> Sertakan nama peserta</label>}
      </div>
      {galat && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700">{galat}</p>}
    </section>
  );
}
