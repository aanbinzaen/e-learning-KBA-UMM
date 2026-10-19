import { ambilSesi } from "@/lib/auth";
import { grupDiampu } from "@/lib/guru";
import { rekapGrup, rentangWIB, barisCSV } from "@/lib/rekap";
import { keCSV, responsCSV } from "@/lib/csv";
import { nilaiGrup, barisCSVNilai } from "@/lib/nilai";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const s = await ambilSesi();
  if (!s?.profil?.aktif || !["pengajar", "admin"].includes(s.profil.role)) return new Response("Tidak diizinkan", { status: 403 });
  const u = new URL(request.url).searchParams;
  const grup = (await grupDiampu(s.supabase, s.profil)).find((g) => g.id === u.get("grup"));
  if (!grup) return new Response("Grup tidak ditemukan", { status: 404 });
  if (u.get("nilai") === "1") return responsCSV("nilai-kuis-kbumm.csv", keCSV(barisCSVNilai(await nilaiGrup(s.supabase, grup))));
  const hasil = await rekapGrup(s.supabase, grup, rentangWIB(u.get("dari"), u.get("sampai")));
  const rinci = u.get("rinci") === "1";
  return responsCSV(`rekap-${rinci ? "rinci" : "ringkas"}-kbumm.csv`, keCSV(barisCSV([hasil], rinci)));
}
