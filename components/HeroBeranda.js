import Link from "next/link";
import { gayaLatar } from "@/lib/hero";

// Bagian hero Beranda. Dipakai di Beranda dan sebagai pratinjau di halaman admin (kompak = ukuran kecil).
export default function HeroBeranda({ h, kompak = false }) {
  const tengah = h.tata === "tengah";
  const adaArab = Boolean(h.arab);
  const arab = kompak ? "text-4xl" : "text-6xl sm:text-7xl md:text-8xl";
  const judul = kompak ? "text-xl" : "text-3xl sm:text-4xl";
  const sub = kompak ? "mt-2 text-sm" : "mt-4 text-lg";
  return (
    <section className="relative text-white" style={gayaLatar(h)}>
      <div className={`mx-auto max-w-5xl px-5 ${kompak ? "py-7" : "pb-14 pt-12 md:pb-20 md:pt-16"} ${tengah ? "flex flex-col items-center gap-5 text-center" : `grid items-center gap-6 ${adaArab && !kompak ? "md:grid-cols-[1.3fr_1fr] md:gap-10" : ""}`}`}>
        {adaArab && (
          <p lang="ar" className={`arab text-kuning drop-shadow ${arab} ${tengah ? "text-center" : kompak ? "text-right" : "text-right md:order-2 md:text-center"}`}>{h.arab}</p>
        )}
        <div className={tengah ? "max-w-2xl" : adaArab && !kompak ? "md:order-1" : ""}>
          <h1 className={`font-bold leading-tight drop-shadow ${judul} ${tengah ? "" : "max-w-2xl"}`}>{h.judul}</h1>
          {h.subjudul && <p className={`max-w-xl text-white/90 drop-shadow ${sub} ${tengah ? "mx-auto" : ""}`}>{h.subjudul}</p>}
          {(h.tombol1 || h.tombol2) && (
            <div className={`flex flex-wrap gap-3 ${kompak ? "mt-4" : "mt-8"} ${tengah ? "justify-center" : ""}`}>
              {h.tombol1 && <Link href="/masuk" className="btn-kuning">{h.tombol1}</Link>}
              {h.tombol2 && <Link href="/pengajar" className="btn-garis">{h.tombol2}</Link>}
            </div>
          )}
        </div>
      </div>
      <div className="h-2 bg-gradient-to-r from-kuning to-jingga" />
    </section>
  );
}
