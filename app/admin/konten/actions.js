"use server";
import { revalidatePath } from "next/cache";
import { wajibAdmin } from "@/lib/auth";
import { bersih } from "@/lib/validasi";
import { dariInputWIB } from "@/lib/waktu";
import { kirimPush } from "@/lib/push";
import { tanggalIndo } from "@/lib/data";

const segarkan = () => { ["/", "/profil", "/pendiri", "/pengajar", "/admin/konten"].forEach((p) => revalidatePath(p)); };
const GAGAL = { galat: "Gagal menyimpan. Coba lagi." };

export async function tambahPengumuman(_prev, fd) {
  const { supabase, user } = await wajibAdmin();
  const judul = bersih(fd.get("judul")), isi = String(fd.get("isi") || "").trim();
  if (!judul || !isi) return { galat: "Judul dan isi wajib diisi." };
  const { error } = await supabase.from("pengumuman").insert({ judul, isi });
  if (error) return GAGAL;
  segarkan();
  if (fd.get("notif") === "on") await kirimPush({ topik: "pengumuman", kecuali: user.id, judul: "Pengumuman baru", isi: judul, url: "/" });
  return { ok: "Pengumuman diterbitkan." };
}
export async function hapusPengumuman(id) {
  const { supabase } = await wajibAdmin(); await supabase.from("pengumuman").delete().eq("id", id); segarkan();
}

export async function tambahJadwal(_prev, fd) {
  const { supabase, user } = await wajibAdmin();
  const judul = bersih(fd.get("judul")), waktu = dariInputWIB(fd.get("waktu"));
  if (!judul || !waktu) return { galat: "Judul dan waktu wajib diisi." };
  const { error } = await supabase.from("jadwal").insert({ judul, waktu_mulai: waktu, keterangan: bersih(fd.get("keterangan")) || null });
  if (error) return GAGAL;
  segarkan();
  if (fd.get("notif") === "on") await kirimPush({ topik: "jadwal", kecuali: user.id, judul: "Jadwal baru", isi: `${judul} · ${tanggalIndo(waktu)}`, url: "/" });
  return { ok: "Jadwal ditambahkan." };
}
export async function hapusJadwal(id) {
  const { supabase } = await wajibAdmin(); await supabase.from("jadwal").delete().eq("id", id); segarkan();
}

export async function simpanKonten(kunci, _prev, fd) {
  const { supabase } = await wajibAdmin();
  const isi = String(fd.get("isi") || "").trim();
  if (!isi) { await supabase.from("konten_halaman").delete().eq("kunci", kunci); segarkan(); return { ok: "Dikosongkan; teks bawaan dipakai." }; }
  const { error } = await supabase.from("konten_halaman").upsert({ kunci, isi });
  if (error) return GAGAL; segarkan(); return { ok: "Tersimpan." };
}

export async function tambahPendiri(_prev, fd) {
  const { supabase } = await wajibAdmin();
  const nama = bersih(fd.get("nama"));
  if (!nama) return { galat: "Nama wajib diisi." };
  const foto = bersih(fd.get("foto_url"));
  if (foto && !/^https:\/\//.test(foto)) return { galat: "Alamat foto harus diawali https://" };
  const { error } = await supabase.from("pendiri").insert({
    nama, peran: bersih(fd.get("peran")) || null, biografi: String(fd.get("biografi") || "").trim() || null,
    foto_url: foto || null, urutan: Number(fd.get("urutan")) || 0,
  });
  if (error) return GAGAL; segarkan(); return { ok: "Pendiri ditambahkan." };
}
export async function hapusPendiri(id) {
  const { supabase } = await wajibAdmin(); await supabase.from("pendiri").delete().eq("id", id); segarkan();
}
