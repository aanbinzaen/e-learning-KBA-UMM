// Data bersama fitur Pengumuman & Flyer: templat, daftar grup WhatsApp, dan penyusun teks WhatsApp.

// Grup WhatsApp resmi. Admin dapat memilih salah satunya sebagai tujuan.
// Untuk mengubah atau menambah grup, cukup sunting daftar ini.
export const GRUP_WA = [
  { kunci: "aswad", nama: "Kelas Abul Aswad", kata: ["aswad"], link: "https://chat.whatsapp.com/DChsHS8Vr6g0ZJqFulKpEs?s=cl&p=a&iam=2" },
  { kunci: "kisai", nama: "Kelas Imam Kisai", kata: ["kisa", "kisai", "kisa'i"], link: "https://chat.whatsapp.com/Lld1QX5cnBxGALLJz4HPFH?s=cl&p=a&iam=2" },
  { kunci: "khalil", nama: "Kelas Imam Khalil", kata: ["khalil", "kholil"], link: "https://chat.whatsapp.com/DvtmqUwTPjV98lResvvjtl?s=cl&p=a&iam=2" },
  { kunci: "hisyam", nama: "Kelas Imam Ibnu Hisyam", kata: ["hisyam", "hisham"], link: "https://chat.whatsapp.com/HFYfi0hdueBD7Tkd48g4k5?s=cl&p=a&iam=2" },
  { kunci: "sibawaih", nama: "Kelas Imam Sibawaih", kata: ["sibawaih", "sibawayh", "sibawaeh"], link: "https://chat.whatsapp.com/HdgEAeZpSRs4gkOY4bDVSJ?s=cl&p=a&iam=2" },
  { kunci: "akhwat", nama: "Grup Akhwat Umum", kata: ["akhwat umum", "umum akhwat"], link: "https://chat.whatsapp.com/JnN2fv0K1tF1xfRRsxtkAk?s=cl&p=a&iam=2" },
];

export const linkWaSah = (u) => /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+/.test(String(u || ""));

// Cadangan bagi pengajar yang tautan grupnya belum diisi di menu Kelas & Grup: cocokkan lewat nama grup.
export function cariTautanWa(namaGrup) {
  const n = String(namaGrup || "").toLowerCase();
  return GRUP_WA.find((g) => g.kata.some((k) => n.includes(k)))?.link || "";
}

export const JENIS = {
  hadir: {
    label: "Ajakan hadir ke kelas", badge: "UNDANGAN KELAS", ikon: "kalender",
    judul: "Ayo Hadir di Kelas Kita!",
    isi: "Mari hadir tepat waktu, siapkan buku catatan, dan hadirkan semangat menuntut ilmu.",
    baris: [["Hari / Tanggal", "", "tanggal"], ["Waktu", "19.30 WIB – selesai", "teks"], ["Tempat / Tautan", "", "teks"], ["Materi", "", "teks"], ["Pengajar", "", "teks"]],
    ajakan: "Hadir tepat waktu, semoga ilmu semakin berkah.",
  },
  mulai: {
    label: "Pengumuman kelas dimulai", badge: "PENGUMUMAN RESMI", ikon: "kalender",
    judul: "Kelas Akan Segera Dimulai",
    isi: "Dengan memohon pertolongan Allah, kami umumkan bahwa kelas akan dimulai pada:",
    baris: [["Hari / Tanggal", "", "tanggal"], ["Waktu", "19.30 WIB – selesai", "teks"], ["Tempat / Tautan", "", "teks"], ["Pengajar", "", "teks"], ["Perlengkapan", "Buku catatan dan alat tulis", "teks"]],
    ajakan: "Mohon konfirmasi kehadiran di grup ini.",
  },
  kuis: {
    label: "Kuis sudah terbit", badge: "KUIS TELAH TERBIT", ikon: "kuis",
    judul: "Kuis Baru Sudah Tersedia",
    isi: "Silakan kerjakan kuis melalui akun e-learning KBA-UMM masing-masing.",
    baris: [["Judul Kuis", "", "teks"], ["Batas Waktu", "", "tanggal"], ["Cara Mengerjakan", "Masuk akun e-learning, lalu buka menu Kuis", "teks"], ["Pengajar", "", "teks"]],
    ajakan: "Kerjakan dengan jujur dan teliti. Semoga Allah memudahkan.",
  },
  rekaman: {
    label: "Rekaman sudah terbit", badge: "REKAMAN TELAH TERBIT", ikon: "rekaman",
    judul: "Rekaman Pertemuan Sudah Tersedia",
    isi: "Bagi yang berhalangan hadir atau ingin mengulang pelajaran, rekaman dapat disimak di e-learning KBA-UMM.",
    baris: [["Pertemuan", "", "teks"], ["Tanggal Kelas", "", "tanggal"], ["Cara Menonton", "Masuk akun e-learning, lalu buka menu Rekaman", "teks"], ["Pengajar", "", "teks"]],
    ajakan: "Simak ulang, catat faidahnya, dan amalkan.",
  },
  libur: {
    label: "Pengumuman libur kelas", badge: "PENGUMUMAN LIBUR", ikon: "kalender",
    judul: "Kelas Libur Pekan Ini",
    isi: "Diberitahukan kepada seluruh peserta bahwa kelas diliburkan pada waktu berikut. Manfaatkan untuk mengulang pelajaran dan memperbanyak amal.",
    baris: [["Hari / Tanggal Libur", "", "tanggal"], ["Libur Sampai", "", "tanggal"], ["Keterangan", "", "teks"], ["Kelas Kembali", "", "tanggal"], ["Pengajar", "", "teks"]],
    ajakan: "Mohon maaf atas ketidaknyamanannya. Tetap semangat belajar.",
  },
  umum: {
    label: "Pengumuman lain (bebas)", badge: "PENGUMUMAN", ikon: "pengeras",
    judul: "Pengumuman",
    isi: "",
    baris: [],
    ajakan: "",
  },
};

export const TEMA = {
  hijau: { label: "Hijau klasik" },
  emas: { label: "Hijau gelap & emas" },
  krem: { label: "Krem elegan" },
};

export const FORMAT_FLYER = {
  potret: { w: 1080, h: 1350, label: "Potret 4:5 (WhatsApp / Instagram)" },
  story: { w: 1080, h: 1920, label: "Story 9:16 (Status WhatsApp)" },
  persegi: { w: 1080, h: 1080, label: "Persegi 1:1" },
};

export const tglPanjang = (iso) => {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};

// Nilai baris yang akan dicetak: baris bertipe tanggal diformat, baris kosong dibuang.
export function barisTercetak(baris) {
  return (baris || [])
    .map((b) => ({ label: String(b.label || "").trim(), nilai: b.tipe === "tanggal" ? tglPanjang(b.nilai) : String(b.nilai || "").trim() }))
    .filter((b) => b.label && b.nilai);
}

const EMOJI = [[/tanggal|hari/i, "📅"], [/waktu|jam|batas/i, "🕒"], [/tempat|lokasi|tautan|link/i, "📍"], [/pengajar|pemateri|ustadz|narasumber/i, "👤"], [/materi|judul|pertemuan|kitab/i, "📖"], [/kembali|dimulai lagi/i, "🔔"], [/keterangan|alasan/i, "📝"]];
const emojiUntuk = (label) => EMOJI.find(([r]) => r.test(label))?.[1] || "▪️";

// Teks siap tempel ke WhatsApp (penebalan *…* dan miring _…_ bawaan WhatsApp).
export function susunTeksWa(d, situs = "") {
  const j = JENIS[d.jenis] || JENIS.umum;
  const baris = barisTercetak(d.baris);
  const out = [
    "Assalamu'alaikum warahmatullahi wabarakatuh",
    "",
    `*📢 ${j.badge}*`,
    `*${String(d.judul || "").trim()}*`,
  ];
  if (d.kelas) out.push(`_${String(d.kelas).trim()}_`);
  if (d.isi) out.push("", String(d.isi).trim());
  if (baris.length) { out.push(""); baris.forEach((b) => out.push(`${emojiUntuk(b.label)} *${b.label}*: ${b.nilai}`)); }
  if (d.ajakan) out.push("", String(d.ajakan).trim());
  if (d.tautan) out.push("", `🔗 ${String(d.tautan).trim()}`);
  if (situs) out.push("", `🌐 Masuk ke website KB-UMM (kelas, absensi, kuis, rekaman):\n${situs}`);
  out.push("", "Jazakumullahu khairan.");
  if (d.penandatangan) out.push(`_Hormat kami, ${String(d.penandatangan).trim()}_`);
  out.push("KBA-UMM · Rumah Dakwah Malang & Pesantren Online");
  return out.join("\n");
}

// Nilai awal formulir untuk satu templat.
export function dariTemplat(jenis, { pengajar = "", kelas = "", tautan = "" } = {}) {
  const j = JENIS[jenis] || JENIS.umum;
  const butuhTautan = jenis === "kuis" || jenis === "rekaman";
  return {
    jenis,
    judul: j.judul,
    kelas,
    isi: j.isi,
    baris: j.baris.map(([label, nilai, tipe]) => ({ label, nilai: label === "Pengajar" ? pengajar : nilai, tipe })),
    ajakan: j.ajakan,
    tautan: butuhTautan ? tautan : "",
    penandatangan: pengajar,
  };
}
