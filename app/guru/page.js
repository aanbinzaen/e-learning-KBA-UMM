import Link from "next/link";
import { wajibGuru } from "@/lib/guru";
import { tanggalIndo } from "@/lib/data";
import PilihGrup from "@/components/PilihGrup";
import FormAksi from "@/components/FormAksi";
import FormPdf from "./pertemuan/[id]/FormPdf";
import FormGambar from "./pertemuan/[id]/FormGambar";
import { tambahPertemuan, simpanTautanKelas, ubahAbsensiBuka, buatKuis, tambahRekaman, tambahCatatan } from "./actions";

export default async function Guru({ searchParams }) {
  const { supabase, grup } = await wajibGuru();
  const aktif = grup.find((g) => g.id === searchParams.grup) || grup[0];
  if (!aktif) return <p className="kartu">Anda belum mengampu grup. Hubungi admin agar akun Anda dihubungkan ke grup.</p>;

  const [{ data: daftar }, { data: tt }] = await Promise.all([
    supabase.from("pertemuan").select("id,judul,waktu,absensi_buka,materi(id),rekaman(id)").eq("grup_id", aktif.id).order("waktu", { ascending: false }),
    supabase.from("grup_tautan").select("link").eq("grup_id", aktif.id).maybeSingle(),
  ]);
  const kini = Date.now();
  const berlangsung = (daftar || []).find((x) => { const t = new Date(x.waktu).getTime(); return t >= kini - 3 * 3600e3 && t <= kini + 30 * 60e3; });
  const berikutnya = [...(daftar || [])].filter((x) => new Date(x.waktu).getTime() > kini).sort((a, b) => new Date(a.waktu) - new Date(b.waktu))[0];
  const dibuka = (daftar || []).filter((x) => x.absensi_buka);
  const target0 = (daftar || []).find((x) => x.id === searchParams.p);
  const fokus = berlangsung || dibuka[0] || berikutnya || (daftar || [])[0];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-hijau-tua">Kelola Kelas</h1>
      <PilihGrup grup={grup} aktifId={aktif.id} dasar="/guru" />
      <p className="text-tinta/80">{aktif.kelas?.jenis_kelamin} · {aktif.kelas?.tingkat} · <b>{aktif.nama}</b></p>

      <section className="kartu space-y-3 !border-2 !border-hijau/30">
        <h2 className="text-lg font-semibold text-hijau">Link kelas (Zoom / Meet / WhatsApp)</h2>
        <p className="text-sm text-tinta/70">Peserta menekan tombol Gabung Kelas di beranda mereka; link ini yang terbuka, dan kehadiran mereka tercatat otomatis pada jam kelas.</p>
        <FormAksi key={aktif.id} aksi={simpanTautanKelas.bind(null, aktif.id)} kirim="Simpan link kelas" className="space-y-3">
          <input name="link" type="url" inputMode="url" className="input" defaultValue={tt?.link || ""} placeholder="https://zoom.us/j/…  atau  https://meet.google.com/…" />
        </FormAksi>
        {tt?.link && <a href={tt.link} target="_blank" rel="noopener noreferrer" className="btn-kuning w-full">Buka link kelas</a>}
      </section>

      {fokus && (
        <section className="space-y-3 rounded-kartu bg-hijau p-5 text-white">
          <p className="text-sm text-white/80">Absensi · {berlangsung ? "kelas sedang berlangsung" : fokus === berikutnya ? "kelas berikutnya" : "pertemuan terakhir"}</p>
          <h2 className="text-lg font-bold">{fokus.judul}</h2>
          <p className="text-sm text-white/90">{tanggalIndo(fokus.waktu)} · Absen mandiri: <b>{fokus.absensi_buka ? "DIBUKA" : "ditutup"}</b></p>
          <div className="grid gap-2 sm:grid-cols-2">
            <form action={ubahAbsensiBuka.bind(null, fokus.id, !fokus.absensi_buka)}>
              <button className={`w-full ${fokus.absensi_buka ? "btn-garis !border-white !text-white" : "btn-kuning"}`}>{fokus.absensi_buka ? "Tutup absen mandiri" : "Buka absen mandiri"}</button>
            </form>
            <Link href={`/guru/pertemuan/${fokus.id}/absensi`} className="btn-garis !border-white !text-white w-full">Isi kehadiran manual</Link>
          </div>
        </section>
      )}

      {(target0 || fokus) && (() => {
        const t = target0 || fokus;
        const pilihan = (daftar || []).slice(0, 5);
        return (
          <section className="kartu space-y-3 !border-2 !border-kuning/60">
            <h2 className="text-lg font-semibold text-hijau">Tambah cepat</h2>
            <p className="text-sm text-tinta/70">Untuk pertemuan: <b>{t.judul}</b></p>
            {pilihan.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {pilihan.map((x) => (
                  <Link key={x.id} href={`/guru?grup=${aktif.id}&p=${x.id}`} className={`rounded-full border-2 px-3 py-1 text-xs font-semibold ${x.id === t.id ? "border-hijau bg-hijau text-white" : "border-hijau/30 text-hijau"}`}>{x.judul.length > 22 ? x.judul.slice(0, 22) + "…" : x.judul}</Link>
                ))}
              </div>
            )}
            <details className="rounded-2xl border-2 border-hijau/15 p-4"><summary className="cursor-pointer font-semibold text-hijau">📝 Buat kuis</summary>
              <FormAksi aksi={buatKuis.bind(null, t.id, aktif.id)} kirim="Buat kuis" reset className="mt-3 space-y-4">
                <div><label className="label" htmlFor="jk0">Judul kuis baru</label><input id="jk0" name="judul" className="input" placeholder="Kuis Pertemuan 1" required /></div>
                <p className="text-sm text-tinta/70">Setelah dibuat, buka kuisnya dari halaman pertemuan untuk menambah soal dan menerbitkannya.</p>
              </FormAksi></details>
            <details className="rounded-2xl border-2 border-hijau/15 p-4"><summary className="cursor-pointer font-semibold text-hijau">🎥 Tambah rekaman</summary>
              <FormAksi aksi={tambahRekaman.bind(null, t.id, aktif.id)} kirim="Tambah rekaman" reset className="mt-3 space-y-4">
                <div><label className="label" htmlFor="jr0">Judul rekaman</label><input id="jr0" name="judul" className="input" required /></div>
                <div><label className="label" htmlFor="lk0">Tautan YouTube</label><input id="lk0" name="link" className="input" placeholder="https://youtu.be/…" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label" htmlFor="km0">Klip mulai (opsional)</label><input id="km0" name="mulai" className="input" placeholder="10.22" inputMode="numeric" /></div>
                  <div><label className="label" htmlFor="ks0">Klip selesai (opsional)</label><input id="ks0" name="selesai" className="input" placeholder="15.45" inputMode="numeric" /></div>
                </div>
                <p className="text-sm text-tinta/70">Menit.detik, contoh 10.22. Kosongkan keduanya untuk rekaman utuh.</p>
              </FormAksi></details>
            <details className="rounded-2xl border-2 border-hijau/15 p-4"><summary className="cursor-pointer font-semibold text-hijau">📚 Tambah materi</summary>
              <div className="mt-3 space-y-3">
                <details className="rounded-2xl border-2 border-hijau/15 p-4"><summary className="cursor-pointer font-medium text-hijau">+ Unggah PDF</summary><div className="mt-3"><FormPdf pertemuanId={t.id} grupId={aktif.id} /></div></details>
                <details className="rounded-2xl border-2 border-hijau/15 p-4"><summary className="cursor-pointer font-medium text-hijau">+ Unggah gambar (PNG/JPG)</summary><div className="mt-3"><FormGambar pertemuanId={t.id} grupId={aktif.id} /></div></details>
                <details className="rounded-2xl border-2 border-hijau/15 p-4"><summary className="cursor-pointer font-medium text-hijau">+ Tulis catatan</summary>
                  <FormAksi aksi={tambahCatatan.bind(null, t.id, aktif.id)} kirim="Simpan catatan" reset className="mt-3 space-y-4">
                    <div><label className="label" htmlFor="jc0">Judul</label><input id="jc0" name="judul" className="input" required /></div>
                    <div><label className="label" htmlFor="isi0">Isi catatan</label><textarea id="isi0" name="catatan" rows="5" className="input !py-3" required /></div>
                  </FormAksi></details>
              </div>
            </details>
            <Link href={`/guru/pertemuan/${t.id}`} className="block text-center text-sm font-medium text-hijau underline">Buka halaman lengkap pertemuan ini</Link>
          </section>
        );
      })()}

      <details className="kartu" open={!daftar?.length}>
        <summary className="cursor-pointer font-semibold text-hijau">+ Tambah pertemuan</summary>
        <FormAksi aksi={tambahPertemuan.bind(null, aktif.id)} kirim="Buat pertemuan" className="mt-4 space-y-4">
          <div><label className="label" htmlFor="judul">Judul pertemuan</label><input id="judul" name="judul" className="input" placeholder="Pertemuan 1: Huruf Hijaiyah" required /></div>
          <div><label className="label" htmlFor="waktu">Tanggal dan jam (WIB)</label><input id="waktu" name="waktu" type="datetime-local" className="input" required /></div>
          <div><label className="label" htmlFor="keterangan">Keterangan (opsional)</label><textarea id="keterangan" name="keterangan" rows="2" className="input !py-3" /></div>
          <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="notif" defaultChecked className="h-6 w-6 accent-[#1E7B34]" /> Kirim notifikasi ke HP pengguna</label>
        </FormAksi>
      </details>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-hijau">Pertemuan ({daftar?.length || 0})</h2>
        {(daftar || []).map((p) => (
          <Link key={p.id} href={`/guru/pertemuan/${p.id}`} className="kartu !p-4 block hover:bg-hijau-muda">
            <p className="font-semibold">{p.judul}</p>
            <p className="text-sm text-hijau">{tanggalIndo(p.waktu)}</p>
            <p className="text-sm text-tinta/60">{p.materi.length} materi · {p.rekaman.length} rekaman</p>
          </Link>
        ))}
        {!daftar?.length && <p className="kartu text-tinta/70">Belum ada pertemuan. Mulai dengan tombol di atas.</p>}
      </section>
    </div>
  );
}
