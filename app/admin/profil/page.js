import { wajibAdmin } from "@/lib/auth";
import FormAksi from "@/components/FormAksi";
import TombolHapus from "@/components/TombolHapus";
import FotoUnggah from "@/components/FotoUnggah";
import { simpanPengajar, simpanPendiri, tambahPendiri, hapusPendiri } from "./actions";

export const metadata = { title: "Profil publik" };

export default async function ProfilPublik() {
  const { supabase } = await wajibAdmin();
  const [{ data: pengajar }, { data: pendiri }] = await Promise.all([
    supabase.from("pengajar").select("id,nama,nama_tampil,jabatan,bio,foto_url,urutan,tampil_publik,grup(nama)").order("urutan").order("nama"),
    supabase.from("pendiri").select("id,nama,peran,biografi,foto_url,urutan").order("urutan"),
  ]);

  const FormPendiri = ({ p }) => (
    <>
      <FotoUnggah awal={p?.foto_url} nama={p?.nama || "Pendiri"} folder="pendiri" />
      <div><label className="label">Nama lengkap dan gelar</label><input name="nama" defaultValue={p?.nama || ""} className="input" required /></div>
      <div><label className="label">Peran (satu peran per baris, atau pisahkan dengan titik)</label><textarea name="peran" rows="4" defaultValue={p?.peran || ""} className="input !py-3" /></div>
      <div><label className="label">Biografi (beri baris kosong untuk paragraf baru)</label><textarea name="biografi" rows="6" defaultValue={p?.biografi || ""} className="input !py-3" /></div>
      <div><label className="label">Urutan tampil (1, 2, …)</label><input name="urutan" type="number" defaultValue={p?.urutan ?? 0} className="input" /></div>
    </>
  );

  return (
    <div className="max-w-3xl space-y-8">
      <div><h1 className="text-2xl font-bold text-hijau-tua">Profil publik</h1>
        <p className="mt-1 text-sm text-tinta/70">Atur foto, jabatan, dan biografi yang tampil di halaman Pengajar dan Pendiri. Foto otomatis dipotong persegi dan dikecilkan.</p></div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-hijau">Pengajar ({pengajar?.length || 0})</h2>
        {(pengajar || []).map((p) => (
          <details key={p.id} className="kartu">
            <summary className="flex cursor-pointer items-center justify-between gap-3">
              <span className="min-w-0"><span className="block truncate font-semibold">{p.nama_tampil || p.nama}</span>
                <span className="text-xs text-tinta/60">{p.tampil_publik ? "Tampil di situs" : "Disembunyikan"} · {p.foto_url ? "ada foto" : "belum ada foto"} · {(p.grup || []).map((g) => g.nama).join(", ") || "belum punya grup"}</span></span>
              <span className="shrink-0 text-sm font-medium text-hijau">Ubah</span>
            </summary>
            <FormAksi aksi={simpanPengajar.bind(null, p.id)} kirim="Simpan profil" className="mt-4 space-y-4">
              <FotoUnggah awal={p.foto_url} nama={p.nama_tampil || p.nama} folder="pengajar" />
              <div><label className="label">Nama yang tampil di situs</label><input name="nama_tampil" defaultValue={p.nama_tampil || ""} placeholder={p.nama} className="input" />
                <p className="mt-1 text-xs text-tinta/60">Kosongkan untuk memakai: {p.nama}. Nama pada data impor tidak berubah.</p></div>
              <div><label className="label">Jabatan</label><input name="jabatan" defaultValue={p.jabatan || ""} placeholder="Pengajar Kelas Pemula Ikhwan" className="input" /></div>
              <div><label className="label">Biografi singkat</label><textarea name="bio" rows="5" defaultValue={p.bio || ""} className="input !py-3" /></div>
              <div><label className="label">Urutan tampil (1, 2, …)</label><input name="urutan" type="number" defaultValue={p.urutan ?? 0} className="input" /></div>
              <label className="flex items-center gap-3 font-medium"><input type="checkbox" name="tampil_publik" defaultChecked={p.tampil_publik} className="h-6 w-6 accent-[#1E7B34]" /> Tampilkan di halaman Pengajar</label>
            </FormAksi>
          </details>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-hijau">Pendiri ({pendiri?.length || 0})</h2>
        {(pendiri || []).map((p) => (
          <details key={p.id} className="kartu">
            <summary className="flex cursor-pointer items-center justify-between gap-3"><span className="min-w-0 truncate font-semibold">{p.nama}</span><span className="shrink-0 text-sm font-medium text-hijau">Ubah</span></summary>
            <FormAksi aksi={simpanPendiri.bind(null, p.id)} kirim="Simpan profil" className="mt-4 space-y-4"><FormPendiri p={p} /></FormAksi>
            <div className="mt-2"><TombolHapus aksi={hapusPendiri.bind(null, p.id)} label="Hapus pendiri ini" pesan="Hapus profil pendiri ini?" /></div>
          </details>
        ))}
        <details className="kartu" open={!pendiri?.length}>
          <summary className="cursor-pointer font-semibold text-hijau">+ Tambah pendiri</summary>
          <FormAksi aksi={tambahPendiri} kirim="Tambah pendiri" reset className="mt-4 space-y-4"><FormPendiri /></FormAksi>
        </details>
      </section>
    </div>
  );
}
