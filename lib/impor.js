import { supabaseAdmin } from "@/lib/supabase/server";
import { normalisasiWA } from "@/lib/identitas";
import { adalahEmail, bersih } from "@/lib/validasi";
import { buatPassword, AUTH_DOMAIN } from "@/lib/sandi";

const JK = { ikhwan: "Ikhwan", akhwat: "Akhwat" };
const TINGKAT = { pemula: "Pemula", lanjutan: "Lanjutan", "kelas khusus": "Kelas Khusus", khusus: "Kelas Khusus" };
const kunci = (nama, grup) => `${bersih(nama).toLowerCase()}|${bersih(grup).toLowerCase()}`;
const cek = (r) => { if (r.error) throw new Error(r.error.message); return r.data; };

export function normalisasiBaris(r, i) {
  const b = {
    baris: r.__baris ?? i + 2, // baris 1 = header
    jenis_kelamin: JK[bersih(r.jenis_kelamin).toLowerCase()] || "",
    nama_lengkap: bersih(r.nama_lengkap),
    kelas: TINGKAT[bersih(r.kelas).toLowerCase()] || "",
    grup: bersih(r.grup),
    pengajar: bersih(r.pengajar),
    email: bersih(r.email).toLowerCase(),
    whatsapp: bersih(r.whatsapp) ? normalisasiWA(r.whatsapp) : "",
    galat: [],
  };
  if (!b.jenis_kelamin) b.galat.push("jenis_kelamin harus Ikhwan atau Akhwat");
  if (!b.nama_lengkap) b.galat.push("nama_lengkap kosong");
  if (!b.kelas) b.galat.push("kelas harus Pemula, Lanjutan, atau Kelas Khusus");
  if (b.kelas === "Kelas Khusus" && b.jenis_kelamin === "Akhwat") b.galat.push("Kelas Khusus hanya untuk Ikhwan");
  if (!b.grup) b.galat.push("grup kosong");
  if (!b.pengajar) b.galat.push("pengajar kosong");
  if (b.email && !adalahEmail(b.email)) b.galat.push("format email salah");
  if (b.whatsapp && !/^62\d{8,13}$/.test(b.whatsapp)) b.galat.push("format WhatsApp salah");
  return b;
}

async function muatReferensi(db) {
  const [kelas, grup, pengajar] = await Promise.all([
    db.from("kelas").select("id,jenis_kelamin,tingkat"),
    db.from("grup").select("id,kelas_id,nama,pengajar_id"),
    db.from("pengajar").select("id,nama"),
  ]);
  return { kelas: cek(kelas), grup: cek(grup), pengajar: cek(pengajar) };
}

// Pratinjau: menentukan status tiap baris tanpa menulis apa pun.
export async function periksa(rowsMentah) {
  const db = supabaseAdmin();
  const baris = rowsMentah.map(normalisasiBaris);
  const [ada, kontak, ref] = await Promise.all([
    db.from("peserta_grup").select("profiles(nama_lengkap), grup(nama)"),
    db.from("profiles").select("email,whatsapp"),
    muatReferensi(db),
  ]);
  const kunciAda = new Set(cek(ada).map((x) => kunci(x.profiles?.nama_lengkap, x.grup?.nama)));
  const emailAda = new Set(cek(kontak).map((x) => x.email).filter(Boolean));
  const waAda = new Set(cek(kontak).map((x) => x.whatsapp).filter(Boolean));
  const dalamBerkas = new Set();

  return baris.map((b) => {
    const dasar = { baris: b.baris, nama: b.nama_lengkap, grup: b.grup, data: b, catatan: [] };
    if (b.galat.length) return { ...dasar, status: "gagal", pesan: b.galat.join("; ") };
    const k = kunci(b.nama_lengkap, b.grup);
    if (kunciAda.has(k) || dalamBerkas.has(k)) return { ...dasar, status: "duplikat", pesan: "Nama dan grup sudah ada" };
    if (b.email && emailAda.has(b.email)) return { ...dasar, status: "gagal", pesan: "Email sudah dipakai akun lain" };
    if (b.whatsapp && waAda.has(b.whatsapp)) return { ...dasar, status: "gagal", pesan: "WhatsApp sudah dipakai akun lain" };
    dalamBerkas.add(k);
    if (b.email) emailAda.add(b.email);
    if (b.whatsapp) waAda.add(b.whatsapp);
    const kelas = ref.kelas.find((x) => x.jenis_kelamin === b.jenis_kelamin && x.tingkat === b.kelas);
    const grup = kelas && ref.grup.find((x) => x.kelas_id === kelas.id && x.nama.toLowerCase() === b.grup.toLowerCase());
    if (!grup) dasar.catatan.push("grup baru");
    if (!ref.pengajar.find((x) => x.nama.toLowerCase() === b.pengajar.toLowerCase())) dasar.catatan.push("pengajar baru");
    return { ...dasar, status: "baru", pesan: dasar.catatan.join(", ") };
  });
}

async function pastikanReferensi(db, ref, b) {
  let kelas = ref.kelas.find((x) => x.jenis_kelamin === b.jenis_kelamin && x.tingkat === b.kelas);
  if (!kelas) {
    kelas = cek(await db.from("kelas").insert({ jenis_kelamin: b.jenis_kelamin, tingkat: b.kelas }).select("id,jenis_kelamin,tingkat").single());
    ref.kelas.push(kelas);
  }
  let pengajar = ref.pengajar.find((x) => x.nama.toLowerCase() === b.pengajar.toLowerCase());
  if (!pengajar) {
    pengajar = cek(await db.from("pengajar").insert({ nama: b.pengajar }).select("id,nama").single());
    ref.pengajar.push(pengajar);
  }
  let grup = ref.grup.find((x) => x.kelas_id === kelas.id && x.nama.toLowerCase() === b.grup.toLowerCase());
  if (!grup) {
    grup = cek(await db.from("grup").insert({ kelas_id: kelas.id, nama: b.grup, pengajar_id: pengajar.id }).select("id,kelas_id,nama,pengajar_id").single());
    ref.grup.push(grup);
  } else if (!grup.pengajar_id) {
    cek(await db.from("grup").update({ pengajar_id: pengajar.id }).eq("id", grup.id));
    grup.pengajar_id = pengajar.id;
  }
  return grup.id;
}

// Impor sungguhan: buat akun, profil, keanggotaan grup, dan password awal.
export async function prosesBaris(rowsMentah) {
  const db = supabaseAdmin();
  const hasil = await periksa(rowsMentah);
  const ref = await muatReferensi(db);
  const keluar = [];
  for (const h of hasil) {
    if (h.status !== "baru") { keluar.push({ baris: h.baris, nama: h.nama, grup: h.grup, status: h.status, pesan: h.pesan }); continue; }
    const b = h.data;
    let userId = null;
    try {
      const grupId = await pastikanReferensi(db, ref, b);
      const kode = cek(await db.rpc("kode_berikutnya", { prefix: "KBUMM" }));
      const password = buatPassword();
      const authEmail = `${kode.toLowerCase()}@${AUTH_DOMAIN}`;
      const u = cek(await db.auth.admin.createUser({ email: authEmail, password, email_confirm: true }));
      userId = u.user.id;
      cek(await db.from("profiles").insert({
        id: userId, kode, auth_email: authEmail, nama_lengkap: b.nama_lengkap, jenis_kelamin: b.jenis_kelamin,
        role: "peserta", email: b.email || null, whatsapp: b.whatsapp || null,
      }));
      cek(await db.from("peserta_grup").insert({ profile_id: userId, grup_id: grupId }));
      cek(await db.from("password_awal").insert({ profile_id: userId, password }));
      keluar.push({ baris: h.baris, nama: h.nama, grup: h.grup, status: "berhasil", kode, pesan: h.pesan });
    } catch (e) {
      if (userId) await db.auth.admin.deleteUser(userId);
      keluar.push({ baris: h.baris, nama: h.nama, grup: h.grup, status: "gagal", pesan: `Gagal membuat akun: ${e.message}` });
    }
  }
  return keluar;
}
