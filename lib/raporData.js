// Pemuat data rapor dan laporan. Memakai klien sesi pengguna, sehingga aturan RLS berlaku:
// peserta hanya mendapat datanya sendiri; pengajar hanya grup yang diampu; admin semuanya.
import { semua, rentangWIB } from "@/lib/rekap";
import { hitungRapor, hitungLaporan, bacaBobot } from "@/lib/rapor";

const bagi = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
const ms = (iso) => new Date(iso).getTime();

export async function ambilBobot(supabase) {
  const { data } = await supabase.from("pengaturan").select("nilai").eq("kunci", "rapor_bobot").maybeSingle();
  return bacaBobot(data?.nilai);
}

// Periode dari parameter alamat (?dari=YYYY-MM-DD&sampai=YYYY-MM-DD)
export function bacaRentang(sp = {}) {
  const ok = (t) => /^\d{4}-\d{2}-\d{2}$/.test(String(t || ""));
  const dari = ok(sp.dari) ? sp.dari : "", sampai = ok(sp.sampai) ? sp.sampai : "";
  return { ...rentangWIB(dari, sampai), labelDari: dari, labelSampai: sampai };
}

export function grupRingkas(g) {
  return { id: g.id, nama: g.nama, jk: g.kelas?.jenis_kelamin || g.jk, tingkat: g.kelas?.tingkat || g.tingkat, pengajar: g.pengajar?.nama || g.pengajar || "" };
}

// Rapor semua peserta satu grup (atau hanya sebagian lewat opsi.hanya), dengan kueri massal
export async function muatRaporGrup(supabase, grup, rentang, bobot, { anggota = null, hanya = null } = {}) {
  const gid = grup.id, sekarang = new Date().toISOString();
  let daftar = anggota;
  if (!daftar) {
    const { data, error } = await supabase.rpc("anggota_grup_daftar", { gid });
    if (error) throw new Error(error.message);
    daftar = data || [];
  }
  if (hanya) daftar = daftar.filter((a) => hanya.includes(a.profile_id));
  if (!daftar.length) return [];
  const ids = daftar.map((a) => a.profile_id);

  let qp = supabase.from("pertemuan").select("id,judul,waktu").eq("grup_id", gid).lte("waktu", sekarang).order("waktu");
  if (rentang?.dari) qp = qp.gte("waktu", rentang.dari);
  if (rentang?.sampai) qp = qp.lte("waktu", rentang.sampai);
  const [pertRes, kuisRes, matRes, rekRes] = await Promise.all([
    qp,
    supabase.from("kuis").select("id,judul,pertemuan(waktu)").eq("grup_id", gid).eq("diterbitkan", true).order("dibuat_pada"),
    semua(() => supabase.from("materi").select("id,pertemuan_id").eq("grup_id", gid)),
    semua(() => supabase.from("rekaman").select("id,pertemuan_id,mulai_detik,selesai_detik").eq("grup_id", gid)),
  ]);
  if (pertRes.error) throw new Error(pertRes.error.message);
  const pertemuan = pertRes.data || [];
  const kuisSemua = (kuisRes.data || []).map((k) => ({ id: k.id, judul: k.judul, waktu: k.pertemuan?.waktu || null }));
  const kuis = kuisSemua.filter((k) => !k.waktu || ((!rentang?.dari || ms(k.waktu) >= ms(rentang.dari)) && (!rentang?.sampai || ms(k.waktu) <= ms(rentang.sampai))));

  const idsKuis = kuis.map((k) => k.id);
  // keempat kelompok data tidak saling bergantung, jadi dimuat bersamaan
  const [abs, perc, progBagian, catBagian] = await Promise.all([
    pertemuan.length
      ? semua(() => { let q = supabase.from("absensi").select("pertemuan_id,profile_id,status,pertemuan!inner(grup_id)").eq("pertemuan.grup_id", gid); if (hanya) q = q.in("profile_id", ids); return q; })
      : [],
    idsKuis.length
      ? semua(() => { let q = supabase.from("percobaan").select("kuis_id,profile_id,nilai,status").in("kuis_id", idsKuis); if (hanya) q = q.in("profile_id", ids); return q; })
      : [],
    Promise.all(bagi(ids, 80).map((bg) => semua(() => supabase.from("progres").select("profile_id,jenis,item_id").in("profile_id", bg).in("jenis", ["materi", "rekaman", "kuis"])))),
    Promise.all(bagi(ids, 80).map((bg) => supabase.from("rapor_catatan").select("profile_id,catatan,penulis,diubah_pada").in("profile_id", bg))),
  ]);
  const prog = progBagian.flat(), catatan = catBagian.flatMap((r) => r.data || []);

  const absensi = {}, percobaan = {}, selesai = {}, cat = {};
  abs.forEach((a) => { (absensi[a.profile_id] = absensi[a.profile_id] || {})[a.pertemuan_id] = a.status; });
  perc.forEach((p) => {
    const m = (percobaan[p.profile_id] = percobaan[p.profile_id] || {});
    const lama = m[p.kuis_id];
    // status 'menunggu' = esai belum dinilai (kolom nilai sementara tidak dipakai); 'selesai' = nilai final, diambil yang terbaik
    if (p.status === "selesai") m[p.kuis_id] = { nilai: Math.max(lama?.nilai ?? -1, p.nilai ?? 0) };
    else if (!lama) m[p.kuis_id] = { nilai: null };
  });
  const tandai = {}; // profile_id -> Set item_id yang ditandai sendiri
  prog.forEach((p) => { (tandai[p.profile_id] = tandai[p.profile_id] || new Set()).add(p.item_id); if (p.jenis === "kuis") { const s = (selesai[p.profile_id] = selesai[p.profile_id] || { materi: 0, rekaman: 0, kuis: 0 }); s.kuis++; } });
  catatan.forEach((c) => { cat[c.profile_id] = { isi: c.catatan, oleh: c.penulis, waktu: c.diubah_pada }; });

  const matSemua = matRes || [], rekSemua = (rekRes || []).filter((x) => x.mulai_detik == null && x.selesai_detik == null); // klip kajian tidak dihitung
  const total = { materi: matSemua.length, rekaman: rekSemua.length, kuis: kuisSemua.length };
  return daftar.map((a) => {
    const s = selesai[a.profile_id] || { materi: 0, rekaman: 0, kuis: 0 };
    // hadir langsung = materi & rekaman pertemuan itu otomatis selesai; selain itu dihitung dari tombol "Tandai selesai"
    const ab = absensi[a.profile_id] || {}, ts = tandai[a.profile_id] || new Set();
    const selesaiDari = (daftarItem) => daftarItem.filter((x) => ts.has(x.id) || ab[x.pertemuan_id] === "hadir").length;
    s.materi = selesaiDari(matSemua); s.rekaman = selesaiDari(rekSemua);
    return hitungRapor({
      peserta: { id: a.profile_id, nama: a.nama_lengkap, kode: a.kode, jk: a.jenis_kelamin },
      grup, rentang: { dari: rentang?.labelDari || "", sampai: rentang?.labelSampai || "" },
      pertemuan, absensi: absensi[a.profile_id] || {}, kuis, percobaan: percobaan[a.profile_id] || {},
      progres: { materi: { selesai: Math.min(s.materi, total.materi), total: total.materi }, rekaman: { selesai: Math.min(s.rekaman, total.rekaman), total: total.rekaman }, kuis: { selesai: Math.min(s.kuis, total.kuis), total: total.kuis } },
      catatan: cat[a.profile_id] || null,
    }, bobot);
  }).sort((x, y) => x.peserta.nama.localeCompare(y.peserta.nama, "id"));
}

// Rapor satu peserta. sebagaiPeserta = true bila yang membuka adalah peserta itu sendiri.
export async function muatRaporPeserta(supabase, { profilId, rentang, bobot, sebagaiPeserta = false }) {
  const { data: pg } = await supabase.from("peserta_grup").select("grup_id,grup(id,nama,kelas(jenis_kelamin,tingkat),pengajar(nama))").eq("profile_id", profilId).maybeSingle();
  if (!pg?.grup) return null;
  const grup = grupRingkas(pg.grup);
  let anggota = null;
  if (sebagaiPeserta) {
    const { data: p } = await supabase.from("profiles").select("id,kode,nama_lengkap,jenis_kelamin").eq("id", profilId).maybeSingle();
    if (!p) return null;
    anggota = [{ profile_id: p.id, kode: p.kode, nama_lengkap: p.nama_lengkap, jenis_kelamin: p.jenis_kelamin }];
  }
  const [r] = await muatRaporGrup(supabase, grup, rentang, bobot, { anggota, hanya: [profilId] });
  return r || null;
}

// Laporan umum untuk sekumpulan grup
export async function muatLaporan(supabase, daftarGrup, rentang, bobot) {
  const hasil = await Promise.all(daftarGrup.map(async (g) => {
    const grup = grupRingkas(g);
    return { grup, rapor: await muatRaporGrup(supabase, grup, rentang, bobot) };
  }));
  return hitungLaporan(hasil, { rentang: { dari: rentang?.labelDari || "", sampai: rentang?.labelSampai || "" } });
}

// Daftar grup untuk laporan: admin semua grup, pengajar hanya grup yang diampu (dilengkapi nama pengajar)
export async function grupLaporan(supabase, profil, idPilihan = null) {
  const { grupDiampu } = await import("@/lib/guru");
  const boleh = new Set((await grupDiampu(supabase, profil)).map((g) => g.id));
  const { data } = await supabase.from("grup").select("id,nama,kelas(jenis_kelamin,tingkat),pengajar(nama)").order("nama");
  return (data || []).filter((g) => boleh.has(g.id) && (!idPilihan?.length || idPilihan.includes(g.id)));
}
