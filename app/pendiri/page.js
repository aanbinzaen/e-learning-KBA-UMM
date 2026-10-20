import Avatar from "@/components/Avatar";
import { ambilPendiri } from "@/lib/data";

export const revalidate = 300;
export const metadata = { title: "Pendiri" };

// Peran yang diketik panjang dalam satu kolom dipecah per kalimat (atau per baris) agar tampil sebagai daftar rapi.
function pecahPeran(teks) {
  return String(teks || "")
    .split(/\n+/)
    .flatMap((baris) => baris.split(/(?<=\.)\s+(?=[A-Z])/))
    .map((t) => t.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

export default async function Pendiri() {
  const daftar = await ambilPendiri();
  return (
    <div className="bagian !max-w-3xl">
      <h1 className="text-3xl font-bold text-hijau-tua">Pendiri</h1>
      {daftar.length === 0 ? (
        <p className="kartu mt-6 text-tinta/70">Profil pendiri belum ditambahkan. Admin dapat menambahkannya dari menu Konten.</p>
      ) : (
        <div className="mt-8 space-y-6">
          {daftar.map((p) => {
            const peran = pecahPeran(p.peran);
            const paragraf = String(p.biografi || "").split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
            return (
              <article key={p.id} className="kartu !p-0 overflow-hidden">
                <header className="bg-hijau-muda px-6 py-7 sm:flex sm:items-start sm:gap-6">
                  <div className="flex justify-center sm:block sm:shrink-0"><Avatar nama={p.nama} src={p.foto_url} ukuran={128} /></div>
                  <div className="mt-4 sm:mt-0">
                    <h2 className="text-center text-2xl font-bold leading-snug text-hijau-tua sm:text-left">{p.nama}</h2>
                    {peran.length > 0 && (
                      <>
                        <p className="mt-3 text-center text-xs font-semibold tracking-wide text-hijau sm:text-left">PERAN DAN AMANAH</p>
                        <ul className="mt-2 space-y-2 text-left text-[0.95rem] leading-snug text-tinta">
                          {peran.map((r, i) => (
                            <li key={i} className="flex gap-3">
                              <span aria-hidden className="mt-[0.45rem] h-2 w-2 shrink-0 rounded-full bg-jingga" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </header>
                {paragraf.length > 0 && (
                  <div lang="id" className="space-y-4 px-6 py-7 text-justify leading-relaxed [hyphens:auto]">
                    {paragraf.map((t, i) => <p key={i} className="whitespace-pre-line">{t}</p>)}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
