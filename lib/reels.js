// Reels 9:16 ciri khas KBA-UMM: latar hijau-emas bergerak, judul bebas, bingkai video / teks, logo di sudut bawah.
// Semua digambar di kanvas peramban lalu direkam (MediaRecorder); tidak ada beban server.
import { muatKufi, keluargaArab } from "@/lib/fontKufi";

export const W = 1080, H = 1920;
const HIJAU = "#1E7B34", TUA = "#14582A", KUNING = "#F5B800";
const adaArab = (t) => /[؀-ۿ]/.test(t || "");
const muat = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const overshoot = (x) => { x = Math.min(1, Math.max(0, x)); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

function kotak(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function bintang(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let k = 0; k < 2; k++) for (let i = 0; i < 4; i++) {
    const a = (Math.PI / 2) * i + (k ? Math.PI / 4 : 0) + Math.PI / 4, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.stroke();
}
function bungkus(ctx, teks, lebar) {
  const hasil = [];
  String(teks || "").split("\n").forEach((par) => {
    const kata = par.split(/\s+/).filter(Boolean); let baris = "";
    if (!kata.length) { hasil.push(""); return; }
    kata.forEach((k) => { const coba = baris ? `${baris} ${k}` : k; if (ctx.measureText(coba).width > lebar && baris) { hasil.push(baris); baris = k; } else baris = coba; });
    hasil.push(baris);
  });
  return hasil;
}

function mic(ctx, cx, cy, warna) {
  ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = warna; ctx.fillStyle = warna; ctx.lineWidth = 4; ctx.lineCap = "round";
  kotak(ctx, -8, -20, 16, 28, 8); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -2, 15, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 13); ctx.lineTo(0, 22); ctx.moveTo(-9, 22); ctx.lineTo(9, 22); ctx.stroke();
  ctx.restore();
}

// Di bawah kotak rekaman: keterangan potongan (pertemuan ke-?) lalu kelas.
function keteranganBawah(ctx, s, F, y, t) {
  const p = ease((t - 1.0) / 0.5); ctx.globalAlpha = p; ctx.textAlign = "center";
  if (s.label) { ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.font = F(600, 28); ctx.fillText(s.label, W / 2, y + 48); }
  if (s.kelas && s.kelas.trim()) {
    const k = s.kelas.trim().slice(0, 60); ctx.font = F(700, 32);
    const w = Math.min(W - 120, ctx.measureText(k).width + 90);
    ctx.fillStyle = "rgba(255,255,255,0.12)"; kotak(ctx, W / 2 - w / 2, y + 76, w, 64, 32); ctx.fill();
    ctx.strokeStyle = KUNING; ctx.lineWidth = 3; kotak(ctx, W / 2 - w / 2, y + 76, w, 64, 32); ctx.stroke();
    ctx.fillStyle = "#FFFFFF"; ctx.fillText(k, W / 2, y + 119);
  }
  ctx.globalAlpha = 1;
}

export async function siapkanReels() {
  const css = getComputedStyle(document.body);
  const lat = css.getPropertyValue("--font-poppins").trim() || "Poppins, sans-serif";
  const arb = keluargaArab(css.getPropertyValue("--font-amiri").trim());
  try { await Promise.all([500, 600, 700, 800].map((b) => document.fonts.load(`${b} 30px ${lat}`)).concat([muatKufi([500, 600, 700])])); } catch { /* font bawaan */ }
  const [logoRD, logoPO] = await Promise.all([muat("/img/logo-rumah-dakwah-putih.png"), muat("/img/logo-pesantren-online.png")]);
  return { lat, arb, logoRD, logoPO };
}

// s: { judul, sub, isi, video (elemen <video> atau null), label }   t: detik sejak mulai   total: durasi detik
export function gambarReels(ctx, s, aset, t, total) {
  const { lat, arb, logoRD, logoPO } = aset;
  const F = (b, u) => `${b} ${Math.round(u)}px ${lat}`, FA = (b, u) => `${b} ${Math.round(u)}px ${arb}`;
  ctx.save(); ctx.setTransform(ctx.canvas.width / W, 0, 0, ctx.canvas.height / H, 0, 0);
  ctx.textBaseline = "alphabetic"; ctx.direction = "ltr";

  // latar bergerak pelan
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H); g.addColorStop(0, HIJAU); g.addColorStop(0.55, TUA); g.addColorStop(1, "#0E3F1F");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(245,184,0,0.08)"; ctx.lineWidth = 2;
  const geser = (t * 12) % 120;
  for (let y = -120 + geser; y < H + 120; y += 120) for (let x = (Math.floor(y / 120) % 2 ? 60 : 0); x < W + 120; x += 120) bintang(ctx, x, y, 38);
  const r1 = ctx.createRadialGradient(W * (0.2 + 0.1 * Math.sin(t * 0.6)), 420, 0, W * 0.2, 420, 700);
  r1.addColorStop(0, "rgba(245,184,0,0.20)"); r1.addColorStop(1, "rgba(245,184,0,0)"); ctx.fillStyle = r1; ctx.fillRect(0, 0, W, H);

  // kepala
  ctx.textAlign = "center";
  const a0 = ease(t / 0.6);
  ctx.globalAlpha = a0; ctx.fillStyle = "#FFFFFF"; ctx.font = F(800, 50); if ("letterSpacing" in ctx) ctx.letterSpacing = "10px";
  ctx.fillText("KBA-UMM", W / 2, 118 - (1 - a0) * 24); if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  ctx.fillStyle = KUNING; ctx.font = F(500, 26); ctx.fillText("Kuliah Bahasa Arab Untuk Meraih Mahabatullah", W / 2, 166);
  ctx.globalAlpha = 1;

  // judul: muncul kata demi kata dengan pantulan ringan, otomatis diperkecil bila panjang
  const judul = (s.judul || "").trim() || "Judul Reels";
  let fs = 92, baris;
  const ar = adaArab(judul);
  for (; fs >= 50; fs -= 4) { ctx.font = ar ? FA(700, fs) : F(800, fs); baris = bungkus(ctx, judul, W - 150); if (baris.length <= 3) break; }
  const lh = fs * 1.28, yJudul = 300;
  const kata = baris.map((b) => b.split(" ")); const jumlahKata = kata.flat().length; let n = 0;
  ctx.fillStyle = "#FFFFFF"; ctx.font = ar ? FA(700, fs) : F(800, fs); if (ar) ctx.direction = "rtl";
  baris.forEach((b, i) => {
    const lebar = ctx.measureText(b).width; let x = W / 2 - lebar / 2 * (ar ? -1 : 1);
    const ks = b.split(" ");
    if (ar) { ctx.textAlign = "center"; const p = ease((t - 0.3 - n * 0.12) / 0.5); ctx.globalAlpha = p; ctx.fillText(b, W / 2, yJudul + i * lh + (1 - p) * 30); n += ks.length; return; }
    ctx.textAlign = "left";
    ks.forEach((k, j) => {
      const p = (t - 0.3 - n * 0.12) / 0.45, sk = overshoot(p), al = ease(p * 1.6);
      const lk = ctx.measureText(k + (j < ks.length - 1 ? " " : "")).width, lw = ctx.measureText(k).width;
      ctx.save(); ctx.globalAlpha = al; ctx.translate(x + lw / 2, yJudul + i * lh - fs * 0.3); ctx.scale(sk, sk); ctx.fillText(k, -lw / 2, fs * 0.3); ctx.restore();
      x += lk; n++;
    });
  });
  ctx.globalAlpha = 1; ctx.direction = "ltr"; ctx.textAlign = "center";
  const yGaris = yJudul + (baris.length - 1) * lh + 48, pg = ease((t - 0.3 - jumlahKata * 0.12) / 0.5);
  ctx.fillStyle = KUNING; kotak(ctx, W / 2 - 120 * pg, yGaris, 240 * pg, 8, 4); ctx.fill();
  ctx.save(); ctx.translate(W / 2, yGaris + 4); ctx.rotate(Math.PI / 4); ctx.fillRect(-8, -8, 16, 16); ctx.restore();

  let yIsi = yGaris + 56;
  if (s.pemateri && s.pemateri.trim()) {
    const nama = s.pemateri.trim().slice(0, 60); ctx.font = F(600, 32);
    const tw = ctx.measureText(nama).width, w = Math.min(W - 120, tw + 140), p = ease((t - 0.9) / 0.5), x0 = W / 2 - w / 2;
    ctx.globalAlpha = p; ctx.fillStyle = KUNING; kotak(ctx, x0, yIsi, w, 68, 34); ctx.fill();
    mic(ctx, x0 + 46, yIsi + 34, TUA);
    ctx.fillStyle = TUA; ctx.textAlign = "left"; ctx.fillText(nama, x0 + 80, yIsi + 45); ctx.textAlign = "center"; ctx.globalAlpha = 1; yIsi += 104;
  }

  // isi: bingkai video atau teks bergulir
  const yBawah = H - 220, tersedia = yBawah - yIsi - 20;
  if (s.video && s.video.videoWidth) {
    const v = s.video, rasio = v.videoWidth / v.videoHeight;
    const cadangan = 170; // ruang keterangan & kelas di bawah kotak rekaman
    let bw = W - 120, bh = bw / rasio; if (bh > tersedia - cadangan) { bh = tersedia - cadangan; bw = bh * rasio; }
    const bx = (W - bw) / 2, by = yIsi + (tersedia - bh - cadangan) / 2, p = overshoot((t - 0.6) / 0.7);
    ctx.save(); ctx.translate(W / 2, by + bh / 2); ctx.scale(p, p); ctx.translate(-W / 2, -(by + bh / 2));
    ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12; ctx.fillStyle = "#000"; kotak(ctx, bx - 8, by - 8, bw + 16, bh + 16, 30); ctx.fill(); ctx.shadowColor = "transparent";
    ctx.save(); kotak(ctx, bx, by, bw, bh, 24); ctx.clip(); try { ctx.drawImage(v, bx, by, bw, bh); } catch { /* bingkai belum siap */ } ctx.restore();
    ctx.strokeStyle = KUNING; ctx.lineWidth = 5; kotak(ctx, bx - 8, by - 8, bw + 16, bh + 16, 30); ctx.stroke();
    ctx.restore();
    keteranganBawah(ctx, s, F, by + bh + 8, t);
    ctx.fillStyle = "rgba(255,255,255,0.2)"; kotak(ctx, 90, yBawah - 14, W - 180, 8, 4); ctx.fill();
    ctx.fillStyle = KUNING; kotak(ctx, 90, yBawah - 14, Math.max(8, (W - 180) * Math.min(1, t / total)), 8, 4); ctx.fill();
  } else if (s.isi && s.isi.trim()) {
    // arah & font ditentukan per paragraf, supaya teks Arab dan Latin boleh bercampur
    const teks = s.isi.trim(); let f2 = 54, bs = [];
    const susun = (f) => {
      const hasil = [];
      teks.split("\n").forEach((par) => {
        const ar = adaArab(par); ctx.font = ar ? FA(500, f * 1.1) : F(600, f);
        const bagian = bungkus(ctx, par, W - 220); (bagian.length ? bagian : [""]).forEach((b) => hasil.push({ b, ar }));
      });
      return hasil;
    };
    for (; f2 >= 34; f2 -= 3) { bs = susun(f2); if (bs.length * f2 * 1.55 <= tersedia - 40) break; }
    bs = susun(f2);
    const lh2 = f2 * 1.55, hKartu = Math.min(tersedia, bs.length * lh2 + 100), yK = yIsi + (tersedia - hKartu) / 2, p = ease((t - 0.7) / 0.6);
    ctx.globalAlpha = p; ctx.fillStyle = "rgba(255,255,255,0.1)"; kotak(ctx, 70, yK, W - 140, hKartu, 36); ctx.fill();
    ctx.strokeStyle = "rgba(245,184,0,0.8)"; ctx.lineWidth = 3; kotak(ctx, 70, yK, W - 140, hKartu, 36); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = "#FFFFFF";
    bs.forEach((l, i) => {
      const pi = ease((t - 1.1 - i * 0.35) / 0.5);
      ctx.font = l.ar ? FA(500, f2 * 1.1) : F(600, f2); ctx.direction = l.ar ? "rtl" : "ltr"; ctx.globalAlpha = pi;
      ctx.fillText(l.b, W / 2, yK + 70 + i * lh2 + (1 - pi) * 24);
    });
    ctx.globalAlpha = 1; ctx.direction = "ltr";
    keteranganBawah(ctx, s, F, yK + hKartu + 4, t);
  }

  // kaki: logo di sudut bawah kiri & kanan
  const tk = 170; ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0, H - tk, W, tk); ctx.fillStyle = KUNING; ctx.fillRect(0, H - tk, W, 4);
  const yt = H - tk / 2 + 2;
  if (logoRD) { const h = 56; ctx.drawImage(logoRD, 40, yt - h / 2, h * (logoRD.width / logoRD.height), h); }
  if (logoPO) { const d = 92, cx = W - 40 - d / 2; ctx.save(); ctx.fillStyle = "#FFF"; ctx.beginPath(); ctx.arc(cx, yt, d / 2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); ctx.drawImage(logoPO, cx - d / 2 + 5, yt - d / 2 + 5, d - 10, d - 10); }
  ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.font = F(600, 24); ctx.fillText("Rumah Dakwah Malang  ·  Pesantren Online", W / 2, yt + 8);
  ctx.restore();
}

// Pilih format rekaman terbaik yang didukung peramban (MP4 bila bisa, agar mudah diunggah ke Instagram/WhatsApp).
export function pilihFormatRekam() {
  const daftar = [["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "mp4"], ["video/mp4", "mp4"], ["video/webm;codecs=vp9,opus", "webm"], ["video/webm;codecs=vp8,opus", "webm"], ["video/webm", "webm"]];
  if (typeof MediaRecorder === "undefined") return null;
  const f = daftar.find(([m]) => MediaRecorder.isTypeSupported(m));
  return f ? { mime: f[0], ext: f[1] } : null;
}
