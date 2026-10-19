import Link from "next/link";
import { notFound } from "next/navigation";
import { wajibGuru } from "@/lib/guru";
import { tanggalIndo } from "@/lib/data";
import FormAksi from "@/components/FormAksi";
import { nilaiEsai } from "@/app/guru/actions";

export const metadata = { title: "Nilai esai" };

export default async function NilaiEsai({ params }) {
  const { supabase } = await wajibGuru();
  const { data: k } = await supabase.from("kuis").select("id,judul,grup_id").eq("id", params.id).maybeSingle();
  if (!k) notFound();
  const [{ data: esai }, { data: perc }, { data: anggota }] = await Promise.all([
    supabase.from("soal").select("id,pertanyaan,bobot,kunci_esai").eq("kuis_id", k.id).eq("tipe", "esai").order("urutan"),
    supabase.from("percobaan").select("id,profile_id,jawaban,penilaian,status,nilai,waktu").eq("kuis_id", k.id),
    supabase.rpc("anggota_grup_daftar", { gid: k.grup_id }),
  ]);
  const nama = Object.fromEntries((anggota || []).map((a) => [a.profile_id, a.nama_lengkap]));
  const urut = [...(perc || [])].sort((a, b) => (a.status === b.status ? new Date(b.waktu) - new Date(a.waktu) : a.status === "menunggu" ? -1 : 1));

  return (
    <div className="space-y-5">
      <Link href={`/guru/kuis/${k.id}`} className="text-sm font-medium text-hijau underline">← Kembali ke kuis</Link>
      <h1 className="text-2xl font-bold text-hijau-tua">Nilai esai <span className="block text-base font-normal text-tinta/70">{k.judul}</span></h1>
      {!esai?.length && <p className="kartu text-tinta/70">Kuis ini tidak memiliki soal esai.</p>}
      {esai?.length > 0 && !urut.length && <p className="kartu text-tinta/70">Belum ada peserta yang mengerjakan.</p>}
      {urut.map((p) => (
        <article key={p.id} className="kartu space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="font-semibold">{nama[p.profile_id] || "Peserta"}</p><p className="text-xs text-tinta/60">{tanggalIndo(p.waktu)}</p></div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${p.status === "menunggu" ? "bg-yellow-100 text-yellow-800" : "bg-hijau-muda text-hijau-tua"}`}>{p.status === "menunggu" ? "Menunggu penilaian" : `Nilai akhir ${p.nilai}`}</span>
          </div>
          <FormAksi aksi={nilaiEsai.bind(null, p.id, k.id)} kirim="Simpan nilai">
            {(esai || []).map((e, n) => {
              const nil = p.penilaian?.[e.id];
              const jawab = typeof p.jawaban?.[e.id] === "string" ? p.jawaban[e.id] : "";
              return (
                <fieldset key={e.id} className="space-y-2 rounded-2xl border-2 border-hijau/15 p-3">
                  <legend className="sr-only">Esai {n + 1}</legend>
                  <p className="font-medium" dir="auto">{e.pertanyaan}</p>
                  <p className="whitespace-pre-line rounded-2xl bg-krem p-3 text-sm" dir="auto">{jawab || <span className="text-tinta/50">(tidak dijawab)</span>}</p>
                  {e.kunci_esai && <p className="text-xs text-hijau" dir="auto">Kunci: {e.kunci_esai}</p>}
                  <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
                    <div><label className="label" htmlFor={`skor_${p.id}_${e.id}`}>Skor (0–{e.bobot})</label>
                      <input id={`skor_${p.id}_${e.id}`} name={`skor_${e.id}`} inputMode="decimal" defaultValue={nil?.skor ?? ""} className="input" /></div>
                    <div><label className="label" htmlFor={`cat_${p.id}_${e.id}`}>Catatan untuk peserta (opsional)</label>
                      <input id={`cat_${p.id}_${e.id}`} name={`catatan_${e.id}`} dir="auto" defaultValue={nil?.catatan ?? ""} className="input" /></div>
                  </div>
                </fieldset>
              );
            })}
          </FormAksi>
        </article>
      ))}
    </div>
  );
}
