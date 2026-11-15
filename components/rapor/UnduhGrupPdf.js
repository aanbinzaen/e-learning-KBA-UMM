"use client";
import { useState } from "react";

// Satu berkas PDF A4 berisi rapor semua peserta dalam satu grup (tiap peserta mulai di halaman baru).
export default function UnduhGrupPdf({ grupId, tambah = "", namaGrup = "grup" }) {
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  async function buat() {
    setSibuk(true); setGalat("");
    try {
      const res = await fetch(`/api/rapor?grup=${grupId}&format=json${tambah}`, { cache: "no-store" });
      if (!res.ok) throw new Error("data");
      const { daftar, nama } = await res.json();
      const [{ gambarRaporBanyak }, { kanvasKePdf }] = await Promise.all([import("@/lib/gambarRapor"), import("@/lib/pdfA4")]);
      const blob = await kanvasKePdf(await gambarRaporBanyak(daftar), { judul: nama || namaGrup });
      const url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = `${nama || "rapor-grup"}.pdf`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch { setGalat("PDF gagal dibuat. Coba lagi, atau gunakan komputer."); }
    setSibuk(false);
  }
  return (
    <>
      <button type="button" onClick={buat} disabled={sibuk} className="btn-kuning !min-h-[44px] !px-4 text-sm disabled:opacity-60">{sibuk ? "Membuat PDF…" : "PDF A4: semua rapor"}</button>
      {galat && <span role="alert" className="text-sm text-red-700">{galat}</span>}
    </>
  );
}
