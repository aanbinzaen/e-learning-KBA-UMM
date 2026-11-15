// Pembuat dokumen Word (.docx) untuk rapor dan laporan. Bagan dibuat dari blok warna sehingga tetap dapat diedit di Word.
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, BorderStyle, Footer, VerticalAlign, PageNumber } from "docx";
import { PREDIKAT, STATUS_HADIR, WARNA_HADIR, warnaNilai, labelBulan } from "@/lib/rapor";

const LEBAR = 9906;   // A4 dengan margin 1000 twip
const HIJAU = "1E7B34", HIJAU_TUA = "14582A", MUDA = "E6F0DC", KREM = "FAF8F1", TEPI = "C9D3BC", ABU = "5B6B5F";
const hex = (w) => String(w).replace("#", "");
const pct = (v) => (v == null ? "-" : `${v}%`);
const tgl = (iso) => (iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }) : "");
const tglPendek = (iso) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const periode = (r) => (r?.dari || r?.sampai ? `${r.dari ? tgl(r.dari) : "awal program"} – ${r.sampai ? tgl(r.sampai) : "sekarang"}` : "Seluruh periode sampai hari ini");

const run = (t, o = {}) => new TextRun({ text: String(t), font: "Calibri", size: o.ukuran || 21, bold: o.tebal, italics: o.miring, color: o.warna ? hex(o.warna) : undefined, ...(o.arab ? { rightToLeft: true } : {}) });
const para = (t, o = {}) => new Paragraph({ alignment: o.rata || AlignmentType.LEFT, spacing: { before: o.sebelum ?? 0, after: o.sesudah ?? 80, line: o.garis }, children: Array.isArray(t) ? t : [run(t, o)] });

const batas = { style: BorderStyle.SINGLE, size: 4, color: TEPI };
const semuaBatas = { top: batas, bottom: batas, left: batas, right: batas, insideHorizontal: batas, insideVertical: batas };
const tanpaBatas = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const tanpa = { top: tanpaBatas, bottom: tanpaBatas, left: tanpaBatas, right: tanpaBatas, insideHorizontal: tanpaBatas, insideVertical: tanpaBatas };
const margin = { top: 70, bottom: 70, left: 110, right: 110 };

function sel(isi, lebar, o = {}) {
  const anak = Array.isArray(isi) && isi[0] instanceof Paragraph ? isi : [para(isi, { rata: o.rata, tebal: o.tebal, warna: o.warna, ukuran: o.ukuran, sesudah: 0 })];
  return new TableCell({ width: { size: lebar, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, margins: margin, columnSpan: o.span,
    shading: o.isi ? { type: ShadingType.CLEAR, fill: hex(o.isi), color: "auto" } : undefined, children: anak });
}
function tabel(kepala, baris, lebar, opsi = {}) {
  const jml = lebar.reduce((a, b) => a + b, 0);
  const rows = [];
  if (kepala) rows.push(new TableRow({ tableHeader: true, children: kepala.map((k, i) => sel(k, lebar[i], { isi: HIJAU, warna: "FFFFFF", tebal: true, rata: AlignmentType.CENTER, ukuran: 20 })) }));
  baris.forEach((r, n) => rows.push(new TableRow({ cantSplit: true, children: r.map((c, i) => {
    const o = typeof c === "object" && c !== null && !Array.isArray(c) && !(c instanceof Paragraph) && "t" in c ? c : { t: c };
    return sel(o.t, lebar[i], { isi: o.isi || (n % 2 ? KREM : undefined), rata: o.rata || (opsi.rata?.[i]), tebal: o.tebal, warna: o.warna, ukuran: o.ukuran });
  }) })));
  return new Table({ width: { size: jml, type: WidthType.DXA }, columnWidths: lebar, borders: opsi.tanpaBatas ? tanpa : semuaBatas, rows });
}
function batang(persen, warna, blok = 20) {
  const isi = Math.max(0, Math.min(blok, Math.round(((persen ?? 0) / 100) * blok)));
  return [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: "█".repeat(isi), color: hex(warna), size: 20, font: "Calibri" }), new TextRun({ text: "█".repeat(blok - isi), color: "E3E8DC", size: 20, font: "Calibri" })] })];
}
function bandJudul(judul, sub) {
  return new Table({ width: { size: LEBAR, type: WidthType.DXA }, columnWidths: [LEBAR], borders: tanpa, rows: [new TableRow({ children: [new TableCell({ width: { size: LEBAR, type: WidthType.DXA }, margins: { top: 160, bottom: 160, left: 220, right: 220 }, shading: { type: ShadingType.CLEAR, fill: HIJAU, color: "auto" }, children: [
    para(judul, { tebal: true, ukuran: 40, warna: "FFFFFF", sesudah: 20 }), para(sub, { ukuran: 21, warna: "F5B800", sesudah: 0 }),
  ] })] })] });
}
const judulBagian = (t) => new Paragraph({ keepNext: true, spacing: { before: 260, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "F5B800", space: 2 } }, children: [run(t, { tebal: true, ukuran: 26, warna: HIJAU_TUA })] });
const baris = (t, o) => para(t, { sesudah: 40, ...o });
const kaki = (teks) => new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${teks} · Halaman `, size: 16, color: ABU, font: "Calibri" }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: ABU, font: "Calibri" })] })] });
const propSeksi = (teks) => ({ page: { size: { width: 11906, height: 16838 }, margin: { top: 900, bottom: 900, left: 1000, right: 1000 } }, footers: { default: kaki(teks) } });
const KAKI_TEKS = "KBA-UMM · Rumah Dakwah Malang & Pesantren Online";
const BASE = { styles: { default: { document: { run: { font: "Calibri", size: 21 } } } } };

function tandaTangan(kiri, kanan) {
  const w = [LEBAR / 2, LEBAR / 2].map(Math.floor);
  const blok = (judul, nama) => [para(judul, { rata: AlignmentType.CENTER, sesudah: 700 }), para("______________________", { rata: AlignmentType.CENTER, sesudah: 0 }), para(nama || " ", { rata: AlignmentType.CENTER, tebal: true, sesudah: 0 })];
  return new Table({ width: { size: LEBAR, type: WidthType.DXA }, columnWidths: w, borders: tanpa, rows: [new TableRow({ children: [sel(blok(kiri.judul, kiri.nama), w[0]), sel(blok(kanan.judul, kanan.nama), w[1])] })] });
}

// ------------------------------------------------------------ rapor satu peserta
function isiRapor(r) {
  const k = r.kehadiran, q = r.kuis, g = r.progres, pr = r.predikat;
  const anak = [bandJudul("RAPOR PESERTA", "Kuliah Bahasa Arab Untuk Meraih Mahabatullah (KBA-UMM)"), para(`Periode: ${periode(r.rentang)}`, { warna: ABU, ukuran: 19, sebelum: 80, sesudah: 120 })];

  anak.push(tabel(null, [
    [{ t: "Nama", tebal: true, isi: MUDA }, { t: r.peserta.nama, tebal: true }, { t: "Kelas", tebal: true, isi: MUDA }, `${r.grup.jk || ""} · ${r.grup.tingkat || ""}`],
    [{ t: "Kode peserta", tebal: true, isi: MUDA }, r.peserta.kode, { t: "Grup", tebal: true, isi: MUDA }, r.grup.nama],
    [{ t: "Jenis kelamin", tebal: true, isi: MUDA }, r.peserta.jk || "-", { t: "Pengajar", tebal: true, isi: MUDA }, r.grup.pengajar || "-"],
  ], [1700, 3300, 1500, 3406]));

  anak.push(judulBagian("Ringkasan Penilaian"));
  const kartu = (judul, nilai, warna) => [para(judul, { rata: AlignmentType.CENTER, ukuran: 17, warna: ABU, sesudah: 0 }), para(nilai, { rata: AlignmentType.CENTER, tebal: true, ukuran: 40, warna: warna || HIJAU_TUA, sesudah: 0 })];
  const w5 = [1981, 1981, 1981, 1981, 1982];
  anak.push(new Table({ width: { size: LEBAR, type: WidthType.DXA }, columnWidths: w5, borders: semuaBatas, rows: [new TableRow({ children: [
    sel(kartu("SKOR AKHIR", r.skor == null ? "-" : String(r.skor), pr.warna), w5[0], { isi: KREM }),
    sel([para("PREDIKAT", { rata: AlignmentType.CENTER, ukuran: 17, warna: ABU, sesudah: 0 }), para(pr.nama, { rata: AlignmentType.CENTER, tebal: true, ukuran: 26, warna: pr.warna, sesudah: 0 }), para(pr.ar || pr.arti || " ", { rata: AlignmentType.CENTER, ukuran: 19, warna: ABU, sesudah: 0, arab: Boolean(pr.ar) })], w5[1], { isi: KREM }),
    sel(kartu("KEHADIRAN", pct(k.persen), WARNA_HADIR.hadir), w5[2], { isi: KREM }),
    sel(kartu("RATA-RATA KUIS", q.rata == null ? "-" : String(q.rata), warnaNilai(q.rata)), w5[3], { isi: KREM }),
    sel(kartu("PROGRES BELAJAR", pct(g.persen), "6B9E2F"), w5[4], { isi: KREM }),
  ] })] }));
  anak.push(para(`Skor akhir = kehadiran ${r.bobot.hadir}% + nilai kuis ${r.bobot.kuis}% + progres belajar ${r.bobot.progres}% (komponen yang belum memiliki data tidak dihitung).`, { ukuran: 17, warna: ABU, sebelum: 60 }));

  anak.push(judulBagian("Kehadiran"));
  if (!k.total) anak.push(baris("Belum ada pertemuan yang terlaksana pada periode ini.", { warna: ABU }));
  else {
    const pers = (n) => Math.round((n * 100) / k.total);
    anak.push(tabel(["Status", "Jumlah", "Persentase", "Bagan"], ["hadir", "izin", "sakit", "alpa"].map((s) => [{ t: STATUS_HADIR[s], tebal: true }, { t: String(k[s]), rata: AlignmentType.CENTER }, { t: `${pers(k[s])}%`, rata: AlignmentType.CENTER }, { t: batang(pers(k[s]), WARNA_HADIR[s]) }]).concat([[{ t: "Total pertemuan", tebal: true, isi: MUDA }, { t: String(k.total), tebal: true, rata: AlignmentType.CENTER, isi: MUDA }, { t: "100%", rata: AlignmentType.CENTER, isi: MUDA }, { t: " ", isi: MUDA }]]), [2400, 1400, 1700, 4406]));
  }

  anak.push(judulBagian("Nilai Kuis"));
  if (!q.jumlah) anak.push(baris("Belum ada kuis yang diterbitkan.", { warna: ABU }));
  else anak.push(tabel(["Kuis", "Status", "Nilai", "Bagan"], q.daftar.map((x) => [{ t: x.judul }, { t: x.status === "selesai" ? "Selesai" : x.status === "menunggu" ? "Menunggu penilaian" : "Belum dikerjakan", rata: AlignmentType.CENTER, warna: x.status === "selesai" ? HIJAU : ABU }, { t: x.nilai == null ? "-" : String(x.nilai), tebal: true, rata: AlignmentType.CENTER, warna: warnaNilai(x.nilai) }, { t: batang(x.nilai ?? 0, warnaNilai(x.nilai)) }]), [3300, 2000, 1000, 3606]));

  anak.push(judulBagian("Progres Belajar"));
  const komp = [["Materi", g.rincian.materi], ["Rekaman", g.rincian.rekaman], ["Kuis", g.rincian.kuis]];
  const pp = (a, b) => (b ? Math.round((a * 100) / b) : null);
  anak.push(tabel(["Komponen", "Selesai", "Dari", "Persentase", "Bagan"], komp.map(([n, v]) => [{ t: n, tebal: true }, { t: String(v.selesai), rata: AlignmentType.CENTER }, { t: String(v.total), rata: AlignmentType.CENTER }, { t: pct(pp(v.selesai, v.total)), rata: AlignmentType.CENTER }, { t: batang(pp(v.selesai, v.total) ?? 0, "6B9E2F") }]).concat([[{ t: "Keseluruhan", tebal: true, isi: MUDA }, { t: String(g.selesai), rata: AlignmentType.CENTER, isi: MUDA, tebal: true }, { t: String(g.total), rata: AlignmentType.CENTER, isi: MUDA, tebal: true }, { t: pct(g.persen), rata: AlignmentType.CENTER, isi: MUDA, tebal: true }, { t: batang(g.persen ?? 0, HIJAU), isi: MUDA }]]), [2000, 1200, 1200, 1500, 4006]));

  if (k.riwayat.length) {
    anak.push(judulBagian("Riwayat Kehadiran"));
    const SEL = { hadir: "D4EDDA", izin: "FFF3CC", sakit: "FDE6D0", alpa: "FBE3E0" }, HURUF = { hadir: "H", izin: "I", sakit: "S", alpa: "A" };
    const per = 10, w = Math.floor(LEBAR / per), daftar = k.riwayat.slice(-60), gabung = [];
    for (let i = 0; i < daftar.length; i += per) gabung.push(daftar.slice(i, i + per));
    anak.push(new Table({ width: { size: w * per, type: WidthType.DXA }, columnWidths: Array(per).fill(w), borders: semuaBatas, rows: gabung.map((baris2, bi) => new TableRow({ cantSplit: true, children: Array.from({ length: per }, (_, c) => {
      const x = baris2[c];
      if (!x) return sel(" ", w);
      return sel([para(String(k.riwayat.length - daftar.length + bi * per + c + 1), { rata: AlignmentType.CENTER, tebal: true, ukuran: 19, sesudah: 0 }), para(new Date(x.waktu).toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }), { rata: AlignmentType.CENTER, ukuran: 14, warna: ABU, sesudah: 0 }), para(HURUF[x.status], { rata: AlignmentType.CENTER, tebal: true, ukuran: 20, warna: WARNA_HADIR[x.status], sesudah: 0 })], w, { isi: SEL[x.status] });
    }) })) }));
    anak.push(para("H = Hadir · I = Izin · S = Sakit · A = Alpa (nomor menunjukkan urutan pertemuan)" + (k.riwayat.length > 60 ? ` · menampilkan 60 pertemuan terakhir dari ${k.riwayat.length}` : ""), { ukuran: 16, warna: ABU, sebelum: 40 }));
  }

  anak.push(judulBagian("Catatan Pengajar"));
  anak.push(r.catatan?.isi
    ? new Table({ width: { size: LEBAR, type: WidthType.DXA }, columnWidths: [LEBAR], borders: semuaBatas, rows: [new TableRow({ children: [sel([(/[\u0600-\u06FF]/.test(r.catatan.isi) && !/[A-Za-z]/.test(r.catatan.isi) ? new Paragraph({ bidirectional: true, alignment: AlignmentType.LEFT, spacing: { after: 40 }, children: [new TextRun({ text: r.catatan.isi, rightToLeft: true, font: "Arial", size: 26 })] }) : para(r.catatan.isi, { sesudah: 40 })), ...(r.catatan.oleh ? [para(`— ${r.catatan.oleh}`, { miring: true, ukuran: 18, warna: ABU, sesudah: 0 })] : [])], LEBAR, { isi: KREM })] })] })
    : baris("Belum ada catatan dari pengajar.", { warna: ABU }));

  anak.push(para(" ", { sesudah: 200 }));
  anak.push(tandaTangan({ judul: "Pengajar", nama: r.grup.pengajar }, { judul: "Mengetahui, Pembina", nama: "" }));
  anak.push(para(`Predikat: ${PREDIKAT.map((p) => `${p.nama} (≥ ${p.min})`).slice(0, 4).join(" · ")} · di bawah 60 = Perlu Bimbingan.`, { ukuran: 16, warna: ABU, sebelum: 160 }));
  return anak;
}

// daftar: array hasil hitungRapor. Satu halaman (seksi) per peserta.
export async function buatDokRapor(daftar) {
  const doc = new Document({ ...BASE, creator: "KBA-UMM", title: "Rapor Peserta KBA-UMM", sections: daftar.map((r) => ({ properties: propSeksi(KAKI_TEKS), children: isiRapor(r) })) });
  return Packer.toBuffer(doc);
}

// ------------------------------------------------------------ laporan umum
export async function buatDokLaporan(l, { tampilNama = true } = {}) {
  const t = l.total, r = l.ringkas;
  const anak = [bandJudul("LAPORAN PROGRAM KBA-UMM", "Kuliah Bahasa Arab Untuk Meraih Mahabatullah"), para(`Periode: ${periode(l.rentang)}  ·  Dibuat: ${tgl(l.dibuat)}`, { warna: ABU, ukuran: 19, sebelum: 80, sesudah: 100 })];

  anak.push(judulBagian("Ringkasan"));
  l.ringkasan.forEach((s) => anak.push(para([run("•  ", { warna: "F5B800", tebal: true }), run(s)], { sesudah: 70 })));

  anak.push(judulBagian("Angka Utama"));
  const w4 = [2476, 2476, 2477, 2477];
  const kartu = (j, v, w) => sel([para(j, { rata: AlignmentType.CENTER, ukuran: 17, warna: ABU, sesudah: 0 }), para(v, { rata: AlignmentType.CENTER, tebal: true, ukuran: 38, warna: w || HIJAU_TUA, sesudah: 0 })], 0, { isi: KREM });
  const kolom = (j, v, w, i) => { const c = kartu(j, v, w); return new TableCell({ ...{}, width: { size: w4[i], type: WidthType.DXA }, margins: margin, shading: { type: ShadingType.CLEAR, fill: KREM, color: "auto" }, verticalAlign: VerticalAlign.CENTER, children: [para(j, { rata: AlignmentType.CENTER, ukuran: 17, warna: ABU, sesudah: 0 }), para(v, { rata: AlignmentType.CENTER, tebal: true, ukuran: 38, warna: w || HIJAU_TUA, sesudah: 0 })] }); };
  anak.push(new Table({ width: { size: LEBAR, type: WidthType.DXA }, columnWidths: w4, borders: semuaBatas, rows: [
    new TableRow({ children: [kolom("PESERTA", String(t.peserta), null, 0), kolom("GRUP", String(t.grup), null, 1), kolom("PERTEMUAN", String(t.pertemuan), null, 2), kolom("RATA-RATA SKOR", r.rataSkor == null ? "-" : String(r.rataSkor), null, 3)] }),
    new TableRow({ children: [kolom("RATA KEHADIRAN", pct(r.rataHadir), WARNA_HADIR.hadir, 0), kolom("RATA NILAI KUIS", r.rataKuis == null ? "-" : String(r.rataKuis), warnaNilai(r.rataKuis), 1), kolom("RATA PROGRES", pct(r.rataProgres), "6B9E2F", 2), kolom("PERLU BIMBINGAN", String(r.distribusi["Perlu Bimbingan"] || 0), "C0392B", 3)] }),
  ] }));

  anak.push(judulBagian("Per Grup"));
  anak.push(tabel(["Grup", "Kelas", "Peserta", "Hadir", "Kuis", "Progres", "Skor", "Kehadiran"], l.perGrup.map((g) => [{ t: g.nama, tebal: true }, `${g.jk || ""} · ${g.tingkat || ""}`, { t: String(g.n), rata: AlignmentType.CENTER }, { t: pct(g.rataHadir), rata: AlignmentType.CENTER }, { t: g.rataKuis == null ? "-" : String(g.rataKuis), rata: AlignmentType.CENTER }, { t: pct(g.rataProgres), rata: AlignmentType.CENTER }, { t: g.rataSkor == null ? "-" : String(g.rataSkor), tebal: true, rata: AlignmentType.CENTER }, { t: batang(g.rataHadir ?? 0, WARNA_HADIR.hadir, 12) }]), [1800, 1400, 900, 800, 800, 1000, 800, 2406]));

  anak.push(judulBagian("Sebaran Predikat"));
  const dist = [...PREDIKAT].map((p) => ({ ...p, n: r.distribusi[p.nama] || 0 }));
  anak.push(tabel(["Predikat", "Arti", "Jumlah", "Persentase", "Bagan"], dist.map((p) => { const pc = r.n ? Math.round((p.n * 100) / r.n) : 0; return [{ t: p.nama, tebal: true, warna: p.warna }, p.arti, { t: String(p.n), rata: AlignmentType.CENTER }, { t: `${pc}%`, rata: AlignmentType.CENTER }, { t: batang(pc, p.warna) }]; }), [2200, 2000, 1000, 1300, 3406]));

  if (l.bulanan.length) {
    anak.push(judulBagian("Tren per Bulan"));
    anak.push(tabel(["Bulan", "Pertemuan", "Kehadiran", "Bagan"], l.bulanan.map((b) => [{ t: b.label, tebal: true }, { t: String(b.pertemuan), rata: AlignmentType.CENTER }, { t: pct(b.persen), rata: AlignmentType.CENTER }, { t: batang(b.persen ?? 0, HIJAU) }]), [2400, 1600, 1700, 4206]));
  }

  if (tampilNama && (l.unggulan.length || l.pendampingan.length)) {
    const tab = (daftar) => !daftar.length ? para("Tidak ada.", { warna: ABU }) : tabel(["No", "Nama", "Grup", "Skor", "Predikat"], daftar.map((p, i) => [{ t: String(i + 1), rata: AlignmentType.CENTER }, { t: p.nama, tebal: true }, p.grup, { t: String(p.skor), tebal: true, rata: AlignmentType.CENTER }, { t: p.predikat, warna: p.warna, tebal: true }]), [600, 3300, 2700, 800, 2506]);
    anak.push(judulBagian("Peserta Berprestasi (skor 70 ke atas)")); anak.push(tab(l.unggulan));
    anak.push(judulBagian("Peserta yang Perlu Pendampingan (skor di bawah 70)")); anak.push(tab(l.pendampingan));
  }

  anak.push(para(" ", { sesudah: 200 }));
  anak.push(tandaTangan({ judul: "Dibuat oleh", nama: "" }, { judul: "Mengetahui, Pembina", nama: "" }));
  anak.push(para(`Cara penilaian: skor akhir = kehadiran ${l.bobot?.hadir ?? 40}% + nilai kuis ${l.bobot?.kuis ?? 40}% + progres belajar ${l.bobot?.progres ?? 20}%. Kuis yang belum dikerjakan dihitung 0; esai yang menunggu penilaian belum dihitung.`, { ukuran: 16, warna: ABU, sebelum: 160 }));
  const doc = new Document({ ...BASE, creator: "KBA-UMM", title: "Laporan Program KBA-UMM", sections: [{ properties: propSeksi(KAKI_TEKS), children: anak }] });
  return Packer.toBuffer(doc);
}
