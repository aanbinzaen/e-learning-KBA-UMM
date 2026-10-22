import KartuFaidah from "@/components/KartuFaidah";
import { ambilFaidah } from "@/lib/data";

export const revalidate = 120;
export const metadata = { title: "Faidah Ilmu", description: "Kumpulan faidah ilmu dari KB-UMM Rumah Dakwah Malang dan Pesantren Online." };

export default async function Faidah() {
  const daftar = await ambilFaidah(40);
  return (
    <div className="bagian !max-w-3xl">
      <header className="text-center">
        <p className="text-sm font-semibold tracking-[0.2em] text-jingga">FAIDAH ILMU</p>
        <h1 className="mt-2 text-3xl font-bold text-hijau-tua">Mutiara Faidah</h1>
        <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-kuning to-jingga" />
        <p className="mt-4 text-tinta/80">Catatan singkat yang bermanfaat untuk menambah ilmu dan menguatkan semangat belajar.</p>
      </header>
      <div className="mt-12 space-y-10">
        {daftar.map((f) => <KartuFaidah key={f.id} f={f} />)}
        {!daftar.length && <p className="kartu text-center text-tinta/70">Faidah akan segera ditambahkan.</p>}
      </div>
    </div>
  );
}
