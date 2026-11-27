"use client";
import Link from "next/link";
import { useState } from "react";

// Ubin aksi cepat: ketuk untuk membuka panel isiannya di bawah; ubin bertautan langsung membuka halamannya.
export default function PanelAksi({ item }) {
  const [buka, setBuka] = useState(null);
  const aktif = item.find((x) => x.id === buka);
  const gaya = "relative flex min-h-[104px] flex-col justify-between rounded-kartu border-2 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md";
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {item.map((x) => {
          const isi = (
            <>
              <span className="text-3xl" aria-hidden>{x.ikon}</span>
              <span><span className="block font-bold leading-tight text-hijau-tua">{x.judul}</span>{x.ket && <span className="mt-0.5 block text-xs leading-snug text-tinta/70">{x.ket}</span>}</span>
            </>
          );
          return x.href ? (
            <Link key={x.id} href={x.href} className={`${gaya} border-hijau/15 bg-white`}>{isi}</Link>
          ) : (
            <button key={x.id} type="button" aria-expanded={buka === x.id} onClick={() => setBuka(buka === x.id ? null : x.id)} className={`${gaya} ${buka === x.id ? "border-hijau bg-hijau-muda" : "border-hijau/15 bg-white"}`}>{isi}</button>
          );
        })}
      </div>
      {aktif && (
        <section className="kartu space-y-3 !border-2 !border-hijau/40" aria-label={aktif.judul}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-hijau">{aktif.ikon} {aktif.judul}</h2>
            <button type="button" onClick={() => setBuka(null)} className="rounded-full border-2 border-hijau/30 px-3 py-1 text-sm font-medium text-hijau">Tutup ✕</button>
          </div>
          {aktif.isi}
        </section>
      )}
    </div>
  );
}
