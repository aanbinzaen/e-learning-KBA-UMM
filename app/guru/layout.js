import Link from "next/link";
import { wajibGuru } from "@/lib/guru";
export const metadata = { title: "Kelola Kelas", robots: { index: false } };

export default async function GuruLayout({ children }) {
  await wajibGuru();
  return (
    <div className="bagian !max-w-4xl !py-5 md:!py-8">
      <nav className="no-print -mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Menu pengajar">
        {[["/guru", "Beranda"], ["/guru/rekap", "Peserta & Rekap"], ["/guru/rapor", "Rapor"], ["/guru/laporan", "Laporan"], ["/guru/faidah", "Faidah"], ["/guru/diagram", "Diagram"], ["/guru/pengumuman", "Pengumuman"], ["/guru/reels", "Reels"], ["/guru/ruang", "Ruang Pengajar"]].map(([h, l]) => (
          <Link key={h} href={h} className="shrink-0 whitespace-nowrap rounded-full border border-hijau/25 bg-white px-3.5 py-1.5 text-[13px] font-medium text-hijau hover:bg-hijau-muda">{l}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
