import { wajibGuru } from "@/lib/guru";
import { ringkasWIB } from "@/lib/waktu";
import TombolHapus from "@/components/TombolHapus";
import FormBahan from "./FormBahan";
import { hapusBahan } from "./actions";

export const metadata = { title: "Perpustakaan pengajar" };
const KAT = { kitab: "Kitab / referensi", materi: "Bahan materi", lainnya: "Lainnya" };
const WARNA = { kitab: "bg-kuning/25 text-hijau-tua", materi: "bg-hijau-muda text-hijau-tua", lainnya: "bg-krem text-tinta/70 border border-hijau/15" };
const ukuranBerkas = (n) => (!n ? "" : n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default async function Perpustakaan({ searchParams }) {
  const { supabase, user, profil } = await wajibGuru();
  const q = String(searchParams.q || "").replace(/[%_,()*\\]/g, " ").trim().slice(0, 80);
  const kat = Object.keys(KAT).includes(searchParams.kat) ? searchParams.kat : "";
  let query = supabase.from("ruang_bahan").select("id,judul,deskripsi,kategori,jenis,nama_berkas,ukuran,tautan,penulis,dibuat_oleh,dibuat_pada").order("dibuat_pada", { ascending: false }).limit(200);
  if (kat) query = query.eq("kategori", kat);
  if (q) query = query.or(`judul.ilike.%${q}%,deskripsi.ilike.%${q}%`);
  const { data: daftar, error } = await query;

  return (
    <div className="space-y-5">
      {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">Perpustakaan belum siap. Minta admin menjalankan <b>supabase/12_ruang_pengajar.sql</b> di SQL Editor Supabase.</p>}

      <details className="kartu"><summary className="cursor-pointer font-semibold text-hijau">+ Tambah bahan atau kitab rujukan</summary><FormBahan userId={user.id} /></details>

      <form method="get" className="kartu grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input name="q" defaultValue={q} placeholder="Cari judul atau keterangan…" className="input" aria-label="Cari" />
        <select name="kat" defaultValue={kat} className="input" aria-label="Jenis"><option value="">Semua jenis</option>{Object.entries(KAT).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <button className="btn-hijau">Cari</button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-hijau">Bahan ({daftar?.length || 0})</h2>
        {(daftar || []).map((b) => (
          <article key={b.id} className="kartu space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0"><p className="font-semibold leading-snug" dir="auto">{b.judul}</p>
                <p className="text-xs text-tinta/60">{b.penulis || "Pengajar"} · {ringkasWIB(b.dibuat_pada)}{b.jenis === "berkas" && b.ukuran ? ` · ${ukuranBerkas(b.ukuran)}` : ""}</p></div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${WARNA[b.kategori]}`}>{KAT[b.kategori]}</span>
            </div>
            {b.deskripsi && <p className="whitespace-pre-line text-sm leading-relaxed text-tinta/85" dir="auto">{b.deskripsi}</p>}
            <div className="flex flex-wrap items-center gap-2">
              {b.jenis === "berkas"
                ? <a href={`/guru/ruang/berkas/${b.id}`} target="_blank" rel="noopener noreferrer" className="btn-hijau !min-h-[44px] !px-5 text-sm">Buka / unduh{b.nama_berkas ? ` (${b.nama_berkas.split(".").pop().toUpperCase()})` : ""}</a>
                : <a href={b.tautan} target="_blank" rel="noopener noreferrer" className="btn-hijau !min-h-[44px] !px-5 text-sm">Buka tautan</a>}
              {(b.dibuat_oleh === user.id || profil.role === "admin") && <TombolHapus aksi={hapusBahan.bind(null, b.id)} pesan="Hapus bahan ini dari perpustakaan?" />}
            </div>
          </article>
        ))}
        {!daftar?.length && !error && <p className="kartu text-tinta/70">{q || kat ? "Tidak ada bahan yang cocok." : "Belum ada bahan. Tambahkan yang pertama di atas."}</p>}
      </section>
    </div>
  );
}
