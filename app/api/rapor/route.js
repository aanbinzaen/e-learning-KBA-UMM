import { ambilSesi } from "@/lib/auth";
import { grupDiampu } from "@/lib/guru";
import { ambilBobot, bacaRentang, grupRingkas, muatRaporGrup, muatRaporPeserta } from "@/lib/raporData";
import { buatDokRapor } from "@/lib/wordRapor";
import { buatExcelRapor } from "@/lib/excelRapor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;
const slug = (t) => String(t || "rapor").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "rapor";
const TIPE = { docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };

// GET /api/rapor?peserta=<id>|grup=<id>&format=docx|xlsx|json&dari=&sampai=
export async function GET(request) {
  const s = await ambilSesi();
  if (!s?.profil?.aktif) return new Response("Silakan masuk dulu.", { status: 401 });
  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const format = sp.format === "xlsx" ? "xlsx" : sp.format === "json" ? "json" : "docx";
  const rentang = bacaRentang(sp), bobot = await ambilBobot(s.supabase), staf = ["pengajar", "admin"].includes(s.profil.role);
  let daftar = [], nama = "rapor";

  if (UUID.test(sp.peserta || "")) {
    if (!staf && sp.peserta !== s.user.id) return new Response("Tidak diizinkan.", { status: 403 });
    const r = await muatRaporPeserta(s.supabase, { profilId: sp.peserta, rentang, bobot, sebagaiPeserta: !staf });
    if (r) { daftar = [r]; nama = `rapor-${slug(r.peserta.nama)}`; }
  } else if (UUID.test(sp.grup || "")) {
    if (!staf) return new Response("Tidak diizinkan.", { status: 403 });
    const g = (await grupDiampu(s.supabase, s.profil)).find((x) => x.id === sp.grup);
    if (!g) return new Response("Grup tidak ditemukan.", { status: 404 });
    daftar = await muatRaporGrup(s.supabase, grupRingkas(g), rentang, bobot);
    nama = `rapor-grup-${slug(g.nama)}`;
  }
  if (!daftar.length) return new Response("Data rapor tidak ditemukan.", { status: 404 });

  if (format === "json") return Response.json({ nama, daftar }, { headers: { "Cache-Control": "no-store" } });
  const buf = format === "xlsx" ? await buatExcelRapor(daftar) : await buatDokRapor(daftar, { sampul: sp.sampul !== "0" });
  return new Response(buf, { headers: { "Content-Type": TIPE[format], "Content-Disposition": `attachment; filename="${nama}.${format}"`, "Cache-Control": "no-store" } });
}
