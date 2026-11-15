// Gambar rapor peserta dan laporan umum (PNG/JPG) dengan bagan, digambar di kanvas peramban.
import { PREDIKAT, STATUS_HADIR, WARNA_HADIR, warnaNilai } from "@/lib/rapor";

const W = 1080, M = 56, CW = W - M * 2;
const HIJAU = "#1E7B34", TUA = "#14582A", DAUN = "#6B9E2F", KUNING = "#F5B800", JINGGA = "#F28C1B", KREM = "#FAF8F1", MUDA = "#E6F0DC", TINTA = "#1B2A1F", ABU = "#5B6B5F", TEPI = "#C9D3BC", TRACK = "#E3E8DC";

const muat = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
const pct = (v) => (v == null ? "-" : `${v}%`);
const tgl = (iso) => (iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }) : "");
const periode = (r) => (r?.dari || r?.sampai ? `${r.dari ? tgl(r.dari) : "awal program"} – ${r.sampai ? tgl(r.sampai) : "sekarang"}` : "Seluruh periode sampai hari ini");
const ARAB = /[\u0600-\u06FF]/;

function kotak(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

async function siapkan(teksArab = "") {
  const css = getComputedStyle(document.body);
  const lat = css.getPropertyValue("--font-poppins").trim() || "Poppins, sans-serif";
  const arb = css.getPropertyValue("--font-amiri").trim() || "Amiri, serif";
  try {
    await Promise.all([400, 500, 600, 700].map((b) => document.fonts.load(`${b} 30px ${lat}`)).concat(ARAB.test(teksArab) ? [document.fonts.load(`400 40px ${arb}`, teksArab)] : []));
  } catch { /* lanjut dengan font bawaan */ }
  const [logoRD, logoPO] = await Promise.all([muat("/img/logo-rumah-dakwah-putih.png"), muat("/img/logo-pesantren-online.png")]);
  const ukur = document.createElement("canvas").getContext("2d");
  const F = (b, u, arab) => `${b} ${u}px ${arab ? arb : lat}`;
  const bungkus = (t, lebar, font) => {
    ukur.font = font; const out = []; let cur = "";
    for (const k of String(t).split(/\s+/).filter(Boolean)) { const c = cur ? `${cur} ${k}` : k; if (!cur || ukur.measureText(c).width <= lebar) cur = c; else { out.push(cur); cur = k; } }
    if (cur) out.push(cur); return out;
  };
  const potong = (ctx, t, lebar) => { let s = String(t); if (ctx.measureText(s).width <= lebar) return s; while (s.length > 1 && ctx.measureText(`${s}…`).width > lebar) s = s.slice(0, -1); return `${s}…`; };
  return { lat, arb, logoRD, logoPO, ukur, F, bungkus, potong };
}

// ---------------------------------------------------------------- bagan
function donut(ctx, cx, cy, rl, rd, bagian) {
  const total = bagian.reduce((a, b) => a + b.nilai, 0), tebal = rl - rd, rm = (rl + rd) / 2;
  ctx.lineWidth = tebal; ctx.lineCap = "butt";
  if (!total) { ctx.strokeStyle = TRACK; ctx.beginPath(); ctx.arc(cx, cy, rm, 0, Math.PI * 2); ctx.stroke(); return; }
  let a = -Math.PI / 2;
  for (const b of bagian) { if (!b.nilai) continue; const s = (b.nilai / total) * Math.PI * 2; ctx.strokeStyle = b.warna; ctx.beginPath(); ctx.arc(cx, cy, rm, a, a + s - (bagian.filter((x) => x.nilai).length > 1 ? 0.012 : 0)); ctx.stroke(); a += s; }
}
function cincin(ctx, cx, cy, r, tebal, persen, warna) {
  ctx.lineWidth = tebal; ctx.lineCap = "round";
  ctx.strokeStyle = TRACK; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  if (persen > 0) { ctx.strokeStyle = warna; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.min(100, persen) / 100) * Math.PI * 2); ctx.stroke(); }
}
function batang(ctx, x, y, w, h, persen, warna) {
  kotak(ctx, x, y, w, h, h / 2); ctx.fillStyle = TRACK; ctx.fill();
  if (persen > 0) { kotak(ctx, x, y, Math.max(h, (w * Math.min(100, persen)) / 100), h, h / 2); ctx.fillStyle = warna; ctx.fill(); }
}
function kartu(ctx, x, y, w, h, isi = "#FFFFFF") {
  ctx.save(); ctx.shadowColor = "rgba(20,88,42,0.16)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6; kotak(ctx, x, y, w, h, 28); ctx.fillStyle = isi; ctx.fill(); ctx.restore();
  kotak(ctx, x, y, w, h, 28); ctx.strokeStyle = "rgba(201,211,188,0.8)"; ctx.lineWidth = 1.5; ctx.stroke();
}
function judulBagian(ctx, k, teks, y) {
  const g = ctx.createLinearGradient(0, 0, 0, 1); ctx.fillStyle = KUNING; kotak(ctx, M, y + 6, 9, 38, 4); ctx.fill();
  ctx.fillStyle = TUA; ctx.font = k.F(700, 36); ctx.textAlign = "left"; ctx.fillText(teks, M + 26, y + 38);
}

// ---------------------------------------------------------------- kepala dan kaki
function kepala(k, judul, sub, periodeTeks) {
  const T = 262;
  return { tinggi: T, gambar(ctx, y) {
    const g = ctx.createLinearGradient(0, y, W, y + T); g.addColorStop(0, HIJAU); g.addColorStop(1, "#0E3F1F"); ctx.fillStyle = g; ctx.fillRect(0, y, W, T);
    ctx.strokeStyle = "rgba(245,184,0,0.12)"; ctx.lineWidth = 3;
    for (let r = 160; r <= 520; r += 90) { ctx.beginPath(); ctx.arc(W, y, r, 0, Math.PI * 2); ctx.stroke(); }
    if (k.logoRD) { const h = 58, w = h * (k.logoRD.width / k.logoRD.height); ctx.drawImage(k.logoRD, M, y + 38, w, h); }
    if (k.logoPO) { ctx.fillStyle = KREM; ctx.beginPath(); ctx.arc(W - M - 48, y + 66, 48, 0, Math.PI * 2); ctx.fill(); ctx.drawImage(k.logoPO, W - M - 48 - 40, y + 66 - 40, 80, 80); }
    ctx.textAlign = "left"; ctx.fillStyle = "#FFFFFF"; ctx.font = k.F(700, 56); ctx.fillText(judul, M, y + 168);
    ctx.fillStyle = KUNING; ctx.font = k.F(500, 26); ctx.fillText(sub, M, y + 208);
    ctx.fillStyle = "rgba(255,255,255,0.78)"; ctx.font = k.F(400, 22); ctx.fillText(periodeTeks, M, y + 240);
    const e = ctx.createLinearGradient(0, 0, W, 0); e.addColorStop(0, KUNING); e.addColorStop(1, JINGGA); ctx.fillStyle = e; ctx.fillRect(0, y + T - 8, W, 8);
  } };
}
function kaki(k, catatan) {
  const T = 150;
  return { tinggi: T, opsional: true, gambar(ctx, y) {
    ctx.fillStyle = TUA; ctx.fillRect(0, y, W, T);
    const e = ctx.createLinearGradient(0, 0, W, 0); e.addColorStop(0, KUNING); e.addColorStop(1, JINGGA); ctx.fillStyle = e; ctx.fillRect(0, y, W, 6);
    if (k.logoPO) { ctx.fillStyle = KREM; ctx.beginPath(); ctx.arc(M + 44, y + 78, 44, 0, Math.PI * 2); ctx.fill(); ctx.drawImage(k.logoPO, M + 44 - 36, y + 78 - 36, 72, 72); }
    ctx.textAlign = "left"; ctx.fillStyle = "#FFFFFF"; ctx.font = k.F(700, 28); ctx.fillText("KBA-UMM", M + 112, y + 66);
    ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = k.F(400, 21); ctx.fillText("Kuliah Bahasa Arab Untuk Meraih Mahabatullah", M + 112, y + 96);
    ctx.fillStyle = KUNING; ctx.font = k.F(500, 20); ctx.fillText(catatan, M + 112, y + 124);
  } };
}

// ---------------------------------------------------------------- rapor peserta
function bagianRapor(k, r) {
  const b = [kepala(k, "RAPOR PESERTA", "Kuliah Bahasa Arab Untuk Meraih Mahabatullah (KBA-UMM)", `Periode: ${periode(r.rentang)}`)];
  const kh = r.kehadiran, q = r.kuis, g = r.progres, pr = r.predikat;

  // identitas
  const namaBaris = k.bungkus(r.peserta.nama, CW - 80, k.F(700, 46)).slice(0, 2);
  const chip = [r.peserta.kode, `${r.grup.jk || ""} · ${r.grup.tingkat || ""}`, r.grup.nama, r.grup.pengajar ? `Pengajar: ${r.grup.pengajar}` : null].filter(Boolean);
  const chipPos = []; { let x = 0, row = 0; k.ukur.font = k.F(500, 22); for (const c of chip) { const w = Math.min(CW - 80, k.ukur.measureText(c).width + 40); if (x + w > CW - 80 && x > 0) { x = 0; row++; } chipPos.push({ c, x, row, w }); x += w + 12; } }
  const baris = chipPos.length ? chipPos[chipPos.length - 1].row + 1 : 0, tIdent = 40 + namaBaris.length * 58 + 18 + baris * 54 + 24;
  b.push({ tinggi: tIdent + 40, gambar(ctx, y) {
    kartu(ctx, M, y + 28, CW, tIdent); ctx.textAlign = "left"; ctx.fillStyle = TUA; ctx.font = k.F(700, 46);
    namaBaris.forEach((t, i) => ctx.fillText(t, M + 40, y + 28 + 40 + 44 + i * 58));
    const y0 = y + 28 + 40 + namaBaris.length * 58 + 10;
    chipPos.forEach((c) => { const cx = M + 40 + c.x, cy = y0 + c.row * 54; kotak(ctx, cx, cy, c.w, 44, 22); ctx.fillStyle = MUDA; ctx.fill(); ctx.fillStyle = TUA; ctx.font = k.F(500, 22); ctx.fillText(k.potong(ctx, c.c, c.w - 32), cx + 20, cy + 30); });
  } });

  // ringkasan penilaian
  b.push({ tinggi: 400, gambar(ctx, y) {
    kartu(ctx, M, y, CW, 372);
    const cx = M + 200, cy = y + 150;
    cincin(ctx, cx, cy, 112, 34, r.skor ?? 0, pr.warna);
    ctx.textAlign = "center"; ctx.fillStyle = TUA; ctx.font = k.F(700, 84); ctx.fillText(r.skor == null ? "-" : String(r.skor), cx, cy + 20);
    ctx.fillStyle = ABU; ctx.font = k.F(500, 20); ctx.fillText("SKOR AKHIR", cx, cy + 56);
    ctx.fillStyle = pr.warna; ctx.font = k.F(700, 34); ctx.fillText(pr.nama, cx, y + 322);
    if (pr.ar) { ctx.font = k.F(400, 32, true); ctx.direction = "rtl"; ctx.fillText(pr.ar, cx, y + 358); ctx.direction = "ltr"; }
    ctx.textAlign = "left";
    const x0 = M + 400, lb = CW - 400 - 40;
    [["Kehadiran", kh.persen, WARNA_HADIR.hadir, kh.total ? `hadir ${kh.hadir} · sakit ${kh.sakit} · izin ${kh.izin} · alpa ${kh.alpa}` : "belum ada pertemuan"], ["Rata-rata kuis", q.rata, warnaNilai(q.rata), q.jumlah ? `${q.dikerjakan} dari ${q.jumlah} kuis dikerjakan` : "belum ada kuis"], ["Progres belajar", g.persen, DAUN, g.total ? `${g.selesai} dari ${g.total} materi, rekaman, dan kuis` : "belum ada materi"]].forEach(([jd, v, w, sub], i) => {
      const yy = y + 50 + i * 110;
      ctx.fillStyle = ABU; ctx.font = k.F(500, 22); ctx.fillText(jd, x0, yy + 4);
      ctx.fillStyle = w; ctx.font = k.F(700, 46); ctx.textAlign = "right"; ctx.fillText(jd === "Rata-rata kuis" ? (v == null ? "-" : String(v)) : pct(v), x0 + lb, yy + 8); ctx.textAlign = "left";
      batang(ctx, x0, yy + 24, lb, 18, v ?? 0, w);
      ctx.fillStyle = ABU; ctx.font = k.F(400, 19); ctx.fillText(sub, x0, yy + 66);
    });
  } });

  // kehadiran
  b.push({ tinggi: 420, gambar(ctx, y) {
    judulBagian(ctx, k, "Kehadiran", y); kartu(ctx, M, y + 64, CW, 330);
    const cx = M + 200, cy = y + 64 + 165;
    donut(ctx, cx, cy, 120, 74, ["hadir", "izin", "sakit", "alpa"].map((s) => ({ nilai: kh[s], warna: WARNA_HADIR[s] })));
    ctx.textAlign = "center"; ctx.fillStyle = TUA; ctx.font = k.F(700, 50); ctx.fillText(pct(kh.persen), cx, cy + 12); ctx.fillStyle = ABU; ctx.font = k.F(500, 20); ctx.fillText("nilai hadir", cx, cy + 42);
    ctx.textAlign = "left";
    if (!kh.total) { ctx.fillStyle = ABU; ctx.font = k.F(400, 26); ctx.fillText("Belum ada pertemuan yang terlaksana.", M + 400, cy); return; }
    ["hadir", "izin", "sakit", "alpa"].forEach((s, i) => {
      const yy = y + 64 + 62 + i * 58; kotak(ctx, M + 400, yy, 30, 30, 8); ctx.fillStyle = WARNA_HADIR[s]; ctx.fill();
      ctx.fillStyle = TINTA; ctx.font = k.F(600, 28); ctx.fillText(STATUS_HADIR[s], M + 446, yy + 25);
      ctx.textAlign = "right"; ctx.font = k.F(700, 28); ctx.fillText(`${kh[s]}`, M + CW - 150, yy + 25); ctx.fillStyle = ABU; ctx.font = k.F(500, 24); ctx.fillText(`${Math.round((kh[s] * 100) / kh.total)}%`, M + CW - 40, yy + 25); ctx.textAlign = "left";
    });
    ctx.fillStyle = ABU; ctx.font = k.F(500, 22); ctx.fillText(`Total ${kh.total} pertemuan · nilai: hadir & sakit 100, izin 95, alpa 0`, M + 400, y + 64 + 62 + 4 * 58 + 8);
  } });

  // kuis (dipecah per 7 baris agar mengalir ke halaman berikutnya)
  const semua = q.daftar.slice(0, 40), sisa = q.daftar.length - semua.length, PERK = 7;
  if (!q.jumlah) {
    b.push({ tinggi: 64 + 100 + 32, gambar(ctx, y) { judulBagian(ctx, k, "Nilai Kuis", y); kartu(ctx, M, y + 64, CW, 100); ctx.textAlign = "left"; ctx.fillStyle = ABU; ctx.font = k.F(400, 26); ctx.fillText("Belum ada kuis yang diterbitkan.", M + 40, y + 64 + 58); } });
  } else {
    for (let aw = 0; aw < semua.length; aw += PERK) {
      const tampil = semua.slice(aw, aw + PERK), akhir = aw + PERK >= semua.length;
      const tKuis = 56 + tampil.length * 62 + (akhir ? (sisa > 0 ? 36 : 0) + 74 : 0) - (akhir ? 0 : 20);
      b.push({ tinggi: 64 + tKuis + 32, gambar(ctx, y) {
        judulBagian(ctx, k, aw ? "Nilai Kuis (lanjutan)" : "Nilai Kuis", y); kartu(ctx, M, y + 64, CW, tKuis); ctx.textAlign = "left";
        tampil.forEach((x, i) => {
          const yy = y + 64 + 36 + i * 62;
          ctx.fillStyle = TINTA; ctx.font = k.F(500, 23); ctx.fillText(k.potong(ctx, x.judul, 300), M + 40, yy + 28);
          batang(ctx, M + 370, yy + 8, 400, 26, x.nilai ?? 0, warnaNilai(x.nilai));
          ctx.textAlign = "right"; ctx.fillStyle = x.status === "selesai" ? warnaNilai(x.nilai) : ABU; ctx.font = x.status === "selesai" ? k.F(700, 30) : k.F(500, 20);
          ctx.fillText(x.status === "selesai" ? String(x.nilai) : x.status === "menunggu" ? "menunggu" : "belum", M + CW - 40, yy + 30); ctx.textAlign = "left";
        });
        if (!akhir) return;
        let yb = y + 64 + 36 + tampil.length * 62; if (sisa > 0) { ctx.fillStyle = ABU; ctx.font = k.F(500, 21); ctx.fillText(`+ ${sisa} kuis lainnya`, M + 40, yb + 14); yb += 36; }
        ctx.fillStyle = ABU; ctx.font = k.F(500, 22); ctx.fillText(`Dikerjakan ${q.dikerjakan} dari ${q.jumlah} kuis · rata-rata ${q.rata == null ? "-" : q.rata}${q.menunggu ? ` · ${q.menunggu} menunggu penilaian` : ""}`, M + 40, yb + 30);
      } });
    }
  }

  // progres
  b.push({ tinggi: 64 + 330 + 32, gambar(ctx, y) {
    judulBagian(ctx, k, "Progres Belajar", y); kartu(ctx, M, y + 64, CW, 330); ctx.textAlign = "left";
    [["Materi", g.rincian.materi, HIJAU], ["Rekaman", g.rincian.rekaman, DAUN], ["Kuis", g.rincian.kuis, KUNING], ["Keseluruhan", { selesai: g.selesai, total: g.total }, TUA]].forEach(([n, v, w], i) => {
      const yy = y + 64 + 40 + i * 70, p = v.total ? Math.round((v.selesai * 100) / v.total) : 0;
      ctx.fillStyle = TINTA; ctx.font = k.F(i === 3 ? 700 : 600, 26); ctx.fillText(n, M + 40, yy + 28);
      batang(ctx, M + 250, yy + 8, 480, 26, p, w);
      ctx.textAlign = "right"; ctx.fillStyle = ABU; ctx.font = k.F(500, 21); ctx.fillText(`${v.selesai}/${v.total}`, M + 810, yy + 28); ctx.fillStyle = TUA; ctx.font = k.F(700, 28); ctx.fillText(v.total ? `${p}%` : "-", M + CW - 40, yy + 30); ctx.textAlign = "left";
    });
  } });

  // riwayat kehadiran (kotak berwarna)
  if (kh.riwayat.length) {
    const kotakW = 48, jarak = 10, perBaris = Math.floor((CW - 80 + jarak) / (kotakW + jarak)), maks = perBaris * 5, dl = kh.riwayat.slice(-maks), rows = Math.ceil(dl.length / perBaris);
    const tRiw = 40 + rows * (kotakW + jarak) + 70;
    b.push({ tinggi: 64 + tRiw + 32, gambar(ctx, y) {
      judulBagian(ctx, k, "Riwayat Kehadiran", y); kartu(ctx, M, y + 64, CW, tRiw);
      dl.forEach((x, i) => {
        const cx = M + 40 + (i % perBaris) * (kotakW + jarak), cy = y + 64 + 28 + Math.floor(i / perBaris) * (kotakW + jarak);
        kotak(ctx, cx, cy, kotakW, kotakW, 12); ctx.fillStyle = WARNA_HADIR[x.status]; ctx.fill();
        ctx.fillStyle = "#FFFFFF"; ctx.font = k.F(700, 19); ctx.textAlign = "center"; ctx.fillText(String(kh.riwayat.length - dl.length + i + 1), cx + kotakW / 2, cy + 31); ctx.textAlign = "left";
      });
      let lx = M + 40; const ly = y + 64 + tRiw - 26;
      ["hadir", "izin", "sakit", "alpa"].forEach((s) => { kotak(ctx, lx, ly - 16, 20, 20, 6); ctx.fillStyle = WARNA_HADIR[s]; ctx.fill(); ctx.fillStyle = ABU; ctx.font = k.F(500, 20); ctx.fillText(STATUS_HADIR[s], lx + 28, ly); lx += 28 + ctx.measureText(STATUS_HADIR[s]).width + 30; });
      if (kh.riwayat.length > maks) { ctx.fillStyle = ABU; ctx.font = k.F(400, 18); ctx.textAlign = "right"; ctx.fillText(`${maks} pertemuan terakhir dari ${kh.riwayat.length}`, M + CW - 40, ly); ctx.textAlign = "left"; }
    } });
  }

  // catatan pengajar (catatan yang seluruhnya Arab ditulis kanan-ke-kiri dengan huruf Arab)
  if (r.catatan?.isi) {
    const arab = ARAB.test(r.catatan.isi) && !/[A-Za-z]/.test(r.catatan.isi);
    const fontC = arab ? k.F(400, 36, true) : k.F(400, 28, false), lh = arab ? 62 : 44;
    const lines = k.bungkus(r.catatan.isi, CW - 130, fontC);
    const tCat = 40 + lines.length * lh + 60 + (r.catatan.oleh ? 40 : 0);
    b.push({ tinggi: 64 + tCat + 32, gambar(ctx, y) {
      judulBagian(ctx, k, "Catatan Pengajar", y); kartu(ctx, M, y + 64, CW, tCat, "#FFFDF5");
      ctx.fillStyle = KUNING; ctx.font = k.F(700, 90, false); ctx.textAlign = arab ? "right" : "left"; ctx.fillText("“", arab ? M + CW - 28 : M + 28, y + 64 + 82);
      ctx.fillStyle = TINTA; ctx.font = fontC; ctx.direction = arab ? "rtl" : "ltr"; ctx.textAlign = arab ? "right" : "left";
      lines.forEach((t, i) => ctx.fillText(t, arab ? M + CW - 60 : M + 60, y + 64 + 52 + i * lh + (arab ? 46 : 40)));
      ctx.direction = "ltr";
      if (r.catatan.oleh) { ctx.fillStyle = HIJAU; ctx.font = k.F(600, 24, ARAB.test(r.catatan.oleh)); ctx.direction = ARAB.test(r.catatan.oleh) ? "rtl" : "ltr"; ctx.textAlign = arab ? "left" : "right"; ctx.fillText(`— ${r.catatan.oleh}`, arab ? M + 40 : M + CW - 40, y + 64 + tCat - 26); ctx.direction = "ltr"; }
      ctx.textAlign = "left";
    } });
  }
  b.push(kaki(k, `Dicetak ${tgl(new Date().toISOString())}`));
  return b;
}

// ---------------------------------------------------------------- laporan umum
function bagianLaporan(k, l, tampilNama) {
  const r = l.ringkas, t = l.total;
  const b = [kepala(k, "LAPORAN PROGRAM", "Kuliah Bahasa Arab Untuk Meraih Mahabatullah (KBA-UMM)", `Periode: ${periode(l.rentang)}`)];

  // ringkasan teks
  const bar = l.ringkasan.map((s) => k.bungkus(s, CW - 110, k.F(400, 26)));
  const tR = 36 + bar.reduce((a, x) => a + x.length * 40 + 14, 0) + 20;
  b.push({ tinggi: 64 + tR + 32, gambar(ctx, y) {
    judulBagian(ctx, k, "Ringkasan", y); kartu(ctx, M, y + 64, CW, tR); let yy = y + 64 + 36; ctx.textAlign = "left";
    bar.forEach((ls) => { ctx.fillStyle = KUNING; ctx.beginPath(); ctx.arc(M + 44, yy + 18, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = TINTA; ctx.font = k.F(400, 26); ls.forEach((x, i) => ctx.fillText(x, M + 74, yy + 28 + i * 40)); yy += ls.length * 40 + 14; });
  } });

  // angka utama
  b.push({ tinggi: 64 + 300 + 32, gambar(ctx, y) {
    judulBagian(ctx, k, "Angka Utama", y);
    const kt = [["Peserta", String(t.peserta), TUA, `${t.grup} grup`], ["Pertemuan", String(t.pertemuan), TUA, "terlaksana"], ["Rata-rata skor", r.rataSkor == null ? "-" : String(r.rataSkor), TUA, "skor akhir"], ["Kehadiran", pct(r.rataHadir), WARNA_HADIR.hadir, "rata-rata"], ["Nilai kuis", r.rataKuis == null ? "-" : String(r.rataKuis), warnaNilai(r.rataKuis), "rata-rata"], ["Progres belajar", pct(r.rataProgres), DAUN, "rata-rata"]];
    const w = (CW - 40) / 3;
    kt.forEach(([jd, v, wr, sub], i) => {
      const x = M + (i % 3) * (w + 20), yy = y + 64 + Math.floor(i / 3) * 160; kartu(ctx, x, yy, w, 140);
      ctx.textAlign = "left"; ctx.fillStyle = ABU; ctx.font = k.F(500, 21); ctx.fillText(jd, x + 24, yy + 40);
      ctx.fillStyle = wr; ctx.font = k.F(700, 56); ctx.fillText(v, x + 24, yy + 98); ctx.fillStyle = ABU; ctx.font = k.F(400, 18); ctx.fillText(sub, x + 24, yy + 126);
    });
  } });

  // per grup
  const GRUP_PER_BLOK = 4;
  for (let awal = 0; awal < l.perGrup.length; awal += GRUP_PER_BLOK) {
  const gr = l.perGrup.slice(awal, awal + GRUP_PER_BLOK), lanjut = awal > 0;
  const tG = 26 + gr.length * 118 - 12 + 14;
  b.push({ tinggi: 64 + tG + 32, gambar(ctx, y) {
    judulBagian(ctx, k, lanjut ? "Capaian per Grup (lanjutan)" : "Capaian per Grup", y); kartu(ctx, M, y + 64, CW, tG); ctx.textAlign = "left";
    gr.forEach((g, i) => {
      const yy = y + 64 + 26 + i * 118;
      ctx.fillStyle = TINTA; ctx.font = k.F(700, 25); ctx.fillText(k.potong(ctx, g.nama, 520), M + 36, yy + 24);
      ctx.fillStyle = ABU; ctx.font = k.F(400, 19); ctx.fillText(`${g.jk || ""} · ${g.tingkat || ""} · ${g.n} peserta`, M + 36, yy + 50);
      [["Hadir", g.rataHadir, WARNA_HADIR.hadir, pct(g.rataHadir)], ["Kuis", g.rataKuis, KUNING, g.rataKuis == null ? "-" : String(g.rataKuis)], ["Progres", g.rataProgres, DAUN, pct(g.rataProgres)]].forEach(([n, v, w, tx], j) => {
        const yb = yy + 62 + j * 18 - 6 + (j === 0 ? 0 : 0);
        ctx.fillStyle = ABU; ctx.font = k.F(500, 15); ctx.fillText(n, M + 36 + 560, yy + 18 + j * 24 - 4 + 0);
        batang(ctx, M + 36 + 640, yy + 4 + j * 24, 190, 14, v ?? 0, w); ctx.fillStyle = TINTA; ctx.font = k.F(700, 16); ctx.textAlign = "right"; ctx.fillText(tx, M + CW - 28, yy + 17 + j * 24); ctx.textAlign = "left";
      });
      ctx.fillStyle = r.rataSkor == null ? ABU : TUA; ctx.font = k.F(600, 21); ctx.fillText(`Skor ${g.rataSkor == null ? "-" : g.rataSkor}`, M + 36, yy + 84);
      if (i < gr.length - 1) { ctx.fillStyle = TRACK; ctx.fillRect(M + 36, yy + 104, CW - 72, 1.5); }
    });
  } });
  }

  // sebaran predikat
  b.push({ tinggi: 64 + 340 + 32, gambar(ctx, y) {
    judulBagian(ctx, k, "Sebaran Predikat", y); kartu(ctx, M, y + 64, CW, 340);
    const dist = PREDIKAT.map((p) => ({ ...p, n: r.distribusi[p.nama] || 0 })), cx = M + 190, cy = y + 64 + 170;
    donut(ctx, cx, cy, 118, 72, dist.map((p) => ({ nilai: p.n, warna: p.warna })));
    ctx.textAlign = "center"; ctx.fillStyle = TUA; ctx.font = k.F(700, 54); ctx.fillText(String(r.n), cx, cy + 14); ctx.fillStyle = ABU; ctx.font = k.F(500, 20); ctx.fillText("peserta", cx, cy + 44); ctx.textAlign = "left";
    dist.forEach((p, i) => {
      const yy = y + 64 + 36 + i * 58; kotak(ctx, M + 380, yy, 30, 30, 8); ctx.fillStyle = p.warna; ctx.fill();
      ctx.fillStyle = TINTA; ctx.font = k.F(600, 26); ctx.fillText(p.nama, M + 426, yy + 24); ctx.fillStyle = ABU; ctx.font = k.F(400, 19); ctx.fillText(p.arti, M + 426, yy + 46);
      ctx.textAlign = "right"; ctx.fillStyle = TINTA; ctx.font = k.F(700, 28); ctx.fillText(String(p.n), M + CW - 120, yy + 26); ctx.fillStyle = ABU; ctx.font = k.F(500, 22); ctx.fillText(`${r.n ? Math.round((p.n * 100) / r.n) : 0}%`, M + CW - 36, yy + 26); ctx.textAlign = "left";
    });
  } });

  // tren bulanan
  if (l.bulanan.length) {
    const n = l.bulanan.length, lebarB = Math.min(110, (CW - 80) / n - 24);
    b.push({ tinggi: 64 + 380 + 32, gambar(ctx, y) {
      judulBagian(ctx, k, "Tren Kehadiran per Bulan", y); kartu(ctx, M, y + 64, CW, 380);
      const dasar = y + 64 + 290, tinggiMaks = 200, slot = (CW - 80) / n;
      ctx.fillStyle = TRACK; ctx.fillRect(M + 40, dasar, CW - 80, 2);
      l.bulanan.forEach((x, i) => {
        const cx = M + 40 + slot * i + slot / 2, h = ((x.persen ?? 0) / 100) * tinggiMaks;
        kotak(ctx, cx - lebarB / 2, dasar - h, lebarB, Math.max(h, 6), 12); ctx.fillStyle = HIJAU; ctx.fill();
        ctx.textAlign = "center"; ctx.fillStyle = TUA; ctx.font = k.F(700, 24); ctx.fillText(pct(x.persen), cx, dasar - h - 12);
        ctx.fillStyle = TINTA; ctx.font = k.F(600, slot >= 110 ? 21 : 17); ctx.fillText(x.label, cx, dasar + 34); ctx.fillStyle = ABU; ctx.font = k.F(400, slot >= 130 ? 18 : 16); ctx.fillText(slot >= 130 ? `${x.pertemuan} pertemuan` : slot >= 84 ? `${x.pertemuan} pert.` : `${x.pertemuan}x`, cx, dasar + 60);
      }); ctx.textAlign = "left";
    } });
  }

  // daftar peserta (dipecah per 10 baris agar tidak terpotong di batas halaman)
  if (tampilNama && (l.unggulan.length || l.pendampingan.length)) {
    const PER = 6, jumlah = Math.max(Math.ceil(l.unggulan.length / PER), Math.ceil(l.pendampingan.length / PER), 1);
    for (let n = 0; n < jumlah; n++) {
      const ung = l.unggulan.slice(n * PER, n * PER + PER), pen = l.pendampingan.slice(n * PER, n * PER + PER);
      const baris = Math.max(ung.length, pen.length, 1), tD = 80 + baris * 64 + 20, awal = n * PER;
      b.push({ tinggi: 64 + tD + 32, gambar(ctx, y) {
        judulBagian(ctx, k, n ? "Berprestasi dan Pendampingan (lanjutan)" : "Peserta Berprestasi dan Pendampingan", y);
        const w = (CW - 20) / 2;
        [["Berprestasi (skor ≥ 70)", ung, HIJAU, l.unggulan.length], ["Pendampingan (skor < 70)", pen, "#C0392B", l.pendampingan.length]].forEach(([jd, dl, wr, total], c) => {
          const x = M + c * (w + 20); kartu(ctx, x, y + 64, w, tD); ctx.textAlign = "left"; ctx.fillStyle = wr; ctx.font = k.F(700, 25); ctx.fillText(jd, x + 28, y + 64 + 46);
          if (!dl.length) { ctx.fillStyle = ABU; ctx.font = k.F(400, 22); if (!total) ctx.fillText("Tidak ada.", x + 28, y + 64 + 100); }
          dl.forEach((p, i) => { const yy = y + 64 + 80 + i * 64; ctx.fillStyle = TINTA; ctx.font = k.F(600, 22); ctx.fillText(k.potong(ctx, `${awal + i + 1}. ${p.nama}`, w - 150), x + 28, yy + 22); ctx.fillStyle = ABU; ctx.font = k.F(400, 17); ctx.fillText(k.potong(ctx, p.grup, w - 150), x + 28, yy + 46); ctx.textAlign = "right"; ctx.fillStyle = p.warna; ctx.font = k.F(700, 32); ctx.fillText(String(p.skor), x + w - 28, yy + 36); ctx.textAlign = "left"; });
        });
      } });
    }
  }
  b.push(kaki(k, `Dibuat ${tgl(l.dibuat)}`));
  return b;
}

// ---------------------------------------------------------------- halaman A4
// Lebar 1080 px, tinggi 1528 px (rasio 210 x 297 mm). Blok tidak dipotong: blok yang tidak muat pindah ke halaman berikutnya.
const PH = Math.round((W * 297) / 210), TOP_LANJUT = 104, BAWAH = 64;

function susunHalaman(bagian) {
  const hal = [[]]; let y = 0;
  for (const x of bagian) {
    if (x.opsional && y + x.tinggi > PH - BAWAH) continue; // kaki besar tidak berdiri sendiri di halaman baru
    if (y + x.tinggi > PH - BAWAH && hal[hal.length - 1].length) { hal.push([]); y = TOP_LANJUT; }
    hal[hal.length - 1].push({ x, y }); y += x.tinggi;
  }
  return hal;
}

// Mengembalikan daftar kanvas, satu per halaman A4.
function render(bagian, piksel, k, judul) {
  const hal = susunHalaman(bagian), n = hal.length;
  return hal.map((isi, no) => {
    const kanvas = document.createElement("canvas"); kanvas.width = W * piksel; kanvas.height = PH * piksel;
    const ctx = kanvas.getContext("2d"); ctx.scale(piksel, piksel);
    ctx.fillStyle = KREM; ctx.fillRect(0, 0, W, PH);
    isi.forEach(({ x, y }) => x.gambar(ctx, y));
    if (no > 0) {
      ctx.fillStyle = HIJAU; ctx.fillRect(0, 0, W, 84);
      const e = ctx.createLinearGradient(0, 0, W, 0); e.addColorStop(0, KUNING); e.addColorStop(1, JINGGA); ctx.fillStyle = e; ctx.fillRect(0, 84, W, 6);
      if (k.logoPO) { ctx.fillStyle = KREM; ctx.beginPath(); ctx.arc(M + 30, 42, 30, 0, Math.PI * 2); ctx.fill(); ctx.drawImage(k.logoPO, M + 30 - 25, 42 - 25, 50, 50); }
      ctx.textAlign = "left"; ctx.fillStyle = "#FFFFFF"; ctx.font = k.F(700, 28); ctx.fillText(`${judul} (lanjutan)`, M + 78, 52);
    }
    // nomor halaman
    ctx.fillStyle = TRACK; ctx.fillRect(M, PH - 52, CW, 1.5);
    ctx.fillStyle = ABU; ctx.font = k.F(500, 19); ctx.textAlign = "left"; ctx.fillText("KBA-UMM · Rumah Dakwah Malang & Pesantren Online", M, PH - 20);
    ctx.textAlign = "right"; ctx.fillText(`Halaman ${no + 1} dari ${n}`, W - M, PH - 20); ctx.textAlign = "left";
    return kanvas;
  });
}

// Mengembalikan array kanvas A4 (satu per halaman).
export async function gambarRapor(r, opsi = {}) {
  const k = await siapkan(`${r.peserta.nama} ${r.catatan?.isi || ""} ${r.predikat.ar || ""}`);
  return render(bagianRapor(k, r), opsi.piksel === 2 ? 2 : 1, k, `Rapor ${r.peserta.nama}`);
}
// Beberapa rapor sekaligus (satu grup): tiap peserta mulai di halaman baru.
export async function gambarRaporBanyak(daftar, opsi = {}) {
  const k = await siapkan(daftar.map((r) => `${r.peserta.nama} ${r.catatan?.isi || ""} ${r.predikat.ar || ""}`).join(" "));
  return daftar.flatMap((r) => render(bagianRapor(k, r), opsi.piksel === 2 ? 2 : 1, k, `Rapor ${r.peserta.nama}`));
}
export async function gambarLaporan(l, opsi = {}) {
  const k = await siapkan(l.perGrup.map((g) => g.nama).join(" ") + l.peserta.map((p) => p.nama).join(" "));
  return render(bagianLaporan(k, l, opsi.tampilNama !== false), opsi.piksel === 2 ? 2 : 1, k, "Laporan Program KBA-UMM");
}
