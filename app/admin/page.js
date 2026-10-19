import { wajibAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
      <h1 className="text-2xl font-bold text-hijau-tua">Ringkasan</h1>
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
