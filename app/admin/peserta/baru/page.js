import Link from "next/link";
import { wajibAdmin } from "@/lib/auth";
import FormAksi from "@/components/FormAksi";
import { tambahPesertaBaru } from "./actions";

export const metadata = { title: "Tambah peserta" };

export default async function PesertaBaru() {
  const { supabase } = await wajibAdmin();
  const { data: grup } = await supabase.from("grup").select("id,nama,kelas(jenis_kelamin,tingkat)").order("nama");
  const urut = [...(grup || [])].sort((a, b) => `${a.kelas.jenis_kelamin}${a.kelas.tingkat}${a.nama}`.localeCompare(`${b.kelas.jenis_kelamin}${b.kelas.tingkat}${b.nama}`, "id"));
  return (
    <div className="max-w-xl space-y-4">
      <Link href="/admin/peserta" className="text-sm font-medium text-hijau underline">← Kembali ke daftar peserta</Link>
      <h1 className="text-2xl font-bold text-hijau-tua">Tambah peserta</h1>
      <p className="text-sm text-tinta/70">Kode peserta dan password awal dibuat otomatis dan ditampilkan setelah disimpan. Jenis kelamin dan kelas mengikuti grup yang dipilih.</p>
      <div className="kartu">
        <FormAksi aksi={tambahPesertaBaru} kirim="Tambah peserta" reset>
          <div><label className="label" htmlFor="nama">Nama lengkap</label><input id="nama" name="nama_lengkap" className="input" required /></div>
          <div><label className="label" htmlFor="grup">Grup</label>
            <select id="grup" name="grup_id" className="input" required defaultValue="">
              <option value="" disabled>Pilih grup…</option>
              {urut.map((g) => <option key={g.id} value={g.id}>{g.kelas.jenis_kelamin} · {g.kelas.tingkat} · {g.nama}</option>)}
            </select></div>
          <div><label className="label" htmlFor="wa">Nomor WhatsApp (opsional)</label><input id="wa" name="whatsapp" inputMode="tel" placeholder="0812xxxxxxx" className="input" /></div>
          <div><label className="label" htmlFor="email">Email (opsional)</label><input id="email" name="email" type="email" className="input" /></div>
        </FormAksi>
      </div>
    </div>
  );
}
