import Link from "next/link";
import { ambilSesi } from "@/lib/auth";
import { tanggalIndo } from "@/lib/data";
import { grupDiampu } from "@/lib/guru";
import PilihGrup from "@/components/PilihGrup";

export const metadata = { title: "Kelas saya" };

export default async function KelasSaya({ searchParams }) {
  const { supabase, user, profil } = await ambilSesi();

  // Akun master (admin) dan pengajar: pilih grup mana pun yang boleh mereka buka
  if (profil.role !== "peserta") {
    const semuaGrup = await grupDiampu(supabase, profil);
    const aktif = semuaGrup.find((g) => g.id === searchParams?.grup) || semuaGrup[0];
    if (!aktif) return <p className="kartu">Belum ada grup yang bisa dibuka.</p>;
    const { data: daftarGrup } = await supabase.from("pertemuan").select("id,judul,waktu,absensi_buka,materi(id),rekaman(id),kuis(id)").eq("grup_id", aktif.id).order("waktu", { ascending: false });
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-hijau-tua">Lihat kelas</h1>
        <PilihGrup grup={semuaGrup} aktifId={aktif.id} dasar="/dashboard/kelas" />
        <p className="text-tinta/80">{aktif.kelas?.jenis_kelamin} · {aktif.kelas?.tingkat} · <b>{aktif.nama}</b></p>
        {(daftarGrup || []).map((p) => (
          <Link key={p.id} href={`/dashboard/kelas/${p.id}`} className="kartu block hover:bg-hijau-muda">
            <p className="text-lg font-semibold">{p.judul}</p>
            <p className="text-sm text-hijau">{tanggalIndo(p.waktu)}{p.absensi_buka ? " · absensi dibuka" : ""}</p>
            <p className="mt-1 text-xs text-tinta/60">{p.materi.length} materi · {p.rekaman.length} rekaman · {p.kuis.length} kuis</p>
          </Link>
        ))}
        {!daftarGrup?.length && <p className="kartu text-tinta/70">Belum ada pertemuan di grup ini.</p>}
      </div>
    );
  }

  const { data: pg } = await supabase.from("peserta_grup").select("grup_id,grup(nama)").eq("profile_id", user.id).maybeSingle();
  if (!pg) return <p className="kartu">Anda belum ditempatkan di grup. Hubungi admin.</p>;

  const [{ data: daftar }, { data: selesai }] = await Promise.all([
    supabase.from("pertemuan").select("id,judul,waktu,materi(id),rekaman(id),kuis(id)").eq("grup_id", pg.grup_id).order("waktu", { ascending: false }),
    supabase.from("progres").select("item_id").eq("profile_id", user.id),
  ]);
  const sudah = new Set((selesai || []).map((x) => x.item_id));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-hijau-tua">Kelas saya</h1>
      <p className="text-tinta/80">{pg.grup?.nama}</p>
      {(daftar || []).map((p) => {
        const item = [...p.materi, ...p.rekaman, ...p.kuis.filter((x) => x.id)];
        const n = item.filter((x) => sudah.has(x.id)).length;
        const persen = item.length ? Math.round((n / item.length) * 100) : 0;
        return (
          <Link key={p.id} href={`/dashboard/kelas/${p.id}`} className="kartu block hover:bg-hijau-muda">
            <p className="text-lg font-semibold">{p.judul}</p>
            <p className="text-sm text-hijau">{tanggalIndo(p.waktu)}</p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-hijau-muda" role="progressbar" aria-valuenow={persen} aria-valuemin="0" aria-valuemax="100" aria-label="Progres pertemuan">
              <div className="h-full rounded-full bg-hijau" style={{ width: `${persen}%` }} />
            </div>
            <p className="mt-1 text-xs text-tinta/60">{item.length ? `${n} dari ${item.length} selesai` : "Materi belum tersedia"}</p>
          </Link>
        );
      })}
      {!daftar?.length && <p className="kartu text-tinta/70">Belum ada pertemuan. Pengajar akan menambahkannya.</p>}
    </div>
  );
}
