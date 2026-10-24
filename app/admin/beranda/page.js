import { wajibAdmin } from "@/lib/auth";
import { gabungHero } from "@/lib/hero";
import TombolHapus from "@/components/TombolHapus";
import FormHero from "./FormHero";
import { aturUlangHero } from "./actions";

export const metadata = { title: "Tampilan Beranda" };

export default async function TampilanBeranda() {
  const { supabase } = await wajibAdmin();
  const { data } = await supabase.from("konten_halaman").select("isi").eq("kunci", "hero_beranda").maybeSingle();
  return (
    <div className="max-w-3xl space-y-6">
      <div><h1 className="text-2xl font-bold text-hijau-tua">Tampilan Beranda</h1>
        <p className="mt-1 text-sm text-tinta/70">Atur tulisan dan latar belakang bagian paling atas Beranda. Pratinjau di bawah berubah langsung saat Anda mengetik.</p></div>
      <div className="kartu"><FormHero awal={gabungHero(data?.isi)} /></div>
      <TombolHapus aksi={aturUlangHero} label="Kembalikan ke tampilan awal" pesan="Kembalikan tampilan Beranda ke pengaturan awal?" />
    </div>
  );
}
