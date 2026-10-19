import Avatar from "@/components/Avatar";
import { ambilPengajar } from "@/lib/data";

export const revalidate = 300;
export const metadata = { title: "Pengajar" };

export default async function Pengajar() {
  const daftar = await ambilPengajar();
  return (
    <div className="bagian">
      <h1 className="text-3xl font-bold text-hijau-tua">Pengajar</h1>
      <p className="mt-2 text-tinta/80">Setiap grup (halaqah) dibimbing satu pengajar penanggung jawab.</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {daftar.map((p) => (
          <article key={p.id} className="kartu flex flex-col items-center text-center">
            <Avatar nama={p.nama} src={p.foto_url} />
            <h2 className="mt-4 text-lg font-semibold">{p.nama}</h2>
            <ul className="mt-3 w-full space-y-2 text-left">
              {p.grup.map((g) => (
                <li key={g.nama} className="rounded-2xl bg-hijau-muda px-3 py-2 text-sm">
                  <span className="font-medium">{g.nama}</span>
                  <span className="block text-hijau">{[g.jenis_kelamin, g.tingkat].filter(Boolean).join(" · ")}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
