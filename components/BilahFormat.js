"use client";
import { jalankanFormat } from "@/lib/formatTeks";

// Tombol format di atas kolom teks (alternatif untuk Ctrl+B / Ctrl+I / Ctrl+Spasi)
export default function BilahFormat({ taRef, nilai, setNilai }) {
  const tombol = "inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-xl border-2 border-hijau/25 bg-white px-3 text-base text-hijau hover:bg-hijau-muda";
  const jalan = (jenis) => jalankanFormat(taRef.current, nilai, setNilai, jenis);
  const tahan = (e) => e.preventDefault(); // agar blok tulisan tidak hilang saat tombol ditekan
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2" role="toolbar" aria-label="Format tulisan">
      <button type="button" onMouseDown={tahan} onClick={() => jalan("tebal")} className={`${tombol} font-bold`} title="Tebal (Ctrl+B)" aria-label="Tebal">B</button>
      <button type="button" onMouseDown={tahan} onClick={() => jalan("miring")} className={`${tombol} italic`} title="Miring (Ctrl+I)" aria-label="Miring">I</button>
      <button type="button" onMouseDown={tahan} onClick={() => jalan("reguler")} className={`${tombol} text-sm`} title="Hapus gaya / reguler (Ctrl+Spasi)" aria-label="Reguler">Reguler</button>
      <span className="text-xs text-tinta/60">Blok tulisan lalu tekan <b>Ctrl+B</b>, <b>Ctrl+I</b>, atau tombol di samping.</span>
    </div>
  );
}
