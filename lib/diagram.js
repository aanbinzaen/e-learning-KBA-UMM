// Diagram hierarki otomatis dari teks berjenjang. Digambar di kanvas peramban (tanpa pustaka tambahan).
//
// Format teks: satu butir per baris, jenjang ditandai spasi di depan (atau tab), atau penomoran 1 / 1.1 / 1.1.1.
//   Kalam
//     Isim
//     Fi'il
//       Madhi
//       Mudhari'
//     Harf

export const UKURAN = {
  potret45: { w: 1080, h: 1350, label: "4:5 Potret" },
  lanskap54: { w: 1350, h: 1080, label: "5:4 Lanskap" },
  story: { w: 1080, h: 1920, label: "9:16 Potret (Story)" },
  lanskap169: { w: 1920, h: 1080, label: "16:9 Lanskap" },
  persegi: { w: 1080, h: 1080, label: "1:1 Persegi" },
};

export const CONTOH_DIAGRAM = `Kalam
  Isim
    Marfu'
    Manshub
    Majrur
  Fi'il
    Madhi
    Mudhari'
    Amr
  Harf`;

const MAKS_BUTIR = 200, MAKS_JENJANG = 8, MAKS_HURUF = 120;
const ARAB = /[\u0600-\u06FF]/;

// ---------------------------------------------------------------- parsing
export function bacaDiagram(teks, judul = "") {
  const baris = String(teks || "").replace(/\r/g, "").split("\n").filter((b) => b.trim());
  if (!baris.length) return { galat: "Tulis isi diagram dulu, satu butir per baris." };
  if (baris.length > MAKS_BUTIR) return { galat: `Maksimal ${MAKS_BUTIR} butir.` };

  const item = baris.map((b) => {
    const m = b.match(/^(\s*)(.*)$/);
    return { indent: m[1].replace(/\t/g, "    ").length, t: m[2].trim(), level: 0 };
  });

  const bernomor = item.every((i) => /^\d+(\.\d+)*[.)]?\s+\S/.test(i.t)) && item.every((i) => i.indent === item[0].indent);
  if (bernomor) {
    item.forEach((i) => { const m = i.t.match(/^(\d+(?:\.\d+)*)[.)]?\s+(.*)$/); i.level = m[1].split(".").length - 1; i.t = m[2]; });
  } else {
    const tumpuk = [];
    for (const i of item) {
      i.t = i.t.replace(/^[-*•–—>]+\s+/, "");
      while (tumpuk.length && tumpuk[tumpuk.length - 1] > i.indent) tumpuk.pop();
      if (!tumpuk.length || tumpuk[tumpuk.length - 1] < i.indent) tumpuk.push(i.indent);
      i.level = tumpuk.length - 1;
    }
  }

  const akarAkar = [], jalur = [];
  let tertinggi = 0;
  item.forEach((i, idx) => {
    if (!i.t) return;
    const level = Math.min(i.level, idx === 0 ? 0 : jalur.length);   // tidak boleh melompat lebih dari satu jenjang
    const node = { t: i.t.slice(0, MAKS_HURUF), anak: [] };
    jalur.length = level;
    if (level === 0) akarAkar.push(node); else jalur[level - 1].anak.push(node);
    jalur[level] = node;
    tertinggi = Math.max(tertinggi, level);
  });
  if (!akarAkar.length) return { galat: "Tidak ada isi yang terbaca." };
  if (tertinggi + 1 > MAKS_JENJANG) return { galat: `Maksimal ${MAKS_JENJANG} jenjang.` };

  const maya = akarAkar.length > 1;
  const akar = maya ? { t: String(judul || "").trim() || "Diagram", anak: akarAkar, maya: true } : akarAkar[0];
  let jumlah = 0; (function hitung(n) { jumlah++; n.anak.forEach(hitung); })(akar);
  return { akar, jumlah, jenjang: tertinggi + 1 + (maya ? 1 : 0), akarMaya: maya };
}

// ---------------------------------------------------------------- penataan
const TEMA = {
  terang: {
    bg: ["#FAF8F1", "#FAF8F1"], garis: "#6B9E2F",
    level: [
      { isi: "#F5B800", teks: "#14582A", tepi: null },
      { isi: "#1E7B34", teks: "#FFFFFF", tepi: null },
      { isi: "#E6F0DC", teks: "#14582A", tepi: "#6B9E2F" },
      { isi: "#FFFFFF", teks: "#1B2A1F", tepi: "#C9D3BC" },
    ],
  },
  gelap: {
    bg: ["#1E7B34", "#0E3F1F"], garis: "rgba(245,184,0,0.75)",
    level: [
      { isi: "#F5B800", teks: "#14582A", tepi: null },
      { isi: "#FAF8F1", teks: "#14582A", tepi: null },
      { isi: "rgba(255,255,255,0.16)", teks: "#FFFFFF", tepi: "rgba(255,255,255,0.45)" },
      { isi: "rgba(255,255,255,0.08)", teks: "#F2F2F2", tepi: "rgba(255,255,255,0.28)" },
    ],
  },
};
export const DAFTAR_TEMA = [["terang", "Terang (krem)"], ["gelap", "Gelap (hijau)"]];
export const DAFTAR_TATA = [["otomatis", "Otomatis (paling pas)"], ["vertikal", "Atas ke bawah"], ["kiri-kanan", "Kiri ke kanan"], ["kanan-kiri", "Kanan ke kiri (Arab)"]];

const salin = (n) => ({ t: n.t, maya: n.maya, anak: n.anak.map(salin) });

function pecah(ctx, teks, lebarMax) {
  const kata = String(teks).split(/\s+/).filter(Boolean), baris = [];
  let cur = "";
  for (const k of kata) {
    const coba = cur ? `${cur} ${k}` : k;
    if (!cur || ctx.measureText(coba).width <= lebarMax) cur = coba; else { baris.push(cur); cur = k; }
  }
  if (cur) baris.push(cur);
  return baris;
}

function susun(ctx, akarAsli, arah, fam) {
  // arah: "v" (atas-bawah), "kk" (kiri-kanan), "rtl" (kanan-kiri)
  const vertikal = arah === "v";
  const akar = salin(akarAsli);
  const tingkat = [];
  (function jalan(n, l) { n.level = l; (tingkat[l] = tingkat[l] || []).push(n); n.anak.forEach((c) => jalan(c, l + 1)); })(akar, 0);

  const FONT = [32, 28, 25, 23];
  for (const n of tingkat.flat()) {
    const arab = ARAB.test(n.t), basis = FONT[Math.min(n.level, 3)] * (arab ? 1.25 : 1);
    ctx.font = arab ? `400 ${basis}px ${fam.arb}` : `600 ${basis}px ${fam.lat}`;
    n.arab = arab; n.u = basis; n.lh = basis * (arab ? 1.5 : 1.32);
    n.baris = pecah(ctx, n.t, vertikal ? 250 : 320);
    const lt = Math.max(...n.baris.map((b) => ctx.measureText(b).width));
    n.w = Math.max(120, lt + 46); n.h = n.baris.length * n.lh + 30;
  }

  const GAP_B = 26, GAP_D = vertikal ? 66 : 78;
  if (vertikal) tingkat.forEach((ls) => { const h = Math.max(...ls.map((n) => n.h)); ls.forEach((n) => { n.h = h; }); });
  else tingkat.forEach((ls) => { const w = Math.max(...ls.map((n) => n.w)); ls.forEach((n) => { n.w = w; }); });

  const lebarSub = (n) => {
    const diri = vertikal ? n.w : n.h;
    n.B = n.anak.length ? Math.max(diri, n.anak.reduce((a, c) => a + lebarSub(c), 0) + GAP_B * (n.anak.length - 1)) : diri;
    return n.B;
  };
  lebarSub(akar);

  const ukDalam = tingkat.map((ls) => (vertikal ? ls[0].h : ls[0].w));
  const awal = []; let acc = 0;
  ukDalam.forEach((u, l) => { awal[l] = acc; acc += u + GAP_D; });
  const dalamTotal = acc - GAP_D;

  (function taruh(n, mulai) {
    const total = n.anak.reduce((a, c) => a + c.B, 0) + GAP_B * Math.max(0, n.anak.length - 1);
    const pusat = mulai + n.B / 2;
    if (vertikal) { n.cx = pusat; n.cy = awal[n.level] + ukDalam[n.level] / 2; } else { n.cy = pusat; n.cx = awal[n.level] + ukDalam[n.level] / 2; }
    let x = mulai + (n.B - total) / 2;
    for (const c of n.anak) { taruh(c, x); x += c.B + GAP_B; }
  })(akar, 0);

  const TW = vertikal ? akar.B : dalamTotal, TH = vertikal ? dalamTotal : akar.B;
  if (arah === "rtl") tingkat.flat().forEach((n) => { n.cx = TW - n.cx; });
  return { akar, tingkat, TW, TH, arah };
}

// ---------------------------------------------------------------- gambar
let cacheLogo = null;
const muat = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

function kotak(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export async function buatGambarDiagram(hasil, opsi = {}) {
  const { w: W, h: H } = UKURAN[opsi.ukuran] || UKURAN.lanskap169;
  const piksel = opsi.piksel === 2 ? 2 : 1;
  const tema = TEMA[opsi.tema] || TEMA.terang;
  const judul = opsi.judul && !hasil.akarMaya ? String(opsi.judul).trim() : "";

  const css = getComputedStyle(document.body);
  const fam = { lat: css.getPropertyValue("--font-poppins").trim() || "Poppins, sans-serif", arb: css.getPropertyValue("--font-amiri").trim() || "Amiri, serif" };
  const semuaTeks = (function kumpul(n) { return [n.t, ...n.anak.flatMap(kumpul)]; })(hasil.akar).join(" ");
  try {
    await Promise.all([
      document.fonts.load(`400 30px ${fam.lat}`), document.fonts.load(`600 30px ${fam.lat}`), document.fonts.load(`700 30px ${fam.lat}`),
      ARAB.test(semuaTeks) ? document.fonts.load(`400 40px ${fam.arb}`, semuaTeks) : Promise.resolve(),
    ]);
  } catch { /* lanjut */ }
  if (!cacheLogo) cacheLogo = await Promise.all([muat(opsi.logoRumahDakwah || "/img/logo-rumah-dakwah-putih.png"), muat(opsi.logoPesantren || "/img/logo-pesantren-online.png")]);
  const [logoRD, logoPO] = cacheLogo;

  const kanvas = document.createElement("canvas");
  kanvas.width = W * piksel; kanvas.height = H * piksel;
  const ctx = kanvas.getContext("2d");
  ctx.scale(piksel, piksel);

  // ---- pita atas dan bawah (hijau, sesuai aturan logo putih)
  const tinggiAtas = judul ? 215 : 118, tinggiBawah = 112;
  const area = { x: 56, y: tinggiAtas + 34, w: W - 112, h: H - tinggiAtas - tinggiBawah - 68 };

  // ---- pilih tata letak
  let layout, arahDipakai;
  ctx.direction = "ltr";
  const coba = (a) => { const l = susun(ctx, hasil.akar, a, fam); l.skala = Math.min(area.w / l.TW, area.h / l.TH); return l; };
  if (opsi.tata === "vertikal") layout = coba("v");
  else if (opsi.tata === "kiri-kanan") layout = coba("kk");
  else if (opsi.tata === "kanan-kiri") layout = coba("rtl");
  else { const a = coba("v"), b = coba("kk"); layout = a.skala >= b.skala ? a : b; }
  arahDipakai = layout.arah;
  const skala = Math.min(layout.skala, 2.2);

  // ---- latar
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, tema.bg[0]); g.addColorStop(1, tema.bg[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const hijau = ctx.createLinearGradient(0, 0, W, 0); hijau.addColorStop(0, "#1E7B34"); hijau.addColorStop(1, "#14582A");
  ctx.fillStyle = hijau; ctx.fillRect(0, 0, W, tinggiAtas); ctx.fillRect(0, H - tinggiBawah, W, tinggiBawah);
  const emas = ctx.createLinearGradient(0, 0, W, 0); emas.addColorStop(0, "#F5B800"); emas.addColorStop(1, "#F28C1B");
  ctx.fillStyle = emas; ctx.fillRect(0, tinggiAtas, W, 6); ctx.fillRect(0, H - tinggiBawah - 6, W, 6);

  // ---- kepala
  if (logoRD) { const hl = 54, wl = hl * (logoRD.width / logoRD.height); ctx.drawImage(logoRD, (W - wl) / 2, 24, wl, hl); }
  if (judul) {
    ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "center"; ctx.direction = "ltr";
    let u = 52; const ada = ARAB.test(judul);
    ctx.font = ada ? `400 ${u * 1.2}px ${fam.arb}` : `700 ${u}px ${fam.lat}`;
    let bs = pecah(ctx, judul, W - 160);
    while (bs.length > 2 && u > 28) { u -= 4; ctx.font = ada ? `400 ${u * 1.2}px ${fam.arb}` : `700 ${u}px ${fam.lat}`; bs = pecah(ctx, judul, W - 160); }
    if (ada) ctx.direction = "rtl";
    const lh = u * (ada ? 1.5 : 1.25), y0 = 100 + (tinggiAtas - 100 - bs.length * lh) / 2;
    bs.forEach((b, i) => ctx.fillText(b, W / 2, y0 + (i + 1) * lh - lh * 0.25));
    ctx.direction = "ltr";
  }

  // ---- diagram
  const ox = area.x + (area.w - layout.TW * skala) / 2, oy = area.y + (area.h - layout.TH * skala) / 2;
  ctx.save(); ctx.translate(ox, oy); ctx.scale(skala, skala);
  const vertikal = arahDipakai === "v", rtl = arahDipakai === "rtl";
  ctx.strokeStyle = tema.garis; ctx.lineWidth = 3.2 / Math.max(0.6, Math.min(1, skala)); ctx.lineJoin = "round"; ctx.lineCap = "round";
  (function garis(n) {
    for (const c of n.anak) {
      ctx.beginPath();
      if (vertikal) { const y1 = n.cy + n.h / 2, y2 = c.cy - c.h / 2, m = (y1 + y2) / 2; ctx.moveTo(n.cx, y1); ctx.lineTo(n.cx, m); ctx.lineTo(c.cx, m); ctx.lineTo(c.cx, y2); }
      else { const x1 = rtl ? n.cx - n.w / 2 : n.cx + n.w / 2, x2 = rtl ? c.cx + c.w / 2 : c.cx - c.w / 2, m = (x1 + x2) / 2; ctx.moveTo(x1, n.cy); ctx.lineTo(m, n.cy); ctx.lineTo(m, c.cy); ctx.lineTo(x2, c.cy); }
      ctx.stroke(); garis(c);
    }
  })(layout.akar);

  layout.tingkat.flat().forEach((n) => {
    const w = tema.level[Math.min(n.level, 3)];
    ctx.save();
    if (opsi.tema !== "gelap") { ctx.shadowColor = "rgba(20,88,42,0.22)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4; }
    kotak(ctx, n.cx - n.w / 2, n.cy - n.h / 2, n.w, n.h, 16); ctx.fillStyle = w.isi; ctx.fill();
    ctx.restore();
    if (w.tepi) { kotak(ctx, n.cx - n.w / 2, n.cy - n.h / 2, n.w, n.h, 16); ctx.strokeStyle = w.tepi; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.fillStyle = w.teks; ctx.textAlign = "center";
    ctx.font = n.arab ? `400 ${n.u}px ${fam.arb}` : `600 ${n.u}px ${fam.lat}`;
    ctx.direction = n.arab ? "rtl" : "ltr";
    const y0 = n.cy - (n.baris.length * n.lh) / 2;
    n.baris.forEach((b, i) => ctx.fillText(b, n.cx, y0 + (i + 1) * n.lh - n.lh * 0.27));
    ctx.direction = "ltr";
  });
  ctx.restore();

  // ---- kaki
  const cy = H - tinggiBawah / 2;
  ctx.fillStyle = "#FAF8F1"; ctx.beginPath(); ctx.arc(56 + 38, cy, 38, 0, Math.PI * 2); ctx.fill();
  if (logoPO) ctx.drawImage(logoPO, 56 + 38 - 32, cy - 32, 64, 64);
  ctx.textAlign = "left"; ctx.direction = "ltr";
  ctx.fillStyle = "#FFFFFF"; ctx.font = `700 26px ${fam.lat}`; ctx.fillText("KBA-UMM", 56 + 96, cy - 4);
  ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = `500 20px ${fam.lat}`;
  ctx.fillText("Kuliah Bahasa Arab Untuk Meraih Mahabatullah", 56 + 96, cy + 24);
  const situs = String(opsi.situs || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (situs) { ctx.textAlign = "right"; ctx.fillStyle = "#F5B800"; ctx.font = `500 20px ${fam.lat}`; ctx.fillText(situs, W - 56, cy + 7); }

  return { kanvas, skala: layout.skala, arah: arahDipakai };
}
