import Link from "next/link";
import { wajibAdmin } from "@/lib/auth";
import { ambilKredensial } from "@/lib/kredensial";
import CetakTombol from "./CetakTombol";

export const metadata = { title: "Kode dan password awal" };

export default async function Kredensial({ searchParams }) {
  const { supabase } = await wajibAdmin();
  const grupId = searchParams.grup || "";
  const { data: daftarGrup } = await supabase.from("grup").select("id,nama,kelas(jenis_kelamin,tingkat)").order("nama");
  const baris = await ambilKredensial(supabase, grupId);
  const kelompok = new Map();
  baris.forEach((b) => { const k = `${b.kelas} – ${b.grup}`; kelompok.set(k, [...(kelompok.get(k) || []), b]); });

  let guru = [];
  if (!grupId) {
    const { data: g } = await supabase.from("profiles").select("id,kode,nama_lengkap,wajib_ganti_password").eq("role", "pengajar").order("kode");
    const { data: pw } = await supabase.from("password_awal").select("profile_id,password").in("profile_id", (g || []).map((x) => x.id));
    const peta = new Map((pw || []).map((x) => [x.profile_id, x.password]));
    guru = (g || []).map((x) => ({ ...x, password: peta.get(x.id) || null }));
  }
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-hijau-tua">Kode dan password awal</h1>
      <form method="get" className="no-print kartu flex flex-wrap gap-3">
        <select name="grup" defaultValue={grupId} className="input flex-1" aria-label="Pilih grup">
          <option value="">Semua grup</option>
          {(daftarGrup || []).map((g) => <option key={g.id} value={g.id}>{g.kelas?.jenis_kelamin} – {g.nama}</option>)}
        </select>
        <button className="btn-hijau">Tampilkan</button>
        <a href={`/admin/kredensial/csv${grupId ? `?grup=${grupId}` : ""}`} className="btn-kuning">Unduh CSV</a>
        <CetakTombol />
      </form>
      <p className="no-print rounded-2xl bg-yellow-50 p-4 text-sm text-yellow-900">Daftar ini rahasia. Bagikan hanya kepada pengajar grup terkait. Password awal otomatis hilang dari daftar setelah peserta menggantinya.</p>
      {[...kelompok].map(([judul, rows]) => (
        <section key={judul} className="kartu !p-0 overflow-hidden [break-inside:avoid-page]">
          <h2 className="bg-hijau-muda px-4 py-3 font-semibold text-hijau-tua">{judul} ({rows.length} peserta)</h2>
          <table className="w-full text-left text-sm">
            <thead><tr className="text-tinta/60"><th className="p-3">Nama</th><th className="p-3">Kode</th><th className="p-3">Password awal</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.kode} className="border-t border-hijau/10">
                <td className="p-3">{r.nama}</td><td className="p-3 font-mono">{r.kode}</td>
                <td className="p-3 font-mono">{r.password || <span className="font-sans text-tinta/60">{r.sudahGanti ? "sudah diganti" : "–"}</span>}</td>
              </tr>))}
            </tbody>
          </table>
        </section>
      ))}
      {guru.length > 0 && (
        <section className="kartu !p-0 overflow-hidden [break-inside:avoid-page]">
          <h2 className="bg-hijau-muda px-4 py-3 font-semibold text-hijau-tua">Pengajar ({guru.length})</h2>
          <table className="w-full text-left text-sm">
            <thead><tr className="text-tinta/60"><th className="p-3">Nama</th><th className="p-3">Kode</th><th className="p-3">Password awal</th></tr></thead>
            <tbody>{guru.map((r) => (
              <tr key={r.id} className="border-t border-hijau/10"><td className="p-3">{r.nama_lengkap}</td><td className="p-3 font-mono">{r.kode}</td>
                <td className="p-3 font-mono">{r.password || <span className="font-sans text-tinta/60">{r.wajib_ganti_password ? "–" : "sudah diganti"}</span>}</td></tr>))}
            </tbody>
          </table>
        </section>
      )}
      {baris.length === 0 && <p className="kartu text-tinta/70">Belum ada peserta. Mulai dari <Link className="text-hijau underline" href="/admin/impor">impor peserta</Link>.</p>}
    </div>
  );
}
