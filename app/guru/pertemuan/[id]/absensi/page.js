import Link from "next/link";
import { notFound } from "next/navigation";
import { wajibGuru } from "@/lib/guru";
import { tanggalIndo } from "@/lib/data";
import FormAksi from "@/components/FormAksi";
import { simpanKehadiran } from "@/app/guru/actions";

export const metadata = { title: "Kehadiran" };
const OPSI = [["hadir", "Hadir"], ["izin", "Izin"], ["sakit", "Sakit"], ["alpa", "Alpa"], ["", "Kosong"]];

export default async function Kehadiran({ params }) {
  const { supabase } = await wajibGuru();
  const { data: p } = await supabase.from("pertemuan").select("id,grup_id,judul,waktu,grup(nama)").eq("id", params.id).maybeSingle();
  if (!p) notFound();
  const [{ data: anggota }, { data: abs }] = await Promise.all([
    supabase.rpc("anggota_grup_daftar", { gid: p.grup_id }),
    supabase.from("absensi").select("profile_id,status,dicatat_oleh").eq("pertemuan_id", p.id),
  ]);
  const status = Object.fromEntries((abs || []).map((a) => [a.profile_id, a]));

  return (
    <div className="space-y-5">
      <Link href={`/guru/pertemuan/${p.id}`} className="text-sm font-medium text-hijau underline">← Kembali ke pertemuan</Link>
      <h1 className="text-2xl font-bold text-hijau-tua">Kehadiran <span className="block text-base font-normal text-tinta/70">{p.judul} · {p.grup?.nama} · {tanggalIndo(p.waktu)}</span></h1>
      <p className="text-sm text-tinta/70">Pilih status tiap peserta lalu simpan. "Kosong" menghapus catatan; peserta tanpa catatan dihitung Alpa di rekap setelah pertemuan lewat.</p>
      <FormAksi aksi={simpanKehadiran.bind(null, p.id)} kirim="Simpan kehadiran" className="space-y-3">
        {(anggota || []).map((a) => {
          const sekarang = status[a.profile_id]?.status || "";
          return (
            <fieldset key={a.profile_id} className="kartu !p-4">
              <legend className="sr-only">{a.nama_lengkap}</legend>
              <p className="font-medium">{a.nama_lengkap} {status[a.profile_id]?.dicatat_oleh === "peserta" && <span className="ml-1 rounded-full bg-hijau-muda px-2 py-0.5 text-xs text-hijau">absen sendiri</span>}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {OPSI.map(([nilai, label]) => (
                  <span key={nilai || "kosong"}>
                    <input type="radio" className="peer sr-only" name={`s_${a.profile_id}`} id={`s_${a.profile_id}_${nilai || "k"}`} value={nilai} defaultChecked={sekarang === nilai} />
                    <label htmlFor={`s_${a.profile_id}_${nilai || "k"}`} className="inline-flex min-h-[44px] cursor-pointer items-center rounded-2xl border-2 border-hijau/25 px-4 text-sm font-medium text-hijau peer-checked:border-hijau peer-checked:bg-hijau peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-4 peer-focus-visible:outline-kuning">{label}</label>
                  </span>
                ))}
              </div>
            </fieldset>
          );
        })}
        {!anggota?.length && <p className="kartu text-tinta/70">Belum ada peserta aktif di grup ini.</p>}
      </FormAksi>
    </div>
  );
}
