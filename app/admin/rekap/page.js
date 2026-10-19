import { wajibAdmin } from "@/lib/auth";
import { rekapGrup, rentangWIB } from "@/lib/rekap";
import TabelRekap from "@/components/TabelRekap";

export const metadata = { title: "Rekap absensi" };

export default async function RekapAdmin({ searchParams }) {
  const { supabase } = await wajibAdmin();
  const { jk = "", tingkat = "", grup = "", dari = "", sampai = "" } = searchParams;
  const [{ data: semua }, { data: set }] = await Promise.all([
    supabase.from("grup").select("id,nama,kelas!inner(jenis_kelamin,tingkat)").order("nama"),
    supabase.from("pengaturan").select("nilai").eq("kunci", "pisah_ikhwan_akhwat").maybeSingle(),
  ]);
  const pisah = set?.nilai !== "false";
  const terpilih = (semua || []).filter((g) => (!jk || g.kelas.jenis_kelamin === jk) && (!tingkat || g.kelas.tingkat === tingkat) && (!grup || g.id === grup));
  const hasil = await Promise.all(terpilih.map((g) => rekapGrup(supabase, g, rentangWIB(dari, sampai))));
  const q = new URLSearchParams(Object.entries({ jk, tingkat, grup, dari, sampai }).filter(([, v]) => v)).toString();
  const bagian = pisah && !jk
    ? [["Ikhwan", hasil.filter((h) => h.grup.kelas.jenis_kelamin === "Ikhwan")], ["Akhwat", hasil.filter((h) => h.grup.kelas.jenis_kelamin === "Akhwat")]]
    : [[jk || "Semua kelas", hasil]];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-hijau-tua">Rekap absensi</h1>
      <form method="get" className="kartu grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <select name="jk" defaultValue={jk} className="input" aria-label="Jenis kelamin"><option value="">Ikhwan &amp; Akhwat</option><option>Ikhwan</option><option>Akhwat</option></select>
        <select name="tingkat" defaultValue={tingkat} className="input" aria-label="Kelas"><option value="">Semua kelas</option><option>Pemula</option><option>Lanjutan</option><option>Kelas Khusus</option></select>
        <select name="grup" defaultValue={grup} className="input" aria-label="Grup"><option value="">Semua grup</option>{(semua || []).map((g) => <option key={g.id} value={g.id}>{g.kelas.jenis_kelamin} – {g.nama}</option>)}</select>
        <div><label className="label" htmlFor="dari">Dari tanggal</label><input id="dari" type="date" name="dari" defaultValue={dari} className="input" /></div>
        <div><label className="label" htmlFor="sampai">Sampai tanggal</label><input id="sampai" type="date" name="sampai" defaultValue={sampai} className="input" /></div>
        <button className="btn-hijau self-end">Terapkan filter</button>
      </form>
      <div className="flex flex-wrap gap-3">
        <a href={`/admin/rekap/csv?${q}`} className="btn-kuning">Unduh ringkasan (CSV)</a>
        <a href={`/admin/rekap/csv?${q}${q ? "&" : ""}rinci=1`} className="btn-garis !border-hijau !text-hijau">Unduh rinci per pertemuan</a>
      </div>
      <p className="text-sm text-tinta/70">Berkas CSV dapat dibuka langsung di Excel.</p>
      {bagian.map(([judul, daftar]) => (
        <section key={judul} className="space-y-3">
          <h2 className="text-lg font-semibold text-hijau">{judul}</h2>
          {daftar.map((h) => <TabelRekap key={h.grup.id} judul={`${h.grup.kelas.tingkat} · ${h.grup.nama}`} rekap={h} />)}
          {!daftar.length && <p className="kartu text-tinta/70">Tidak ada grup yang cocok dengan filter.</p>}
        </section>
      ))}
    </div>
  );
}
