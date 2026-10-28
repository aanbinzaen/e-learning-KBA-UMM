import { wajibGuru } from "@/lib/guru";
import { tanggalPendek } from "@/lib/data";
import FormAksi from "@/components/FormAksi";
import TombolHapus from "@/components/TombolHapus";
import TombolGambarFaidah from "@/components/TombolGambarFaidah";
import { tambahFaidahGuru, ubahFaidahGuru, hapusFaidahGuru } from "./actions";

export const metadata = { title: "Faidah saya" };

function Bidang({ f }) {
  return (
    <>
      <div><label className="label">Judul faidah</label><input name="judul" defaultValue={f?.judul || ""} className="input" required maxLength={150} /></div>
      <div><label className="label">Kutipan Arab (opsional)</label><textarea name="teks_arab" rows="3" dir="rtl" defaultValue={f?.teks_arab || ""} className="input !py-3 font-arab text-xl" /></div>
      <div><label className="label">Isi faidah (beri baris kosong untuk paragraf baru)</label><textarea name="isi" rows="7" dir="auto" defaultValue={f?.isi || ""} className="input !py-3" required /></div>
      <div><label className="label">Sumber (opsional)</label><input name="sumber" defaultValue={f?.sumber || ""} placeholder="Contoh: Miftah Dar as-Sa'adah, Juz 1/399" className="input" /></div>
      <label className="flex items-center gap-3 font-medium"><input type="checkbox" name="terbit" defaultChecked={f ? f.terbit : true} className="h-6 w-6 accent-[#1E7B34]" /> Terbitkan di situs</label>
    </>
  );
}

export default async function FaidahGuru() {
  const { supabase, user, profil } = await wajibGuru();
  let q = supabase.from("faidah").select("id,judul,teks_arab,isi,sumber,penulis,terbit,dibuat_pada,dibuat_oleh").order("dibuat_pada", { ascending: false });
  if (profil.role !== "admin") q = q.eq("dibuat_oleh", user.id);
  const { data: daftar, error } = await q;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-hijau-tua">Faidah saya</h1>
        <p className="mt-1 text-sm leading-relaxed text-tinta/70">Tulis faidah ilmu, terbitkan di situs, lalu unduh flyernya (4:5, 9:16, 1:1, 5:4, atau 16:9) untuk dibagikan. Nama Anda otomatis tercantum sebagai penyampai.</p></div>
      {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">Fitur ini membutuhkan <b>supabase/10_faidah_pengajar.sql</b> (dan 09). Minta admin menjalankannya di SQL Editor Supabase.</p>}

      <details className="kartu" open={!daftar?.length}>
        <summary className="cursor-pointer font-semibold text-hijau">+ Tulis faidah baru</summary>
        <FormAksi aksi={tambahFaidahGuru} kirim="Simpan faidah" reset className="mt-4 space-y-4"><Bidang /></FormAksi>
      </details>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-hijau">{profil.role === "admin" ? "Semua faidah" : "Faidah yang saya tulis"} ({daftar?.length || 0})</h2>
        {(daftar || []).map((f) => (
          <article key={f.id} className="kartu space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0"><p className="font-semibold leading-snug">{f.judul}</p>
                <p className="text-xs text-tinta/60">{tanggalPendek(f.dibuat_pada)}{f.penulis ? ` · ${f.penulis}` : ""}</p></div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${f.terbit ? "bg-hijau-muda text-hijau-tua" : "bg-yellow-100 text-yellow-800"}`}>{f.terbit ? "Terbit" : "Draf"}</span>
            </div>
            <TombolGambarFaidah f={{ id: f.id, judul: f.judul, teks_arab: f.teks_arab, isi: f.isi, sumber: f.sumber, penulis: f.penulis }} pratinjau />
            <details className="rounded-2xl border-2 border-hijau/15 p-4"><summary className="cursor-pointer text-sm font-medium text-hijau">Ubah faidah</summary>
              <FormAksi aksi={ubahFaidahGuru.bind(null, f.id)} kirim="Simpan perubahan" className="mt-4 space-y-4"><Bidang f={f} /></FormAksi>
            </details>
            <TombolHapus aksi={hapusFaidahGuru.bind(null, f.id)} label="Hapus faidah ini" pesan="Hapus faidah ini?" />
          </article>
        ))}
        {!daftar?.length && !error && <p className="kartu text-tinta/70">Belum ada faidah. Tulis yang pertama di atas.</p>}
      </section>
    </div>
  );
}
