import { ambilSesi } from "@/lib/auth";
import { rekapGrup, rentangWIB, barisCSV } from "@/lib/rekap";
import { keCSV, responsCSV } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const s = await ambilSesi();
  if (!s?.profil?.aktif || s.profil.role !== "admin") return new Response("Tidak diizinkan", { status: 403 });
  const u = new URL(request.url).searchParams;
  const jk = u.get("jk"), tingkat = u.get("tingkat"), grup = u.get("grup");
  const { data: semua } = await s.supabase.from("grup").select("id,nama,kelas!inner(jenis_kelamin,tingkat)").order("nama");
  const terpilih = (semua || []).filter((g) => (!jk || g.kelas.jenis_kelamin === jk) && (!tingkat || g.kelas.tingkat === tingkat) && (!grup || g.id === grup));
  const r = rentangWIB(u.get("dari"), u.get("sampai"));
  const hasil = await Promise.all(terpilih.map((g) => rekapGrup(s.supabase, g, r)));
  const rinci = u.get("rinci") === "1";
  return responsCSV(`rekap-absensi-${rinci ? "rinci" : "ringkas"}-kbumm.csv`, keCSV(barisCSV(hasil, rinci)));
}
