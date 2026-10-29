import { wajibAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import FormAksi from "@/components/FormAksi";
import { siarkanNotifikasi } from "./actions";

export const metadata = { title: "Notifikasi" };

export default async function Notifikasi() {
  const { supabase } = await wajibAdmin();
  const db = supabaseAdmin();
  const [{ data: langganan, error }, { data: grup }, { count: peserta }] = await Promise.all([
    db.from("push_langganan").select("profile_id").limit(5000),
    supabase.from("grup").select("id,nama,kelas(jenis_kelamin,tingkat)").order("nama"),
    supabase.from("peserta_grup").select("profile_id", { count: "exact", head: true }),
  ]);
  const perangkat = langganan?.length || 0, pengguna = new Set((langganan || []).map((x) => x.profile_id)).size;

  return (
    <div className="max-w-2xl space-y-6">
      <div><h1 className="text-2xl font-bold text-hijau-tua">Notifikasi</h1>
        <p className="mt-1 text-sm leading-relaxed text-tinta/70">Notifikasi otomatis terkirim saat ada pertemuan baru, absensi dibuka, kuis diterbitkan, nilai esai keluar, pengumuman, jadwal, dan faidah. Di sini Anda bisa mengirim pesan khusus.</p></div>
      {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">Tabel notifikasi belum ada. Jalankan <b>supabase/11_notifikasi.sql</b> di SQL Editor Supabase.</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="kartu !p-4"><p className="text-3xl font-bold text-hijau">{perangkat}</p><p className="text-sm text-tinta/70">Perangkat aktif</p></div>
        <div className="kartu !p-4"><p className="text-3xl font-bold text-hijau">{pengguna}</p><p className="text-sm text-tinta/70">Pengguna ({peserta ? Math.round((pengguna / peserta) * 100) : 0}% dari peserta)</p></div>
      </div>

      <section className="kartu">
        <h2 className="mb-3 text-lg font-semibold text-hijau">Kirim pesan khusus</h2>
        <FormAksi aksi={siarkanNotifikasi} kirim="Kirim notifikasi" reset>
          <div><label className="label" htmlFor="judul">Judul (tampil tebal)</label><input id="judul" name="judul" maxLength={80} className="input" placeholder="Pengingat kelas malam ini" required /></div>
          <div><label className="label" htmlFor="isi">Isi pesan</label><textarea id="isi" name="isi" rows="3" maxLength={160} className="input !py-3" placeholder="Kelas dimulai pukul 20.00 WIB. Jangan lupa hadir." /></div>
          <div><label className="label" htmlFor="target">Kirim kepada</label>
            <select id="target" name="target" className="input" defaultValue="semua"><option value="semua">Semua pengguna</option>
              {(grup || []).map((g) => <option key={g.id} value={g.id}>Peserta {g.kelas?.jenis_kelamin} · {g.nama}</option>)}</select></div>
          <div><label className="label" htmlFor="url">Halaman yang dibuka saat diketuk (opsional)</label><input id="url" name="url" className="input" placeholder="/dashboard/kelas" /></div>
        </FormAksi>
      </section>
    </div>
  );
}
