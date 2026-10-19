import Link from "next/link";
import { notFound } from "next/navigation";
import { ambilSesi } from "@/lib/auth";
import { tanggalIndo } from "@/lib/data";
import YouTubePlayer from "@/components/YouTubePlayer";
import TombolSelesai from "../TombolSelesai";

export const metadata = { title: "Pertemuan" };

export default async function DetailKelas({ params }) {
  const { supabase, user } = await ambilSesi();
  const { data: p } = await supabase.from("pertemuan").select("id,grup_id,judul,waktu,keterangan").eq("id", params.id).maybeSingle();
  if (!p) notFound();
  const [{ data: materi }, { data: rekaman }, { data: selesai }, { data: tautan }] = await Promise.all([
    supabase.from("materi").select("id,jenis,judul,catatan").eq("pertemuan_id", p.id).order("dibuat_pada"),
    supabase.from("rekaman").select("id,judul,youtube_id").eq("pertemuan_id", p.id).order("dibuat_pada"),
    supabase.from("progres").select("item_id").eq("profile_id", user.id),
    supabase.from("grup_tautan").select("link").eq("grup_id", p.grup_id).maybeSingle(),
  ]);
  const sudah = new Set((selesai || []).map((x) => x.item_id));

  return (
    <div className="max-w-2xl space-y-5">
      <Link href="/dashboard/kelas" className="text-sm font-medium text-hijau underline">← Semua pertemuan</Link>
      <header className="rounded-kartu bg-hijau p-6 text-white">
        <h1 className="text-2xl font-bold">{p.judul}</h1>
        <p className="mt-1 text-white/90">{tanggalIndo(p.waktu)}</p>
        {p.keterangan && <p className="mt-3 text-sm text-white/90">{p.keterangan}</p>}
        {tautan?.link && <a href={tautan.link} target="_blank" rel="noopener noreferrer" className="btn-kuning mt-4 w-full">Gabung Kelas</a>}
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-hijau-tua">Materi</h2>
        {(materi || []).map((m) => (
          <article key={m.id} className="kartu space-y-3">
            <h3 className="font-semibold">{m.judul}</h3>
            {m.jenis === "catatan" && <p className="whitespace-pre-line leading-relaxed" dir="auto">{m.catatan}</p>}
            {m.jenis === "pdf" && <a href={`/dashboard/materi/${m.id}`} target="_blank" rel="noopener noreferrer" className="btn-hijau w-full">Buka PDF</a>}
            <TombolSelesai jenis="materi" itemId={m.id} awal={sudah.has(m.id)} />
          </article>
        ))}
        {!materi?.length && <p className="kartu text-tinta/70">Belum ada materi untuk pertemuan ini.</p>}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-hijau-tua">Rekaman</h2>
        {(rekaman || []).map((r) => (
          <article key={r.id} className="kartu space-y-3">
            <YouTubePlayer id={r.youtube_id} judul={r.judul} />
            <h3 className="font-semibold">{r.judul}</h3>
            <TombolSelesai jenis="rekaman" itemId={r.id} awal={sudah.has(r.id)} />
          </article>
        ))}
        {!rekaman?.length && <p className="kartu text-tinta/70">Belum ada rekaman.</p>}
      </section>
    </div>
  );
}
