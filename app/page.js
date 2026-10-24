import Link from "next/link";
import { ambilJadwal, ambilPengumuman, ambilKonten, ambilFaidah, ambilHero, bagianTanggal, tanggalPendek } from "@/lib/data";
import HeroBeranda from "@/components/HeroBeranda";
import KartuFaidah from "@/components/KartuFaidah";

export const revalidate = 60;

const TINGKAT = [
  { nama: "Pemula", isi: "Mulai dari dasar: huruf, bacaan, dan kosakata, dibimbing pelan-pelan dalam halaqah kecil." },
  { nama: "Lanjutan", isi: "Memperdalam kaidah Bahasa Arab dan membaca teks dengan lebih mandiri." },
  { nama: "Kelas Khusus", isi: "Kelas pendalaman untuk Ikhwan yang sudah siap belajar lebih jauh." },
];
function Judul({ children }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-hijau-tua">{children}</h2>
      <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-kuning to-jingga" />
    </div>
  );
}
// Paragraf rata kanan-kiri dengan pemenggalan kata otomatis agar jarak antarkata tetap rapi di layar HP.
const rata = "text-justify leading-relaxed [hyphens:auto]";
const paragraf = (t) => String(t || "").split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);

const CARA = [
  "Masuk dengan kode peserta dari pengajar Anda",
  "Ikuti pertemuan lewat tombol Gabung Kelas",
  "Pelajari materi dan tonton rekaman kapan saja",
  "Kerjakan kuis, isi absensi, dan pantau progres",
];

export default async function Beranda() {
  const [hero, jadwal, pengumuman, faidah, tentang] = await Promise.all([
    ambilHero(), ambilJadwal(), ambilPengumuman(), ambilFaidah(1),
    ambilKonten("tentang_program", "KB-UMM adalah program belajar Bahasa Arab yang diselenggarakan oleh Rumah Dakwah Malang dan Pesantren Online. Peserta belajar dalam kelompok kecil (halaqah) bersama pengajar penanggung jawab, terpisah untuk Ikhwan dan Akhwat."),
  ]);

  return (
    <>
      <HeroBeranda h={hero} />

      <section className="bagian !pb-6">
        <details className="group kartu !p-0 overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 [&::-webkit-details-marker]:hidden">
            <span>
              <span className="block text-2xl font-bold text-hijau-tua">Tentang program</span>
              <span className="mt-1 block h-1 w-12 rounded-full bg-gradient-to-r from-kuning to-jingga" />
              <span className="mt-2 block text-sm text-tinta/60">Ketuk tombol untuk membaca penjelasan program</span>
            </span>
            <span className="flex shrink-0 items-center gap-3 rounded-full bg-kuning py-2 pl-5 pr-3 font-semibold text-hijau-tua">
              <span className="group-open:hidden">Baca</span><span className="hidden group-open:inline">Tutup</span>
              <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-open:rotate-180"><path d="M6 9l6 6 6-6" /></svg>
            </span>
          </summary>
          <div className="space-y-8 border-t border-hijau/15 px-6 py-7">
            <div lang="id" className={`max-w-3xl space-y-4 border-l-4 border-kuning pl-5 ${rata}`}>
              {paragraf(tentang).map((t, i) => <p key={i} className="whitespace-pre-line">{t}</p>)}
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {TINGKAT.map((t) => (
                <div key={t.nama} className="relative overflow-hidden rounded-3xl bg-hijau-muda p-5 pt-7">
                  <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-kuning to-jingga" />
                  <h3 className="text-lg font-semibold text-hijau">{t.nama}</h3>
                  <p lang="id" className={`mt-2 text-sm ${rata}`}>{t.isi}</p>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-lg font-bold text-hijau-tua">Cara belajar</h3>
              <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                {CARA.map((c, i) => (
                  <li key={c} className="flex items-center gap-4 rounded-2xl border border-hijau/15 bg-krem p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kuning font-bold text-hijau-tua">{i + 1}</span>
                    <span className="leading-snug">{c}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </details>
      </section>

      <section className="bg-hijau-muda">
        <div className="bagian">
          <Judul>Jadwal terdekat</Judul>
          {jadwal.length === 0 ? (
            <p className="kartu mt-6 text-tinta/70">Belum ada jadwal. Jadwal pertemuan akan muncul di sini.</p>
          ) : (
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {jadwal.map((j) => {
                const d = bagianTanggal(j.waktu_mulai);
                return (
                  <li key={j.id} className="kartu flex gap-4 !p-4">
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-hijau text-white" aria-hidden>
                      <span className="text-2xl font-bold leading-none">{d.hari}</span>
                      <span className="mt-1 text-[0.65rem] font-semibold tracking-widest text-kuning">{d.bulan}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug">{j.judul}</p>
                      <p className="mt-0.5 text-sm font-medium text-hijau">{d.namaHari}, pukul {d.jam} WIB</p>
                      {j.keterangan && <p lang="id" className={`mt-2 text-sm text-tinta/75 ${rata}`}>{j.keterangan}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="bagian">
        <Judul>Pengumuman</Judul>
        {pengumuman.length === 0 ? (
          <p className="kartu mt-6 text-tinta/70">Belum ada pengumuman.</p>
        ) : (
          <ul className="mt-6 max-w-3xl space-y-4">
            {pengumuman.map((p) => (
              <li key={p.id} className="kartu relative overflow-hidden !p-5 !pl-6">
                <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-kuning to-jingga" />
                <p className="font-semibold uppercase leading-snug tracking-wide text-hijau-tua">{p.judul}</p>
                {p.dibuat_pada && <p className="mt-1 text-xs text-tinta/55">{tanggalPendek(p.dibuat_pada)}</p>}
                <div lang="id" className={`mt-3 space-y-3 border-t border-hijau/15 pt-3 text-sm ${rata}`}>
                  {paragraf(p.isi).map((t, i) => <p key={i} className="whitespace-pre-line" dir="auto">{t}</p>)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {faidah.length > 0 && (
        <section className="bg-hijau-tua text-white">
          <div className="bagian">
            <div className="text-center">
              <p className="text-sm font-semibold tracking-[0.2em] text-kuning">FAIDAH ILMU</p>
              <h2 className="mt-2 text-2xl font-bold">Mutiara Faidah</h2>
              <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-kuning to-jingga" />
            </div>
            <div className="mx-auto mt-10 max-w-3xl">
              <KartuFaidah f={faidah[0]} gelap lainnya />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
