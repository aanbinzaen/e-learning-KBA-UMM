import { wajibGuru } from "@/lib/guru";
import { ambilBobot, bacaRentang, grupLaporan, muatLaporan } from "@/lib/raporData";
import LaporanView from "@/components/rapor/LaporanView";
import UnduhRapor from "@/components/rapor/UnduhRapor";
import FilterPeriode from "@/components/rapor/FilterPeriode";
import FormAksi from "@/components/FormAksi";
import { simpanBobot } from "../rapor/actions";

export const metadata = { title: "Laporan" };
export const dynamic = "force-dynamic";

export default async function Laporan({ searchParams }) {
  const { supabase, profil } = await wajibGuru();
  const rentang = bacaRentang(searchParams), bobot = await ambilBobot(supabase);
  const semuaGrup = await grupLaporan(supabase, profil);
  const dipilih = [].concat(searchParams.g || []).filter((x) => semuaGrup.some((g) => g.id === x));
  const pakai = dipilih.length ? semuaGrup.filter((g) => dipilih.includes(g.id)) : semuaGrup;
  let lap = null, galat = false;
  if (pakai.length) { try { lap = await muatLaporan(supabase, pakai, rentang, bobot); lap.bobot = bobot; } catch { galat = true; } }
  const qs = new URLSearchParams([...(rentang.labelDari ? [["dari", rentang.labelDari]] : []), ...(rentang.labelSampai ? [["sampai", rentang.labelSampai]] : []), ...dipilih.map((g) => ["g", g])]).toString();

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-hijau-tua">Laporan</h1><p className="mt-1 text-sm text-tinta/70">Ringkasan capaian untuk disampaikan kepada pembina. Unduh sebagai gambar, Word, atau Excel.</p></div>
      <FilterPeriode rentang={rentang} aksi="/guru/laporan" anak={semuaGrup.length > 1 ? (
        <fieldset className="w-full"><legend className="label">Grup yang dilaporkan (kosongkan = semua)</legend>
          <div className="flex flex-wrap gap-2">{semuaGrup.map((g) => <label key={g.id} className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-2xl border-2 border-hijau/20 bg-white px-3 text-sm"><input type="checkbox" name="g" value={g.id} defaultChecked={dipilih.includes(g.id)} className="h-5 w-5 accent-[#1E7B34]" />{g.nama}</label>)}</div></fieldset>
      ) : null} />
      {galat && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">Laporan belum dapat dimuat. Pastikan SQL 13 sudah dijalankan, lalu coba lagi.</p>}
      {!pakai.length && <p className="kartu text-tinta/70">Belum ada grup untuk dilaporkan.</p>}
      {lap && (
        <>
          <UnduhRapor jenis="laporan" data={lap} namaBerkas="laporan-kba-umm" hrefDasar={`/api/laporan${qs ? `?${qs}` : ""}`} bisaSembunyikanNama />
          <LaporanView l={lap} />
        </>
      )}
      {profil.role === "admin" && (
        <section className="no-print kartu">
          <h2 className="mb-1 text-lg font-bold text-hijau-tua">Bobot skor akhir</h2>
          <p className="mb-3 text-sm text-tinta/65">Skor akhir rapor = kehadiran, nilai kuis, dan progres belajar menurut bobot ini (jumlah harus 100). Berlaku untuk semua rapor dan laporan.</p>
          <FormAksi aksi={simpanBobot} kirim="Simpan bobot" className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {[["hadir", "Kehadiran (%)"], ["kuis", "Nilai kuis (%)"], ["progres", "Progres belajar (%)"]].map(([k, l]) => <div key={k}><label className="label" htmlFor={`b-${k}`}>{l}</label><input id={`b-${k}`} name={k} type="number" min="0" max="100" step="1" defaultValue={bobot[k]} className="input" required /></div>)}
            </div>
          </FormAksi>
        </section>
      )}
    </div>
  );
}
