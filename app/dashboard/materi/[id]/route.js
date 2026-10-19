import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Membuat tautan unduhan sementara (5 menit) hanya bila pengguna berhak (RLS + Storage policy).
export async function GET(request, { params }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.redirect(new URL("/masuk", request.url), 302);
  const { data: m } = await supabase.from("materi").select("file_path").eq("id", params.id).maybeSingle();
  if (!m?.file_path) return new Response("Materi tidak ditemukan.", { status: 404 });
  const { data, error } = await supabase.storage.from("materi").createSignedUrl(m.file_path, 300);
  if (error || !data?.signedUrl) return new Response("Berkas tidak dapat dibuka.", { status: 404 });
  return Response.redirect(data.signedUrl, 302);
}
