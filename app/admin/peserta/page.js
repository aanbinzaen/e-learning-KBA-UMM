import Link from "next/link";
import { wajibAdmin } from "@/lib/auth";

export const metadata = { title: "Peserta" };

export default async function DaftarPeserta({ searchParams }) {
  const { supabase } = await wajibAdmin();
  const { q = "", jk = "", grup = "" } = searchParams;
  const { data: pengaturan } = await supabase.from("pengaturan").select("nilai").eq("kunci", "pisah_ikhwan_akhwat").maybeSingle();
  const pisah = pengaturan?.nilai !== "false";
  const { data: daftarGrup } = await supabase.from("grup").select("id,nama,kelas(jenis_kelamin,tingkat)").order("nama");

  let query = supabase.from("peserta_grup")
    .select("grup_id, profiles!inner(id,kode,nama_lengkap,jenis_kelamin,aktif,email,whatsapp,wajib_ganti_password), grup!inner(id,nama,kelas!inner(jenis_kelamin,tingkat))");
  if (q) query = query.ilike("profiles.nama_lengkap", `%${q.replace(/[%_]/g, "")}%`);
  if (jk) query = query.eq("grup.kelas.jenis_kelamin", jk);
  if (grup) query = query.eq("grup_id", grup);
  const { data } = await query;
  const baris = (data || []).sort((a, b) => a.profiles.nama_lengkap.localeCompare(b.profiles.nama_lengkap, "id"));
  const bagian = pisah && !jk
    ? [["Ikhwan", baris.filter((r) => r.grup.kelas.jenis_kelamin === "Ikhwan")], ["Akhwat", baris.filter((r) => r.grup.kelas.jenis_kelamin === "Akhwat")]]
    : [[jk || "Semua peserta", baris]];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold text-hijau-tua">Peserta ({baris.length})</h1><Link href="/admin/peserta/baru" className="btn-kuning !min-h-[44px] !px-5 text-sm">+ Tambah peserta</Link></div>
      <form className="kartu grid gap-3 sm:grid-cols-4" method="get">
        <input name="q" defaultValue={q} placeholder="Cari nama…" className="input sm:col-span-2" aria-label="Cari nama" />
        <select name="jk" defaultValue={jk} className="input" aria-label="Jenis kelamin"><option value="">Ikhwan &amp; Akhwat</option><option>Ikhwan</option><option>Akhwat</option></select>
        <select name="grup" defaultValue={grup} className="input" aria-label="Grup"><option value="">Semua grup</option>
          {(daftarGrup || []).map((g) => <option key={g.id} value={g.id}>{g.kelas?.jenis_kelamin} – {g.nama}</option>)}</select>
        <button className="btn-hijau sm:col-span-4">Terapkan filter</button>
      </form>
      {bagian.map(([judul, rows]) => (
        <section key={judul} className="kartu !p-0 overflow-hidden">
          <h2 className="bg-hijau-muda px-4 py-3 font-semibold text-hijau-tua">{judul} ({rows.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead><tr className="text-tinta/60"><th className="p-3">Kode</th><th className="p-3">Nama</th><th className="p-3">Kelas</th><th className="p-3">Grup</th><th className="p-3">Status</th></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.profiles.id} className="border-t border-hijau/10 hover:bg-krem">
                  <td className="p-3 font-mono">{r.profiles.kode}</td>
                  <td className="p-3"><Link className="font-medium text-hijau underline" href={`/admin/peserta/${r.profiles.id}`}>{r.profiles.nama_lengkap}</Link></td>
                  <td className="p-3">{r.grup.kelas.tingkat}</td><td className="p-3">{r.grup.nama}</td>
                  <td className="p-3">{!r.profiles.aktif ? "Nonaktif" : r.profiles.wajib_ganti_password ? "Belum ganti password" : "Aktif"}</td>
                </tr>))}
                {rows.length === 0 && <tr><td colSpan="5" className="p-4 text-tinta/60">Tidak ada data.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
