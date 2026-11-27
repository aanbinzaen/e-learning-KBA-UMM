// Mengubah MP4 "terpecah" (fragmented) hasil MediaRecorder Chrome menjadi MP4 biasa (progresif)
// dengan durasi lengkap di header. Tanpa ini, WhatsApp hanya membaca fragmen pertama (± 3 detik)
// walau galeri memutar seluruhnya. Tidak menyandi ulang: hanya menata ulang kotak MP4.

const u32 = (d, o) => ((d[o] << 24) | (d[o + 1] << 16) | (d[o + 2] << 8) | d[o + 3]) >>> 0;
const tipe = (d, o) => String.fromCharCode(d[o], d[o + 1], d[o + 2], d[o + 3]);
const i32 = (d, o) => u32(d, o) | 0;

function anak(d, mulai, akhir) {
  const hasil = [];
  for (let o = mulai; o + 8 <= akhir;) {
    let s = u32(d, o), h = 8;
    if (s === 1) { s = u32(d, o + 12); h = 16; } else if (s === 0) s = akhir - o;
    if (s < h || o + s > akhir) break;
    hasil.push({ t: tipe(d, o + 4), o, e: o + s, p: o + h });
    o += s;
  }
  return hasil;
}
const cari = (d, k, t) => anak(d, k.p, k.e).find((x) => x.t === t);

function gabung(bagian) {
  const n = bagian.reduce((a, b) => a + b.length, 0), h = new Uint8Array(n); let o = 0;
  bagian.forEach((b) => { h.set(b, o); o += b.length; }); return h;
}
const a32 = (...n) => { const h = new Uint8Array(n.length * 4); n.forEach((v, i) => { h[i * 4] = v >>> 24; h[i * 4 + 1] = (v >>> 16) & 255; h[i * 4 + 2] = (v >>> 8) & 255; h[i * 4 + 3] = v & 255; }); return h; };
const kotak = (t, ...bagian) => { const isi = gabung(bagian), h = new Uint8Array(8 + isi.length); h.set(a32(h.length), 0); for (let i = 0; i < 4; i++) h[4 + i] = t.charCodeAt(i); h.set(isi, 8); return h; };
const salin = (d, k) => d.slice(k.o, k.e);
const tulis32 = (h, o, v) => { h[o] = v >>> 24; h[o + 1] = (v >>> 16) & 255; h[o + 2] = (v >>> 8) & 255; h[o + 3] = v & 255; };

// ubah durasi pada mvhd / tkhd / mdhd (versi 0 maupun 1). letak: indeks bidang durasi pada payload
function setDurasi(d, k, jenis, durasi) {
  const c = salin(d, k), v = c[k.p - k.o]; let o = k.p - k.o;
  const geser = jenis === "tkhd" ? (v === 1 ? 28 : 20) : (v === 1 ? 24 : 16); // posisi bidang durasi dari awal payload
  const pos = o + geser;
  if (v === 1) { tulis32(c, pos, 0); tulis32(c, pos + 4, durasi); } else tulis32(c, pos, durasi);
  return c;
}
const skalaWaktu = (d, k) => { const v = d[k.p]; return u32(d, k.p + (v === 1 ? 20 : 12)); };

export function jadikanProgresif(d) {
  const atas = anak(d, 0, d.length);
  const moov = atas.find((x) => x.t === "moov");
  if (!moov || !atas.some((x) => x.t === "moof")) return null; // sudah progresif / bukan MP4 terpecah
  const ftyp = atas.find((x) => x.t === "ftyp");
  const mvhd = cari(d, moov, "mvhd"), skalaFilm = skalaWaktu(d, mvhd);
  const mvex = cari(d, moov, "mvex");
  const trex = {};
  if (mvex) anak(d, mvex.p, mvex.e).filter((x) => x.t === "trex").forEach((x) => { trex[u32(d, x.p + 4)] = { dur: u32(d, x.p + 12), ukuran: u32(d, x.p + 16), flag: u32(d, x.p + 20) }; });

  const jalur = anak(d, moov.p, moov.e).filter((x) => x.t === "trak").map((k) => {
    const tkhd = cari(d, k, "tkhd"), mdia = cari(d, k, "mdia"), mdhd = cari(d, mdia, "mdhd"), hdlr = cari(d, mdia, "hdlr");
    const id = u32(d, tkhd.p + (d[tkhd.p] === 1 ? 20 : 12));
    return { k, tkhd, mdia, mdhd, id, skala: skalaWaktu(d, mdhd), jenis: tipe(d, hdlr.p + 8), sampel: [], potong: [], awal: null };
  });
  const per = Object.fromEntries(jalur.map((j) => [j.id, j]));

  // baca semua fragmen
  atas.filter((x) => x.t === "moof").forEach((mf) => {
    anak(d, mf.p, mf.e).filter((x) => x.t === "traf").forEach((tf) => {
      const tfhd = cari(d, tf, "tfhd"); if (!tfhd) return;
      const fl = u32(d, tfhd.p) & 0xffffff, id = u32(d, tfhd.p + 4), j = per[id]; if (!j) return;
      let o = tfhd.p + 8, dasar = mf.o; const tx = trex[id] || { dur: 0, ukuran: 0, flag: 0 };
      let dDur = tx.dur, dUk = tx.ukuran, dFl = tx.flag;
      if (fl & 1) { dasar = u32(d, o + 4); o += 8; }
      if (fl & 2) o += 4;
      if (fl & 8) { dDur = u32(d, o); o += 4; }
      if (fl & 0x10) { dUk = u32(d, o); o += 4; }
      if (fl & 0x20) { dFl = u32(d, o); o += 4; }
      const tfdt = cari(d, tf, "tfdt");
      if (tfdt && j.awal === null) j.awal = d[tfdt.p] === 1 ? u32(d, tfdt.p + 8) : u32(d, tfdt.p + 4);
      let kursor = dasar;
      anak(d, tf.p, tf.e).filter((x) => x.t === "trun").forEach((tr) => {
        const f = u32(d, tr.p) & 0xffffff, n = u32(d, tr.p + 4); let p = tr.p + 8, pertama = null;
        if (f & 1) { kursor = dasar + i32(d, p); p += 4; }
        if (f & 4) { pertama = u32(d, p); p += 4; }
        const idx0 = j.sampel.length, mulai = kursor;
        for (let i = 0; i < n; i++) {
          let dur = dDur, uk = dUk, fg = dFl, cto = 0;
          if (f & 0x100) { dur = u32(d, p); p += 4; }
          if (f & 0x200) { uk = u32(d, p); p += 4; }
          if (f & 0x400) { fg = u32(d, p); p += 4; } else if (i === 0 && pertama !== null) fg = pertama;
          if (f & 0x800) { cto = d[tr.p] === 0 ? u32(d, p) : i32(d, p); p += 4; }
          j.sampel.push({ dur, uk, sinkron: !(fg & 0x10000), cto, off: kursor }); kursor += uk;
        }
        if (n > 0) j.potong.push({ dari: idx0, n, src: mulai, akhir: kursor }); // potongan kosong membuat tabel stsc tidak sah
      });
    });
  });
  if (jalur.some((j) => !j.sampel.length)) return null;

  // Penyelarasan gambar-suara: pada HP, jalur gambar bisa lebih lambat/cepat sedikit daripada jalur suara sehingga
  // makin lama makin bergeser (ucapan tak sesuai gerak mulut). Suara dijadikan acuan; durasi tiap gambar diskalakan
  // supaya gambar dan suara berakhir di titik yang sama. (Hanya bila selisihnya 0,4%–10%.)
  const jv = jalur.find((j) => j.jenis === "vide"), ja = jalur.find((j) => j.jenis === "soun");
  if (jv && ja) {
    const dv = jv.sampel.reduce((x, y) => x + y.dur, 0) / jv.skala, da = ja.sampel.reduce((x, y) => x + y.dur, 0) / ja.skala;
    const k = da / dv;
    if (dv > 1 && da > 1 && Math.abs(k - 1) > 0.004 && Math.abs(k - 1) < 0.1) {
      let lama = 0, baru = 0;
      jv.sampel.forEach((x) => { lama += x.dur; const target = Math.round(lama * k); x.dur = Math.max(1, target - baru); baru += x.dur; x.cto = Math.round(x.cto * k); });
    }
  }

  // susun data (urut sesuai posisi sumber agar tetap berselang-seling)
  const semuaPotong = jalur.flatMap((j) => j.potong.map((c) => ({ j, c }))).sort((a, b) => a.c.src - b.c.src);
  let ukData = 0; semuaPotong.forEach(({ c }) => { c.baru = ukData; ukData += c.akhir - c.src; });
  const data = new Uint8Array(ukData); semuaPotong.forEach(({ c }) => data.set(d.subarray(c.src, c.akhir), c.baru));

  const bangun = (dasarData) => {
    let durFilm = 0;
    const trak = jalur.map((j) => {
      const dur = j.sampel.reduce((a, s) => a + s.dur, 0), awal = j.awal || 0;
      durFilm = Math.max(durFilm, Math.round(((awal + dur) * skalaFilm) / j.skala));
      // tabel sampel
      const stts = []; j.sampel.forEach((s) => { const l = stts[stts.length - 1]; if (l && l[1] === s.dur) l[0]++; else stts.push([1, s.dur]); });
      const adaCto = j.sampel.some((s) => s.cto !== 0), cttsT = []; if (adaCto) j.sampel.forEach((s) => { const l = cttsT[cttsT.length - 1]; if (l && l[1] === s.cto) l[0]++; else cttsT.push([1, s.cto]); });
      const sinkron = []; j.sampel.forEach((s, i) => s.sinkron && sinkron.push(i + 1));
      const stsc = []; j.potong.forEach((c, i) => { const l = stsc[stsc.length - 1]; if (!l || l[1] !== c.n) stsc.push([i + 1, c.n, 1]); });
      const stco = j.potong.map((c) => dasarData + c.baru);
      const stsd = salin(d, cari(d, cari(d, cari(d, j.mdia, "minf"), "stbl"), "stsd"));
      const stbl = kotak("stbl", stsd,
        kotak("stts", a32(0, stts.length), ...stts.map(([n, v]) => a32(n, v))),
        ...(adaCto ? [kotak("ctts", a32(0, cttsT.length), ...cttsT.map(([n, v]) => a32(n, v >>> 0)))] : []),
        ...(j.jenis === "vide" && sinkron.length !== j.sampel.length ? [kotak("stss", a32(0, sinkron.length), ...sinkron.map((n) => a32(n)))] : []),
        kotak("stsc", a32(0, stsc.length), ...stsc.map((e) => a32(...e))),
        kotak("stsz", a32(0, 0, j.sampel.length), ...j.sampel.map((s) => a32(s.uk))),
        kotak("stco", a32(0, stco.length), ...stco.map((n) => a32(n))));
      const minf = cari(d, j.mdia, "minf");
      const minfBaru = kotak("minf", ...anak(d, minf.p, minf.e).map((x) => (x.t === "stbl" ? stbl : salin(d, x))));
      const mdiaBaru = kotak("mdia", ...anak(d, j.mdia.p, j.mdia.e).map((x) => (x.t === "mdhd" ? setDurasi(d, x, "mdhd", dur) : x.t === "minf" ? minfBaru : salin(d, x))));
      const durTrak = Math.round(((awal + dur) * skalaFilm) / j.skala);
      const awalFilm = Math.round((awal * skalaFilm) / j.skala);
      const edts = awal > 0 ? [kotak("edts", kotak("elst", a32(0, 2, awalFilm, 0xffffffff, 0x10000), a32(durTrak - awalFilm, 0, 0x10000)))] : [];
      return kotak("trak", ...anak(d, j.k.p, j.k.e).flatMap((x) => (x.t === "tkhd" ? [setDurasi(d, x, "tkhd", durTrak), ...edts] : x.t === "mdia" ? [mdiaBaru] : x.t === "edts" ? [] : [salin(d, x)])));
    });
    const lain = anak(d, moov.p, moov.e).filter((x) => !["mvhd", "trak", "mvex"].includes(x.t)).map((x) => salin(d, x));
    return kotak("moov", setDurasi(d, mvhd, "mvhd", durFilm), ...trak, ...lain);
  };

  const kepala = ftyp ? salin(d, ftyp) : kotak("ftyp", new Uint8Array([105, 115, 111, 109, 0, 0, 2, 0, 105, 115, 111, 109, 109, 112, 52, 50]));
  const ukMoov = bangun(0).length, moovAkhir = bangun(kepala.length + ukMoov + 8);
  return gabung([kepala, moovAkhir, kotak("mdat", data)]);
}
