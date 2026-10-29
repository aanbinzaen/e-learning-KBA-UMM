"use server";
import { revalidatePath } from "next/cache";
import { wajibAdmin } from "@/lib/auth";
import { bersih } from "@/lib/validasi";
import { kirimPush } from "@/lib/push";

const segarkan = () => ["/", "/faidah", "/admin/faidah"].forEach((p) => revalidatePath(p));
const GAGAL = { galat: "Gagal menyimpan. Pastikan SQL 09 sudah dijalankan, lalu coba lagi." };

function baca(fd) {
  const judul = bersih(fd.get("judul")), isi = String(fd.get("isi") || "").trim();
  if (!judul || !isi) return { galat: "Judul dan isi faidah wajib diisi." };
  if (judul.length > 150) return { galat: "Judul terlalu panjang (maks. 150 karakter)." };
  if (isi.length > 5000) return { galat: "Isi terlalu panjang (maks. 5000 karakter)." };
  return { nilai: {
    judul, isi, teks_arab: String(fd.get("teks_arab") || "").trim().slice(0, 2000) || null,
    sumber: bersih(fd.get("sumber")).slice(0, 300) || null, terbit: fd.get("terbit") === "on",
  } };
}

export async function tambahFaidah(_prev, fd) {
  const { supabase, user } = await wajibAdmin();
  const b = baca(fd); if (b.galat) return b;
  const { error } = await supabase.from("faidah").insert(b.nilai);
  if (error) return GAGAL;
  segarkan();
  if (b.nilai.terbit && fd.get("notif") === "on") await kirimPush({ topik: "faidah", kecuali: user.id, judul: "Faidah ilmu baru", isi: b.nilai.judul, url: "/faidah" });
  return { ok: b.nilai.terbit ? "Faidah diterbitkan." : "Faidah disimpan sebagai draf." };
}

export async function ubahFaidah(id, _prev, fd) {
  const { supabase, user } = await wajibAdmin();
  const b = baca(fd); if (b.galat) return b;
  const { data: lama } = await supabase.from("faidah").select("terbit").eq("id", id).maybeSingle();
  const { error } = await supabase.from("faidah").update(b.nilai).eq("id", id);
  if (error) return GAGAL;
  segarkan();
  if (b.nilai.terbit && lama && !lama.terbit && fd.get("notif") === "on") await kirimPush({ topik: "faidah", kecuali: user.id, judul: "Faidah ilmu baru", isi: b.nilai.judul, url: "/faidah" });
  return { ok: "Perubahan disimpan." };
}

export async function hapusFaidah(id) {
  const { supabase } = await wajibAdmin();
  await supabase.from("faidah").delete().eq("id", id); segarkan();
}
