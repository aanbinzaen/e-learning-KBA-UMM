import Link from "next/link";
import { notFound } from "next/navigation";
import { wajibGuru } from "@/lib/guru";
import { ringkasWIB } from "@/lib/waktu";
import TombolHapus from "@/components/TombolHapus";
import SegarkanOtomatis from "@/components/SegarkanOtomatis";
import KotakPesan from "./KotakPesan";
import { kirimPesan, hapusPesan, hapusTopik } from "../../actions";

export const metadata = { title: "Diskusi" };

export default async function Topik({ params }) {
  const { supabase, user, profil } = await wajibGuru();
  const { data: t } = await supabase.from("ruang_topik").select("id,judul,penulis,dibuat_oleh,dibuat_pada").eq("id", params.id).maybeSingle();
  if (!t) notFound();
  const { data: pesan } = await supabase.from("ruang_pesan").select("id,isi,penulis,dibuat_oleh,dibuat_pada").eq("topik_id", t.id).order("dibuat_pada").limit(500);
  const admin = profil.role === "admin";

  return (
    <div className="space-y-4">
      <SegarkanOtomatis jumlah={pesan?.length || 0} gulir detik={15} />
      <Link href="/guru/ruang/diskusi" className="text-sm font-medium text-hijau underline">← Semua topik</Link>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><h2 className="text-xl font-bold leading-snug text-hijau-tua" dir="auto">{t.judul}</h2>
          <p className="text-xs text-tinta/60">Dibuka {t.penulis || "pengajar"} · {ringkasWIB(t.dibuat_pada)}</p></div>
        {(t.dibuat_oleh === user.id || admin) && <TombolHapus aksi={hapusTopik.bind(null, t.id)} label="Hapus topik" pesan="Hapus topik beserta semua pesannya?" />}
      </header>

      <ol className="space-y-3 rounded-kartu bg-hijau-muda/60 p-3 sm:p-4" aria-label="Pesan diskusi">
        {(pesan || []).map((m) => {
          const saya = m.dibuat_oleh === user.id;
          return (
            <li key={m.id} className={`flex ${saya ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] rounded-3xl px-4 py-3 shadow-sm ${saya ? "rounded-br-lg bg-hijau text-white" : "rounded-bl-lg bg-white text-tinta"}`}>
                <p className={`text-xs font-semibold ${saya ? "text-kuning" : "text-hijau"}`}>{saya ? "Anda" : m.penulis || "Pengajar"}</p>
                <p className="mt-0.5 whitespace-pre-line break-words text-[0.95rem] leading-relaxed" dir="auto">{m.isi}</p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <span className={`text-[0.7rem] ${saya ? "text-white/70" : "text-tinta/50"}`}>{ringkasWIB(m.dibuat_pada)}</span>
                  {(saya || admin) && <TombolHapus aksi={hapusPesan.bind(null, m.id, t.id)} label="Hapus" pesan="Hapus pesan ini?" kelas={`px-1 py-1 text-[0.7rem] underline ${saya ? "text-white/80" : "text-red-700"}`} />}
                </div>
              </div>
            </li>
          );
        })}
        {!pesan?.length && <li className="text-center text-sm text-tinta/60">Belum ada pesan.</li>}
      </ol>
      <div id="akhir-pesan" />
      <div className="sticky bottom-0 -mx-1 bg-krem/95 px-1 py-3 backdrop-blur"><KotakPesan aksi={kirimPesan.bind(null, t.id)} /></div>
    </div>
  );
}
