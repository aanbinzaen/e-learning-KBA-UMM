"use server";
import { revalidatePath } from "next/cache";
import { wajibAdmin } from "@/lib/auth";
import { bersih } from "@/lib/validasi";

const segarkan = () => ["/pengajar", "/pendiri", "/admin/profil"].forEach((p) => revalidatePath(p));
const GAGAL = { galat: "Gagal menyimpan. Coba lagi." };

function fotoValid(f) {
  const u = bersih(f);
  if (!u) return { nilai: null };
  if (!/^https:\/\//.test(u) || u.length > 600) return { galat: "Alamat foto tidak valid." };
  return { nilai: u };
}

export async function simpanPengajar(id, _prev, fd) {
  const { supabase } = await wajibAdmin();
  const foto = fotoValid(fd.get("foto_url")); if (foto.galat) return foto;
  const urutan = Number(fd.get("urutan"));
  const { error } = await supabase.from("pengajar").update({
    nama_tampil: bersih(fd.get("nama_tampil")) || null,
    jabatan: bersih(fd.get("jabatan")).slice(0, 120) || null,
    bio: String(fd.get("bio") || "").trim().slice(0, 3000) || null,
    foto_url: foto.nilai,
    urutan: Number.isInteger(urutan) ? urutan : 0,
    tampil_publik: fd.get("tampil_publik") === "on",
  }).eq("id", id);
  if (error) return GAGAL;
  segarkan(); return { ok: "Profil pengajar disimpan." };
}

function bacaPendiri(fd) {
  const nama = bersih(fd.get("nama"));
  if (!nama) return { galat: "Nama wajib diisi." };
  const foto = fotoValid(fd.get("foto_url")); if (foto.galat) return foto;
  const urutan = Number(fd.get("urutan"));
  return { nilai: {
    nama, peran: String(fd.get("peran") || "").trim().slice(0, 1500) || null,
    biografi: String(fd.get("biografi") || "").trim().slice(0, 6000) || null,
    foto_url: foto.nilai, urutan: Number.isInteger(urutan) ? urutan : 0,
  } };
}

export async function simpanPendiri(id, _prev, fd) {
  const { supabase } = await wajibAdmin();
  const b = bacaPendiri(fd); if (b.galat) return b;
  const { error } = await supabase.from("pendiri").update(b.nilai).eq("id", id);
  if (error) return GAGAL; segarkan(); return { ok: "Profil pendiri disimpan." };
}

export async function tambahPendiri(_prev, fd) {
  const { supabase } = await wajibAdmin();
  const b = bacaPendiri(fd); if (b.galat) return b;
  const { error } = await supabase.from("pendiri").insert(b.nilai);
  if (error) return GAGAL; segarkan(); return { ok: "Pendiri ditambahkan." };
}

export async function hapusPendiri(id) {
  const { supabase } = await wajibAdmin();
  await supabase.from("pendiri").delete().eq("id", id); segarkan();
}
