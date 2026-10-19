import Link from "next/link";
import { wajibGuru } from "@/lib/guru";
export const metadata = { title: "Kelola Kelas", robots: { index: false } };

export default async function GuruLayout({ children }) {
  await wajibGuru();
  return (
    <div className="bagian !max-w-4xl">
      <nav className="mb-6 flex gap-2" aria-label="Menu pengajar">
        {[["/guru", "Pertemuan"], ["/guru/rekap", "Peserta & Rekap"]].map(([h, l]) => (
          <Link key={h} href={h} className="rounded-2xl border-2 border-hijau/20 bg-white px-4 py-2.5 text-sm font-medium text-hijau hover:bg-hijau-muda">{l}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
