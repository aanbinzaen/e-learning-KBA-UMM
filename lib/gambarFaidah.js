// Membuat gambar faidah (PNG) di peramban memakai kanvas, tanpa pustaka tambahan.
// Teks Arab memakai font Amiri, teks Latin memakai Poppins (font yang sama dengan situs).

export const FORMAT = {
  potret: { w: 1080, h: 1350, label: "Potret 4:5 (Instagram)" },
  persegi: { w: 1080, h: 1080, label: "Persegi 1:1" },
  story: { w: 1080, h: 1920, label: "Story 9:16 (Status WhatsApp)" },
};

const HIJAU = "#1E7B34", TUA = "#14582A", KUNING = "#F5B800", JINGGA = "#F28C1B", KREM = "#FAF8F1";
const MARGIN = 84;

const muat = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

function pecah(ctx, teks, lebarMax) {
  const kata = String(teks).split(/\s+/).filter(Boolean);
  const baris = []; let cur = "";
  for (const k of kata) {
    const coba = cur ? `${cur} ${k}` : k;
    if (!cur || ctx.measureText(coba).width <= lebarMax) cur = coba; else { baris.push(cur); cur = k; }
  }
  if (cur) baris.push(cur);
  return baris;
}

function kotak(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// Rata kanan-kiri: sebarkan sisa lebar ke sela kata (baris terakhir paragraf rata kiri)
function barisPenuh(ctx, baris, x, y, lebar, terakhir) {
  const kata = baris.split(" ");
  const total = kata.reduce((a, k) => a + ctx.measureText(k).width, 0);
  const celah = kata.length > 1 ? (lebar - total) / (kata.length - 1) : 0;
  if (terakhir || kata.length < 2 || celah > ctx.measureText(" ").width * 3.2) { ctx.fillText(baris, x, y); return; }
  let cx = x;
  for (const k of kata) { ctx.fillText(k, cx, y); cx += ctx.measureText(k).width + celah; }
}

export async function buatGambarFaidah(f, kunciFormat = "potret", opsi = {}) {
  const { w: W, h: H } = FORMAT[kunciFormat] || FORMAT.potret;
  const css = getComputedStyle(document.body);
  const lat = css.getPropertyValue("--font-poppins").trim() || "Poppins, sans-serif";
  const arb = css.getPropertyValue("--font-amiri").trim() || "Amiri, serif";
  const jenis = (b, u, fam) => `${b} ${Math.round(u)}px ${fam}`;

  try {
    await Promise.all([
      document.fonts.load(jenis(400, 30, lat)), document.fonts.load(jenis(600, 30, lat)), document.fonts.load(jenis(700, 30, lat)),
      f.teks_arab ? document.fonts.load(jenis(400, 60, arb), f.teks_arab) : Promise.resolve(),
    ]);
  } catch { /* lanjut dengan font bawaan */ }

  const [logoRD, logoPO] = await Promise.all([muat(opsi.logoRumahDakwah || "/img/logo-rumah-dakwah-putih.png"), muat(opsi.logoPesantren || "/img/logo-pesantren-online.png")]);

  const kanvas = document.createElement("canvas");
  kanvas.width = W; kanvas.height = H;
  const ctx = kanvas.getContext("2d");

  // ---------- Latar ----------
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, HIJAU); g.addColorStop(0.55, TUA); g.addColorStop(1, "#0E3F1F");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(245,184,0,0.10)"; ctx.lineWidth = 3;
  for (const [cx, cy] of [[W, 0], [0, H]]) for (let r = 180; r <= 560; r += 95) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); }
  const garis = ctx.createLinearGradient(0, 0, W, 0); garis.addColorStop(0, KUNING); garis.addColorStop(1, JINGGA);
  ctx.fillStyle = garis; ctx.fillRect(0, 0, W, 16);

  // ---------- Kepala ----------
  if (logoRD) { const hl = 62, wl = hl * (logoRD.width / logoRD.height); ctx.drawImage(logoRD, (W - wl) / 2, 62, wl, hl); }
  ctx.fillStyle = garis; ctx.fillRect(W / 2 - 40, 150, 80, 5);

  // ---------- Isi: ukur, kecilkan bila perlu ----------
  const lebar = W - MARGIN * 2;
  const atas = 190, bawah = H - 215, tersedia = bawah - atas;
  const paragraf = String(f.isi || "").split(/\n{2,}/).map((t) => t.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);

  function ukur(s, batasBarisIsi) {
    const m = {};
    ctx.direction = "ltr";
    m.uLabel = 25 * s; m.uJudul = 52 * s; m.uArab = 62 * s; m.uIsi = 33 * s; m.uSumber = 27 * s;
    ctx.font = jenis(700, m.uJudul, lat);
    m.judul = pecah(ctx, f.judul, lebar);
    m.lhJudul = m.uJudul * 1.28;
    if (f.teks_arab) {
      ctx.font = jenis(400, m.uArab, arb);
      m.pad = 34 * s;
      m.arab = pecah(ctx, f.teks_arab, lebar - m.pad * 2);
      m.lhArab = m.uArab * 1.95;
      m.hArab = m.arab.length * m.lhArab + m.pad * 2;
    } else m.hArab = 0;
    ctx.font = jenis(400, m.uIsi, lat);
    m.lhIsi = m.uIsi * 1.62; m.jedaP = m.uIsi * 0.55;
    m.isi = paragraf.map((p) => pecah(ctx, p, lebar));
    let n = m.isi.reduce((a, b) => a + b.length, 0);
    if (batasBarisIsi && n > batasBarisIsi) {
      let sisa = batasBarisIsi; const potong = [];
      for (const p of m.isi) { if (sisa <= 0) break; const ambil = p.slice(0, sisa); if (ambil.length < p.length) ambil[ambil.length - 1] = `${ambil[ambil.length - 1].replace(/[\s,.;:]+$/, "")}…`; potong.push(ambil); sisa -= ambil.length; }
      m.isi = potong; n = batasBarisIsi; m.terpotong = true;
    }
    m.hIsi = n * m.lhIsi + Math.max(0, m.isi.length - 1) * m.jedaP;
    ctx.font = jenis(500, m.uSumber, lat);
    m.sumber = f.sumber ? pecah(ctx, `Sumber: ${f.sumber}`, lebar) : [];
    m.lhSumber = m.uSumber * 1.4; m.hSumber = m.sumber.length * m.lhSumber;
    m.jeda = 38 * s;
    m.total = m.uLabel * 1.2 + m.jeda * 0.6 + m.judul.length * m.lhJudul + (m.hArab ? m.jeda + m.hArab : 0) + m.jeda + m.hIsi + (m.hSumber ? m.jeda + m.hSumber : 0);
    return m;
  }

  let m = null;
  for (let s = 1.15; s >= 0.5; s -= 0.05) { m = ukur(s); if (m.total <= tersedia) break; }
  if (m.total > tersedia) {
    const kosong = m.total - m.hIsi, batas = Math.max(2, Math.floor((tersedia - kosong) / m.lhIsi));
    m = ukur(0.5, batas);
  }

  // ---------- Gambar isi ----------
  let y = atas + Math.max(0, (tersedia - m.total) / 2);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center"; ctx.direction = "ltr";
  ctx.font = jenis(600, m.uLabel, lat); ctx.fillStyle = KUNING;
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${Math.round(m.uLabel * 0.28)}px`;
  y += m.uLabel; ctx.fillText("FAIDAH ILMU", W / 2, y);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  y += m.jeda * 0.6;

  ctx.font = jenis(700, m.uJudul, lat); ctx.fillStyle = KUNING;
  for (const b of m.judul) { y += m.lhJudul; ctx.fillText(b, W / 2, y - m.lhJudul * 0.22); }

  if (m.hArab) {
    y += m.jeda;
    ctx.fillStyle = "rgba(0,0,0,0.24)"; kotak(ctx, MARGIN, y, lebar, m.hArab, 30); ctx.fill();
    ctx.strokeStyle = "rgba(245,184,0,0.65)"; ctx.lineWidth = 3; kotak(ctx, MARGIN, y, lebar, m.hArab, 30); ctx.stroke();
    ctx.font = jenis(400, m.uArab, arb); ctx.fillStyle = "#FFFFFF"; ctx.direction = "rtl"; ctx.textAlign = "center";
    let ya = y + m.pad;
    for (const b of m.arab) { ya += m.lhArab; ctx.fillText(b, W / 2, ya - m.lhArab * 0.3); }
    y += m.hArab; ctx.direction = "ltr";
  }

  y += m.jeda;
  ctx.font = jenis(400, m.uIsi, lat); ctx.fillStyle = "rgba(255,255,255,0.93)"; ctx.textAlign = "left";
  m.isi.forEach((p, pi) => {
    p.forEach((b, i) => { y += m.lhIsi; barisPenuh(ctx, b, MARGIN, y - m.lhIsi * 0.27, lebar, i === p.length - 1 || (m.terpotong && pi === m.isi.length - 1 && i === p.length - 1)); });
    if (pi < m.isi.length - 1) y += m.jedaP;
  });

  if (m.hSumber) {
    y += m.jeda * 0.6;
    ctx.font = jenis(500, m.uSumber, lat); ctx.fillStyle = KUNING; ctx.textAlign = "center";
    for (const b of m.sumber) { y += m.lhSumber; ctx.fillText(b, W / 2, y - m.lhSumber * 0.25); }
  }

  // ---------- Kaki ----------
  const yk = H - 190;
  ctx.fillStyle = "rgba(245,184,0,0.55)"; ctx.fillRect(MARGIN, yk, lebar, 2);
  const cy = yk + 95;
  ctx.fillStyle = KREM; ctx.beginPath(); ctx.arc(MARGIN + 56, cy, 56, 0, Math.PI * 2); ctx.fill();
  if (logoPO) ctx.drawImage(logoPO, MARGIN + 56 - 47, cy - 47, 94, 94);
  ctx.textAlign = "left";
  const situs = String(opsi.situs || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const xt = MARGIN + 140, lt = W - MARGIN - xt;
  // Tulis satu baris; huruf dikecilkan otomatis bila melebihi lebar yang tersedia
  const tulis = (teks, tebal, ukuran, warna, yy) => {
    let u = ukuran; ctx.font = jenis(tebal, u, lat);
    while (u > 16 && ctx.measureText(teks).width > lt) { u -= 1; ctx.font = jenis(tebal, u, lat); }
    ctx.fillStyle = warna; ctx.fillText(teks, xt, yy);
  };
  tulis("KBA-UMM", 700, 32, "#FFFFFF", cy - 16);
  tulis("Kuliah Bahasa Arab Untuk Meraih Mahabatullah", 500, 24, "rgba(255,255,255,0.9)", cy + 18);
  tulis(situs ? `${situs}/faidah` : "Rumah Dakwah Malang · Pesantren Online", 500, 24, KUNING, cy + 52);
  return kanvas;
}
