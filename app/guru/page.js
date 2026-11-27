import Link from "next/link";
import { wajibGuru } from "@/lib/guru";
import { tanggalIndo } from "@/lib/data";
import PilihGrup from "@/components/PilihGrup";
import FormAksi from "@/components/FormAksi";
import FormPdf from "./pertemuan/[id]/FormPdf";
import FormGambar from "./pertemuan/[id]/FormGambar";
import PanelAksi from "@/components/PanelAksi";
import TombolGambarFaidah from "@/components/TombolGambarFaidah";
import { tambahFaidahGuru } from "./faidah/actions";
import { tambahPertemuan, simpanTautanKelas, ubahAbsensiBuka, buatKuis, tambahRekaman, tambahCatatan } from "./actions";

export default async function Guru({ searchParams }) {
  const { supabase, user, profil, grup } = await wajibGuru();
  const aktif = grup.find((g) => g.id === searchParams.grup) || grup[0];
  if (!aktif) return <p className="kartu">Anda belum mengampu grup. Hubungi admin agar akun Anda dihubungkan ke grup.</p>;

  let qf = supabase.from("faidah").select("id,judul,teks_arab,isi,sumber,penulis").order("dibuat_pada", { ascending: false }).limit(3);
  if (profil.role !== "admin") qf = qf.eq("dibuat_oleh", user.id);
  const [{ data: daftar }, { data: tt }, { data: faidahSaya }] = await Promise.all([
    supabase.from("pertemuan").select("id,judul,waktu,absensi_buka,materi(id),rekaman(id)").eq("grup_id", aktif.id).order("waktu", { ascending: false }),
    supabase.from("grup_tautan").select("link").eq("grup_id", aktif.id).maybeSingle(),
    qf,
  ]);
  const kini = Date.now();
  const berlangsung = (daftar || []).find((x) => { const t = new Date(x.waktu).getTime(); return t >= kini - 3 * 3600e3 && t <= kini + 30 * 60e3; });
  const berikutnya = [...(daftar || [])].filter((x) => new Date(x.waktu).getTime() > kini).sort((a, b) => new Date(a.waktu) - new Date(b.waktu))[0];
  const dibuka = (daftar || []).filter((x) => x.absensi_buka);
  const fokus = berlangsung || dibuka[0] || berikutnya || (daftar || [])[0];
  const t = (daftar || []).find((x) => x.id === searchParams.p) || fokus;
  const pilihan = (daftar || []).slice(0, 5);

  const item = [];
  if (t) {
    item.push({ id: "kuis", ikon: "kuis", label: "Kuis", judul: "Buat kuis", isi: (
      <FormAksi aksi={buatKuis.bind(null, t.id, aktif.id)} kirim="Buat kuis" reset className="space-y-4">
        <div><label className="label" htmlFor="jk0">Judul kuis baru</label><input id="jk0" name="judul" className="input" placeholder="Kuis Pertemuan 1" required /></div>
        <p className="text-sm text-tinta/70">Setelah dibuat, Anda langsung dibawa ke halaman kuis untuk menambah soal dan menerbitkannya.</p>
      </FormAksi>) });
    item.push({ id: "rekaman", ikon: "rekaman", label: "Rekaman", judul: "Tambah rekaman", isi: (
      <FormAksi aksi={tambahRekaman.bind(null, t.id, aktif.id)} kirim="Tambah rekaman" reset className="space-y-4">
        <div><label className="label" htmlFor="jr0">Judul rekaman</label><input id="jr0" name="judul" className="input" required /></div>
        <div><label className="label" htmlFor="lk0">Tautan YouTube</label><input id="lk0" name="link" className="input" placeholder="https://youtu.be/…" required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="km0">Klip mulai (opsional)</label><input id="km0" name="mulai" className="input" placeholder="10.22" inputMode="numeric" /></div>
          <div><label className="label" htmlFor="ks0">Klip selesai (opsional)</label><input id="ks0" name="selesai" className="input" placeholder="15.45" inputMode="numeric" /></div>
        </div>
        <p className="text-sm text-tinta/70">Menit.detik, contoh 10.22. Kosongkan keduanya untuk rekaman utuh.</p>
      </FormAksi>) });
    item.push({ id: "materi", ikon: "materi", label: "Materi", judul: "Tambah materi", isi: (
      <div className="space-y-3">
        <details className="rounded-2xl border-2 border-hijau/15 p-4"><summary className="cursor-pointer font-medium text-hijau">+ Unggah PDF</summary><div className="mt-3"><FormPdf pertemuanId={t.id} grupId={aktif.id} /></div></details>
        <details className="rounded-2xl border-2 border-hijau/15 p-4"><summary className="cursor-pointer font-medium text-hijau">+ Unggah gambar (PNG/JPG)</summary><div className="mt-3"><FormGambar pertemuanId={t.id} grupId={aktif.id} /></div></details>
        <details className="rounded-2xl border-2 border-hijau/15 p-4"><summary className="cursor-pointer font-medium text-hijau">+ Tulis catatan</summary>
          <FormAksi aksi={tambahCatatan.bind(null, t.id, aktif.id)} kirim="Simpan catatan" reset className="mt-3 space-y-4">
            <div><label className="label" htmlFor="jc0">Judul</label><input id="jc0" name="judul" className="input" required /></div>
            <div><label className="label" htmlFor="isi0">Isi catatan</label><textarea id="isi0" name="catatan" rows="5" className="input !py-3" required /></div>
          </FormAksi></details>
      </div>) });
  }
  item.push({ id: "faidah", ikon: "faidah", label: "Faidah", judul: "Tulis faidah & buat flyer", isi: (
    <div className="space-y-4">
      <FormAksi aksi={tambahFaidahGuru} kirim="Simpan & terbitkan faidah" reset className="space-y-4">
        <div><label className="label" htmlFor="fj">Judul faidah</label><input id="fj" name="judul" className="input" required maxLength={150} /></div>
        <div><label className="label" htmlFor="fa">Kutipan Arab (opsional)</label><textarea id="fa" name="teks_arab" rows="2" dir="rtl" className="input !py-3 font-arab text-xl" /></div>
        <div><label className="label" htmlFor="fi">Isi faidah</label><textarea id="fi" name="isi" rows="5" dir="auto" className="input !py-3" required /></div>
        <div><label className="label" htmlFor="fs">Sumber (opsional)</label><input id="fs" name="sumber" className="input" placeholder="Contoh: Miftah Dar as-Sa'adah, Juz 1/399" /></div>
        <input type="hidden" name="terbit" value="on" />
        <p className="text-sm text-tinta/70">Setelah disimpan, flyernya bisa diunduh atau dibagikan dari daftar di bawah.</p>
      </FormAksi>
      {faidahSaya?.length > 0 && (
        <div className="space-y-4 border-t border-hijau/15 pt-4">
          <p className="font-semibold text-hijau-tua">Flyer dari faidah terbaru</p>
          {faidahSaya.map((f) => (
            <div key={f.id} className="space-y-2 rounded-2xl bg-hijau-muda/50 p-3">
              <p className="font-medium leading-snug">{f.judul}</p>
              <TombolGambarFaidah f={{ id: f.id, judul: f.judul, teks_arab: f.teks_arab, isi: f.isi, sumber: f.sumber, penulis: f.penulis }} />
            </div>
          ))}
          <Link href="/guru/faidah" className="block text-center text-sm font-medium text-hijau underline">Kelola semua faidah</Link>
        </div>
      )}
    </div>) });
  item.push({ id: "link", ikon: "link", label: "Link kelas", judul: "Link kelas (Zoom / Meet / WhatsApp)", sorot: !tt?.link, isi: (
    <div className="space-y-3">
      <p className="text-sm text-tinta/70">Peserta menekan <b>Gabung Kelas</b> di beranda mereka; link ini yang terbuka, dan kehadiran mereka tercatat otomatis pada jam kelas.</p>
      <FormAksi key={aktif.id} aksi={simpanTautanKelas.bind(null, aktif.id)} kirim="Simpan link kelas" className="space-y-3">
        <input name="link" type="url" inputMode="url" className="input" defaultValue={tt?.link || ""} placeholder="https://zoom.us/j/…  atau  https://meet.google.com/…" aria-label="Link kelas" />
      </FormAksi>
    </div>) });
  item.push({ id: "pertemuan", ikon: "pertemuan", label: "Pertemuan", judul: "Tambah pertemuan", isi: (
    <FormAksi aksi={tambahPertemuan.bind(null, aktif.id)} kirim="Buat pertemuan" className="space-y-4">
      <div><label className="label" htmlFor="judul">Judul pertemuan</label><input id="judul" name="judul" className="input" placeholder="Pertemuan 1: Huruf Hijaiyah" required /></div>
      <div><label className="label" htmlFor="waktu">Tanggal dan jam (WIB)</label><input id="waktu" name="waktu" type="datetime-local" className="input" required /></div>
      <div><label className="label" htmlFor="keterangan">Keterangan (opsional)</label><textarea id="keterangan" name="keterangan" rows="2" className="input !py-3" /></div>
      <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="notif" defaultChecked className="h-6 w-6 accent-[#1E7B34]" /> Kirim notifikasi ke HP pengguna</label>
    </FormAksi>) });
  item.push({ id: "reels", ikon: "reels", label: "Reels", href: "/guru/reels" });
  item.push({ id: "pengumuman", ikon: "pengumuman", label: "Pengumuman", href: "/guru/pengumuman" });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-hijau-tua">Kelola Kelas</h1>
        <PilihGrup grup={grup} aktifId={aktif.id} dasar="/guru" />
        <p className="text-sm text-tinta/80">{aktif.kelas?.jenis_kelamin} · {aktif.kelas?.tingkat} · <b>{aktif.nama}</b></p>
      </div>

      {fokus ? (
        <section className="space-y-3 rounded-kartu bg-hijau p-4 text-white">
          <div>
            <p className="text-xs text-white/75">{berlangsung ? "Kelas sedang berlangsung" : fokus === berikutnya ? "Kelas berikutnya" : "Pertemuan terakhir"} · Absen mandiri <b>{fokus.absensi_buka ? "DIBUKA" : "ditutup"}</b></p>
            <h2 className="mt-0.5 text-lg font-bold leading-snug">{fokus.judul}</h2>
            <p className="text-sm text-white/90">{tanggalIndo(fokus.waktu)}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {tt?.link ? <a href={tt.link} target="_blank" rel="noopener noreferrer" className="btn-kuning col-span-2 !min-h-[46px] w-full">Buka link kelas</a> : null}
            <form action={ubahAbsensiBuka.bind(null, fokus.id, !fokus.absensi_buka)}>
              <button className={`!min-h-[44px] w-full text-sm ${fokus.absensi_buka ? "btn-garis !border-white !text-white" : "btn-kuning"}`}>{fokus.absensi_buka ? "Tutup absen" : "Buka absen mandiri"}</button>
            </form>
            <Link href={`/guru/pertemuan/${fokus.id}/absensi`} className="btn-garis !min-h-[44px] w-full !border-white text-sm !text-white">Absen manual</Link>
          </div>
        </section>
      ) : (
        <p className="kartu text-tinta/80">Belum ada pertemuan. Ketuk <b>Pertemuan</b> di bawah untuk menambah.</p>
      )}

      <section className="space-y-3" aria-label="Aksi cepat">
                {t && pilihan.length > 1 && (
          <div className="space-y-1.5">
            <p className="text-xs text-tinta/70">Kuis, rekaman & materi masuk ke: <b>{t.judul}</b></p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {pilihan.map((x) => (
                <Link key={x.id} href={`/guru?grup=${aktif.id}&p=${x.id}`} className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${x.id === t.id ? "border-hijau bg-hijau text-white" : "border-hijau/30 text-hijau"}`}>{x.judul.length > 22 ? x.judul.slice(0, 22) + "…" : x.judul}</Link>
              ))}
            </div>
          </div>
        )}
        {t && pilihan.length <= 1 && <p className="text-xs text-tinta/70">Kuis, rekaman & materi masuk ke: <b>{t.judul}</b></p>}
        <PanelAksi item={item} />
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-hijau">Pertemuan ({daftar?.length || 0})</h2>
        {(daftar || []).slice(0, 3).map((p) => (
          <Link key={p.id} href={`/guru/pertemuan/${p.id}`} className="kartu !p-3 block hover:bg-hijau-muda">
            <p className="font-semibold leading-snug">{p.judul}</p>
            <p className="text-xs text-tinta/70">{tanggalIndo(p.waktu)} · {p.materi.length} materi · {p.rekaman.length} rekaman</p>
          </Link>
        ))}
        {(daftar || []).length > 3 && (
          <details className="space-y-2">
            <summary className="cursor-pointer text-sm font-medium text-hijau underline">Tampilkan {(daftar || []).length - 3} pertemuan lainnya</summary>
            <div className="mt-2 space-y-2">
              {(daftar || []).slice(3).map((p) => (
                <Link key={p.id} href={`/guru/pertemuan/${p.id}`} className="kartu !p-3 block hover:bg-hijau-muda">
                  <p className="font-semibold leading-snug">{p.judul}</p>
                  <p className="text-xs text-tinta/70">{tanggalIndo(p.waktu)} · {p.materi.length} materi · {p.rekaman.length} rekaman</p>
                </Link>
              ))}
            </div>
          </details>
        )}
        {!daftar?.length && <p className="kartu text-tinta/70">Belum ada pertemuan.</p>}
      </section>
    </div>
  );
}
