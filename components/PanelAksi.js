"use client";
import Link from "next/link";
import { useState } from "react";
import Ikon from "@/components/Ikon";

// Menu ikon ringkas. Ubin biasa membuka panel isiannya di bawah; ubin bertautan (href) langsung pindah halaman.
export default function PanelAksi({ item, kolom = 4 }) {
  const [buka, setBuka] = useState(null);
  const aktif = item.find((x) => x.id === buka);
  const grid = kolom === 3 ? "grid-cols-3" : "grid-cols-4";
  const dasar = "relative flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-2.5 text-center transition active:scale-95";
  return (
    <div className="space-y-3">
      <div className={`grid ${grid} gap-2`}>
        {item.map((x) => {
          const sedangBuka = buka === x.id;
          const isi = (
            <>
              <span className={`flex h-11 w-11 items-center justify-center rounded-full ${sedangBuka ? "bg-white/20 text-white" : x.sorot ? "bg-kuning text-hijau-tua" : "bg-hijau-muda text-hijau"}`}><Ikon nama={x.ikon} /></span>
              <span className={`text-[12px] font-semibold leading-tight ${sedangBuka ? "text-white" : "text-hijau-tua"}`}>{x.label}</span>
              {x.lencana ? <span className={`absolute right-1.5 top-1.5 min-w-[20px] rounded-full px-1.5 text-[11px] font-bold leading-5 ${x.sorot ? "bg-kuning text-hijau-tua" : "bg-hijau text-white"}`}>{x.lencana}</span> : null}
            </>
          );
          const warna = sedangBuka ? "border-hijau bg-hijau" : x.sorot ? "border-kuning bg-kuning/20" : "border-hijau/15 bg-white";
          return x.href ? (
            <Link key={x.id} href={x.href} className={`${dasar} ${warna}`}>{isi}</Link>
          ) : (
            <button key={x.id} type="button" aria-expanded={sedangBuka} onClick={() => setBuka(sedangBuka ? null : x.id)} className={`${dasar} ${warna}`}>{isi}</button>
          );
        })}
      </div>
      {aktif && (
        <section className="kartu space-y-3 !border-2 !border-hijau/30 !p-4" aria-label={aktif.judul || aktif.label}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-hijau"><Ikon nama={aktif.ikon} ukuran={20} /> {aktif.judul || aktif.label}</h2>
            <button type="button" onClick={() => setBuka(null)} aria-label="Tutup panel" className="flex h-8 w-8 items-center justify-center rounded-full border border-hijau/30 text-hijau">✕</button>
          </div>
          {aktif.isi}
        </section>
      )}
    </div>
  );
}
