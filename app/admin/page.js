import { wajibAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import PanelAksi from "@/components/PanelAksi";

const MENU = [
  { id: "notif", ikon: "lonceng", label: "Kirim notifikasi", href: "/admin/notifikasi", sorot: true },
  { id: "pengumuman", ikon: "pengumuman", label: "Pengumuman", href: "/guru/pengumuman" },
  { id: "peserta-baru", ikon: "peserta", label: "Tambah peserta", href: "/admin/peserta/baru" },
  { id: "sandi", ikon: "kunci", label: "Edit / sandi", href: "/admin/peserta" },
  { id: "reels", ikon: "reels", label: "Reels", href: "/guru/reels" },
  { id: "faidah", ikon: "faidah", label: "Faidah", href: "/admin/faidah" },
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
      <h1 className="text-xl font-bold text-hijau-tua">Beranda Admin</h1>
      <PanelAksi item={MENU} kolom={3} />
      <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
        {kartu.map(([l, n]) => (
          <div key={l} className="kartu !rounded-2xl !p-3"><p className="text-2xl font-bold leading-none text-hijau">{n}</p><p className="mt-1 text-xs leading-tight text-tinta/70">{l}</p></div>
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
