import Link from "next/link";
import { wajibGuru } from "@/lib/guru";
import { ringkasWIB } from "@/lib/waktu";
import FormAksi from "@/components/FormAksi";
import SegarkanOtomatis from "@/components/SegarkanOtomatis";
import { bukaTopik } from "../actions";

export const metadata = { title: "Diskusi pengajar" };

export default async function Diskusi() {
  const { supabase } = await wajibGuru();
  const { data: daftar, error } = await supabase.from("ruang_topik").select("id,judul,penulis,aktivitas,dibuat_pada,ruang_pesan(count)").order("aktivitas", { ascending: false }).limit(100);
  return (
    <div className="space-y-5">
      <SegarkanOtomatis detik={30} />
      {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">Diskusi belum siap. Minta admin menjalankan <b>supabase/12_ruang_pengajar.sql</b> di SQL Editor Supabase.</p>}

      <details className="kartu" open={!daftar?.length}>
        <summary className="cursor-pointer font-semibold text-hijau">+ Buka topik diskusi baru</summary>
        <FormAksi aksi={bukaTopik} kirim="Buka topik" className="mt-4 space-y-4">
          <div><label className="label" htmlFor="judul-topik">Judul topik</label><input id="judul-topik" name="judul" maxLength={150} dir="auto" className="input" placeholder="Contoh: Metode mengajarkan i'rab untuk pemula" required /></div>
          <div><label className="label" htmlFor="isi-topik">Pesan pertama</label><textarea id="isi-topik" name="isi" rows="4" maxLength={3000} dir="auto" className="input !py-3" required /></div>
        </FormAksi>
      </details>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-hijau">Topik ({daftar?.length || 0})</h2>
        {(daftar || []).map((t) => {
          const jumlah = t.ruang_pesan?.[0]?.count ?? 0;
          return (
            <Link key={t.id} href={`/guru/ruang/diskusi/${t.id}`} className="kartu block hover:bg-hijau-muda">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 font-semibold leading-snug" dir="auto">{t.judul}</p>
                <span className="shrink-0 rounded-full bg-kuning/30 px-3 py-1 text-xs font-semibold text-hijau-tua">{jumlah} pesan</span>
              </div>
              <p className="mt-1 text-xs text-tinta/60">Dibuka {t.penulis || "pengajar"} · aktivitas terakhir {ringkasWIB(t.aktivitas)}</p>
            </Link>
          );
        })}
        {!daftar?.length && !error && <p className="kartu text-tinta/70">Belum ada diskusi. Buka topik pertama di atas.</p>}
      </section>
    </div>
  );
}
