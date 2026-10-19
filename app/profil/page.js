import { ambilKonten } from "@/lib/data";
import { SITE, linkWA } from "@/lib/config";

export const revalidate = 300;
export const metadata = { title: "Profil Rumah Dakwah" };

export default async function Profil() {
  const [sejarah, visi, misi] = await Promise.all([
    ambilKonten("profil_sejarah", "Sejarah Rumah Dakwah Malang akan ditampilkan di sini. Admin dapat mengisinya dari tabel konten_halaman (kunci: profil_sejarah)."),
    ambilKonten("profil_visi", "Visi akan ditampilkan di sini (kunci: profil_visi)."),
    ambilKonten("profil_misi", "Misi akan ditampilkan di sini (kunci: profil_misi)."),
  ]);
  const wa = linkWA();
  const blok = [["Sejarah", sejarah], ["Visi", visi], ["Misi", misi]];
  return (
    <div className="bagian">
      <h1 className="text-3xl font-bold text-hijau-tua">Profil Rumah Dakwah</h1>
      <div className="mt-8 space-y-4">
        {blok.map(([j, isi]) => (
          <section key={j} className="kartu">
            <h2 className="text-xl font-semibold text-hijau">{j}</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed">{isi}</p>
          </section>
        ))}
        <section className="kartu">
          <h2 className="text-xl font-semibold text-hijau">Kontak</h2>
          <ul className="mt-2 space-y-1">
            <li>{SITE.alamat}</li>
            {wa && <li><a className="font-medium text-hijau underline" href={wa}>Hubungi lewat WhatsApp</a></li>}
            {SITE.email && <li><a className="font-medium text-hijau underline" href={`mailto:${SITE.email}`}>{SITE.email}</a></li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
