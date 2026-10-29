import { ambilSesi } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
export const runtime = "nodejs";

export async function POST(request) {
  const s = await ambilSesi();
  if (!s?.profil) return Response.json({ galat: "Silakan masuk dulu." }, { status: 401 });
  let b; try { b = await request.json(); } catch { return Response.json({ galat: "Data tidak valid." }, { status: 400 }); }
  if (typeof b?.endpoint !== "string") return Response.json({ galat: "Data tidak valid." }, { status: 400 });
  await supabaseAdmin().from("push_langganan").delete().eq("endpoint", b.endpoint).eq("profile_id", s.user.id);
  return Response.json({ ok: true });
}
