"use server";
import { revalidatePath } from "next/cache";
import { ambilSesi } from "@/lib/auth";

export async function ubahSelesai(jenis, itemId) {
  if (!["materi", "rekaman"].includes(jenis)) return { galat: true };
  const s = await ambilSesi();
  if (!s?.profil) return { galat: true };
  const { data: ada } = await s.supabase.from("progres").select("item_id").eq("profile_id", s.user.id).eq("jenis", jenis).eq("item_id", itemId).maybeSingle();
  if (ada) await s.supabase.from("progres").delete().eq("profile_id", s.user.id).eq("jenis", jenis).eq("item_id", itemId);
  else await s.supabase.from("progres").insert({ profile_id: s.user.id, jenis, item_id: itemId });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/kelas");
  return { selesai: !ada };
}
