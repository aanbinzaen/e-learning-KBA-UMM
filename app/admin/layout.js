import Link from "next/link";
import { wajibAdmin } from "@/lib/auth";

export const metadata = { title: "Admin", robots: { index: false } };
const NAV = [
  ["/admin", "Ringkasan"], ["/admin/peserta", "Peserta"], ["/admin/impor", "Impor"],
  ["/admin/grup", "Kelas & Grup"], ["/admin/kredensial", "Kode & Password"], ["/admin/rekap", "Rekap Absensi"], ["/admin/profil", "Profil Publik"], ["/admin/beranda", "Tampilan Beranda"], ["/admin/faidah", "Faidah"], ["/admin/konten", "Konten"],
];

export default async function AdminLayout({ children }) {
  await wajibAdmin();
  return (
    <div className="bagian !max-w-6xl">
      <nav className="no-print -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 pb-2" aria-label="Menu admin">
        {NAV.map(([h, l]) => (
          <Link key={h} href={h} className="shrink-0 rounded-2xl border-2 border-hijau/20 bg-white px-4 py-2.5 text-sm font-medium text-hijau hover:bg-hijau-muda">{l}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
