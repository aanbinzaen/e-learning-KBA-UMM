import { Donut, BatangH } from "./Grafik";
import { PREDIKAT, warnaNilai } from "@/lib/rapor";

const pct = (v) => (v == null ? "-" : `${v}%`);
const tgl = (iso) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

function Bagian({ judul, children }) {
  return (
    <section className="kartu break-inside-avoid">
      <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-hijau-tua"><span aria-hidden className="h-7 w-2 rounded-full bg-kuning" />{judul}</h2>
      {children}
    </section>
  );
}
function Angka({ judul, nilai, sub, warna = "#14582A" }) {
  return <div className="rounded-2xl bg-krem p-4"><p className="text-sm text-tinta/60">{judul}</p><p className="mt-1 text-4xl font-bold leading-none" style={{ color: warna }}>{nilai}</p><p className="mt-1 text-xs text-tinta/50">{sub}</p></div>;
}

export default function LaporanView({ l, tampilNama = true }) {
  const r = l.ringkas, t = l.total;
  const periode = l.rentang?.dari || l.rentang?.sampai ? `${l.rentang.dari || "awal program"} s.d. ${l.rentang.sampai || "sekarang"}` : "Seluruh periode sampai hari ini";
  const maks = 100;
  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-kartu bg-gradient-to-br from-hijau to-hijau-tua p-6 text-white sm:p-8">
        <p className="text-sm font-semibold tracking-[0.2em] text-kuning">LAPORAN PROGRAM</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">Kuliah Bahasa Arab Untuk Meraih Mahabatullah</h1>
        <p className="mt-3 text-sm text-white/80">Periode: {periode} · Dibuat {tgl(l.dibuat)}</p>
      </header>

      <Bagian judul="Ringkasan">
        <ul className="space-y-3">{l.ringkasan.map((s) => <li key={s} className="flex gap-3 leading-relaxed"><span aria-hidden className="mt-2 h-3 w-3 shrink-0 rounded-full bg-kuning" />{s}</li>)}</ul>
      </Bagian>

      <Bagian judul="Angka Utama">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Angka judul="Peserta" nilai={t.peserta} sub={`${t.grup} grup`} />
          <Angka judul="Pertemuan" nilai={t.pertemuan} sub="terlaksana" />
          <Angka judul="Rata-rata skor" nilai={r.rataSkor ?? "-"} sub="skor akhir" />
          <Angka judul="Kehadiran" nilai={pct(r.rataHadir)} sub="rata-rata" warna="#1E7B34" />
          <Angka judul="Nilai kuis" nilai={r.rataKuis ?? "-"} sub="rata-rata" warna={warnaNilai(r.rataKuis)} />
          <Angka judul="Progres belajar" nilai={pct(r.rataProgres)} sub="rata-rata" warna="#6B9E2F" />
        </div>
      </Bagian>

      <Bagian judul="Capaian per Grup">
        <ul className="space-y-5">
          {l.perGrup.map((g) => (
            <li key={g.id} className="grid gap-3 border-b border-hijau/10 pb-5 last:border-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
              <div><p className="font-bold" dir="auto">{g.nama}</p><p className="text-xs text-tinta/55">{g.jk} · {g.tingkat} · {g.n} peserta · {g.pertemuan} pertemuan</p><p className="mt-1 text-sm font-semibold text-hijau-tua">Skor {g.rataSkor ?? "-"}</p></div>
              <div className="space-y-2">
                {[["Hadir", g.rataHadir, "#1E7B34", pct(g.rataHadir)], ["Kuis", g.rataKuis, "#E0A800", g.rataKuis ?? "-"], ["Progres", g.rataProgres, "#6B9E2F", pct(g.rataProgres)]].map(([n, v, w, tx]) => (
                  <div key={n} className="grid grid-cols-[4rem_1fr_3rem] items-center gap-2 text-sm"><span className="text-tinta/60">{n}</span><BatangH nilai={v ?? 0} warna={w} tinggi={10} label={`${g.nama} ${n} ${tx}`} /><b className="text-right">{tx}</b></div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Bagian>

      <Bagian judul="Sebaran Predikat">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <Donut bagian={PREDIKAT.map((p) => ({ nilai: r.distribusi[p.nama] || 0, warna: p.warna }))} tengah={r.n} sub="peserta" />
          <ul className="w-full space-y-2">
            {PREDIKAT.map((p) => { const n = r.distribusi[p.nama] || 0; return (
              <li key={p.nama} className="flex items-center gap-3"><span aria-hidden className="h-5 w-5 shrink-0 rounded-md" style={{ background: p.warna }} /><span className="flex-1"><b>{p.nama}</b> <span className="text-sm text-tinta/55">{p.arti}</span></span><b>{n}</b><span className="w-12 text-right text-sm text-tinta/60">{r.n ? Math.round((n * 100) / r.n) : 0}%</span></li>
            ); })}
          </ul>
        </div>
      </Bagian>

      {l.bulanan.length > 0 && (
        <Bagian judul="Tren Kehadiran per Bulan">
          <div className="flex items-end justify-around gap-3 overflow-x-auto pb-2" style={{ minHeight: 230 }} role="img" aria-label="Diagram batang kehadiran per bulan">
            {l.bulanan.map((b) => (
              <div key={b.kunci} className="flex min-w-[4.5rem] flex-col items-center gap-1">
                <span className="text-sm font-bold text-hijau-tua">{pct(b.persen)}</span>
                <div className="w-14 rounded-t-xl bg-hijau" style={{ height: Math.max(6, ((b.persen ?? 0) / maks) * 150) }} />
                <span className="text-xs font-semibold">{b.label}</span><span className="text-[0.7rem] text-tinta/50">{b.pertemuan} pertemuan</span>
              </div>
            ))}
          </div>
        </Bagian>
      )}

      {tampilNama && (l.unggulan.length > 0 || l.pendampingan.length > 0) && (
        <div className="grid gap-5 md:grid-cols-2">
          {[["Berprestasi (skor 70 ke atas)", l.unggulan, "#1E7B34"], ["Perlu pendampingan (skor di bawah 70)", l.pendampingan, "#C0392B"]].map(([j, d, w]) => (
            <section key={j} className="kartu break-inside-avoid"><h2 className="mb-3 text-lg font-bold" style={{ color: w }}>{j}</h2>
              {!d.length ? <p className="text-tinta/55">Tidak ada.</p> : <ol className="space-y-3">{d.map((p, i) => <li key={`${p.kode}${i}`} className="flex items-center gap-3"><span className="w-5 text-sm text-tinta/50">{i + 1}.</span><span className="min-w-0 flex-1"><b className="block truncate" dir="auto">{p.nama}</b><span className="text-xs text-tinta/55">{p.grup}</span></span><span className="text-2xl font-bold" style={{ color: p.warna }}>{p.skor}</span></li>)}</ol>}
            </section>
          ))}
        </div>
      )}
      <p className="text-xs leading-relaxed text-tinta/55">Skor akhir = kehadiran {l.bobot?.hadir ?? 40}% + nilai kuis {l.bobot?.kuis ?? 40}% + progres belajar {l.bobot?.progres ?? 20}%. Kuis yang belum dikerjakan dihitung 0; esai yang belum dinilai belum dihitung.</p>
    </div>
  );
}
