"use server";
import { revalidatePath } from "next/cache";
import { wajibAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { prosesBaris } from "@/lib/impor";

// Menambah satu peserta memakai logika yang sama dengan impor CSV (kode otomatis, password awal acak, cegah data ganda).
export async function tambahPesertaBaru(_prev, fd) {
  const { supabase } = await wajibAdmin();
  const { data: g } = await supabase.from("grup")
    .select("id,nama,kelas(jenis_kelamin,tingkat),pengajar(nama)").eq("id", String(fd.get("grup_id") || "")).maybeSingle();
  if (!g) return { galat: "Pilih grup terlebih dahulu." };
  if (!g.pengajar?.nama) return { galat: "Grup ini belum punya pengajar. Atur dulu di menu Kelas & Grup." };

  const [r] = await prosesBaris([{
    jenis_kelamin: g.kelas.jenis_kelamin, nama_lengkap: fd.get("nama_lengkap"), kelas: g.kelas.tingkat,
    grup: g.nama, pengajar: g.pengajar.nama, email: fd.get("email"), whatsapp: fd.get("whatsapp"),
  }]);
  if (r.status === "duplikat") return { galat: "Peserta dengan nama dan grup itu sudah terdaftar." };
  if (r.status !== "berhasil") return { galat: r.pesan || "Gagal menambahkan peserta." };

  const db = supabaseAdmin();
  const { data: p } = await db.from("profiles").select("id").eq("kode", r.kode).maybeSingle();
  const { data: pw } = p ? await db.from("password_awal").select("password").eq("profile_id", p.id).maybeSingle() : { data: null };
  revalidatePath("/admin/peserta"); revalidatePath("/admin");
  return { ok: `Berhasil ditambahkan. Kode: ${r.kode} · Password awal: ${pw?.password ?? "(lihat di menu Kode & Password)"}. Catat dan sampaikan kepada peserta.` };
}
