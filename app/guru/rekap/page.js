import { wajibGuru } from "@/lib/guru";
import { rentangWIB, rekapGrup } from "@/lib/rekap";
import PilihGrup from "@/components/PilihGrup";
import TabelRekap from "@/components/TabelRekap";

export const metadata = { title: "Peserta dan rekap" };

export default async function RekapGuru({ searchParams }) {
  const { supabase, grup } = await wajibGuru();
  const aktif = grup.find((g) => g.id === searchParams.grup) || grup[0];
  if (!aktif) return <p className="kartu">Anda belum mengampu grup.</p>;
  const { dari = "", sampai = "" } = searchParams;
  const hasil = await rekapGrup(supabase, { ...aktif, kelas: aktif.kelas }, rentangWIB(dari, sampai));
  const q = new URLSearchParams({ grup: aktif.id, ...(dari && { dari }), ...(sampai && { sampai }) }).toString();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-hijau-tua">Peserta dan rekap kehadiran</h1>
      <PilihGrup grup={grup} aktifId={aktif.id} dasar="/guru/rekap" />
      <form method="get" className="kartu grid gap-3 sm:grid-cols-3">
        <input type="hidden" name="grup" value={aktif.id} />
        <div><label className="label" htmlFor="dari">Dari tanggal</label><input id="dari" type="date" name="dari" defaultValue={dari} className="input" /></div>
        <div><label className="label" htmlFor="sampai">Sampai tanggal</label><input id="sampai" type="date" name="sampai" defaultValue={sampai} className="input" /></div>
        <button className="btn-hijau self-end">Terapkan</button>
      </form>
      <div className="flex flex-wrap gap-3">
        <a href={`/guru/rekap/csv?${q}`} className="btn-kuning">Unduh ringkasan (CSV)</a>
        <a href={`/guru/rekap/csv?${q}&rinci=1`} className="btn-garis !border-hijau !text-hijau">Unduh rinci per pertemuan</a>
      </div>
      <TabelRekap judul={`${aktif.kelas?.jenis_kelamin} · ${aktif.kelas?.tingkat} · ${aktif.nama}`} rekap={hasil} />
      <p className="text-xs text-tinta/60">Kehadiran = Hadir ÷ pertemuan yang sudah berlangsung. Nilai kuis ditambahkan di tahap berikutnya.</p>
    </div>
  );
}
