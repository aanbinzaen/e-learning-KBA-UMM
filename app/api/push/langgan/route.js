import { ambilSesi } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { endpointValid, TOPIK } from "@/lib/push";
export const runtime = "nodejs";

export async function POST(request) {
  const s = await ambilSesi();
  if (!s?.profil?.aktif) return Response.json({ galat: "Silakan masuk dulu." }, { status: 401 });
  let b; try { b = await request.json(); } catch { return Response.json({ galat: "Data tidak valid." }, { status: 400 }); }
  const l = b?.langganan, endpoint = l?.endpoint, p256dh = l?.keys?.p256dh, auth = l?.keys?.auth;
  if (!endpointValid(endpoint) || typeof p256dh !== "string" || typeof auth !== "string" || p256dh.length > 200 || auth.length > 100)
    return Response.json({ galat: "Langganan tidak valid." }, { status: 400 });
  const topik = Array.isArray(b.topik) ? b.topik.filter((t) => TOPIK.includes(t)) : TOPIK;

  const db = supabaseAdmin();
  const { error } = await db.from("push_langganan").upsert({ profile_id: s.user.id, endpoint, p256dh, auth, topik }, { onConflict: "endpoint" });
  if (error) return Response.json({ galat: "Gagal menyimpan. Pastikan SQL 11 sudah dijalankan." }, { status: 500 });

  // maksimal 10 perangkat per akun
  const { data: semua } = await db.from("push_langganan").select("id").eq("profile_id", s.user.id).order("dibuat_pada", { ascending: false });
  if (semua && semua.length > 10) await db.from("push_langganan").delete().in("id", semua.slice(10).map((x) => x.id));
  return Response.json({ ok: true });
}
