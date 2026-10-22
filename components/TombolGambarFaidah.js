"use client";
import { useEffect, useState } from "react";
import { buatGambarFaidah, FORMAT } from "@/lib/gambarFaidah";

const slug = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "faidah";

export default function TombolGambarFaidah({ f, gelap = false }) {
  const [fmt, setFmt] = useState("potret");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  const [bisaBagi, setBisaBagi] = useState(false);

  useEffect(() => {
    try { setBisaBagi(!!(navigator.canShare && navigator.canShare({ files: [new File([""], "a.png", { type: "image/png" })] }))); } catch { /* tidak didukung */ }
  }, []);

  async function buatBlob() {
    const kanvas = await buatGambarFaidah(f, fmt, { situs: process.env.NEXT_PUBLIC_SITE_URL });
    return new Promise((ok) => kanvas.toBlob(ok, "image/png"));
  }
  const namaBerkas = () => `faidah-${slug(f.judul)}-${fmt}.png`;

  async function unduh() {
    setSibuk(true); setGalat("");
    try {
      const blob = await buatBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = namaBerkas(); document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch { setGalat("Gambar gagal dibuat. Coba lagi."); }
    setSibuk(false);
  }

  async function bagikan() {
    setSibuk(true); setGalat("");
    try {
      const blob = await buatBlob();
      await navigator.share({ files: [new File([blob], namaBerkas(), { type: "image/png" })], title: f.judul });
    } catch (e) { if (e?.name !== "AbortError") setGalat("Gambar gagal dibagikan. Gunakan tombol Unduh gambar."); }
    setSibuk(false);
  }

  const tombol = `btn !min-h-[44px] !px-5 text-sm border-2 disabled:opacity-60 ${gelap ? "border-white/60 text-white hover:bg-white/10" : "border-hijau text-hijau hover:bg-hijau-muda"}`;
  return (
    <div className={`mt-5 rounded-2xl p-4 ${gelap ? "bg-black/20" : "bg-hijau-muda"}`}>
      <p className={`mb-3 text-sm font-semibold ${gelap ? "text-kuning" : "text-hijau-tua"}`}>Simpan sebagai gambar untuk dibagikan</p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor={`fmt-${f.id}`}>Ukuran gambar</label>
        <select id={`fmt-${f.id}`} value={fmt} onChange={(e) => setFmt(e.target.value)} className={`min-h-[44px] rounded-2xl border-2 px-3 text-sm ${gelap ? "border-white/40 bg-white/10 text-white" : "border-hijau/30 bg-white text-tinta"}`}>
          {Object.entries(FORMAT).map(([k, v]) => <option key={k} value={k} className="text-tinta">{v.label}</option>)}
        </select>
        <button type="button" onClick={unduh} disabled={sibuk} className={tombol}>{sibuk ? "Membuat gambar…" : "Unduh gambar"}</button>
        {bisaBagi && <button type="button" onClick={bagikan} disabled={sibuk} className={tombol}>Bagikan gambar</button>}
      </div>
      {galat && <p role="alert" className="mt-3 text-sm text-red-300">{galat}</p>}
    </div>
  );
}
