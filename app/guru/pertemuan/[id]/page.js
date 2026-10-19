import Link from "next/link";
import { notFound } from "next/navigation";
import { wajibGuru } from "@/lib/guru";
import { keInputWIB } from "@/lib/waktu";
import FormAksi from "@/components/FormAksi";
import TombolHapus from "@/components/TombolHapus";
import YouTubePlayer from "@/components/YouTubePlayer";
import FormPdf from "./FormPdf";
import { ubahPertemuan, hapusPertemuan, tambahCatatan, tambahRekaman, hapusMateri, hapusRekaman } from "@/app/guru/actions";

export default async function DetailPertemuan({ params }) {
  const { supabase } = await wajibGuru();
  const { data: p } = await supabase.from("pertemuan").select("id,grup_id,judul,waktu,keterangan,grup(nama)").eq("id", params.id).maybeSingle();
  if (!p) notFound();
  const [{ data: materi }, { data: rekaman }] = await Promise.all([
    supabase.from("materi").select("id,jenis,judul").eq("pertemuan_id", p.id).order("dibuat_pada"),
    supabase.from("rekaman").select("id,judul,youtube_id").eq("pertemuan_id", p.id).order("dibuat_pada"),
  ]);
  const Kotak = ({ judul, children }) => <section className="kartu space-y-3"><h2 className="text-lg font-semibold text-hijau">{judul}</h2>{children}</section>;

  return (
    <div className="space-y-5">
      <Link href={`/guru?grup=${p.grup_id}`} className="text-sm font-medium text-hijau underline">← Kembali ke daftar pertemuan</Link>
      <h1 className="text-2xl font-bold text-hijau-tua">{p.judul} <span className="block text-base font-normal text-tinta/60">{p.grup?.nama}</span></h1>

      <Kotak judul="Data pertemuan">
        <FormAksi aksi={ubahPertemuan.bind(null, p.id)} kirim="Simpan pertemuan">
          <div><label className="label" htmlFor="judul">Judul</label><input id="judul" name="judul" defaultValue={p.judul} className="input" required /></div>
          <div><label className="label" htmlFor="waktu">Tanggal dan jam (WIB)</label><input id="waktu" name="waktu" type="datetime-local" defaultValue={keInputWIB(p.waktu)} className="input" required /></div>
          <div><label className="label" htmlFor="ket">Keterangan</label><textarea id="ket" name="keterangan" rows="2" defaultValue={p.keterangan || ""} className="input !py-3" /></div>
        </FormAksi>
      </Kotak>

      <Kotak judul={`Materi (${materi?.length || 0})`}>
        {(materi || []).map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-2 rounded-2xl bg-hijau-muda px-4 py-2">
            <span className="min-w-0 truncate"><span className="mr-2 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-hijau">{m.jenis === "pdf" ? "PDF" : "Catatan"}</span>{m.judul}</span>
            <TombolHapus aksi={hapusMateri.bind(null, m.id, p.id)} pesan="Hapus materi ini?" />
          </div>
        ))}
        <details className="rounded-2xl border-2 border-hijau/15 p-4"><summary className="cursor-pointer font-medium text-hijau">+ Unggah PDF</summary>
          <div className="mt-3"><FormPdf pertemuanId={p.id} grupId={p.grup_id} /></div></details>
        <details className="rounded-2xl border-2 border-hijau/15 p-4"><summary className="cursor-pointer font-medium text-hijau">+ Tulis catatan</summary>
          <FormAksi aksi={tambahCatatan.bind(null, p.id, p.grup_id)} kirim="Simpan catatan" reset className="mt-3 space-y-4">
            <div><label className="label" htmlFor="jc">Judul</label><input id="jc" name="judul" className="input" required /></div>
            <div><label className="label" htmlFor="isi">Isi catatan</label><textarea id="isi" name="catatan" rows="6" className="input !py-3" required /></div>
          </FormAksi></details>
      </Kotak>

      <Kotak judul={`Rekaman YouTube (${rekaman?.length || 0})`}>
        {(rekaman || []).map((r) => (
          <div key={r.id} className="space-y-2">
            <YouTubePlayer id={r.youtube_id} judul={r.judul} />
            <div className="flex items-center justify-between gap-2"><p className="font-medium">{r.judul}</p><TombolHapus aksi={hapusRekaman.bind(null, r.id, p.id)} pesan="Hapus rekaman ini?" /></div>
          </div>
        ))}
        <FormAksi aksi={tambahRekaman.bind(null, p.id, p.grup_id)} kirim="Tambah rekaman" reset className="space-y-4 rounded-2xl border-2 border-hijau/15 p-4">
          <div><label className="label" htmlFor="jr">Judul rekaman</label><input id="jr" name="judul" className="input" required /></div>
          <div><label className="label" htmlFor="lk">Tautan YouTube</label><input id="lk" name="link" className="input" placeholder="https://youtu.be/…" required /></div>
        </FormAksi>
      </Kotak>

      <TombolHapus aksi={hapusPertemuan.bind(null, p.id)} label="Hapus pertemuan ini" pesan="Hapus pertemuan beserta seluruh materi dan rekamannya?" />
    </div>
  );
}
