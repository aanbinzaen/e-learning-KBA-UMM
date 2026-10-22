import { wajibAdmin } from "@/lib/auth";
import { tanggalPendek } from "@/lib/data";
import FormAksi from "@/components/FormAksi";
import TombolHapus from "@/components/TombolHapus";
import { tambahFaidah, ubahFaidah, hapusFaidah } from "./actions";

export const metadata = { title: "Faidah ilmu" };

function Bidang({ f }) {
  return (
    <>
      <div><label className="label">Judul faidah</label><input name="judul" defaultValue={f?.judul || ""} className="input" required maxLength={150} /></div>
      <div><label className="label">Kutipan Arab (opsional)</label><textarea name="teks_arab" rows="3" dir="rtl" defaultValue={f?.teks_arab || ""} className="input !py-3 font-arab text-xl" /></div>
      <div><label className="label">Isi faidah (beri baris kosong untuk paragraf baru)</label><textarea name="isi" rows="7" dir="auto" defaultValue={f?.isi || ""} className="input !py-3" required /></div>
      <div><label className="label">Sumber (opsional)</label><input name="sumber" defaultValue={f?.sumber || ""} placeholder="Contoh: Miftah Dar as-Sa'adah, Juz 1/399" className="input" /></div>
      <label className="flex items-center gap-3 font-medium"><input type="checkbox" name="terbit" defaultChecked={f ? f.terbit : true} className="h-6 w-6 accent-[#1E7B34]" /> Terbitkan (tampil di situs)</label>
    </>
  );
}

export default async function AdminFaidah() {
  const { supabase } = await wajibAdmin();
  const { data: daftar, error } = await supabase.from("faidah").select("id,judul,teks_arab,isi,sumber,terbit,dibuat_pada").order("dibuat_pada", { ascending: false });
  return (
    <div className="max-w-3xl space-y-6">
      <div><h1 className="text-2xl font-bold text-hijau-tua">Faidah ilmu</h1>
        <p className="mt-1 text-sm text-tinta/70">Faidah yang terbit paling baru tampil menonjol di Beranda. Semua faidah terbit ada di halaman Faidah.</p></div>
      {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">Tabel faidah belum ada. Jalankan <b>supabase/09_faidah.sql</b> di SQL Editor Supabase.</p>}

      <details className="kartu" open={!daftar?.length}>
        <summary className="cursor-pointer font-semibold text-hijau">+ Tambah faidah baru</summary>
        <FormAksi aksi={tambahFaidah} kirim="Simpan faidah" reset className="mt-4 space-y-4"><Bidang /></FormAksi>
      </details>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-hijau">Daftar faidah ({daftar?.length || 0})</h2>
        {(daftar || []).map((f) => (
          <details key={f.id} className="kartu">
            <summary className="flex cursor-pointer items-center justify-between gap-3">
              <span className="min-w-0"><span className="block truncate font-semibold">{f.judul}</span>
                <span className="text-xs text-tinta/60">{tanggalPendek(f.dibuat_pada)} · {f.terbit ? "Terbit" : "Draf (disembunyikan)"}</span></span>
              <span className="shrink-0 text-sm font-medium text-hijau">Ubah</span>
            </summary>
            <FormAksi aksi={ubahFaidah.bind(null, f.id)} kirim="Simpan perubahan" className="mt-4 space-y-4"><Bidang f={f} /></FormAksi>
            <div className="mt-2"><TombolHapus aksi={hapusFaidah.bind(null, f.id)} label="Hapus faidah ini" pesan="Hapus faidah ini?" /></div>
          </details>
        ))}
      </section>
    </div>
  );
}
