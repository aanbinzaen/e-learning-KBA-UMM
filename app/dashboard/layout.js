import Link from "next/link";
import { redirect } from "next/navigation";
import { ambilSesi } from "@/lib/auth";
import { keluar } from "@/app/masuk/actions";

export const metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardLayout({ children }) {
  const s = await ambilSesi();
  if (!s) redirect("/masuk");
  const { supabase, profil } = s;
  if (!profil || !profil.aktif) { await supabase.auth.signOut(); redirect("/masuk"); }
  if (profil.wajib_ganti_password) redirect("/ganti-password");
  const nav = [
    ["/dashboard", "Dashboard"],
    ...(profil.role === "peserta" ? [["/dashboard/kelas", "Kelas"], ["/dashboard/absensi", "Absensi"], ["/dashboard/rapor", "Rapor"]] : [["/guru", "Kelola Kelas"], ["/dashboard/kelas", "Lihat Kelas"]]),
    ["/dashboard/profil", "Profil Saya"],
    ...(profil.role === "admin" ? [["/admin", "Admin"]] : []),
  ];
  return (
    <div className="bagian !py-5 md:!py-8">
      <div className="no-print -mx-5 mb-4 flex items-center gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <nav className="flex gap-2" aria-label="Menu akun">
          {nav.map(([h, l]) => <Link key={h} href={h} className="shrink-0 whitespace-nowrap rounded-full border border-hijau/25 bg-white px-3.5 py-1.5 text-[13px] font-medium text-hijau hover:bg-hijau-muda">{l}</Link>)}
        </nav>
        <form action={keluar} className="shrink-0"><button className="whitespace-nowrap rounded-full border border-hijau/30 px-3.5 py-1.5 text-[13px] font-medium text-hijau hover:bg-hijau-muda">Keluar</button></form>
      </div>
      {children}
    </div>
  );
}
