import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { keluar } from "@/app/masuk/actions";

export const metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardLayout({ children }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");
  const { data: profil } = await supabase.from("profiles").select("nama_lengkap,kode,role,aktif,wajib_ganti_password").eq("id", user.id).maybeSingle();
  if (!profil || !profil.aktif) { await supabase.auth.signOut(); redirect("/masuk"); }
  if (profil.wajib_ganti_password) redirect("/ganti-password");
  return (
    <div className="bagian">
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-tinta/70">Kode: <span className="font-semibold text-tinta">{profil.kode}</span></p>
        <form action={keluar}><button className="rounded-xl border-2 border-hijau/30 px-4 py-2 text-sm font-medium text-hijau hover:bg-hijau-muda">Keluar</button></form>
      </div>
      {children}
    </div>
  );
}
