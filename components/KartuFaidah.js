import Link from "next/link";
import { tanggalPendek } from "@/lib/data";
import TombolGambarFaidah from "@/components/TombolGambarFaidah";

const situs = process.env.NEXT_PUBLIC_SITE_URL || "";

// Tautan bagikan ke WhatsApp (judul, kutipan Arab, isi ringkas, sumber, alamat situs)
function tautanWA(f) {
  const isi = f.isi.length > 1200 ? `${f.isi.slice(0, 1200)}…` : f.isi;
  const teks = [`*${f.judul}*`, f.teks_arab, isi, f.sumber ? `Sumber: ${f.sumber}` : null, situs ? `${situs}/faidah` : null].filter(Boolean).join("\n\n");
  return `https://wa.me/?text=${encodeURIComponent(teks)}`;
}
const paragraf = (t) => String(t || "").split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);

export default function KartuFaidah({ f, gelap = false, lainnya = false }) {
  const w = gelap
    ? { kartu: "bg-white/[0.07] ring-1 ring-white/15", judul: "text-kuning", isi: "text-white/90", tgl: "text-white/60", sumber: "border-white/20 text-kuning", arab: "text-white" }
    : { kartu: "bg-white shadow-[0_1px_0_rgba(30,123,52,.12),0_8px_24px_-12px_rgba(30,123,52,.25)]", judul: "text-hijau-tua", isi: "text-tinta/90", tgl: "text-tinta/55", sumber: "border-hijau/20 text-hijau", arab: "text-hijau-tua" };
  return (
    <article className={`relative rounded-[2rem] p-6 md:p-9 ${w.kartu}`}>
      <span aria-hidden className="absolute -top-3 left-8 flex h-9 w-9 items-center justify-center rounded-full bg-kuning font-serif text-3xl leading-none text-hijau-tua">“</span>
      <p className={`text-xs ${w.tgl}`}>{tanggalPendek(f.dibuat_pada)}</p>
      <h3 className={`mt-1 text-xl font-bold leading-snug md:text-2xl ${w.judul}`}>{f.judul}</h3>
      {f.teks_arab && (
        <p lang="ar" dir="rtl" className={`arab mt-5 rounded-2xl border-r-4 border-kuning bg-black/5 px-4 py-3 text-2xl leading-[2.1] md:text-3xl ${w.arab} ${gelap ? "!bg-black/20" : "!bg-hijau-muda"}`}>{f.teks_arab}</p>
      )}
      <div lang="id" className={`mt-5 space-y-3 text-justify leading-relaxed [hyphens:auto] ${w.isi}`}>
        {paragraf(f.isi).map((t, i) => <p key={i} className="whitespace-pre-line" dir="auto">{t}</p>)}
      </div>
      {f.sumber && <p className={`mt-6 border-t pt-4 text-sm font-medium ${w.sumber}`}>Sumber: {f.sumber}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={tautanWA(f)} target="_blank" rel="noopener noreferrer" className="btn-kuning !min-h-[44px] !px-5 text-sm">Bagikan lewat WhatsApp</a>
        {lainnya && <Link href="/faidah" className={`btn !min-h-[44px] !px-5 text-sm border-2 ${gelap ? "border-white/60 text-white hover:bg-white/10" : "border-hijau text-hijau hover:bg-hijau-muda"}`}>Faidah lainnya</Link>}
      </div>
      <TombolGambarFaidah f={{ id: f.id, judul: f.judul, teks_arab: f.teks_arab, isi: f.isi, sumber: f.sumber }} gelap={gelap} />
    </article>
  );
}
