import { ambilSesi } from "@/lib/auth";
import { ambilBobot, bacaRentang, grupLaporan, muatLaporan } from "@/lib/raporData";
import { buatDokLaporan } from "@/lib/wordRapor";
import { buatExcelLaporan } from "@/lib/excelRapor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIPE = { docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };

// GET /api/laporan?format=docx|xlsx&dari=&sampai=&g=<id>&g=<id>&nama=1|0
export async function GET(request) {
  const s = await ambilSesi();
  if (!s?.profil?.aktif || !["pengajar", "admin"].includes(s.profil.role)) return new Response("Tidak diizinkan.", { status: 403 });
  const url = new URL(request.url), sp = Object.fromEntries(url.searchParams);
  const format = sp.format === "xlsx" ? "xlsx" : "docx", tampilNama = sp.nama !== "0";
  const ids = url.searchParams.getAll("g").filter((x) => /^[0-9a-f-]{36}$/i.test(x));
  const rentang = bacaRentang(sp), bobot = await ambilBobot(s.supabase);
  const grup = await grupLaporan(s.supabase, s.profil, ids);
  if (!grup.length) return new Response("Tidak ada grup untuk dilaporkan.", { status: 404 });
  const lap = await muatLaporan(s.supabase, grup, rentang, bobot);
  lap.bobot = bobot;
  const buf = format === "xlsx" ? await buatExcelLaporan(lap, { tampilNama }) : await buatDokLaporan(lap, { tampilNama });
  return new Response(buf, { headers: { "Content-Type": TIPE[format], "Content-Disposition": `attachment; filename="laporan-kba-umm.${format}"`, "Cache-Control": "no-store" } });
}
