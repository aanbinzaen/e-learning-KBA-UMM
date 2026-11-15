import { redirect } from "next/navigation";
import { ambilSesi } from "@/lib/auth";
import { ambilBobot, bacaRentang, muatRaporPeserta } from "@/lib/raporData";
import RaporView from "@/components/rapor/RaporView";
import UnduhRapor from "@/components/rapor/UnduhRapor";
import FilterPeriode from "@/components/rapor/FilterPeriode";

export const metadata = { title: "Rapor Saya" };
export const dynamic = "force-dynamic";

export default async function RaporSaya({ searchParams }) {
  const s = await ambilSesi();
  if (!s) redirect("/masuk");
  if (s.profil.role !== "peserta") redirect("/guru/rapor");
  const rentang = bacaRentang(searchParams), bobot = await ambilBobot(s.supabase);
  let r = null, galat = false;
  try { r = await muatRaporPeserta(s.supabase, { profilId: s.user.id, rentang, bobot, sebagaiPeserta: true }); } catch { galat = true; }
  const qs = new URLSearchParams({ ...(rentang.labelDari && { dari: rentang.labelDari }), ...(rentang.labelSampai && { sampai: rentang.labelSampai }) }).toString();

  return (
    <div className="space-y-5">
      <FilterPeriode rentang={rentang} aksi="/dashboard/rapor" />
      {galat && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">Rapor belum dapat dimuat. Coba lagi nanti.</p>}
      {!galat && !r && <p className="kartu text-tinta/70">Rapor belum tersedia karena Anda belum ditempatkan di grup. Hubungi admin atau pengajar.</p>}
      {r && (
        <>
          <UnduhRapor jenis="rapor" data={r} namaBerkas={`rapor-${r.peserta.kode}`} hrefDasar={`/api/rapor?peserta=${s.user.id}${qs ? `&${qs}` : ""}`} />
          <RaporView r={r} />
        </>
      )}
    </div>
  );
}
