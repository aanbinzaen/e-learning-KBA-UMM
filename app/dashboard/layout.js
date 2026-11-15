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
    <div className="bagian">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-2" aria-label="Menu akun">
          {nav.map(([h, l]) => <Link key={h} href={h} className="rounded-2xl border-2 border-hijau/20 bg-white px-4 py-2.5 text-sm font-medium text-hijau hover:bg-hijau-muda">{l}</Link>)}
        </nav>
        <form action={keluar}><button className="rounded-xl border-2 border-hijau/30 px-4 py-2.5 text-sm font-medium text-hijau hover:bg-hijau-muda">Keluar</button></form>
      </div>
      {children}
    </div>
  );
}
