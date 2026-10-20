import Avatar from "@/components/Avatar";
import { ambilPengajar } from "@/lib/data";

export const revalidate = 300;
export const metadata = { title: "Pengajar" };

export default async function Pengajar() {
  const daftar = await ambilPengajar();
  return (
    <div className="bagian">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-hijau-tua">Para Pengajar</h1>
        <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-kuning to-jingga" />
        <p className="mt-4 text-tinta/80">Setiap halaqah dibimbing oleh pengajar penanggung jawab yang mendampingi peserta dari awal hingga akhir.</p>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {daftar.map((p) => (
          <article key={p.id} className="kartu flex flex-col !p-0 overflow-hidden">
            <div className="h-20 bg-gradient-to-br from-hijau to-hijau-tua" />
            <div className="-mt-12 flex flex-col items-center px-5 pb-6 text-center">
              <span className="rounded-full bg-white p-1.5 shadow-md ring-2 ring-kuning/70"><Avatar nama={p.nama} src={p.foto_url} ukuran={112} /></span>
              <h2 className="mt-4 text-lg font-semibold leading-snug text-tinta">{p.nama}</h2>
              {p.jabatan && <p className="mt-1 text-sm font-medium text-hijau">{p.jabatan}</p>}

              {p.grup.length > 0 && (
                <ul className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Grup yang diampu">
                  {p.grup.map((g) => (
                    <li key={g.nama} className="rounded-full bg-hijau-muda px-3 py-1.5 text-xs leading-snug text-hijau-tua">
                      <span className="font-semibold">{g.nama}</span>
                      <span className="text-tinta/60"> · {[g.jenis_kelamin, g.tingkat].filter(Boolean).join(" ")}</span>
                    </li>
                  ))}
                </ul>
              )}

              {p.bio && (
                <details className="group mt-4 w-full text-left">
                  <summary className="cursor-pointer list-none text-center text-sm font-medium text-hijau underline underline-offset-4">Baca profil singkat</summary>
                  <div lang="id" className="mt-3 space-y-3 border-t border-hijau/15 pt-3 text-justify text-sm leading-relaxed [hyphens:auto]">
                    {p.bio.split(/\n{2,}/).map((t, i) => <p key={i} className="whitespace-pre-line">{t.trim()}</p>)}
                  </div>
                </details>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
