// Berkas Excel untuk rapor dan laporan. Bagan berupa data bar di dalam sel (persentase/nilai 0-100).
import { buatXlsx, namaKolom } from "@/lib/xlsx";
import { STATUS_HADIR, PREDIKAT, pesanRapor } from "@/lib/rapor";

const J = (v, gaya) => ({ v, gaya });
const tgl = (iso) => (iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }) : "");
const tglS = (iso) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" });
const periode = (r) => (r?.dari || r?.sampai ? `${r.dari ? tgl(r.dari) : "awal program"} – ${r.sampai ? tgl(r.sampai) : "sekarang"}` : "Seluruh periode sampai hari ini");
const num = (v) => (v == null ? "-" : v);
const GAYA_STATUS = { hadir: "hijauMuda", izin: "kuningMuda", sakit: "jinggaMuda", alpa: "merahMuda" };
const HURUF = { hadir: "H", izin: "I", sakit: "S", alpa: "A" };
const rng = (kol, a, b) => `${kol}${a}:${kol}${b}`;

// ---------------------------------------------------------- satu peserta
function lembarRapor(r) {
  const k = r.kehadiran, q = r.kuis, g = r.progres;
  const baris = [], gabung = [], dataBar = [];
  const tambah = (...sel) => { baris.push(sel); return baris.length; };
  tambah(J("RAPOR PESERTA KBA-UMM", "judul")); gabung.push("A1:F1");
  tambah(J(`Kuliah Bahasa Arab Untuk Meraih Mahabatullah · Periode: ${periode(r.rentang)}`, "sub")); gabung.push("A2:F2");
  tambah();
  [["Nama", r.peserta.nama], ["Kode peserta", r.peserta.kode], ["Kelas", `${r.grup.jk || ""} · ${r.grup.tingkat || ""}`], ["Grup", r.grup.nama], ["Pengajar", r.grup.pengajar || "-"]].forEach(([a, b]) => { const n = tambah(J(a, "label"), J(b, "tebal")); gabung.push(`B${n}:F${n}`); });
  tambah();
  tambah(J("RINGKASAN PENILAIAN", "tebal"));
  tambah(J("Skor akhir", "kepala"), J("Predikat", "kepala"), J("Kehadiran (%)", "kepala"), J("Rata-rata kuis", "kepala"), J("Progres belajar (%)", "kepala"));
  const rs = tambah(J(num(r.skor), "angka"), J(r.predikat.nama, "tebal"), J(num(k.persen), "persen"), J(num(q.rata), "angka"), J(num(g.persen), "persen"));
  dataBar.push(rng("C", rs, rs), rng("E", rs, rs));
  tambah(J(`Skor akhir = kehadiran ${r.bobot.hadir}% + nilai kuis ${r.bobot.kuis}% + progres belajar ${r.bobot.progres}%. Nilai kehadiran per pertemuan: hadir dan sakit 100, izin 95, alpa 0.`, "sub"));
  tambah();
  tambah(J("KEHADIRAN", "tebal"));
  tambah(J("Status", "kepala"), J("Jumlah", "kepala"), J("Persen", "kepala"));
  const a = baris.length + 1;
  ["hadir", "izin", "sakit", "alpa"].forEach((s) => tambah(J(STATUS_HADIR[s], GAYA_STATUS[s]), J(k[s], "tengah"), J(k.total ? Math.round((k[s] * 100) / k.total) : 0, "persen")));
  dataBar.push(rng("C", a, a + 3));
  tambah(J("Total pertemuan", "label"), J(k.total, "tebal"));
  tambah();
  tambah(J("NILAI KUIS", "tebal"));
  tambah(J("Kuis", "kepala"), J("Status", "kepala"), J("Nilai", "kepala"));
  const b0 = baris.length + 1;
  if (!q.jumlah) tambah(J("Belum ada kuis yang diterbitkan.", "sub"));
  else q.daftar.forEach((x) => tambah(J(x.judul, "sel"), J(x.status === "selesai" ? "Selesai" : x.status === "menunggu" ? "Menunggu penilaian" : "Belum dikerjakan", "tengah"), J(x.nilai ?? "-", "persen")));
  if (q.jumlah) dataBar.push(rng("C", b0, b0 + q.daftar.length - 1));
  tambah();
  tambah(J("PROGRES BELAJAR", "tebal"));
  tambah(J("Komponen", "kepala"), J("Selesai", "kepala"), J("Dari", "kepala"), J("Persen", "kepala"));
  const c0 = baris.length + 1;
  [["Materi", g.rincian.materi], ["Rekaman", g.rincian.rekaman], ["Kuis", g.rincian.kuis], ["Keseluruhan", { selesai: g.selesai, total: g.total }]].forEach(([n, v]) => tambah(J(n, n === "Keseluruhan" ? "label" : "sel"), J(v.selesai, "tengah"), J(v.total, "tengah"), J(v.total ? Math.round((v.selesai * 100) / v.total) : 0, "persen")));
  dataBar.push(rng("D", c0, c0 + 3));
  tambah();
  tambah(J("CATATAN PENGAJAR", "tebal"));
  const cn = tambah(J(r.catatan?.isi || "Belum ada catatan dari pengajar.", "sel")); gabung.push(`A${cn}:F${cn}`);
  tambah();
  tambah(J("APRESIASI DAN NASIHAT", "tebal"));
  const pesan = pesanRapor(r.skor);
  const na = tambah(J(pesan.apresiasi, "sel")); gabung.push(`A${na}:F${na}`);
  const ny = tambah(J(`${pesan.ayat.arab}  —  “${pesan.ayat.arti}” (${pesan.ayat.sumber})`, "sel")); gabung.push(`A${ny}:F${ny}`);
  const nn = tambah(J(pesan.nasihat, "sel")); gabung.push(`A${nn}:F${nn}`);
  const tinggi = { 0: 30, [cn - 1]: Math.max(24, Math.ceil((r.catatan?.isi || " ").length / 80) * 22),
    [na - 1]: Math.max(24, Math.ceil(pesan.apresiasi.length / 80) * 22), [ny - 1]: Math.max(24, Math.ceil((pesan.ayat.arab.length + pesan.ayat.arti.length) / 80) * 22), [nn - 1]: Math.max(24, Math.ceil(pesan.nasihat.length / 80) * 22) };
  const sheets = [{ nama: "Rapor", kolom: [26, 22, 18, 18, 22, 14], baris, gabung, dataBar, tinggi }];
  if (k.riwayat.length) {
    sheets.push({ nama: "Riwayat Kehadiran", kolom: [6, 18, 48, 14], beku: 3, baris: [
      [J("RIWAYAT KEHADIRAN", "judul")], [], [J("No", "kepala"), J("Tanggal", "kepala"), J("Pertemuan", "kepala"), J("Status", "kepala")],
      ...k.riwayat.map((x, i) => [J(i + 1, "tengah"), J(tglS(x.waktu), "tengah"), J(x.judul, "sel"), J(STATUS_HADIR[x.status], GAYA_STATUS[x.status])]),
    ], gabung: ["A1:D1"] });
  }
  return sheets;
}

// ---------------------------------------------------------- satu grup (banyak peserta)
function lembarGrup(daftar) {
  const grup = daftar[0].grup;
  const ring = [[J(`RAPOR GRUP ${grup.nama}`.toUpperCase(), "judul")], [J(`${grup.jk || ""} · ${grup.tingkat || ""} · Pengajar: ${grup.pengajar || "-"} · Periode: ${periode(daftar[0].rentang)}`, "sub")], [],
    [J("No", "kepala"), J("Nama", "kepala"), J("Kode", "kepala"), J("Hadir", "kepala"), J("Izin", "kepala"), J("Sakit", "kepala"), J("Alpa", "kepala"), J("Kehadiran (%)", "kepala"), J("Kuis dikerjakan", "kepala"), J("Rata kuis", "kepala"), J("Progres (%)", "kepala"), J("Skor", "kepala"), J("Predikat", "kepala")]];
  daftar.forEach((r, i) => ring.push([J(i + 1, "tengah"), J(r.peserta.nama, "tebal"), J(r.peserta.kode, "tengah"), J(r.kehadiran.hadir, "tengah"), J(r.kehadiran.izin, "tengah"), J(r.kehadiran.sakit, "tengah"), J(r.kehadiran.alpa, "tengah"), J(num(r.kehadiran.persen), "persen"), J(`${r.kuis.dikerjakan}/${r.kuis.jumlah}`, "tengah"), J(num(r.kuis.rata), "persen"), J(num(r.progres.persen), "persen"), J(num(r.skor), "persen"), J(r.predikat.nama, "tebal")]));
  const n = daftar.length, awal = 5, akhir = awal + n - 1;
  const sheets = [{ nama: "Ringkasan Grup", kolom: [5, 30, 16, 8, 8, 8, 8, 14, 14, 12, 13, 10, 18], beku: 4, gabung: ["A1:M1", "A2:M2"], dataBar: [rng("H", awal, akhir), rng("J", awal, akhir), rng("K", awal, akhir), rng("L", awal, akhir)], tinggi: { 0: 30, 3: 34 }, baris: ring }];

  const pert = daftar[0].kehadiran.riwayat;
  if (pert.length) {
    const kepala = [J("No", "kepala"), J("Nama", "kepala"), ...pert.map((p, i) => J(`${i + 1}\n${tglS(p.waktu)}`, "kepala"))];
    const mat = [[J("MATRIKS KEHADIRAN", "judul")], [J("H = Hadir · I = Izin · S = Sakit · A = Alpa", "sub")], [], kepala];
    daftar.forEach((r, i) => mat.push([J(i + 1, "tengah"), J(r.peserta.nama, "tebal"), ...r.kehadiran.riwayat.map((x) => J(HURUF[x.status], GAYA_STATUS[x.status]))]));
    sheets.push({ nama: "Matriks Kehadiran", kolom: [5, 30, ...pert.map(() => 8)], beku: 4, tinggi: { 0: 30, 3: 36 }, baris: mat, gabung: [`A1:${namaKolom(Math.min(pert.length + 1, 8))}1`] });
  }
  const kuis = daftar[0].kuis.daftar;
  if (kuis.length) {
    const mk = [[J("NILAI KUIS", "judul")], [J("Tanda - berarti belum dikerjakan; M = menunggu penilaian esai", "sub")], [], [J("No", "kepala"), J("Nama", "kepala"), ...kuis.map((x) => J(x.judul, "kepala")), J("Rata-rata", "kepala")]];
    daftar.forEach((r, i) => mk.push([J(i + 1, "tengah"), J(r.peserta.nama, "tebal"), ...r.kuis.daftar.map((x) => (x.status === "selesai" ? J(x.nilai, "persen") : J(x.status === "menunggu" ? "M" : "-", "tengah"))), J(num(r.kuis.rata), "persen")]));
    const kolAkhir = namaKolom(kuis.length + 2);
    sheets.push({ nama: "Nilai Kuis", kolom: [5, 30, ...kuis.map(() => 16), 12], beku: 4, tinggi: { 0: 30, 3: 48 }, baris: mk, gabung: [`A1:${namaKolom(Math.min(kuis.length + 2, 6))}1`], dataBar: [rng(namaKolom(2), 5, 4 + n), ...(kuis.length > 1 ? [`C5:${namaKolom(kuis.length + 1)}${4 + n}`] : []), rng(kolAkhir, 5, 4 + n)].filter((v, i, a) => a.indexOf(v) === i && !/^B/.test(v)) });
  }
  return sheets;
}

export async function buatExcelRapor(daftar) {
  return buatXlsx(daftar.length === 1 ? lembarRapor(daftar[0]) : lembarGrup(daftar));
}

// ---------------------------------------------------------- laporan umum
export async function buatExcelLaporan(l, { tampilNama = true } = {}) {
  const r = l.ringkas, t = l.total;
  const s1 = [[J("LAPORAN PROGRAM KBA-UMM", "judul")], [J(`Kuliah Bahasa Arab Untuk Meraih Mahabatullah · Periode: ${periode(l.rentang)} · Dibuat: ${tgl(l.dibuat)}`, "sub")], [],
    [J("ANGKA UTAMA", "tebal")], [J("Peserta", "label"), J(t.peserta, "tebal")], [J("Grup", "label"), J(t.grup, "tebal")], [J("Pertemuan terlaksana", "label"), J(t.pertemuan, "tebal")],
    [J("Rata-rata kehadiran (%)", "label"), J(num(r.rataHadir), "persen")], [J("Rata-rata nilai kuis", "label"), J(num(r.rataKuis), "persen")], [J("Rata-rata progres (%)", "label"), J(num(r.rataProgres), "persen")], [J("Rata-rata skor", "label"), J(num(r.rataSkor), "persen")],
    [], [J("RINGKASAN", "tebal")]];
  const gab = ["A1:H1", "A2:H2"], tinggi = { 0: 30 };
  l.ringkasan.forEach((x) => { s1.push([J(`• ${x}`, "sel")]); gab.push(`A${s1.length}:H${s1.length}`); tinggi[s1.length - 1] = Math.max(22, Math.ceil(x.length / 85) * 22); });
  s1.push([]);
  s1.push([J("CAPAIAN PER GRUP", "tebal")]);
  s1.push([J("Grup", "kepala"), J("Kelas", "kepala"), J("Peserta", "kepala"), J("Pertemuan", "kepala"), J("Kehadiran (%)", "kepala"), J("Rata kuis", "kepala"), J("Progres (%)", "kepala"), J("Skor", "kepala")]);
  const g0 = s1.length + 1;
  l.perGrup.forEach((g) => s1.push([J(g.nama, "tebal"), J(`${g.jk || ""} · ${g.tingkat || ""}`, "sel"), J(g.n, "tengah"), J(g.pertemuan, "tengah"), J(num(g.rataHadir), "persen"), J(num(g.rataKuis), "persen"), J(num(g.rataProgres), "persen"), J(num(g.rataSkor), "persen")]));
  const g1 = g0 + l.perGrup.length - 1;
  const sheets = [{ nama: "Ringkasan", kolom: [34, 24, 11, 12, 15, 12, 13, 10], gabung: gab, tinggi, dataBar: l.perGrup.length ? [rng("E", g0, g1), rng("F", g0, g1), rng("G", g0, g1), rng("H", g0, g1)] : [], baris: s1 }];

  const sebaran = [[J("SEBARAN PREDIKAT", "judul")], [], [J("Predikat", "kepala"), J("Arti", "kepala"), J("Jumlah", "kepala"), J("Persen", "kepala")]];
  PREDIKAT.forEach((p) => sebaran.push([J(p.nama, "tebal"), J(p.arti, "sel"), J(r.distribusi[p.nama] || 0, "tengah"), J(r.n ? Math.round(((r.distribusi[p.nama] || 0) * 100) / r.n) : 0, "persen")]));
  sheets.push({ nama: "Predikat", kolom: [22, 24, 10, 12], gabung: ["A1:D1"], dataBar: [rng("D", 4, 3 + PREDIKAT.length)], baris: sebaran, tinggi: { 0: 28 } });

  if (l.bulanan.length) {
    const bl = [[J("TREN PER BULAN", "judul")], [], [J("Bulan", "kepala"), J("Pertemuan", "kepala"), J("Kehadiran (%)", "kepala")]];
    l.bulanan.forEach((b) => bl.push([J(b.label, "tebal"), J(b.pertemuan, "tengah"), J(num(b.persen), "persen")]));
    sheets.push({ nama: "Bulanan", kolom: [18, 12, 16], gabung: ["A1:C1"], dataBar: [rng("C", 4, 3 + l.bulanan.length)], baris: bl, tinggi: { 0: 28 } });
  }
  if (tampilNama && l.peserta.length) {
    const pp = [[J("DAFTAR PESERTA", "judul")], [], [J("No", "kepala"), J("Nama", "kepala"), J("Kode", "kepala"), J("Grup", "kepala"), J("Kelas", "kepala"), J("Kehadiran (%)", "kepala"), J("Rata kuis", "kepala"), J("Progres (%)", "kepala"), J("Skor", "kepala"), J("Predikat", "kepala")]];
    [...l.peserta].sort((a, b) => (b.skor ?? -1) - (a.skor ?? -1)).forEach((p, i) => pp.push([J(i + 1, "tengah"), J(p.nama, "tebal"), J(p.kode, "tengah"), J(p.grup, "sel"), J(`${p.jk || ""} · ${p.tingkat || ""}`, "sel"), J(num(p.hadir), "persen"), J(num(p.kuis), "persen"), J(num(p.progres), "persen"), J(num(p.skor), "persen"), J(p.predikat, "tebal")]));
    const n = l.peserta.length;
    sheets.push({ nama: "Per Peserta", kolom: [5, 30, 16, 28, 20, 14, 12, 13, 10, 18], beku: 3, gabung: ["A1:J1"], dataBar: [rng("F", 4, 3 + n), rng("G", 4, 3 + n), rng("H", 4, 3 + n), rng("I", 4, 3 + n)], baris: pp, tinggi: { 0: 28, 2: 32 } });
  }
  return buatXlsx(sheets);
}
