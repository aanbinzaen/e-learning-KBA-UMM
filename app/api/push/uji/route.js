import { ambilSesi } from "@/lib/auth";
import { kirimPush } from "@/lib/push";
export const runtime = "nodejs";

export async function POST() {
  const s = await ambilSesi();
  if (!s?.profil?.aktif) return Response.json({ galat: "Silakan masuk dulu." }, { status: 401 });
  const r = await kirimPush({ profilIds: [s.user.id], judul: "Uji notifikasi KBA-UMM", isi: "Alhamdulillah, notifikasi berfungsi di perangkat ini.", url: "/dashboard" });
  return Response.json(r);
}
