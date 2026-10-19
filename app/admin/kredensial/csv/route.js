import { ambilSesi } from "@/lib/auth";
import { ambilKredensial } from "@/lib/kredensial";

export async function GET(request) {
  const s = await ambilSesi();
  if (!s || s.profil?.role !== "admin" || !s.profil.aktif) return new Response("Tidak diizinkan", { status: 403 });
  const grupId = new URL(request.url).searchParams.get("grup") || "";
  const baris = await ambilKredensial(s.supabase, grupId);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const isi = "\uFEFF" + [["kelas", "grup", "nama_lengkap", "kode_peserta", "password_awal"],
    ...baris.map((b) => [b.kelas, b.grup, b.nama, b.kode, b.password || (b.sudahGanti ? "sudah diganti" : "")])]
    .map((r) => r.map(esc).join(",")).join("\r\n");
  return new Response(isi, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="kode-peserta-kbumm.csv"', "Cache-Control": "no-store" } });
}
