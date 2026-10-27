import { wajibAdmin } from "@/lib/auth";
import FormAksi from "@/components/FormAksi";
import { buatMaster, resetSandiMaster, ubahAktifMaster } from "./actions";

export const metadata = { title: "Akun master" };

export default async function AkunMaster() {
  const { supabase, user } = await wajibAdmin();
  const { data: daftar } = await supabase.from("profiles").select("id,kode,nama_lengkap,aktif,wajib_ganti_password").eq("role", "admin").order("kode");
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hijau-tua">Akun master</h1>
        <p className="mt-1 text-sm leading-relaxed text-tinta/70">Akun master dapat mengelola seluruh situs dan membuka <b>semua kelas</b> (menu <i>Kelola Kelas</i> dan <i>Lihat Kelas</i>). Berikan hanya kepada orang yang benar-benar dipercaya.</p>
      </div>

      <section className="kartu">
        <h2 className="mb-3 text-lg font-semibold text-hijau">Buat akun master baru</h2>
        <FormAksi aksi={buatMaster} kirim="Buat akun master" reset>
          <div><label className="label" htmlFor="nama">Nama lengkap</label><input id="nama" name="nama_lengkap" className="input" required /></div>
          <div><label className="label" htmlFor="jk">Jenis kelamin</label>
            <select id="jk" name="jenis_kelamin" className="input" defaultValue="Ikhwan"><option>Ikhwan</option><option>Akhwat</option></select></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="wa">WhatsApp (opsional)</label><input id="wa" name="whatsapp" inputMode="tel" className="input" placeholder="0812xxxxxxx" /></div>
            <div><label className="label" htmlFor="em">Email (opsional)</label><input id="em" name="email" type="email" className="input" /></div>
          </div>
        </FormAksi>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-hijau">Akun master yang ada ({daftar?.length || 0})</h2>
        {(daftar || []).map((a) => (
          <article key={a.id} className="kartu space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><p className="font-semibold">{a.nama_lengkap} {a.id === user.id && <span className="ml-1 rounded-full bg-hijau-muda px-2 py-0.5 text-xs text-hijau">Anda</span>}</p>
                <p className="font-mono text-sm text-tinta/70">{a.kode}</p></div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${a.aktif ? "bg-hijau-muda text-hijau-tua" : "bg-red-100 text-red-700"}`}>{!a.aktif ? "Nonaktif" : a.wajib_ganti_password ? "Belum ganti password" : "Aktif"}</span>
            </div>
            <div className="flex flex-wrap items-start gap-3">
              <FormAksi aksi={resetSandiMaster.bind(null, a.id)} kirim="Reset password" kelasTombol="btn-garis !min-h-[44px] !border-hijau !px-4 text-sm !text-hijau" className="space-y-2" />
              {a.id !== user.id && (
                <form action={ubahAktifMaster.bind(null, a.id, !a.aktif)}>
                  <button className="rounded-2xl border-2 border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50">{a.aktif ? "Nonaktifkan" : "Aktifkan kembali"}</button>
                </form>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
