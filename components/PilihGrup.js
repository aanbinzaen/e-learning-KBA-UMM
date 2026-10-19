import Link from "next/link";
export default function PilihGrup({ grup, aktifId, dasar }) {
  if (grup.length < 2) return null;
  return (
    <nav className="mb-5 flex gap-2 overflow-x-auto pb-1" aria-label="Pilih grup">
      {grup.map((g) => (
        <Link key={g.id} href={`${dasar}?grup=${g.id}`} aria-current={g.id === aktifId ? "page" : undefined}
          className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-medium ${g.id === aktifId ? "bg-hijau text-white" : "border-2 border-hijau/20 bg-white text-hijau"}`}>
          {g.nama}
        </Link>
      ))}
    </nav>
  );
}
