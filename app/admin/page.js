import { wajibAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import Link from "next/link";

const PINTASAN = [
  ["/guru/pengumuman", "📣", "Pengumuman & Flyer", "Buat flyer dan kirim ke grup WhatsApp", "btn-kuning"],
  ["/admin/peserta/baru", "➕", "Tambah peserta", "Daftarkan peserta baru + kode & password awal", "btn-hijau"],
  ["/admin/peserta", "🔑", "Edit / reset sandi", "Cari peserta, ubah data, atur ulang password", "btn-hijau"],
  ["/guru/reels", "🎬", "Reels klip kajian", "Potongan kajian jadi video 9:16", "btn-hijau"],
];

async function simpanPengaturan(formData) {
  "use server";
  const { supabase } = await wajibAdmin();
  const nilai = formData.get("pisah") === "on" ? "true" : "false";
  await supabase.from("pengaturan").upsert({ kunci: "pisah_ikhwan_akhwat", nilai });
  revalidatePath("/admin");
}

export default async function Ringkasan() {
  const { supabase } = await wajibAdmin();
  const hitung = async (q) => (await q).count ?? 0;
  const [total, ikhwan, akhwat, belumGanti, grup, pengaturan] = await Promise.all([
    hitung(supabase.from("peserta_grup").select("profile_id", { count: "exact", head: true })),
    hitung(supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "peserta").eq("jenis_kelamin", "Ikhwan")),
    hitung(supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "peserta").eq("jenis_kelamin", "Akhwat")),
    hitung(supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "peserta").eq("wajib_ganti_password", true)),
    hitung(supabase.from("grup").select("id", { count: "exact", head: true })),
    supabase.from("pengaturan").select("nilai").eq("kunci", "pisah_ikhwan_akhwat").maybeSingle(),
  ]);
  const pisah = pengaturan.data?.nilai !== "false";
  const kartu = [["Peserta", total], ["Ikhwan", ikhwan], ["Akhwat", akhwat], ["Grup", grup], ["Belum ganti password", belumGanti]];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-hijau-tua">Beranda Admin</h1>
      <section aria-label="Pintasan utama" className="grid gap-3 sm:grid-cols-2">
        {PINTASAN.map(([h, ikon, judul, ket, kelas]) => (
          <Link key={h} href={h} className={`${kelas} !flex-col !items-start !gap-1 !p-5 text-left !min-h-[96px]`}>
            <span className="text-lg font-bold"><span aria-hidden>{ikon}</span> {judul}</span>
            <span className="text-sm font-normal opacity-90">{ket}</span>
          </Link>
        ))}
      </section>
      <h2 className="text-lg font-semibold text-hijau">Ringkasan</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {kartu.map(([l, n]) => (
          <div key={l} className="kartu !p-4"><p className="text-3xl font-bold text-hijau">{n}</p><p className="text-sm text-tinta/70">{l}</p></div>
        ))}
      </div>
      <form action={simpanPengaturan} className="kartu flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-3 font-medium">
          <input type="checkbox" name="pisah" defaultChecked={pisah} className="h-6 w-6 accent-[#1E7B34]" />
          Pisahkan tampilan Ikhwan dan Akhwat
        </label>
        <button className="btn-hijau">Simpan pengaturan</button>
      </form>
    </div>
  );
}
