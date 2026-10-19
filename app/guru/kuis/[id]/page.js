import Link from "next/link";
import { notFound } from "next/navigation";
import { wajibGuru } from "@/lib/guru";
import FormAksi from "@/components/FormAksi";
import TombolHapus from "@/components/TombolHapus";
import BidangSoal from "@/components/BidangSoal";
import ImporSoal from "./ImporSoal";
import { ubahKuis, hapusKuis, tambahSoal, ubahSoal, hapusSoal } from "@/app/guru/actions";

export const metadata = { title: "Kelola kuis" };
const HURUF = "ABCDE";

export default async function KelolaKuis({ params }) {
  const { supabase } = await wajibGuru();
  const { data: k } = await supabase.from("kuis").select("id,judul,diterbitkan,boleh_ulang,pertemuan_id,grup_id").eq("id", params.id).maybeSingle();
  if (!k) notFound();
  const [{ data: soal }, { data: anggota }, { data: perc }] = await Promise.all([
    supabase.from("soal").select("id,tipe,pertanyaan,opsi,jawaban_benar,bobot,pembahasan,kunci_esai").eq("kuis_id", k.id).order("urutan").order("dibuat_pada"),
    supabase.rpc("anggota_grup_daftar", { gid: k.grup_id }),
    supabase.from("percobaan").select("profile_id,nilai,status").eq("kuis_id", k.id),
  ]);
  const adaEsai = (soal || []).some((s) => s.tipe === "esai");
  const menunggu = (perc || []).filter((p) => p.status === "menunggu").length;
  const stat = {};
  (perc || []).forEach((p) => {
    const x = stat[p.profile_id] || { terbaik: null, n: 0, menunggu: false };
    x.n++; if (p.nilai !== null) x.terbaik = Math.max(x.terbaik ?? -1, p.nilai); if (p.status === "menunggu") x.menunggu = true;
    stat[p.profile_id] = x;
  });

  return (
    <div className="space-y-5">
      <Link href={`/guru/pertemuan/${k.pertemuan_id}`} className="text-sm font-medium text-hijau underline">← Kembali ke pertemuan</Link>
      <h1 className="text-2xl font-bold text-hijau-tua">{k.judul}</h1>

      <section className="kartu space-y-3">
        <h2 className="text-lg font-semibold text-hijau">Pengaturan kuis</h2>
        <FormAksi aksi={ubahKuis.bind(null, k.id)} kirim="Simpan pengaturan">
          <div><label className="label" htmlFor="judul">Judul</label><input id="judul" name="judul" defaultValue={k.judul} className="input" required /></div>
          <label className="flex items-center gap-3 font-medium"><input type="checkbox" name="diterbitkan" defaultChecked={k.diterbitkan} className="h-6 w-6 accent-[#1E7B34]" /> Terbitkan (terlihat oleh peserta)</label>
          <label className="flex items-center gap-3 font-medium"><input type="checkbox" name="boleh_ulang" defaultChecked={k.boleh_ulang} className="h-6 w-6 accent-[#1E7B34]" /> Peserta boleh mengulang (nilai terbaik dipakai)</label>
          {adaEsai && <p className="rounded-2xl bg-yellow-50 p-3 text-sm text-yellow-900">Kuis yang memuat soal esai otomatis hanya boleh dikerjakan satu kali.</p>}
        </FormAksi>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-hijau">Soal ({soal?.length || 0})</h2>
        {(soal || []).map((s, n) => (
          <article key={s.id} className="kartu space-y-2">
            <p className="font-semibold" dir="auto">{n + 1}. {s.pertanyaan}</p>
            <p className="text-xs text-tinta/60">{s.tipe === "esai" ? "Esai" : "Pilihan ganda"} · bobot {s.bobot}</p>
            {s.tipe === "pilihan_ganda" && (
              <ul className="space-y-1 text-sm">
                {s.opsi.map((o, i) => <li key={i} dir="auto" className={i === s.jawaban_benar ? "font-semibold text-hijau" : ""}>{HURUF[i]}. {o} {i === s.jawaban_benar && "✓"}</li>)}
              </ul>
            )}
            {s.tipe === "esai" && s.kunci_esai && <p className="rounded-2xl bg-hijau-muda p-3 text-sm" dir="auto">Kunci: {s.kunci_esai}</p>}
            {s.pembahasan && <p className="rounded-2xl bg-hijau-muda p-3 text-sm" dir="auto">Pembahasan: {s.pembahasan}</p>}
            <details className="rounded-2xl border-2 border-hijau/15 p-3"><summary className="cursor-pointer text-sm font-medium text-hijau">Ubah soal</summary>
              <FormAksi aksi={ubahSoal.bind(null, s.id, k.id)} kirim="Simpan soal" className="mt-3 space-y-3"><BidangSoal s={s} /></FormAksi>
            </details>
            <TombolHapus aksi={hapusSoal.bind(null, s.id, k.id)} pesan="Hapus soal ini?" />
          </article>
        ))}
        <details className="kartu" open={!soal?.length}><summary className="cursor-pointer font-semibold text-hijau">+ Tulis soal langsung</summary>
          <FormAksi aksi={tambahSoal.bind(null, k.id)} kirim="Tambah soal" reset className="mt-3 space-y-3"><BidangSoal /></FormAksi>
        </details>
        <details className="kartu"><summary className="cursor-pointer font-semibold text-hijau">+ Impor soal dari berkas atau teks</summary>
          <div className="mt-3"><ImporSoal kuisId={k.id} /></div>
        </details>
      </section>

      <section className="kartu !p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-hijau-muda px-4 py-3">
          <h2 className="font-semibold text-hijau-tua">Hasil peserta</h2>
          {adaEsai && <Link href={`/guru/kuis/${k.id}/nilai`} className="btn-kuning !min-h-[44px] !px-4 text-sm">Nilai esai{menunggu ? ` (${menunggu} menunggu)` : ""}</Link>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-left text-sm">
            <thead><tr className="text-tinta/60"><th className="p-3">Nama</th><th className="p-3 text-center">Percobaan</th><th className="p-3 text-right">Nilai terbaik</th></tr></thead>
            <tbody>{(anggota || []).map((a) => {
              const x = stat[a.profile_id];
              return <tr key={a.profile_id} className="border-t border-hijau/10"><td className="p-3">{a.nama_lengkap}</td><td className="p-3 text-center">{x?.n || 0}</td>
                <td className="p-3 text-right font-semibold">{x ? (x.terbaik ?? (x.menunggu ? "menunggu penilaian" : "–")) : "–"}</td></tr>;
            })}</tbody>
          </table>
        </div>
      </section>

      <TombolHapus aksi={hapusKuis.bind(null, k.id, k.pertemuan_id)} label="Hapus kuis ini" pesan="Hapus kuis beserta soal dan nilai peserta?" />
    </div>
  );
}
