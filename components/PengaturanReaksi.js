"use client";
import { useEffect, useState } from "react";
import { bacaPengaturan, simpanPengaturan, reaksi } from "@/lib/reaksi";

export default function PengaturanReaksi() {
  const [aktif, setAktif] = useState(true);
  useEffect(() => { const p = bacaPengaturan(); setAktif(p.suara || p.getar); }, []);
  function ubah() {
    const baru = !aktif;
    simpanPengaturan({ suara: baru, getar: baru });
    setAktif(baru);
    if (baru) reaksi("sukses");
  }
  return (
    <button type="button" data-diam onClick={ubah} aria-pressed={aktif}
      className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-white/30 px-4 text-xs font-medium text-white/85 hover:bg-white/10">
      <span aria-hidden>{aktif ? "🔔" : "🔕"}</span>
      Suara dan getar tombol: {aktif ? "Aktif" : "Mati"}
    </button>
  );
}
