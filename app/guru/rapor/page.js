import Link from "next/link";
import { wajibGuru } from "@/lib/guru";
import { ambilBobot, bacaRentang, grupRingkas, muatRaporGrup } from "@/lib/raporData";
import { ringkasKelompok, PREDIKAT } from "@/lib/rapor";
import { Donut, BatangH, Lencana } from "@/components/rapor/Grafik";
import FilterPeriode from "@/components/rapor/FilterPeriode";

export const metadata = { title: "Rapor peserta" };
export const dynamic = "force-dynamic";
const pct = (v) => (v == null ? "-" : `${v}%`);

export default async function RaporGuru({ searchParams }) {
  const { supabase, grup } = await wajibGuru();
  if (!grup.length) return <p className="kartu text-tinta/70">Belum ada grup yang Anda ampu.</p>;
  const aktif = grup.find((g) => g.id === searchParams.grup) || grup[0];
  const rentang = bacaRentang(searchParams), bobot = await ambilBobot(supabase);
  let daftar = [], galat = false;
  try { daftar = await muatRaporGrup(supabase, grupRingkas(aktif), rentang, bobot); } catch { galat = true; }
  const ring = ringkasKelompok(daftar);
  const qs = new URLSearchParams({ ...(rentang.labelDari && { dari: rentang.labelDari }), ...(rentang.labelSampai && { sampai: rentang.labelSampai }) }).toString();
  const tambah = qs ? `&${qs}` : "";

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-hijau-tua">Rapor peserta</h1><p className="mt-1 text-sm text-tinta/70">Pilih grup, lalu buka rapor tiap peserta untuk melihat, menulis catatan, dan mengunduhnya.</p></div>
      <nav className="no-print flex flex-wrap gap-2" aria-label="Pilih grup">
        {grup.map((g) => <Link key={g.id} href={`/guru/rapor?grup=${g.id}${tambah}`} aria-current={g.id === aktif.id ? "page" : undefined} className={`rounded-2xl px-4 py-2.5 text-sm font-medium ${g.id === aktif.id ? "bg-hijau text-white" : "border-2 border-hijau/20 bg-white text-hijau hover:bg-hijau-muda"}`}>{g.nama}</Link>)}
      </nav>
      <FilterPeriode rentang={rentang} aksi="/guru/rapor" tersembunyi={{ grup: aktif.id }} />
      {galat && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">Rapor belum dapat dimuat. Pastikan SQL 13 sudah dijalankan, lalu coba lagi.</p>}

      {!galat && (
        <>
          <section className="kartu space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-hijau-tua">{aktif.nama} <span className="text-sm font-medium text-tinta/60">· {aktif.kelas?.jenis_kelamin} · {aktif.kelas?.tingkat} · {ring.n} peserta</span></h2>
              <div className="no-print flex flex-wrap gap-2">
                <a href={`/api/rapor?grup=${aktif.id}&format=docx${tambah}`} className="btn !min-h-[44px] !px-4 border-2 border-hijau text-sm text-hijau hover:bg-hijau-muda">Word: semua rapor</a>
                <a href={`/api/rapor?grup=${aktif.id}&format=xlsx${tambah}`} className="btn !min-h-[44px] !px-4 border-2 border-hijau text-sm text-hijau hover:bg-hijau-muda">Excel: rekap grup</a>
              </div>
            </div>
            <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
              <div className="flex justify-center"><Donut bagian={PREDIKAT.map((p) => ({ nilai: ring.distribusi[p.nama] || 0, warna: p.warna }))} tengah={ring.rataSkor ?? "-"} sub="rata-rata skor" /></div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[["Kehadiran", ring.rataHadir, "#1E7B34", pct(ring.rataHadir)], ["Rata-rata kuis", ring.rataKuis, "#E0A800", ring.rataKuis ?? "-"], ["Progres belajar", ring.rataProgres, "#6B9E2F", pct(ring.rataProgres)]].map(([j, v, w, t]) => (
                  <div key={j}><p className="text-sm text-tinta/60">{j}</p><p className="text-3xl font-bold" style={{ color: w }}>{t}</p><div className="mt-1"><BatangH nilai={v ?? 0} warna={w} label={`${j} ${t}`} /></div></div>
                ))}
              </div>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">{PREDIKAT.map((p) => <li key={p.nama} className="flex items-center gap-2"><span aria-hidden className="h-3.5 w-3.5 rounded" style={{ background: p.warna }} />{p.nama} <b>{ring.distribusi[p.nama] || 0}</b></li>)}</ul>
          </section>

          <section className="kartu">
            <h2 className="mb-3 text-lg font-semibold text-hijau">Daftar peserta</h2>
            <div className="overflow-x-auto"><table className="w-full min-w-[40rem] text-sm">
              <thead><tr className="border-b-2 border-hijau/15 text-left text-tinta/60"><th className="py-2 pr-3">Nama</th><th className="px-2">Hadir</th><th className="px-2">Kuis</th><th className="px-2">Progres</th><th className="px-2">Skor</th><th className="pl-2">Predikat</th></tr></thead>
              <tbody>
                {daftar.map((r) => (
                  <tr key={r.peserta.id} className="border-b border-hijau/10">
                    <td className="py-3 pr-3"><Link href={`/guru/rapor/${r.peserta.id}${qs ? `?${qs}` : ""}`} className="font-semibold text-hijau underline" dir="auto">{r.peserta.nama}</Link><p className="text-xs text-tinta/50">{r.peserta.kode}</p></td>
                    <td className="px-2"><span className="font-semibold">{pct(r.kehadiran.persen)}</span><div className="mt-1 w-16"><BatangH nilai={r.kehadiran.persen ?? 0} warna="#1E7B34" tinggi={6} /></div></td>
                    <td className="px-2"><span className="font-semibold">{r.kuis.rata ?? "-"}</span><div className="mt-1 w-16"><BatangH nilai={r.kuis.rata ?? 0} warna="#E0A800" tinggi={6} /></div></td>
                    <td className="px-2"><span className="font-semibold">{pct(r.progres.persen)}</span><div className="mt-1 w-16"><BatangH nilai={r.progres.persen ?? 0} warna="#6B9E2F" tinggi={6} /></div></td>
                    <td className="px-2 text-lg font-bold text-hijau-tua">{r.skor ?? "-"}</td>
                    <td className="pl-2"><Lencana predikat={r.predikat} /></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            {!daftar.length && <p className="mt-3 text-tinta/60">Belum ada peserta di grup ini.</p>}
          </section>
        </>
      )}
    </div>
  );
}
