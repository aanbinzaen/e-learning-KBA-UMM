import { ambilSesi } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Tautan unduhan sementara (5 menit); hanya pengajar dan admin (diperiksa juga oleh aturan Storage)
export async function GET(_request, { params }) {
  const s = await ambilSesi();
  if (!s?.profil?.aktif || !["pengajar", "admin"].includes(s.profil.role)) return new Response("Tidak diizinkan.", { status: 403 });
  const { data: b } = await s.supabase.from("ruang_bahan").select("file_path").eq("id", params.id).eq("jenis", "berkas").maybeSingle();
  if (!b?.file_path) return new Response("Berkas tidak ditemukan.", { status: 404 });
  const { data, error } = await s.supabase.storage.from("ruang-pengajar").createSignedUrl(b.file_path, 300);
  if (error || !data?.signedUrl) return new Response("Berkas tidak dapat dibuka.", { status: 404 });
  return Response.redirect(data.signedUrl, 302);
}
