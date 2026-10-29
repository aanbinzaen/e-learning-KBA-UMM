import { kunciPublik } from "@/lib/push";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try { return Response.json({ publik: await kunciPublik() }); }
  catch { return Response.json({ galat: "Notifikasi belum siap. Hubungi admin." }, { status: 503 }); }
}
