// Membuat gambar flyer pengumuman (PNG) di peramban memakai kanvas, tanpa pustaka tambahan.
// Teks Latin memakai Poppins, teks Arab memakai Amiri (font yang sama dengan situs); Arab: Noto Kufi Arabic.
import { muatKufi, keluargaArab } from "@/lib/fontKufi";
import { FORMAT_FLYER, JENIS, barisTercetak } from "@/lib/flyer";

const HIJAU = "#1E7B34", TUA = "#14582A", KUNING = "#F5B800", JINGGA = "#F28C1B", KREM = "#FAF8F1", TINTA = "#1B2B1F";
const BISMILLAH = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
const PENUTUP = "جَزَاكُمُ اللَّهُ خَيْرًا";
const M = 76;

const muat = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

const TEMAS = {
  hijau: {
    bg: [[0, HIJAU], [0.55, TUA], [1, "#0E3F1F"]], pola: "rgba(245,184,0,0.07)", aksen: KUNING, aksen2: JINGGA,
    judul: "#FFFFFF", teks: "rgba(255,255,255,0.88)", bismillah: KUNING, band: null,
    kartu: "rgba(255,255,255,0.97)", kartuTepi: "rgba(245,184,0,0.9)", kartuLabel: HIJAU, kartuTeks: TINTA, kartuGaris: "rgba(30,123,52,0.14)",
    pil: KUNING, pilTeks: TUA, kelasTepi: "rgba(255,255,255,0.55)", kelasTeks: "#FFFFFF", ajakan: KUNING,
    kaki: "rgba(0,0,0,0.28)", kakiTeks: "rgba(255,255,255,0.9)",
  },
  emas: {
    bg: [[0, "#0F3A22"], [0.6, "#0A2616"], [1, "#05150C"]], pola: "rgba(231,185,74,0.08)", aksen: "#E7B94A", aksen2: "#B98B1E",
    judul: "#FFF1C9", teks: "rgba(255,246,218,0.86)", bismillah: "#E7B94A", band: null,
    kartu: "rgba(255,255,255,0.06)", kartuTepi: "#E7B94A", kartuLabel: "#E7B94A", kartuTeks: "#FFF6DA", kartuGaris: "rgba(231,185,74,0.25)",
    pil: "#E7B94A", pilTeks: "#0A2616", kelasTepi: "#E7B94A", kelasTeks: "#FFF1C9", ajakan: "#E7B94A",
    kaki: "rgba(0,0,0,0.35)", kakiTeks: "rgba(255,246,218,0.9)",
  },
  krem: {
    bg: [[0, "#FFFDF6"], [1, "#F3EFDF"]], pola: "rgba(30,123,52,0.06)", aksen: JINGGA, aksen2: KUNING,
    judul: TUA, teks: "#3C4B40", bismillah: TUA, band: [HIJAU, TUA],
    kartu: "#FFFFFF", kartuTepi: "rgba(30,123,52,0.28)", kartuLabel: HIJAU, kartuTeks: TINTA, kartuGaris: "rgba(30,123,52,0.14)",
    pil: HIJAU, pilTeks: "#FFFFFF", kelasTepi: HIJAU, kelasTeks: TUA, ajakan: HIJAU,
    kaki: TUA, kakiTeks: "rgba(255,255,255,0.92)",
  },
};

function kotak(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function bintang(ctx, cx, cy, r) {
  // bintang segi delapan (dua persegi bersilang), motif khas ornamen Islami
  ctx.beginPath();
  for (let k = 0; k < 2; k++) {
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i + (k ? Math.PI / 4 : 0) + Math.PI / 4;
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  ctx.stroke();
}

function ikon(ctx, jenis, cx, cy, warna) {
  ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = warna; ctx.fillStyle = warna; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (jenis === "kalender") {
    kotak(ctx, -30, -26, 60, 56, 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-30, -9); ctx.lineTo(30, -9); ctx.moveTo(-14, -34); ctx.lineTo(-14, -20); ctx.moveTo(14, -34); ctx.lineTo(14, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-14, 10); ctx.lineTo(-4, 19); ctx.lineTo(15, 2); ctx.stroke();
  } else if (jenis === "kuis") {
    kotak(ctx, -26, -32, 52, 64, 8); ctx.stroke();
    kotak(ctx, -11, -39, 22, 14, 5); ctx.fill();
    ctx.lineWidth = 5;
    [-12, 4, 20].forEach((y) => { ctx.beginPath(); ctx.moveTo(-14, y); ctx.lineTo(-9, y + 5); ctx.lineTo(-1, y - 4); ctx.moveTo(6, y + 1); ctx.lineTo(15, y + 1); ctx.stroke(); });
  } else if (jenis === "rekaman") {
    kotak(ctx, -34, -26, 68, 46, 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, -14); ctx.lineTo(14, -3); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-14, 32); ctx.lineTo(14, 32); ctx.stroke();
  } else { // pengeras suara
    ctx.beginPath(); ctx.moveTo(-28, -10); ctx.lineTo(-6, -10); ctx.lineTo(20, -28); ctx.lineTo(20, 28); ctx.lineTo(-6, 10); ctx.lineTo(-28, 10); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-18, 10); ctx.lineTo(-12, 32); ctx.lineTo(-2, 32); ctx.lineTo(-4, 11); ctx.stroke();
    ctx.beginPath(); ctx.arc(22, 0, 14, -Math.PI / 3, Math.PI / 3); ctx.stroke();
    ctx.beginPath(); ctx.arc(22, 0, 28, -Math.PI / 3, Math.PI / 3); ctx.stroke();
  }
  ctx.restore();
}

// Mengembalikan elemen kanvas berisi flyer.
// d: { jenis, judul, kelas, isi, baris:[{label,nilai,tipe}], ajakan, tautan, penandatangan }
export async function buatFlyer(d, kunciFormat = "potret", kunciTema = "hijau") {
  const { w: W, h: H } = FORMAT_FLYER[kunciFormat] || FORMAT_FLYER.potret;
  const T = TEMAS[kunciTema] || TEMAS.hijau;
  const j = JENIS[d.jenis] || JENIS.umum;

  const css = getComputedStyle(document.body);
  const lat = css.getPropertyValue("--font-poppins").trim() || "Poppins, sans-serif";
  const arb = keluargaArab(css.getPropertyValue("--font-amiri").trim());
  const F = (b, u) => `${b} ${Math.round(u)}px ${lat}`;
  const FA = (u, b = 600) => `${b} ${Math.round(u)}px ${arb}`;
  try {
    await Promise.all([400, 500, 600, 700, 800].map((b) => document.fonts.load(`${b} 30px ${lat}`)).concat([muatKufi([500, 600, 700])]));
  } catch { /* lanjut dengan font bawaan */ }
  const [logoRD, logoPO] = await Promise.all([muat("/img/logo-rumah-dakwah-putih.png"), muat("/img/logo-pesantren-online.png")]);

  const kanvas = document.createElement("canvas");
  kanvas.width = W; kanvas.height = H;
  const ctx = kanvas.getContext("2d");
  const spasi = (px) => { try { ctx.letterSpacing = `${px}px`; } catch { /* peramban lama */ } };
  const bungkus = (t, lebar, font) => {
    ctx.font = font; const out = [];
    String(t).split(/\n/).forEach((para) => {
      let cur = "";
      for (const k of para.split(/\s+/).filter(Boolean)) { const c = cur ? `${cur} ${k}` : k; if (!cur || ctx.measureText(c).width <= lebar) cur = c; else { out.push(cur); cur = k; } }
      if (cur) out.push(cur);
    });
    return out;
  };

  // ---------- latar ----------
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H); T.bg.forEach(([p, c]) => g.addColorStop(p, c));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = T.pola; ctx.lineWidth = 2;
  for (let y = 40; y < H + 80; y += 130) for (let x = (Math.round(y / 130) % 2 ? 0 : 65); x < W + 80; x += 130) bintang(ctx, x, y, 48);
  const garis = ctx.createLinearGradient(0, 0, W, 0); garis.addColorStop(0, T.aksen); garis.addColorStop(1, T.aksen2);

  const TINGGI_KEPALA = 150;
  if (T.band) {
    const b = ctx.createLinearGradient(0, 0, W, 0); b.addColorStop(0, T.band[0]); b.addColorStop(1, T.band[1]);
    ctx.fillStyle = b; ctx.fillRect(0, 0, W, TINGGI_KEPALA);
    ctx.strokeStyle = "rgba(245,184,0,0.12)";
    for (let r = 140; r <= 420; r += 70) { ctx.beginPath(); ctx.arc(W, 0, r, 0, Math.PI * 2); ctx.stroke(); }
  }
  ctx.fillStyle = garis; ctx.fillRect(0, 0, W, 14);
  if (T.band) ctx.fillRect(0, TINGGI_KEPALA, W, 6);

  // ---------- kepala: nama program (logo dipindah ke footer) ----------
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.direction = "ltr";
  ctx.fillStyle = T.band ? "#FFFFFF" : T.teks; ctx.font = F(700, 34); spasi(6);
  ctx.fillText("KBA-UMM", W / 2, 80); spasi(0);
  ctx.fillStyle = T.band ? KUNING : T.aksen; ctx.font = F(500, 22);
  ctx.fillText("Kuliah Bahasa Arab Untuk Meraih Mahabatullah", W / 2, 118);

  // ---------- bismillah ----------
  ctx.fillStyle = T.bismillah; ctx.font = FA(33, 600); ctx.direction = "rtl";
  ctx.fillText(BISMILLAH, W / 2, TINGGI_KEPALA + 66); ctx.direction = "ltr";

  // ---------- footer (tetap): logo, penandatangan, lembaga ----------
  const tinggiKaki = 160;
  ctx.fillStyle = T.kaki; ctx.fillRect(0, H - tinggiKaki, W, tinggiKaki);
  ctx.fillStyle = garis; ctx.fillRect(0, H - tinggiKaki, W, 4);
  ctx.textAlign = "center";
  const dPO = 76, hRD = 46, tepi = 40, yTengah = H - tinggiKaki / 2 + 2;
  if (logoRD) { const wRD = hRD * (logoRD.width / logoRD.height); ctx.drawImage(logoRD, tepi, yTengah - hRD / 2, wRD, hRD); }
  if (logoPO) {
    const cxp = W - tepi - dPO / 2;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 12; ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(cxp, yTengah, dPO / 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.drawImage(logoPO, cxp - dPO / 2 + 6, yTengah - dPO / 2 + 6, dPO - 12, dPO - 12);
  }
  const barisKaki = d.penandatangan ? 3 : 1;
  let yk = yTengah - ((barisKaki - 1) * 33) / 2 + 8;
  if (d.penandatangan) {
    ctx.fillStyle = T.kakiTeks; ctx.font = F(500, 21); ctx.fillText("Hormat kami", W / 2, yk); yk += 33;
    ctx.fillStyle = T.band ? KUNING : T.aksen; ctx.font = F(700, 27); ctx.fillText(String(d.penandatangan).slice(0, 60), W / 2, yk); yk += 33;
  }
  ctx.fillStyle = T.kakiTeks; ctx.font = F(700, 19); ctx.fillText("Rumah Dakwah Malang  ·  Pesantren Online", W / 2, yk);

  // ---------- isi: ukur, kecilkan bila perlu ----------
  const yAtas = TINGGI_KEPALA + 98, yBawah = H - tinggiKaki - 34, tersedia = yBawah - yAtas;
  const lebar = W - M * 2;
  const baris = barisTercetak(d.baris);
  const judulTeks = String(d.judul || "").trim() || j.judul;

  function ukur(s, batasIsi) {
    const m = { s };
    m.hEmblem = 112 * s; m.hPil = 46 * s;
    ctx.font = F(800, 66 * s); m.judul = bungkus(judulTeks, lebar - 20, F(800, 66 * s)).slice(0, 5); m.lhJudul = 66 * s * 1.18;
    m.hJudul = m.judul.length * m.lhJudul;
    m.hOrn = 34 * s;
    m.kelas = d.kelas ? String(d.kelas).trim() : "";
    m.hKelas = m.kelas ? 54 * s : 0;
    m.fIsi = F(400, 30 * s); m.lhIsi = 30 * s * 1.58;
    let li = d.isi ? bungkus(d.isi, lebar - 30, m.fIsi) : [];
    if (batasIsi != null && li.length > batasIsi) { li = li.slice(0, batasIsi); if (li.length) li[li.length - 1] = `${li[li.length - 1].replace(/[\s,.;:]+$/, "")}…`; }
    m.isi = li; m.hIsi = li.length * m.lhIsi;
    // kartu rincian
    m.pad = 34 * s; m.lebarLabel = 250 * s;
    const lebarNilai = lebar - m.pad * 2 - m.lebarLabel - 14;
    m.lhRow = 31 * s * 1.34;
    m.rows = baris.map((b) => {
      const hl = /tanggal|hari|waktu|jam|batas|sampai|kembali/i.test(b.label);
      const fNilai = hl ? F(800, 33 * s) : F(600, 30 * s);
      const nilai = bungkus(b.nilai, lebarNilai, fNilai).slice(0, 4);
      const label = bungkus(b.label, m.lebarLabel, F(700, 23 * s)).slice(0, 2);
      const n = Math.max(nilai.length, label.length);
      return { label, nilai, hl, fNilai, h: n * m.lhRow + 28 * s };
    });
    m.hKartu = m.rows.length ? m.rows.reduce((a, r) => a + r.h, 0) + m.pad * 1.1 : 0;
    m.ajakan = d.ajakan ? bungkus(d.ajakan, lebar - 40, F(700, 30 * s)).slice(0, 3) : [];
    m.lhAjakan = 30 * s * 1.4; m.hAjakan = m.ajakan.length * m.lhAjakan;
    m.tautan = d.tautan ? String(d.tautan).trim() : "";
    m.hTautan = m.tautan ? 58 * s : 0;
    m.hPenutup = 42 * s;
    const jeda = 26 * s;
    const bagian = [m.hEmblem + 12 * s + m.hPil, m.hJudul + m.hOrn, m.hKelas, m.hIsi, m.hKartu, m.hAjakan, m.hTautan, m.hPenutup].filter((x) => x > 0);
    m.jeda = jeda;
    m.total = bagian.reduce((a, b) => a + b, 0) + jeda * (bagian.length - 1);
    return m;
  }

  const smaks = H > 1700 ? 1.5 : H < 1200 ? 1.08 : 1.3, BATAS_ISI = 5, SMIN = 0.62;
  let m = null;
  for (let s = smaks; s >= SMIN; s -= 0.04) { m = ukur(s, BATAS_ISI); if (m.total <= tersedia) break; }
  if (m.total > tersedia) {
    // paragraf pengantar dipotong lebih dulu agar rincian tetap terbaca; terakhir baru huruf dikecilkan
    for (let n = BATAS_ISI - 1; n >= 0 && m.total > tersedia; n--) m = ukur(SMIN, n);
    for (let s = SMIN - 0.04; s >= 0.45 && m.total > tersedia; s -= 0.04) m = ukur(s, 0);
  }

  // ---------- gambar isi (dipusatkan secara vertikal) ----------
  let y = yAtas + Math.max(0, (tersedia - m.total) * 0.42);
  const s = m.s, cx = W / 2;

  // lambang
  const r = m.hEmblem / 2, cy = y + r;
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 22; ctx.shadowOffsetY = 6;
  const gl = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r); gl.addColorStop(0, T.aksen); gl.addColorStop(1, T.aksen2);
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r - 7, 0, Math.PI * 2); ctx.stroke();
  ikon(ctx, j.ikon, cx, cy, kunciTema === "krem" ? "#FFFFFF" : TUA);
  y += m.hEmblem + 12 * s;

  // lencana jenis pengumuman
  ctx.font = F(700, 23 * s); spasi(3 * s);
  const wPil = ctx.measureText(j.badge).width + 56 * s;
  ctx.fillStyle = T.pil; kotak(ctx, cx - wPil / 2, y, wPil, m.hPil, m.hPil / 2); ctx.fill();
  ctx.fillStyle = T.pilTeks; ctx.textAlign = "center"; ctx.fillText(j.badge, cx + 1.5 * s, y + m.hPil / 2 + 7.5 * s); spasi(0);
  y += m.hPil + m.jeda;

  // judul
  ctx.fillStyle = T.judul; ctx.font = F(800, 66 * s); ctx.textAlign = "center";
  m.judul.forEach((t, i) => { ctx.fillText(t, cx, y + m.lhJudul * i + 66 * s * 0.86); });
  y += m.hJudul;
  // ornamen pemisah
  const yo = y + m.hOrn / 2 + 2 * s;
  ctx.strokeStyle = T.aksen; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - 150 * s, yo); ctx.lineTo(cx - 24 * s, yo); ctx.moveTo(cx + 24 * s, yo); ctx.lineTo(cx + 150 * s, yo); ctx.stroke();
  ctx.fillStyle = T.aksen; ctx.save(); ctx.translate(cx, yo); ctx.rotate(Math.PI / 4); ctx.fillRect(-7 * s, -7 * s, 14 * s, 14 * s); ctx.restore();
  y += m.hOrn + m.jeda;

  // kelas tujuan
  if (m.kelas) {
    ctx.font = F(600, 27 * s);
    const tk = m.kelas.length > 48 ? `${m.kelas.slice(0, 47)}…` : m.kelas;
    const wk = Math.min(lebar, ctx.measureText(tk).width + 64 * s);
    ctx.strokeStyle = T.kelasTepi; ctx.lineWidth = 2.5; kotak(ctx, cx - wk / 2, y, wk, m.hKelas, m.hKelas / 2); ctx.stroke();
    ctx.fillStyle = T.kelasTeks; ctx.textAlign = "center"; ctx.fillText(tk, cx, y + m.hKelas / 2 + 9 * s);
    y += m.hKelas + m.jeda;
  }

  // paragraf pengantar
  if (m.isi.length) {
    ctx.fillStyle = T.teks; ctx.font = m.fIsi; ctx.textAlign = "center";
    m.isi.forEach((t, i) => ctx.fillText(t, cx, y + m.lhIsi * i + 30 * s * 1.05));
    y += m.hIsi + m.jeda;
  }

  // kartu rincian
  if (m.rows.length) {
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.22)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    ctx.fillStyle = T.kartu; kotak(ctx, M, y, lebar, m.hKartu, 26 * s); ctx.fill(); ctx.restore();
    ctx.strokeStyle = T.kartuTepi; ctx.lineWidth = 2.5; kotak(ctx, M, y, lebar, m.hKartu, 26 * s); ctx.stroke();
    let yy = y + m.pad * 0.55; ctx.textAlign = "left";
    m.rows.forEach((rw, i) => {
      const xl = M + m.pad, xv = xl + m.lebarLabel + 14;
      if (rw.hl) { ctx.fillStyle = kunciTema === "emas" ? "rgba(231,185,74,0.16)" : "rgba(245,184,0,0.2)"; kotak(ctx, M + m.pad * 0.45, yy + 2, lebar - m.pad * 0.9, rw.h - 4, 14 * s); ctx.fill(); }
      ctx.fillStyle = T.kartuLabel; ctx.font = F(700, 23 * s);
      rw.label.forEach((t, k) => ctx.fillText(t, xl, yy + 14 * s + 23 * s * 0.85 + k * 26 * s));
      ctx.fillStyle = rw.hl && kunciTema !== "emas" ? TUA : T.kartuTeks; ctx.font = rw.fNilai;
      rw.nilai.forEach((t, k) => ctx.fillText(t, xv, yy + 14 * s + 31 * s * 0.9 + k * m.lhRow));
      yy += rw.h;
      if (i < m.rows.length - 1 && !rw.hl && !m.rows[i + 1].hl) { ctx.strokeStyle = T.kartuGaris; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xl, yy - 1); ctx.lineTo(M + lebar - m.pad, yy - 1); ctx.stroke(); }
    });
    y += m.hKartu + m.jeda;
  }

  // ajakan
  if (m.ajakan.length) {
    ctx.fillStyle = T.ajakan; ctx.font = F(700, 30 * s); ctx.textAlign = "center";
    m.ajakan.forEach((t, i) => ctx.fillText(t, cx, y + m.lhAjakan * i + 30 * s * 0.95));
    y += m.hAjakan + m.jeda;
  }

  // tautan
  if (m.tautan) {
    ctx.font = F(600, 25 * s);
    const tt = m.tautan.length > 54 ? `${m.tautan.slice(0, 53)}…` : m.tautan;
    const wt = Math.min(lebar, ctx.measureText(tt).width + 72 * s);
    ctx.fillStyle = T.pil; kotak(ctx, cx - wt / 2, y, wt, m.hTautan, m.hTautan / 2); ctx.fill();
    ctx.fillStyle = T.pilTeks; ctx.textAlign = "center"; ctx.fillText(tt, cx, y + m.hTautan / 2 + 8.5 * s);
    y += m.hTautan + m.jeda;
  }

  // penutup
  ctx.fillStyle = T.bismillah; ctx.font = FA(27 * s, 500); ctx.direction = "rtl"; ctx.textAlign = "center";
  ctx.fillText(PENUTUP, cx, y + 30 * s); ctx.direction = "ltr";

  return kanvas;
}
