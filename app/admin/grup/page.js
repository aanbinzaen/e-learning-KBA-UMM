import { wajibAdmin } from "@/lib/auth";
import { simpanGrup, tambahGrup, tambahPengajar, buatAkunPengajar } from "./actions";

export const metadata = { title: "Kelas dan grup" };

export default async function KelolaGrup() {
  const { supabase } = await wajibAdmin();
  const [{ data: kelas }, { data: grup }, { data: pengajar }, { data: tautan }, { data: anggota }, { data: akun }] = await Promise.all([
    supabase.from("kelas").select("id,jenis_kelamin,tingkat").order("jenis_kelamin").order("tingkat"),
    supabase.from("grup").select("id,nama,kelas_id,pengajar_id").order("nama"),
    supabase.from("pengajar").select("id,nama,profile_id").order("nama"),
    supabase.from("grup_tautan").select("grup_id,link"),
    supabase.from("peserta_grup").select("grup_id"),
    supabase.from("profiles").select("id,kode").eq("role", "pengajar"),
  ]);
  const link = Object.fromEntries((tautan || []).map((t) => [t.grup_id, t.link]));
  const jumlah = {}; (anggota || []).forEach((a) => { jumlah[a.grup_id] = (jumlah[a.grup_id] || 0) + 1; });
  const kodeAkun = Object.fromEntries((akun || []).map((a) => [a.id, a.kode]));
  const Pilih = ({ nilai }) => (
    <select name="pengajar_id" defaultValue={nilai || ""} className="input" aria-label="Pengajar">
      <option value="">– belum ada –</option>{(pengajar || []).map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
    </select>
  );
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-hijau-tua">Kelas dan grup</h1>
      {(kelas || []).map((k) => (
        <section key={k.id} className="space-y-3">
          <h2 className="text-lg font-semibold text-hijau">{k.jenis_kelamin} · {k.tingkat}</h2>
          {(grup || []).filter((g) => g.kelas_id === k.id).map((g) => (
            <form key={g.id} action={simpanGrup} className="kartu grid gap-3 md:grid-cols-2">
              <input type="hidden" name="id" value={g.id} />
              <div><label className="label">Nama grup ({jumlah[g.id] || 0} peserta)</label><input name="nama" defaultValue={g.nama} className="input" required /></div>
              <div><label className="label">Pengajar penanggung jawab</label><Pilih nilai={g.pengajar_id} /></div>
              <div className="md:col-span-2"><label className="label">Link Gabung Kelas (Zoom / Meet / grup WhatsApp)</label><input name="link" type="url" defaultValue={link[g.id] || ""} className="input" placeholder="https://" /></div>
              <button className="btn-hijau md:col-span-2">Simpan grup</button>
            </form>
          ))}
          <details className="kartu">
            <summary className="cursor-pointer font-medium text-hijau">+ Tambah grup di kelas ini</summary>
            <form action={tambahGrup} className="mt-3 grid gap-3 md:grid-cols-2">
              <input type="hidden" name="kelas_id" value={k.id} />
              <input name="nama" className="input" placeholder="Nama grup" required />
              <Pilih />
              <button className="btn-hijau md:col-span-2">Tambah grup</button>
            </form>
          </details>
        </section>
      ))}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-hijau">Pengajar</h2>
        <div className="kartu !p-0 overflow-hidden">
          {(pengajar || []).map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-hijau/10 p-4 last:border-0">
              <div><p className="font-medium">{p.nama}</p>
                <p className="text-sm text-tinta/60">{p.profile_id ? `Akun: ${kodeAkun[p.profile_id] || "ada"}` : "Belum punya akun login"}</p></div>
              {!p.profile_id && <form action={buatAkunPengajar}><input type="hidden" name="id" value={p.id} /><button className="btn-kuning !min-h-[44px]">Buat akun</button></form>}
            </div>
          ))}
        </div>
        <form action={tambahPengajar} className="kartu flex flex-wrap gap-3">
          <input name="nama" className="input flex-1" placeholder="Nama pengajar baru, mis. Ustadz Fulan, S.Pd" required />
          <button className="btn-hijau">Tambah pengajar</button>
        </form>
        <p className="text-sm text-tinta/70">Setelah akun pengajar dibuat, kode dan password awalnya muncul di bagian Pengajar pada menu Kode &amp; Password.</p>
      </section>
    </div>
  );
}
