import Link from "next/link";
import { notFound } from "next/navigation";
import { wajibGuru } from "@/lib/guru";
import { ambilBobot, bacaRentang, muatRaporPeserta } from "@/lib/raporData";
import RaporView from "@/components/rapor/RaporView";
import UnduhRapor from "@/components/rapor/UnduhRapor";
import FilterPeriode from "@/components/rapor/FilterPeriode";
import FormAksi from "@/components/FormAksi";
import { simpanCatatan } from "../actions";

export const metadata = { title: "Rapor peserta" };
export const dynamic = "force-dynamic";

export default async function RaporPesertaGuru({ params, searchParams }) {
  const { supabase } = await wajibGuru();
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const rentang = bacaRentang(searchParams), bobot = await ambilBobot(supabase);
  const r = await muatRaporPeserta(supabase, { profilId: params.id, rentang, bobot });
  if (!r) notFound();
  const qs = new URLSearchParams({ ...(rentang.labelDari && { dari: rentang.labelDari }), ...(rentang.labelSampai && { sampai: rentang.labelSampai }) }).toString();

  return (
    <div className="space-y-5">
      <Link href={`/guru/rapor?grup=${r.grup.id}${qs ? `&${qs}` : ""}`} className="no-print text-sm font-medium text-hijau underline">← Semua peserta {r.grup.nama}</Link>
      <FilterPeriode rentang={rentang} aksi={`/guru/rapor/${params.id}`} />
      <UnduhRapor jenis="rapor" data={r} namaBerkas={`rapor-${r.peserta.kode}`} hrefDasar={`/api/rapor?peserta=${params.id}${qs ? `&${qs}` : ""}`} />
      <RaporView r={r} />
      <section className="no-print kartu">
        <h2 className="mb-1 text-lg font-bold text-hijau-tua">Catatan untuk rapor ini</h2>
        <p className="mb-3 text-sm text-tinta/65">Tampil di rapor peserta (layar, gambar, dan Word). Kosongkan lalu simpan untuk menghapus.</p>
        <FormAksi aksi={simpanCatatan.bind(null, params.id)} kirim="Simpan catatan">
          <label className="sr-only" htmlFor="catatan-rapor">Catatan pengajar</label>
          <textarea id="catatan-rapor" name="catatan" rows="4" maxLength={1500} dir="auto" defaultValue={r.catatan?.isi || ""} className="input !py-3" placeholder="Contoh: Masya Allah, semangat belajarnya baik. Perlu lebih teliti pada harakat akhir kata." />
        </FormAksi>
      </section>
    </div>
  );
}
