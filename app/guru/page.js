import Link from "next/link";
import { wajibGuru } from "@/lib/guru";
import { tanggalIndo } from "@/lib/data";
import PilihGrup from "@/components/PilihGrup";
import FormAksi from "@/components/FormAksi";
import { tambahPertemuan } from "./actions";

export default async function Guru({ searchParams }) {
  const { supabase, grup } = await wajibGuru();
  const aktif = grup.find((g) => g.id === searchParams.grup) || grup[0];
  if (!aktif) return <p className="kartu">Anda belum mengampu grup. Hubungi admin agar akun Anda dihubungkan ke grup.</p>;

  const { data: daftar } = await supabase.from("pertemuan")
    .select("id,judul,waktu,materi(id),rekaman(id)").eq("grup_id", aktif.id).order("waktu", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-hijau-tua">Kelola Kelas</h1>
      <PilihGrup grup={grup} aktifId={aktif.id} dasar="/guru" />
      <p className="text-tinta/80">{aktif.kelas?.jenis_kelamin} · {aktif.kelas?.tingkat} · <b>{aktif.nama}</b></p>

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
