import { ambilSesi } from "@/lib/auth";
import { tanggalIndo } from "@/lib/data";
import TombolAbsen from "./TombolAbsen";

export const metadata = { title: "Absensi" };
const LABEL = { hadir: "Hadir", izin: "Izin", sakit: "Sakit", alpa: "Alpa" };
const WARNA = { hadir: "bg-hijau-muda text-hijau-tua", izin: "bg-yellow-100 text-yellow-800", sakit: "bg-orange-100 text-orange-800", alpa: "bg-red-100 text-red-700" };

export default async function Absensi() {
  const { supabase, user, profil } = await ambilSesi();
  const { data: pg } = await supabase.from("peserta_grup").select("grup_id,grup(nama,kelas(jenis_kelamin,tingkat))").eq("profile_id", user.id).maybeSingle();
  if (!pg) return <p className="kartu">Anda belum ditempatkan di grup. Hubungi admin.</p>;

  const [{ data: daftar }, { data: abs }] = await Promise.all([
    supabase.from("pertemuan").select("id,judul,waktu,absensi_buka").eq("grup_id", pg.grup_id).order("waktu", { ascending: false }),
    supabase.from("absensi").select("pertemuan_id,status,dicatat_oleh").eq("profile_id", user.id),
  ]);
  const status = Object.fromEntries((abs || []).map((a) => [a.pertemuan_id, a.status]));
  const oleh = Object.fromEntries((abs || []).map((a) => [a.pertemuan_id, a.dicatat_oleh]));
  const sekarang = Date.now();
  const dibuka = (daftar || []).filter((p) => p.absensi_buka);
  const terlaksana = (daftar || []).filter((p) => new Date(p.waktu).getTime() <= sekarang || status[p.id]);
  const hadir = terlaksana.filter((p) => status[p.id] === "hadir").length;
  const persen = terlaksana.length ? Math.round((hadir / terlaksana.length) * 100) : 0;

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-hijau-tua">Absensi</h1>
      <section className="kartu space-y-1">
        <p className="text-lg font-semibold">{profil.nama_lengkap}</p>
        <p className="text-sm text-tinta/70">{pg.grup?.kelas?.jenis_kelamin} · {pg.grup?.kelas?.tingkat} · {pg.grup?.nama}</p>
      </section>

      {dibuka.map((p) => (
        <section key={p.id} className="rounded-kartu bg-hijau p-5 text-white">
          <p className="text-sm text-white/80">Absensi dibuka</p>
          <h2 className="text-xl font-bold">{p.judul}</h2>
          <p className="mb-4 text-sm text-white/90">{tanggalIndo(p.waktu)}</p>
          <TombolAbsen pertemuanId={p.id} awal={status[p.id] || null} dikunci={oleh[p.id] === "pengajar"} />
        </section>
      ))}
      {!dibuka.length && <p className="kartu text-tinta/70">Tidak ada absensi yang sedang dibuka. Pengajar akan membukanya saat pertemuan berlangsung.</p>}

      <section className="kartu space-y-3">
        <h2 className="text-lg font-semibold text-hijau">Kehadiran saya: {persen}%</h2>
        <div className="h-3 overflow-hidden rounded-full bg-hijau-muda" role="progressbar" aria-valuenow={persen} aria-valuemin="0" aria-valuemax="100" aria-label="Persentase kehadiran"><div className="h-full rounded-full bg-hijau" style={{ width: `${persen}%` }} /></div>
        <p className="text-sm text-tinta/70">{hadir} hadir dari {terlaksana.length} pertemuan yang sudah berlangsung.</p>
        <ul className="divide-y divide-hijau/10">
          {terlaksana.map((p) => {
            const st = status[p.id] || "alpa";
            return <li key={p.id} className="flex items-center justify-between gap-3 py-3"><span><span className="block font-medium">{p.judul}</span><span className="text-xs text-tinta/60">{tanggalIndo(p.waktu)}</span></span><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${WARNA[st]}`}>{LABEL[st]}</span></li>;
          })}
        </ul>
        {!terlaksana.length && <p className="text-sm text-tinta/60">Belum ada riwayat.</p>}
      </section>
    </div>
  );
}
