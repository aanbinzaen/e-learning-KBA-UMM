import Link from "next/link";
import { notFound } from "next/navigation";
import { ambilSesi } from "@/lib/auth";
import KerjakanKuis from "./KerjakanKuis";

export const metadata = { title: "Kuis" };

export default async function HalamanKuis({ params }) {
  const { supabase, user } = await ambilSesi();
  const { data: k } = await supabase.from("kuis").select("id,judul,boleh_ulang,pertemuan_id").eq("id", params.id).maybeSingle();
  if (!k) notFound();
  const [{ data: soal }, { data: rincian }, { data: riwayat }] = await Promise.all([
    supabase.rpc("soal_kuis", { kid: k.id }),
    supabase.rpc("rincian_kuis", { kid: k.id }),
    supabase.from("percobaan").select("id,nilai,waktu").eq("kuis_id", k.id).eq("profile_id", user.id).order("waktu", { ascending: false }),
  ]);
  const awal = rincian && !rincian.galat ? rincian : null;
  const adaEsai = (soal || []).some((x) => x.tipe === "esai");
  const nilaiAda = (riwayat || []).filter((r) => r.nilai !== null).map((r) => r.nilai);

  return (
    <div className="max-w-2xl space-y-5">
      <Link href={`/dashboard/kelas/${k.pertemuan_id}`} className="text-sm font-medium text-hijau underline">← Kembali ke pertemuan</Link>
      <h1 className="text-2xl font-bold text-hijau-tua">{k.judul}</h1>
      {riwayat?.length > 0 && <p className="text-sm text-tinta/70">Percobaan: {riwayat.length} · Nilai terbaik: <b>{nilaiAda.length ? Math.max(...nilaiAda) : "menunggu penilaian"}</b></p>}
      {adaEsai && <p className="rounded-2xl bg-yellow-50 p-3 text-sm text-yellow-900">Kuis ini memuat soal esai yang dinilai pengajar, dan hanya boleh dikerjakan satu kali.</p>}
      {!soal?.length
        ? <p className="kartu text-tinta/70">Kuis ini hanya dapat dikerjakan oleh peserta grup yang bersangkutan.</p>
        : <KerjakanKuis kuisId={k.id} soal={soal} awal={awal} bolehUlang={k.boleh_ulang && !adaEsai} />}
    </div>
  );
}
