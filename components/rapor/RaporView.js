import { Cincin, Donut, BatangH } from "./Grafik";
import { STATUS_HADIR, WARNA_HADIR, warnaNilai } from "@/lib/rapor";

const pct = (v) => (v == null ? "-" : `${v}%`);
const tglS = (iso) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const periode = (r) => (r?.dari || r?.sampai ? `${r.dari || "awal program"} s.d. ${r.sampai || "sekarang"}` : "Seluruh periode sampai hari ini");

function Bagian({ judul, children }) {
  return (
    <section className="kartu break-inside-avoid">
      <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-hijau-tua"><span aria-hidden className="h-7 w-2 rounded-full bg-kuning" />{judul}</h2>
      {children}
    </section>
  );
}
function Metrik({ judul, nilai, warna, sub, bar }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3"><span className="text-sm font-medium text-tinta/70">{judul}</span><span className="text-3xl font-bold" style={{ color: warna }}>{nilai}</span></div>
      <div className="mt-1"><BatangH nilai={bar ?? 0} warna={warna} tinggi={12} label={`${judul} ${nilai}`} /></div>
      <p className="mt-1 text-xs text-tinta/55">{sub}</p>
    </div>
  );
}

export default function RaporView({ r }) {
  const kh = r.kehadiran, q = r.kuis, g = r.progres, pr = r.predikat;
  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-kartu bg-gradient-to-br from-hijau to-hijau-tua p-6 text-white sm:p-8">
        <p className="text-sm font-semibold tracking-[0.2em] text-kuning">RAPOR PESERTA</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl" dir="auto">{r.peserta.nama}</h1>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {[r.peserta.kode, `${r.grup.jk || ""} · ${r.grup.tingkat || ""}`, r.grup.nama, r.grup.pengajar ? `Pengajar: ${r.grup.pengajar}` : null].filter(Boolean).map((c) => <span key={c} className="rounded-full bg-white/15 px-3 py-1.5">{c}</span>)}
        </div>
        <p className="mt-4 text-xs text-white/75">Periode: {periode(r.rentang)}</p>
      </header>

      <section className="kartu grid items-center gap-6 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-3 text-center">
          <Cincin nilai={r.skor ?? 0} isi={r.skor == null ? "-" : r.skor} sub="SKOR AKHIR" warna={pr.warna} ukuran={176} />
          <div><p className="text-xl font-bold" style={{ color: pr.warna }}>{pr.nama}</p>{pr.ar && <p lang="ar" dir="rtl" className="arab text-2xl leading-none" style={{ color: pr.warna }}>{pr.ar}</p>}{!pr.ar && pr.arti && <p className="text-sm text-tinta/60">{pr.arti}</p>}</div>
        </div>
        <div className="space-y-5">
          <Metrik judul="Kehadiran" nilai={pct(kh.persen)} warna={WARNA_HADIR.hadir} bar={kh.persen} sub={kh.total ? `${kh.hadir} dari ${kh.total} pertemuan` : "Belum ada pertemuan"} />
          <Metrik judul="Rata-rata kuis" nilai={q.rata == null ? "-" : q.rata} warna={warnaNilai(q.rata)} bar={q.rata} sub={q.jumlah ? `${q.dikerjakan} dari ${q.jumlah} kuis dikerjakan` : "Belum ada kuis"} />
          <Metrik judul="Progres belajar" nilai={pct(g.persen)} warna="#6B9E2F" bar={g.persen} sub={g.total ? `${g.selesai} dari ${g.total} materi, rekaman, dan kuis` : "Belum ada materi"} />
        </div>
      </section>

      <Bagian judul="Kehadiran">
        {!kh.total ? <p className="text-tinta/60">Belum ada pertemuan yang terlaksana pada periode ini.</p> : (
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <Donut bagian={["hadir", "izin", "sakit", "alpa"].map((s) => ({ nilai: kh[s], warna: WARNA_HADIR[s] }))} tengah={pct(kh.persen)} sub="hadir" />
            <ul className="w-full space-y-2">
              {["hadir", "izin", "sakit", "alpa"].map((s) => (
                <li key={s} className="flex items-center gap-3"><span aria-hidden className="h-5 w-5 shrink-0 rounded-md" style={{ background: WARNA_HADIR[s] }} />
                  <span className="flex-1 font-semibold">{STATUS_HADIR[s]}</span><span className="font-bold">{kh[s]}</span><span className="w-12 text-right text-sm text-tinta/60">{Math.round((kh[s] * 100) / kh.total)}%</span></li>
              ))}
              <li className="border-t border-hijau/15 pt-2 text-sm text-tinta/60">Total {kh.total} pertemuan</li>
            </ul>
          </div>
        )}
      </Bagian>

      <Bagian judul="Nilai Kuis">
        {!q.jumlah ? <p className="text-tinta/60">Belum ada kuis yang diterbitkan.</p> : (
          <ul className="space-y-3">
            {q.daftar.map((x) => (
              <li key={x.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,14rem)_1fr_auto]">
                <span className="min-w-0 truncate text-sm font-medium" dir="auto" title={x.judul}>{x.judul}</span>
                <span className="text-right text-lg font-bold sm:order-3" style={{ color: x.status === "selesai" ? warnaNilai(x.nilai) : "#5B6B5F" }}>{x.status === "selesai" ? x.nilai : x.status === "menunggu" ? "menunggu" : "belum"}</span>
                <div className="col-span-2 sm:order-2 sm:col-span-1"><BatangH nilai={x.nilai ?? 0} warna={warnaNilai(x.nilai)} tinggi={14} label={`${x.judul}: ${x.nilai ?? "belum"}`} /></div>
              </li>
            ))}
            <li className="border-t border-hijau/15 pt-2 text-sm text-tinta/60">Dikerjakan {q.dikerjakan} dari {q.jumlah} kuis · rata-rata {q.rata == null ? "-" : q.rata}{q.menunggu ? ` · ${q.menunggu} menunggu penilaian` : ""}</li>
          </ul>
        )}
      </Bagian>

      <Bagian judul="Progres Belajar">
        <ul className="space-y-4">
          {[["Materi", g.rincian.materi, "#1E7B34"], ["Rekaman", g.rincian.rekaman, "#6B9E2F"], ["Kuis", g.rincian.kuis, "#F5B800"], ["Keseluruhan", { selesai: g.selesai, total: g.total }, "#14582A"]].map(([n, v, w]) => {
            const p = v.total ? Math.round((v.selesai * 100) / v.total) : 0;
            return <li key={n}><div className="mb-1 flex items-baseline justify-between"><span className={n === "Keseluruhan" ? "font-bold" : "font-semibold"}>{n}</span><span className="text-sm text-tinta/60">{v.selesai}/{v.total} · <b className="text-hijau-tua">{v.total ? `${p}%` : "-"}</b></span></div><BatangH nilai={p} warna={w} tinggi={14} label={`${n} ${p}%`} /></li>;
          })}
        </ul>
      </Bagian>

      {kh.riwayat.length > 0 && (
        <Bagian judul="Riwayat Kehadiran">
          <ol className="flex flex-wrap gap-2" aria-label="Riwayat kehadiran per pertemuan">
            {kh.riwayat.map((x, i) => (
              <li key={x.id} title={`${i + 1}. ${x.judul} (${tglS(x.waktu)}): ${STATUS_HADIR[x.status]}`} aria-label={`Pertemuan ${i + 1}: ${STATUS_HADIR[x.status]}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: WARNA_HADIR[x.status] }}>{i + 1}</li>
            ))}
          </ol>
          <ul className="mt-4 flex flex-wrap gap-4 text-sm text-tinta/70">{["hadir", "izin", "sakit", "alpa"].map((s) => <li key={s} className="flex items-center gap-2"><span aria-hidden className="h-4 w-4 rounded" style={{ background: WARNA_HADIR[s] }} />{STATUS_HADIR[s]}</li>)}</ul>
        </Bagian>
      )}

      {r.catatan?.isi && (
        <Bagian judul="Catatan Pengajar">
          <blockquote className="rounded-2xl border-l-4 border-kuning bg-krem p-4 leading-relaxed" dir="auto"><p className="whitespace-pre-line">{r.catatan.isi}</p>{r.catatan.oleh && <footer className="mt-2 text-sm font-semibold text-hijau">— {r.catatan.oleh}</footer>}</blockquote>
        </Bagian>
      )}
      <p className="text-xs leading-relaxed text-tinta/55">Skor akhir = kehadiran {r.bobot.hadir}% + nilai kuis {r.bobot.kuis}% + progres belajar {r.bobot.progres}%. Kuis yang belum dikerjakan dihitung 0; kuis esai yang belum dinilai belum dihitung. Predikat: Mumtaz (90 ke atas), Jayyid Jiddan (80–89), Jayyid (70–79), Maqbul (60–69), di bawah 60 Perlu Bimbingan.</p>
    </div>
  );
}
