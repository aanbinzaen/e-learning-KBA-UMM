// Diagram hierarki otomatis dari teks berjenjang. Digambar di kanvas peramban (tanpa pustaka tambahan).
//
// Format teks: satu butir per baris, jenjang ditandai spasi di depan (atau tab), atau penomoran 1 / 1.1 / 1.1.1.
//   Kalam | ucapan yang bermakna     <- tanda | menambah keterangan kecil di dalam kotak
//     Isim | kata benda
//     Fi'il | kata kerja
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

export const CONTOH_DIAGRAM = `Kalam | ucapan yang bermakna
  Isim | kata benda
    Marfu'
    Manshub
    Majrur
  Fi'il | kata kerja
    Madhi | lampau
    Mudhari' | sedang/akan
    Amr | perintah
  Harf | kata tugas`;

export const CONTOH_CATATAN = "Kalam terdiri dari tiga bagian: isim, fi'il, dan harf.";

const MAKS_BUTIR = 200, MAKS_JENJANG = 8, MAKS_HURUF = 120, MAKS_KET = 140;
const ARAB = /[\u0600-\u06FF]/;
const HURUF_ARAB = /[\u0621-\u064A\u066E-\u06D3]/, HURUF_LATIN = /[A-Za-z]/;

// Jenis tulisan (latin / arab / campur) dan arah dasar mengikuti huruf kuat pertama, seperti dir="auto"
function analisa(t) {
  const a = HURUF_ARAB.test(t), l = HURUF_LATIN.test(t);
  const kuat = String(t).match(/[A-Za-z\u0621-\u064A\u066E-\u06D3]/);
  return { jenis: a && !l ? "arab" : a && l ? "campur" : "latin", rtl: Boolean(kuat) && HURUF_ARAB.test(kuat[0]) };
}

export const DAFTAR_GAYA = [["otomatis", "Otomatis"], ["reguler", "Reguler"], ["tebal", "Tebal"], ["miring", "Miring"], ["tebal-miring", "Tebal miring"]];
export const DAFTAR_RATA_KOTAK = [["tengah", "Rata tengah"], ["kiri", "Rata kiri"], ["kanan", "Rata kanan"], ["penuh", "Rata kanan-kiri"]];

// ---------------------------------------------------------------- teks berformat (tebal / miring / reguler per kata)
// Penanda: ***tebal miring***, **tebal**, *miring*, _miring_, ~reguler~ (boleh membungkus sebagian kata di dalam kalimat)
const POLA_GAYA = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(\S(?:.*?\S)?)\*|_(\S(?:.*?\S)?)_|~(\S(?:.*?\S)?)~/g;
const HURUF_KATA = /\w/;

function parseRuns(mentah, maks) {
  const teks = String(mentah ?? "");
  const runs = []; let idx = 0, m;
  POLA_GAYA.lastIndex = 0;
  while ((m = POLA_GAYA.exec(teks))) {
    const sebelum = teks[m.index - 1] || "", sesudah = teks[m.index + m[0].length] || "";
    const tunggalBintang = m[3] != null, garisBawah = m[4] != null;
    // penanda tunggal tidak boleh menempel pada huruf/angka lain atau bintang lain (mis. snake_case, 2*3*4)
    if ((tunggalBintang && (sebelum === "*" || sesudah === "*" || HURUF_KATA.test(sebelum) || HURUF_KATA.test(sesudah))) ||
        (garisBawah && (HURUF_KATA.test(sebelum) || HURUF_KATA.test(sesudah)))) { POLA_GAYA.lastIndex = m.index + 1; continue; }
    if (m.index > idx) runs.push({ t: teks.slice(idx, m.index), st: null });
    const st = m[1] != null ? "tebal-miring" : m[2] != null ? "tebal" : tunggalBintang || garisBawah ? "miring" : "reguler";
    runs.push({ t: m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5], st });
    idx = m.index + m[0].length;
  }
  if (idx < teks.length) runs.push({ t: teks.slice(idx), st: null });
  let sisa = maks || Infinity; const hasil = [];
  for (const r of runs) {
    if (sisa <= 0) break;
    const t = r.t.slice(0, sisa); sisa -= t.length;
    const akhir = hasil[hasil.length - 1];
    if (akhir && akhir.st === r.st) akhir.t += t; else hasil.push({ t, st: r.st });
  }
  return { plain: hasil.map((r) => r.t).join("").trim(), runs: hasil };
}

// kata-kata (unit) dari run; potongan bergaya berbeda yang menempel tanpa spasi tetap satu unit
function bentukUnit(runs) {
  const units = []; let cur = [];
  for (const r of runs) {
    for (const bagian of r.t.split(/(\s+)/)) {
      if (!bagian) continue;
      if (/^\s+$/.test(bagian)) { if (cur.length) { units.push(cur); cur = []; } } else cur.push({ t: bagian, st: r.st });
    }
  }
  if (cur.length) units.push(cur);
  return units;
}

// gaya akhir sebuah potongan = gaya umum (menu) + penanda per kata
function gayaAkhir(umum, st, jenis, dasar) {
  let w = dasar, i = false;
  if (umum === "reguler") w = 400; else if (umum === "tebal") w = 700; else if (umum === "miring") { w = 400; i = true; } else if (umum === "tebal-miring") { w = 700; i = true; }
  if (st === "tebal") w = 700; else if (st === "miring") i = true; else if (st === "tebal-miring") { w = 700; i = true; } else if (st === "reguler") { w = 400; i = false; }
  return { w, i: i && jenis === "latin" };   // huruf Arab tidak dimiringkan
}

function fontSeg(konf, st, teks) {
  const jenis = analisa(teks).jenis;
  const g = gayaAkhir(konf.gaya, st, jenis, jenis === "arab" ? konf.dasarA : konf.dasarL);
  const keluarga = jenis === "arab" ? konf.fam.arb : jenis === "campur" || konf.campur ? campurFont(konf.fam.lat, konf.fam.arb) : konf.fam.lat;
  return { css: `${g.i ? "italic " : ""}${g.w} ${konf.u}px ${keluarga}`, jenis };
}

function pecahBerformat(ctx, runs, maksW, konf) {
  const units = bentukUnit(runs);
  ctx.font = fontSeg(konf, null, "a").css;
  const spasi = ctx.measureText(" ").width;
  const baris = []; let cur = [], curW = 0;
  for (const u of units) {
    let uw = 0;
    for (const p of u) { ctx.font = fontSeg(konf, p.st, p.t).css; uw += ctx.measureText(p.t).width; }
    const tambah = cur.length ? spasi + uw : uw;
    if (cur.length && curW + tambah > maksW) { baris.push(cur); cur = [u]; curW = uw; } else { cur.push(u); curW += tambah; }
  }
  if (cur.length) baris.push(cur);
  return baris;
}

// Menyusun satu baris menjadi potongan bergaya seragam, lalu mengurutkannya secara visual (bidi: Arab kanan-ke-kiri, Latin kiri-ke-kanan)
function tataBaris(ctx, line, konf, rtlBase) {
  const segs = []; let tunda = false;
  const dorong = (t, st) => {
    const akhir = segs[segs.length - 1];
    if (akhir && !akhir.sp && akhir.st === st) akhir.t += (tunda ? " " : "") + t;
    else { if (tunda) segs.push({ sp: true, t: " ", st: null }); segs.push({ t, st }); }
    tunda = false;
  };
  line.forEach((u, ui) => { if (ui > 0) tunda = true; u.forEach((p) => dorong(p.t, p.st)); });

  let lebar = 0, spasi = 0;
  for (const sg of segs) {
    const f = fontSeg(konf, sg.sp ? null : sg.st, sg.sp ? " " : sg.t);
    sg.font = f.css; ctx.font = f.css; sg.w = ctx.measureText(sg.t).width;
    if (sg.sp) { sg.dir = "N"; spasi++; }
    else {
      sg.dir = f.jenis === "arab" ? "R" : f.jenis === "latin" ? (HURUF_LATIN.test(sg.t) ? "L" : "N") : (rtlBase ? "R" : "L");
      spasi += (sg.t.match(/ /g) || []).length;
    }
    lebar += sg.w;
  }
  const dasar = rtlBase ? "R" : "L", awal = segs.map((x) => x.dir);
  segs.forEach((x, i) => {
    if (x.dir !== "N") return;
    let a = null, b = null;
    for (let k = i - 1; k >= 0; k--) if (awal[k] !== "N") { a = awal[k]; break; }
    for (let k = i + 1; k < segs.length; k++) if (awal[k] !== "N") { b = awal[k]; break; }
    x.dir = a && a === b ? a : dasar;
  });
  const balik = (daftar, tanda) => {
    const hasil = []; let i = 0;
    while (i < daftar.length) {
      if (daftar[i].dir === tanda) { let j = i; while (j < daftar.length && daftar[j].dir === tanda) j++; hasil.push(...daftar.slice(i, j).reverse()); i = j; }
      else { hasil.push(daftar[i]); i++; }
    }
    return hasil;
  };
  return { segs: rtlBase ? balik(segs.slice().reverse(), "L") : balik(segs, "R"), w: lebar, spasi };
}

function gambarBaris(ctx, tt, x0, y, bagi) {
  let x = x0;
  for (const sg of tt.segs) {
    if (!sg.sp) {
      ctx.font = sg.font; ctx.direction = sg.dir === "R" ? "rtl" : "ltr"; ctx.textAlign = "left";
      if (bagi) ctx.wordSpacing = `${bagi}px`;
      ctx.fillText(sg.t, x, y);
      if (bagi) ctx.wordSpacing = "0px";
    }
    x += sg.w + (sg.sp ? bagi : (sg.t.match(/ /g) || []).length * bagi);
  }
  ctx.direction = "ltr";
}

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
    const [label, ...sisa] = i.t.split("|");
    if (!label.trim()) return;
    const level = Math.min(i.level, idx === 0 ? 0 : jalur.length);   // tidak boleh melompat lebih dari satu jenjang
    const pl = parseRuns(label, MAKS_HURUF), pk = parseRuns(sisa.join("|"), MAKS_KET);
    if (!pl.plain) return;
    const node = { t: pl.plain, tr: pl.runs, k: pk.plain, kr: pk.runs, anak: [] };
    jalur.length = level;
    if (level === 0) akarAkar.push(node); else jalur[level - 1].anak.push(node);
    jalur[level] = node;
    tertinggi = Math.max(tertinggi, level);
  });
  if (!akarAkar.length) return { galat: "Tidak ada isi yang terbaca." };
  if (tertinggi + 1 > MAKS_JENJANG) return { galat: `Maksimal ${MAKS_JENJANG} jenjang.` };

  const maya = akarAkar.length > 1;
  const judulAkar = String(judul || "").trim() || "Diagram";
  const akar = maya ? { t: judulAkar, tr: [{ t: judulAkar, st: null }], k: "", kr: [], anak: akarAkar, maya: true } : akarAkar[0];
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
export const DAFTAR_RATA = [["otomatis", "Otomatis"], ["kiri", "Rata kiri"], ["tengah", "Rata tengah"], ["kanan", "Rata kanan"], ["penuh", "Rata kanan-kiri"]];
export const DAFTAR_TATA = [["otomatis", "Otomatis (paling pas)"], ["vertikal", "Atas ke bawah"], ["kiri-kanan", "Kiri ke kanan"], ["kanan-kiri", "Kanan ke kiri (Arab)"]];

// Daftar font gabungan: huruf Latin dari Poppins, huruf Arab dari Amiri (satu baris boleh memuat keduanya)
function campurFont(lat, arb) {
  const l = String(lat).split(","), a = String(arb).split(",");
  return [l[0], a[0], ...l.slice(1), ...a.slice(1)].map((x) => x.trim()).filter(Boolean).join(", ");
}

const salin = (n) => ({ t: n.t, tr: n.tr, k: n.k || "", kr: n.kr || [], maya: n.maya, anak: n.anak.map(salin) });


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

function susun(ctx, akarAsli, arah, fam, gaya) {
  // arah: "v" (atas-bawah), "kk" (kiri-kanan), "rtl" (kanan-kiri)
  const vertikal = arah === "v";
  const akar = salin(akarAsli);
  const tingkat = [];
  (function jalan(n, l) { n.level = l; (tingkat[l] = tingkat[l] || []).push(n); n.anak.forEach((c) => jalan(c, l + 1)); })(akar, 0);

  const FONT = [32, 28, 25, 23];
  for (const n of tingkat.flat()) {
    const dasarU = FONT[Math.min(n.level, 3)];
    const an = analisa(n.t), ar = an.jenis === "arab";
    const basis = dasarU * (ar ? 1.25 : 1);
    n.kfN = { fam, gaya: gaya.nama, dasarL: 600, dasarA: 400, u: basis, campur: false };
    n.nrtl = an.rtl; n.lh = basis * (ar ? 1.5 : an.jenis === "campur" ? 1.45 : 1.32);
    const maksW = vertikal ? 250 : 320;
    n.baris = pecahBerformat(ctx, n.tr, maksW, n.kfN).map((l) => tataBaris(ctx, l, n.kfN, n.nrtl));
    let lt = Math.max(...n.baris.map((b) => b.w));
    n.kBaris = [];
    if (n.k) {
      const ak = analisa(n.k), kar = ak.jenis === "arab", uk = dasarU * 0.66 * (kar ? 1.25 : 1);
      n.kfK = { fam, gaya: gaya.ket, dasarL: 400, dasarA: 400, u: uk, campur: false };
      n.krtl = ak.rtl; n.klh = uk * (kar ? 1.5 : ak.jenis === "campur" ? 1.45 : 1.38);
      n.kBaris = pecahBerformat(ctx, n.kr, maksW, n.kfK).map((l) => tataBaris(ctx, l, n.kfK, n.krtl));
      lt = Math.max(lt, ...n.kBaris.map((b) => b.w));
    }
    n.isiH = n.baris.length * n.lh + (n.kBaris.length ? 8 + n.kBaris.length * n.klh : 0);
    n.w = Math.max(120, lt + 46); n.h = n.isiH + 30;
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
  const ADA = (daftar, v, awal) => (daftar.some(([k]) => k === v) ? v : awal);
  const gaya = {
    nama: ADA(DAFTAR_GAYA, opsi.gayaNama, "otomatis"), ket: ADA(DAFTAR_GAYA, opsi.gayaKet, "otomatis"),
    catatan: ADA(DAFTAR_GAYA, opsi.gayaCatatan, "otomatis"), rata: ADA(DAFTAR_RATA_KOTAK, opsi.rataKotak, "tengah"),
  };

  const css = getComputedStyle(document.body);
  const fam = { lat: css.getPropertyValue("--font-poppins").trim() || "Poppins, sans-serif", arb: css.getPropertyValue("--font-amiri").trim() || "Amiri, serif" };
  const semuaTeks = (function kumpul(n) { return [n.t, n.k || "", ...n.anak.flatMap(kumpul)]; })(hasil.akar).join(" ") + " " + (opsi.catatan || "");
  try {
    await Promise.all([
      document.fonts.load(`400 30px ${fam.lat}`), document.fonts.load(`500 30px ${fam.lat}`), document.fonts.load(`600 30px ${fam.lat}`), document.fonts.load(`700 30px ${fam.lat}`),
      ARAB.test(semuaTeks) ? document.fonts.load(`400 40px ${fam.arb}`, semuaTeks) : Promise.resolve(),
      ARAB.test(semuaTeks) ? document.fonts.load(`700 40px ${fam.arb}`, semuaTeks) : Promise.resolve(),
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
  // ---- catatan umum (keterangan diagram) di atas pita bawah
  const catatan = String(opsi.catatan || "").trim().slice(0, 600);
  let panel = null;
  if (catatan) {
    // Arah dasar mengikuti huruf kuat pertama (seperti dir="auto"): kalimat Indonesia dengan kata Arab di tengah tetap kiri-ke-kanan
    const paras = catatan.split("\n").filter((q) => q.trim()).map((q) => parseRuns(q, 600));
    const an = analisa(paras.map((q) => q.plain).join(" ")), rtl = an.rtl;
    const uc = an.jenis === "arab" ? 30 : 25, lhC = uc * (rtl ? 1.6 : 1.5);
    const konf = { fam, gaya: gaya.catatan, dasarL: 500, dasarA: 400, u: uc, campur: true };
    const lebarC = W - 112 - 68;
    let bC = paras.flatMap((q) => { const ls = pecahBerformat(ctx, q.runs, lebarC, konf); return ls.map((l, i) => ({ unit: l, akhir: i === ls.length - 1 })); });
    if (bC.length > 5) {
      bC = bC.slice(0, 5);
      const terakhir = bC[4].unit.map((u) => u.map((x) => ({ ...x })));
      const pu = terakhir[terakhir.length - 1], pt = pu[pu.length - 1];
      pt.t = `${pt.t.replace(/[\s,.;:]+$/, "")}…`;
      bC[4] = { unit: terakhir, akhir: true };
    }
    ctx.direction = "ltr";
    panel = { rtl, uc, lhC, baris: bC.map((b) => ({ tt: tataBaris(ctx, b.unit, konf, rtl), akhir: b.akhir })), h: 38 + 34 + bC.length * lhC };
  }
  const ruangPanel = panel ? panel.h + 24 : 0;
  const area = { x: 56, y: tinggiAtas + 34, w: W - 112, h: H - tinggiAtas - tinggiBawah - 68 - ruangPanel };

  // ---- pilih tata letak
  let layout, arahDipakai;
  ctx.direction = "ltr";
  const coba = (a) => { const l = susun(ctx, hasil.akar, a, fam, gaya); l.skala = Math.min(area.w / l.TW, area.h / l.TH); return l; };
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
    let u = 52; const aj = analisa(judul);
    const fJ = (uu) => (aj.jenis === "arab" ? `400 ${uu * 1.2}px ${fam.arb}` : `700 ${uu}px ${aj.jenis === "campur" ? campurFont(fam.lat, fam.arb) : fam.lat}`);
    ctx.font = fJ(u);
    let bs = pecah(ctx, judul, W - 160);
    while (bs.length > 2 && u > 28) { u -= 4; ctx.font = fJ(u); bs = pecah(ctx, judul, W - 160); }
    if (aj.rtl) ctx.direction = "rtl";
    const lh = u * (aj.jenis === "arab" ? 1.5 : 1.25), y0 = 100 + (tinggiAtas - 100 - bs.length * lh) / 2;
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
    ctx.fillStyle = w.teks;
    const kiriX = n.cx - n.w / 2 + 23, kananX = n.cx + n.w / 2 - 23, lebarT = kananX - kiriX;
    const bisaPenuh = "wordSpacing" in ctx;
    const tulis = (tata, rtlB, lh, yMulai, alfa) => {
      ctx.globalAlpha = alfa;
      const awal = rtlB ? "kanan" : "kiri";
      tata.forEach((tt, i) => {
        const y = yMulai + (i + 1) * lh - lh * 0.27;
        let mode = gaya.rata;
        if (mode === "penuh" && (i === tata.length - 1 || !bisaPenuh || tt.spasi === 0)) mode = awal;   // baris terakhir mengikuti arah dasar
        let x0, bagi = 0;
        if (mode === "penuh") { x0 = kiriX; const sx = (lebarT - tt.w) / tt.spasi; bagi = sx > 0 && sx < 48 ? sx : 0; }
        else x0 = mode === "kanan" ? kananX - tt.w : mode === "tengah" ? n.cx - tt.w / 2 : kiriX;
        gambarBaris(ctx, tt, x0, y, bagi);
      });
      ctx.globalAlpha = 1;
    };
    const y0 = n.cy - n.isiH / 2;
    tulis(n.baris, n.nrtl, n.lh, y0, 1);
    if (n.kBaris.length) tulis(n.kBaris, n.krtl, n.klh, y0 + n.baris.length * n.lh + 8, 0.88);
    ctx.direction = "ltr"; ctx.textAlign = "left";
  });
  ctx.restore();

  // ---- panel keterangan
  if (panel) {
    const px = 56, pw = W - 112, py = H - tinggiBawah - 6 - 24 - panel.h;
    const gelap = opsi.tema === "gelap";
    ctx.save();
    if (!gelap) { ctx.shadowColor = "rgba(20,88,42,0.18)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3; }
    kotak(ctx, px, py, pw, panel.h, 18); ctx.fillStyle = gelap ? "rgba(255,255,255,0.12)" : "#FFFFFF"; ctx.fill();
    ctx.restore();
    kotak(ctx, px, py, pw, panel.h, 18); ctx.strokeStyle = gelap ? "rgba(255,255,255,0.35)" : "#C9D3BC"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = emas;
    ctx.fillRect(panel.rtl ? px + pw - 9 : px, py + 14, 9, panel.h - 28);

    const kiriX = px + 34, kananX = px + pw - 34, tengahX = px + pw / 2, lebarT = kananX - kiriX;
    const awal = panel.rtl ? "kanan" : "kiri";
    const rata = ["kiri", "tengah", "kanan", "penuh"].includes(opsi.rataCatatan) ? opsi.rataCatatan : awal;
    const posisi = (m) => (m === "kanan" ? [kananX, "right"] : m === "tengah" ? [tengahX, "center"] : [kiriX, "left"]);
    ctx.direction = panel.rtl ? "rtl" : "ltr";

    // judul kecil
    const [hx, hAlign] = posisi(rata === "penuh" ? awal : rata);
    ctx.textAlign = hAlign;
    ctx.fillStyle = gelap ? "#F5B800" : "#1E7B34";
    ctx.font = panel.rtl ? `400 ${panel.uc}px ${fam.arb}` : `700 22px ${fam.lat}`;
    ctx.fillText(panel.rtl ? "ملاحظة" : "KETERANGAN", hx, py + 38);

    // isi
    ctx.fillStyle = gelap ? "#FFFFFF" : "#14582A";
    const bisaPenuh = "wordSpacing" in ctx;
    panel.baris.forEach((b, i) => {
      const y = py + 38 + 12 + (i + 1) * panel.lhC - panel.lhC * 0.2;
      const tt = b.tt; let mode = rata;
      if (rata === "penuh" && (b.akhir || !bisaPenuh || tt.spasi === 0)) mode = awal;
      let x0, bagi = 0;
      if (mode === "penuh") { x0 = kiriX; const sx = (lebarT - tt.w) / tt.spasi; bagi = sx > 0 && sx < 48 ? sx : 0; }
      else x0 = mode === "kanan" ? kananX - tt.w : mode === "tengah" ? tengahX - tt.w / 2 : kiriX;
      gambarBaris(ctx, tt, x0, y, bagi);
    });
    ctx.direction = "ltr"; ctx.textAlign = "left";
  }

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
