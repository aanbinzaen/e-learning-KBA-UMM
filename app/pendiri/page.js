import Avatar from "@/components/Avatar";
import { ambilPendiri } from "@/lib/data";

export const revalidate = 300;
export const metadata = { title: "Pendiri" };

export default async function Pendiri() {
  const daftar = await ambilPendiri();
  return (
    <div className="bagian">
      <h1 className="text-3xl font-bold text-hijau-tua">Pendiri</h1>
      {daftar.length === 0 ? (
        <p className="kartu mt-6 text-tinta/70">Profil pendiri belum ditambahkan. Admin dapat menambahkannya dari tabel pendiri.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {daftar.map((p) => (
            <article key={p.id} className="kartu flex flex-col items-center text-center">
              <Avatar nama={p.nama} src={p.foto_url} ukuran={112} />
              <h2 className="mt-4 text-xl font-semibold">{p.nama}</h2>
              {p.peran && <p className="text-sm font-medium text-jingga">{p.peran}</p>}
              {p.biografi && <p className="mt-3 text-sm leading-relaxed">{p.biografi}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
