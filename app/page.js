import Link from "next/link";
import { ambilJadwal, ambilPengumuman, ambilKonten, tanggalIndo } from "@/lib/data";

export const revalidate = 60;

const TINGKAT = [
  { nama: "Pemula", isi: "Mulai dari dasar: huruf, bacaan, dan kosakata, dibimbing pelan-pelan dalam halaqah kecil." },
  { nama: "Lanjutan", isi: "Memperdalam kaidah Bahasa Arab dan membaca teks dengan lebih mandiri." },
  { nama: "Kelas Khusus", isi: "Kelas pendalaman untuk Ikhwan yang sudah siap belajar lebih jauh." },
];
const CARA = [
  "Masuk dengan kode peserta dari pengajar Anda",
  "Ikuti pertemuan lewat tombol Gabung Kelas",
  "Pelajari materi dan tonton rekaman kapan saja",
  "Kerjakan kuis, isi absensi, dan pantau progres",
];

export default async function Beranda() {
  const [jadwal, pengumuman, tentang] = await Promise.all([
    ambilJadwal(), ambilPengumuman(),
    ambilKonten("tentang_program", "KB-UMM adalah program belajar Bahasa Arab yang diselenggarakan oleh Rumah Dakwah Malang dan Pesantren Online. Peserta belajar dalam kelompok kecil (halaqah) bersama pengajar penanggung jawab, terpisah untuk Ikhwan dan Akhwat."),
  ]);

  return (
    <>
      <section className="bg-hijau text-white">
        <div className="mx-auto max-w-5xl px-5 pb-14 pt-12 md:pb-20 md:pt-16">
          <p lang="ar" className="arab text-right text-6xl text-kuning sm:text-7xl md:text-8xl">مَحَبَّةُ اللهِ</p>
          <h1 className="mt-6 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
            Kuliah Bahasa Arab Untuk Meraih Mahabatullah
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/90">
            Belajar Bahasa Arab bersama Rumah Dakwah Malang dan Pesantren Online, langsung dari HP Anda.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/masuk" className="btn-kuning">Masuk</Link>
            <Link href="/pengajar" className="btn-garis">Kenali pengajar</Link>
          </div>
        </div>
        <div className="h-2 bg-gradient-to-r from-kuning to-jingga" />
      </section>

      <section className="bagian">
        <h2 className="text-2xl font-bold text-hijau-tua">Tentang program</h2>
        <p className="mt-3 max-w-2xl leading-relaxed">{tentang}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {TINGKAT.map((t) => (
            <div key={t.nama} className="kartu">
              <h3 className="text-lg font-semibold text-hijau">{t.nama}</h3>
              <p className="mt-2 text-sm leading-relaxed">{t.isi}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-hijau-muda">
        <div className="bagian">
          <h2 className="text-2xl font-bold text-hijau-tua">Cara belajar</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2">
            {CARA.map((c, i) => (
              <li key={c} className="flex items-start gap-4 rounded-kartu bg-white p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kuning font-bold text-hijau-tua">{i + 1}</span>
                <span className="pt-1.5">{c}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bagian grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold text-hijau-tua">Jadwal terdekat</h2>
          {jadwal.length === 0 ? (
            <p className="kartu mt-4 text-tinta/70">Belum ada jadwal. Jadwal pertemuan akan muncul di sini.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {jadwal.map((j) => (
                <li key={j.id} className="kartu !p-4">
                  <p className="font-semibold">{j.judul}</p>
                  <p className="text-sm text-hijau">{tanggalIndo(j.waktu_mulai)}</p>
                  {j.keterangan && <p className="mt-1 text-sm text-tinta/70">{j.keterangan}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-hijau-tua">Pengumuman</h2>
          {pengumuman.length === 0 ? (
            <p className="kartu mt-4 text-tinta/70">Belum ada pengumuman.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pengumuman.map((p) => (
                <li key={p.id} className="kartu !p-4">
                  <p className="font-semibold">{p.judul}</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{p.isi}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
