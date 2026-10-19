import { wajibAdmin } from "@/lib/auth";
import { tanggalIndo } from "@/lib/data";
import FormAksi from "@/components/FormAksi";
import TombolHapus from "@/components/TombolHapus";
import { tambahPengumuman, hapusPengumuman, tambahJadwal, hapusJadwal, simpanKonten, tambahPendiri, hapusPendiri } from "./actions";

export const metadata = { title: "Konten situs" };
const TEKS = [
  ["tentang_program", "Tentang program (Beranda)"], ["profil_sejarah", "Sejarah Rumah Dakwah"],
  ["profil_visi", "Visi"], ["profil_misi", "Misi"],
];

export default async function Konten() {
  const { supabase } = await wajibAdmin();
  const [{ data: pengumuman }, { data: jadwal }, { data: teks }, { data: pendiri }] = await Promise.all([
    supabase.from("pengumuman").select("id,judul,dibuat_pada").order("dibuat_pada", { ascending: false }),
    supabase.from("jadwal").select("id,judul,waktu_mulai").order("waktu_mulai", { ascending: false }).limit(20),
    supabase.from("konten_halaman").select("kunci,isi"),
    supabase.from("pendiri").select("id,nama,peran").order("urutan"),
  ]);
  const isi = Object.fromEntries((teks || []).map((t) => [t.kunci, t.isi]));
  const Kotak = ({ judul, children }) => <section className="kartu space-y-4"><h2 className="text-lg font-semibold text-hijau">{judul}</h2>{children}</section>;
  const Baris = ({ judul, sub, aksi }) => (
    <div className="flex items-center justify-between gap-2 rounded-2xl bg-hijau-muda px-4 py-2">
      <span className="min-w-0"><span className="block truncate font-medium">{judul}</span><span className="text-xs text-tinta/60">{sub}</span></span>{aksi}
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-hijau-tua">Konten situs</h1>

      <Kotak judul="Pengumuman">
        {(pengumuman || []).map((p) => <Baris key={p.id} judul={p.judul} sub={tanggalIndo(p.dibuat_pada)} aksi={<TombolHapus aksi={hapusPengumuman.bind(null, p.id)} />} />)}
        <FormAksi aksi={tambahPengumuman} kirim="Terbitkan" reset className="space-y-3 rounded-2xl border-2 border-hijau/15 p-4">
          <input name="judul" className="input" placeholder="Judul pengumuman" required aria-label="Judul pengumuman" />
          <textarea name="isi" rows="3" className="input !py-3" placeholder="Isi pengumuman" required aria-label="Isi pengumuman" />
        </FormAksi>
      </Kotak>

      <Kotak judul="Jadwal terdekat (tampil di Beranda)">
        {(jadwal || []).map((j) => <Baris key={j.id} judul={j.judul} sub={tanggalIndo(j.waktu_mulai)} aksi={<TombolHapus aksi={hapusJadwal.bind(null, j.id)} />} />)}
        <FormAksi aksi={tambahJadwal} kirim="Tambah jadwal" reset className="space-y-3 rounded-2xl border-2 border-hijau/15 p-4">
          <input name="judul" className="input" placeholder="Judul, mis. Kelas Pemula Ikhwan" required aria-label="Judul jadwal" />
          <input name="waktu" type="datetime-local" className="input" required aria-label="Tanggal dan jam (WIB)" />
          <input name="keterangan" className="input" placeholder="Keterangan (opsional)" aria-label="Keterangan" />
        </FormAksi>
      </Kotak>

      <Kotak judul="Teks halaman">
        {TEKS.map(([k, label]) => (
          <FormAksi key={k} aksi={simpanKonten.bind(null, k)} kirim={`Simpan: ${label}`} kelasTombol="btn-garis !border-hijau !text-hijau w-full" className="space-y-2">
            <label className="label" htmlFor={k}>{label}</label>
            <textarea id={k} name="isi" rows="4" defaultValue={isi[k] || ""} className="input !py-3" placeholder="Kosongkan untuk memakai teks bawaan" />
          </FormAksi>
        ))}
      </Kotak>

      <Kotak judul="Pendiri">
        {(pendiri || []).map((p) => <Baris key={p.id} judul={p.nama} sub={p.peran || ""} aksi={<TombolHapus aksi={hapusPendiri.bind(null, p.id)} />} />)}
        <FormAksi aksi={tambahPendiri} kirim="Tambah pendiri" reset className="space-y-3 rounded-2xl border-2 border-hijau/15 p-4">
          <input name="nama" className="input" placeholder="Nama" required aria-label="Nama" />
          <input name="peran" className="input" placeholder="Peran, mis. Pendiri" aria-label="Peran" />
          <textarea name="biografi" rows="3" className="input !py-3" placeholder="Biografi singkat" aria-label="Biografi" />
          <input name="foto_url" type="url" className="input" placeholder="Alamat foto (https://…), opsional" aria-label="Alamat foto" />
          <input name="urutan" type="number" className="input" placeholder="Urutan tampil (1, 2, …)" aria-label="Urutan" />
        </FormAksi>
      </Kotak>
    </div>
  );
}
