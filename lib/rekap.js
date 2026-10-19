// Rekap kehadiran. Hanya pertemuan yang waktunya sudah lewat yang dihitung.
// Kehadiran (%) = jumlah Hadir / pertemuan terlaksana. Izin dan sakit ditampilkan terpisah.
// Peserta tanpa catatan pada pertemuan terlaksana dihitung Alpa.

export const rentangWIB = (dari, sampai) => ({
  dari: dari ? `${dari}T00:00:00+07:00` : null,
  sampai: sampai ? `${sampai}T23:59:59+07:00` : null,
});

export async function semua(buat) {
  const hasil = [];
  for (let i = 0; ; i += 1000) {
    const { data, error } = await buat().range(i, i + 999);
    if (error) throw new Error(error.message);
    hasil.push(...data);
    if (data.length < 1000) break;
  }
  return hasil;
}

export async function rekapGrup(supabase, grup, { dari, sampai } = {}) {
  let q = supabase.from("pertemuan").select("id,judul,waktu").eq("grup_id", grup.id).lte("waktu", new Date().toISOString()).order("waktu");
  if (dari) q = q.gte("waktu", dari);
  if (sampai) q = q.lte("waktu", sampai);
  const [{ data: pertemuan, error: e1 }, { data: anggota, error: e2 }] = await Promise.all([q, supabase.rpc("anggota_grup_daftar", { gid: grup.id })]);
  if (e1 || e2) throw new Error((e1 || e2).message);

  const ids = new Set(pertemuan.map((p) => p.id));
  const abs = ids.size
    ? await semua(() => supabase.from("absensi").select("pertemuan_id,profile_id,status,pertemuan!inner(grup_id)").eq("pertemuan.grup_id", grup.id))
    : [];
  const peta = new Map();
  abs.forEach((a) => { if (ids.has(a.pertemuan_id)) peta.set(`${a.profile_id}|${a.pertemuan_id}`, a.status); });

  const baris = (anggota || []).map((a) => {
    const rinci = pertemuan.map((p) => ({ pertemuan: p, status: peta.get(`${a.profile_id}|${p.id}`) || "alpa" }));
    const c = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
    rinci.forEach((r) => { c[r.status]++; });
    const total = pertemuan.length;
    return { id: a.profile_id, kode: a.kode, nama: a.nama_lengkap, jk: a.jenis_kelamin, ...c, total, persen: total ? Math.round((c.hadir / total) * 100) : 0, rinci };
  });
  return { grup, pertemuan, baris };
}

const tgl = (iso) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

export function barisCSV(hasil, rinci) {
  if (rinci) {
    const rows = [["tanggal", "jenis_kelamin", "kelas", "grup", "pertemuan", "nama_lengkap", "kode", "status"]];
    hasil.forEach((h) => h.baris.forEach((b) => b.rinci.forEach((r) =>
      rows.push([tgl(r.pertemuan.waktu), h.grup.kelas.jenis_kelamin, h.grup.kelas.tingkat, h.grup.nama, r.pertemuan.judul, b.nama, b.kode, r.status]))));
    return rows;
  }
  const rows = [["jenis_kelamin", "kelas", "grup", "nama_lengkap", "kode", "pertemuan_terlaksana", "hadir", "izin", "sakit", "alpa", "persen_hadir"]];
  hasil.forEach((h) => h.baris.forEach((b) =>
    rows.push([h.grup.kelas.jenis_kelamin, h.grup.kelas.tingkat, h.grup.nama, b.nama, b.kode, b.total, b.hadir, b.izin, b.sakit, b.alpa, b.persen])));
  return rows;
}
