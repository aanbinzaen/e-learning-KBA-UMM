// Rumus rapor dan laporan. Murni perhitungan (tanpa akses database) sehingga dapat dipakai di server dan peramban.

export const BOBOT_BAWAAN = { hadir: 40, kuis: 40, progres: 20 };

export function bacaBobot(teks) {
  const [a, b, c] = String(teks || "").split(",").map((x) => Number(x));
  return [a, b, c].every((n) => Number.isFinite(n) && n >= 0) && a + b + c > 0 ? { hadir: a, kuis: b, progres: c } : { ...BOBOT_BAWAAN };
}

export const PREDIKAT = [
  { min: 90, nama: "Mumtaz", ar: "ممتاز", arti: "Istimewa", warna: "#1E7B34" },
  { min: 80, nama: "Jayyid Jiddan", ar: "جيد جدًا", arti: "Sangat Baik", warna: "#6B9E2F" },
  { min: 70, nama: "Jayyid", ar: "جيد", arti: "Baik", warna: "#E0A800" },
  { min: 60, nama: "Maqbul", ar: "مقبول", arti: "Cukup", warna: "#F28C1B" },
  { min: 0, nama: "Perlu Bimbingan", ar: "", arti: "Perlu pendampingan", warna: "#C0392B" },
];
export const BELUM_ADA = { min: -1, nama: "Belum ada data", ar: "", arti: "", warna: "#9AA79C" };
export const predikatDari = (skor) => (skor == null ? BELUM_ADA : PREDIKAT.find((p) => skor >= p.min));

// Nilai kehadiran per status (0-100). Hadir tertinggi, sakit sama dengan hadir, izin sedikit di bawahnya, alpa nol.
export const NILAI_HADIR = { hadir: 100, sakit: 100, izin: 95, alpa: 0 };
export const nilaiKehadiran = (c, total) => (total ? Math.round((["hadir", "izin", "sakit", "alpa"].reduce((a, k) => a + (c[k] || 0) * NILAI_HADIR[k], 0)) / total) : null);
export const STATUS_HADIR = { hadir: "Hadir", izin: "Izin", sakit: "Sakit", alpa: "Alpa" };
export const WARNA_HADIR = { hadir: "#1E7B34", izin: "#E0A800", sakit: "#F28C1B", alpa: "#C0392B" };
export const warnaNilai = (n) => (n == null ? "#9AA79C" : n >= 80 ? "#1E7B34" : n >= 60 ? "#E0A800" : "#F28C1B");

const rata = (arr) => { const a = arr.filter((x) => x != null); return a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : null; };

// m: { peserta, grup, rentang, pertemuan, absensi:{id:status}, kuis, percobaan:{kuisId:{nilai,status}}, progres:{materi,rekaman,kuis (selesai/total)}, catatan }
export function hitungRapor(m, bobot = BOBOT_BAWAAN, sekarang = Date.now()) {
  const pert = m.pertemuan.filter((p) => new Date(p.waktu).getTime() <= sekarang);
  const stat = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
  const riwayat = pert.map((p) => {
    const st = ["hadir", "izin", "sakit"].includes(m.absensi[p.id]) ? m.absensi[p.id] : "alpa";   // tanpa catatan = alpa
    stat[st]++; return { id: p.id, judul: p.judul, waktu: p.waktu, status: st };
  });
  const total = pert.length;
  const persenHadir = nilaiKehadiran(stat, total);

  const daftarKuis = m.kuis.map((k) => {
    const pc = m.percobaan[k.id];
    const status = !pc ? "belum" : pc.nilai != null ? "selesai" : "menunggu";
    return { id: k.id, judul: k.judul, waktu: k.waktu, status, nilai: status === "selesai" ? pc.nilai : null };
  });
  const dihitung = daftarKuis.filter((k) => k.status !== "menunggu");          // esai yang menunggu penilaian belum dihitung
  const rataKuis = dihitung.length ? Math.round(dihitung.reduce((s, k) => s + (k.nilai ?? 0), 0) / dihitung.length) : null;   // kuis yang belum dikerjakan dihitung 0

  const pr = m.progres, tp = pr.materi.total + pr.rekaman.total + pr.kuis.total, sp = pr.materi.selesai + pr.rekaman.selesai + pr.kuis.selesai;
  const persenProgres = tp ? Math.min(100, Math.round((sp * 100) / tp)) : null;

  const komp = [["hadir", persenHadir, bobot.hadir], ["kuis", rataKuis, bobot.kuis], ["progres", persenProgres, bobot.progres]].filter(([, v, b]) => v != null && b > 0);
  const sb = komp.reduce((s, [, , b]) => s + b, 0);
  const skor = sb ? Math.round(komp.reduce((s, [, v, b]) => s + v * b, 0) / sb) : null;

  return {
    peserta: m.peserta, grup: m.grup, rentang: m.rentang || {}, catatan: m.catatan || null, bobot,
    kehadiran: { total, ...stat, persen: persenHadir, riwayat },
    kuis: { daftar: daftarKuis, jumlah: daftarKuis.length, dikerjakan: daftarKuis.filter((k) => k.status === "selesai").length, menunggu: daftarKuis.filter((k) => k.status === "menunggu").length, rata: rataKuis },
    progres: { persen: persenProgres, selesai: sp, total: tp, rincian: pr },
    skor, predikat: predikatDari(skor),
  };
}

// Ringkasan satu kelompok rapor (satu grup atau semua peserta)
export function ringkasKelompok(daftar) {
  const distribusi = Object.fromEntries([...PREDIKAT, BELUM_ADA].map((p) => [p.nama, 0]));
  daftar.forEach((r) => { distribusi[r.predikat.nama]++; });
  return {
    n: daftar.length, rataHadir: rata(daftar.map((r) => r.kehadiran.persen)), rataKuis: rata(daftar.map((r) => r.kuis.rata)),
    rataProgres: rata(daftar.map((r) => r.progres.persen)), rataSkor: rata(daftar.map((r) => r.skor)), distribusi,
  };
}

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export function kunciBulan(iso) {
  const d = new Date(new Date(iso).getTime() + 7 * 3600e3);   // WIB
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
export const labelBulan = (kunci) => { const [y, m] = kunci.split("-"); return `${BULAN[Number(m) - 1]} ${y}`; };

// grupHasil: [{ grup, rapor:[...hitungRapor] }]
export function hitungLaporan(grupHasil, { rentang = {}, dibuat = new Date().toISOString() } = {}) {
  const semua = grupHasil.flatMap((g) => g.rapor);
  const perGrup = grupHasil.map((g) => {
    const idPertemuan = new Set(); g.rapor.forEach((r) => r.kehadiran.riwayat.forEach((x) => idPertemuan.add(x.id)));
    return { id: g.grup.id, nama: g.grup.nama, jk: g.grup.jk, tingkat: g.grup.tingkat, pengajar: g.grup.pengajar || "", pertemuan: idPertemuan.size, kuis: g.rapor[0]?.kuis.jumlah || 0, ...ringkasKelompok(g.rapor) };
  });
  const bulan = {};
  grupHasil.forEach((g) => {
    const dilihat = new Set();
    g.rapor.forEach((r) => r.kehadiran.riwayat.forEach((x) => {
      const k = kunciBulan(x.waktu); const b = (bulan[k] = bulan[k] || { pertemuan: new Set(), hadir: 0, kemungkinan: 0 });
      b.pertemuan.add(x.id); b.kemungkinan++; b.hadir += (NILAI_HADIR[x.status] ?? 0) / 100; dilihat.add(x.id);
    }));
  });
  const bulanan = Object.keys(bulan).sort().map((k) => ({ kunci: k, label: labelBulan(k), pertemuan: bulan[k].pertemuan.size, persen: bulan[k].kemungkinan ? Math.round((bulan[k].hadir * 100) / bulan[k].kemungkinan) : null }));
  const peserta = semua.map((r) => ({ nama: r.peserta.nama, kode: r.peserta.kode, jk: r.peserta.jk, grup: r.grup.nama, tingkat: r.grup.tingkat, skor: r.skor, predikat: r.predikat.nama, warna: r.predikat.warna, hadir: r.kehadiran.persen, kuis: r.kuis.rata, progres: r.progres.persen, alpa: r.kehadiran.alpa }));
  const berskor = peserta.filter((p) => p.skor != null);
  const urutNaik = [...berskor].sort((a, b) => b.skor - a.skor || (b.hadir ?? 0) - (a.hadir ?? 0));
  const ringkas = ringkasKelompok(semua);
  const lap = {
    rentang, dibuat, ringkas, perGrup, bulanan, peserta,
    // berprestasi: skor 70 ke atas (maks. 5, tertinggi); pendampingan: skor di bawah 70 (maks. 5, terendah)
    unggulan: urutNaik.filter((p) => p.skor >= 70).slice(0, 5),
    pendampingan: [...berskor].filter((p) => p.skor < 70).sort((a, b) => a.skor - b.skor || (a.hadir ?? 0) - (b.hadir ?? 0)).slice(0, 5),
    total: { peserta: semua.length, grup: perGrup.length, pertemuan: perGrup.reduce((s, g) => s + g.pertemuan, 0) },
  };
  lap.ringkasan = ringkasanOtomatis(lap);
  return lap;
}

// Kalimat ringkasan otomatis untuk disampaikan kepada pembina
export function ringkasanOtomatis(l) {
  const r = l.ringkas, baris = [];
  baris.push(`Program diikuti ${l.total.peserta} peserta di ${l.total.grup} grup, dengan ${l.total.pertemuan} pertemuan terlaksana.`);
  if (r.rataHadir != null) baris.push(`Rata-rata kehadiran ${r.rataHadir}%${r.rataKuis != null ? `, rata-rata nilai kuis ${r.rataKuis}` : ""}${r.rataProgres != null ? `, dan rata-rata progres belajar ${r.rataProgres}%` : ""}.`);
  const g = l.perGrup.filter((x) => x.rataHadir != null);
  if (g.length > 1) {
    const atas = [...g].sort((a, b) => b.rataHadir - a.rataHadir)[0], bawah = [...g].sort((a, b) => a.rataHadir - b.rataHadir)[0];
    baris.push(`Kehadiran tertinggi pada grup ${atas.nama} (${atas.rataHadir}%)${atas.id !== bawah.id ? `; terendah pada grup ${bawah.nama} (${bawah.rataHadir}%) yang perlu mendapat perhatian` : ""}.`);
  }
  const baik = (r.distribusi.Mumtaz || 0) + (r.distribusi["Jayyid Jiddan"] || 0), butuh = r.distribusi["Perlu Bimbingan"] || 0;
  if (r.n) baris.push(`${baik} peserta (${Math.round((baik * 100) / r.n)}%) berpredikat Mumtaz atau Jayyid Jiddan${butuh ? `, sedangkan ${butuh} peserta memerlukan pendampingan` : ""}.`);
  const b = l.bulanan.filter((x) => x.persen != null);
  if (b.length > 1) { const a = b[0], z = b[b.length - 1]; baris.push(`Kehadiran bulan ${z.label} ${z.persen >= a.persen ? "naik" : "turun"} dibanding ${a.label} (${a.persen}% menjadi ${z.persen}%).`); }
  return baris;
}

// Apresiasi dan nasihat pada setiap rapor. Tidak membandingkan peserta; rapor dimaksudkan sebagai bahan muhasabah.
export const AYAT_MUHASABAH = {
  arab: "يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَلْتَنْظُرْ نَفْسٌ مَا قَدَّمَتْ لِغَدٍ",
  arti: "Wahai orang-orang yang beriman, bertakwalah kepada Allah, dan hendaklah setiap diri memperhatikan apa yang telah diperbuatnya untuk hari esok.",
  sumber: "QS. Al-Hasyr: 18",
};
export function pesanRapor(skor) {
  const apresiasi = skor != null && skor >= 80
    ? "Barakallahu fiikum. Terima kasih atas kesungguhan, kehadiran, dan semangat belajar Anda. Semoga Allah menerima amal Anda, menambah ilmu, dan memberkahinya."
    : skor != null && skor >= 60
      ? "Jazakumullahu khairan atas usaha dan kesediaan Anda terus belajar. Setiap langkah dalam menuntut ilmu bernilai di sisi Allah, sekecil apa pun itu."
      : "Jazakumullahu khairan telah bergabung dan berikhtiar belajar. Menuntut ilmu adalah jalan yang mulia, dan yang terpenting adalah tetap melangkah.";
  const nasihat = "Rapor ini bukan patokan bahwa kita yang terbaik, dan bukan pula bahwa kita lebih kurang dibanding yang lain. Angka hanyalah gambaran kegiatan belajar kita di kelas ini, sedangkan nilai yang sebenarnya ada di sisi Allah. Jadikan rapor ini sarana muhasabah: syukuri yang sudah baik, koreksi kekurangan diri dengan lapang dada, lalu terus berusaha memberikan yang terbaik di sisi Allah tanpa membandingkan diri dengan orang lain.";
  return { apresiasi, nasihat, ayat: AYAT_MUHASABAH };
}
