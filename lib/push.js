// Pengiriman notifikasi push (Web Push). HANYA dipakai di server.
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase/server";

export const TOPIK = ["kelas", "kuis", "pengumuman", "jadwal", "faidah"];

// Hanya layanan push resmi peramban yang diterima (mencegah alamat sembarang disimpan)
const LAYANAN = ["fcm.googleapis.com", "android.googleapis.com", "push.services.mozilla.com", "push.apple.com", "notify.windows.com"];
export function endpointValid(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && url.length <= 700 && LAYANAN.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
  } catch { return false; }
}

let kunciSiap = null;
async function siapkan() {
  if (kunciSiap) return kunciSiap;
  const db = supabaseAdmin();
  let { data } = await db.from("push_kunci").select("publik,privat").eq("id", 1).maybeSingle();
  if (!data) {
    const k = webpush.generateVAPIDKeys();
    await db.from("push_kunci").upsert({ id: 1, publik: k.publicKey, privat: k.privateKey }, { onConflict: "id", ignoreDuplicates: true });
    ({ data } = await db.from("push_kunci").select("publik,privat").eq("id", 1).maybeSingle());
  }
  if (!data) throw new Error("Kunci notifikasi tidak tersedia. Pastikan SQL 11 sudah dijalankan.");
  const situs = process.env.NEXT_PUBLIC_SITE_URL || "";
  webpush.setVapidDetails(/^https:\/\//.test(situs) ? situs : "mailto:admin@kbumm.local", data.publik, data.privat);
  kunciSiap = data.publik;
  return kunciSiap;
}
export async function kunciPublik() { return siapkan(); }

const potong = (a, n) => (a.length > n ? `${a.slice(0, n - 1)}…` : a);
const bagi = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

/**
 * kirimPush({ topik, grupId, profilIds, kecuali, judul, isi, url })
 * - grupId: kirim ke peserta grup itu | profilIds: kirim ke akun tertentu | tanpa keduanya: kirim ke semua perangkat
 * - topik: hanya perangkat yang mengaktifkan topik itu (kosongkan untuk mengabaikan pilihan topik)
 * - kecuali: id akun yang tidak perlu menerima (biasanya pengirimnya sendiri)
 * Tidak pernah melempar galat: kegagalan notifikasi tidak boleh menggagalkan aksi utama.
 */
export async function kirimPush({ topik = null, grupId = null, profilIds = null, kecuali = null, judul, isi = "", url = "/" }) {
  try {
    await siapkan();
    const db = supabaseAdmin();
    let ids = profilIds;
    if (grupId) {
      const { data } = await db.from("peserta_grup").select("profile_id").eq("grup_id", grupId);
      ids = (data || []).map((x) => x.profile_id);
    }
    if (ids && !ids.length) return { terkirim: 0 };

    let rows = [];
    const ambil = async (daftarId) => {
      let q = db.from("push_langganan").select("id,endpoint,p256dh,auth,profile_id");
      if (daftarId) q = q.in("profile_id", daftarId);
      if (topik) q = q.contains("topik", [topik]);
      const { data } = await q.limit(5000);
      rows.push(...(data || []));
    };
    if (ids) for (const b of bagi(ids, 80)) await ambil(b); else await ambil(null);

    // hanya akun aktif, bukan pengirim
    const akun = [...new Set(rows.map((r) => r.profile_id))];
    const aktif = new Set();
    for (const b of bagi(akun, 80)) { const { data } = await db.from("profiles").select("id").in("id", b).eq("aktif", true); (data || []).forEach((x) => aktif.add(x.id)); }
    rows = rows.filter((r) => aktif.has(r.profile_id) && r.profile_id !== kecuali);
    if (!rows.length) return { terkirim: 0 };

    const muatan = JSON.stringify({ judul: potong(judul, 80), isi: potong(isi, 160), url, tag: topik || "umum" });
    const kirimSatu = async (r) => {
      try {
        await webpush.sendNotification({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }, muatan, { TTL: 86400, urgency: "normal" });
        return "ok";
      } catch (e) { return e?.statusCode === 404 || e?.statusCode === 410 ? "hapus" : "gagal"; }
    };

    const kerja = (async () => {
      const hasil = [];
      for (const b of bagi(rows, 25)) hasil.push(...(await Promise.all(b.map(async (r) => [r.id, await kirimSatu(r)]))));
      const mati = hasil.filter(([, s]) => s === "hapus").map(([id]) => id);
      if (mati.length) await db.from("push_langganan").delete().in("id", mati);
      return { terkirim: hasil.filter(([, s]) => s === "ok").length, gagal: hasil.filter(([, s]) => s === "gagal").length, dihapus: mati.length };
    })();
    return await Promise.race([kerja, new Promise((ok) => setTimeout(() => ok({ terkirim: 0, tertunda: true }), 8000))]);
  } catch (e) {
    console.error("Notifikasi gagal dikirim:", e?.message || e);
    return { terkirim: 0, galat: true };
  }
}
