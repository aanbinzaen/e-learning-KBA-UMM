// Pemformat teks untuk kolom isi diagram: blok tulisan lalu Ctrl+B (tebal), Ctrl+I (miring), Ctrl+Spasi (hapus gaya).
// Gaya disimpan sebagai penanda di dalam teks: **tebal**, *miring*, ***tebal miring***, ~reguler~.

const BINTANG_BARU = {
  tebal: { 0: 2, 1: 3, 2: 0, 3: 1 },
  miring: { 0: 1, 1: 0, 2: 3, 3: 2 },
};

// Mengubah satu rentang (tanpa baris baru dan tanpa tanda |). Mengembalikan null bila tidak ada isi.
function ubahSatu(teks, a, b, jenis) {
  while (a < b && /\s/.test(teks[a])) a++;
  while (b > a && /\s/.test(teks[b - 1])) b--;
  if (a >= b) return null;

  // penanda yang sudah ada: di dalam blok dan tepat di luar blok
  let n = 0;
  while (n < 3 && (b - a) - 2 * (n + 1) >= 1 && teks[a + n] === "*" && teks[b - 1 - n] === "*") n++;
  let m = 0;
  while (n + m < 3 && teks[a - 1 - m] === "*" && teks[b + m] === "*") m++;
  const total = n + m;
  const awal = a - m, akhir = b + m, inti = teks.slice(a + n, b - n);

  if (jenis === "reguler" && total === 0) {
    // tanpa bintang: pakai ~ sebagai penanda "paksa reguler" (berguna bila gaya umum diatur tebal/miring)
    if (inti.length >= 3 && inti[0] === "~" && inti[inti.length - 1] === "~") return { awal: a, akhir: b, ganti: inti.slice(1, -1) };
    if (teks[a - 1] === "~" && teks[b] === "~") return { awal: a - 1, akhir: b + 1, ganti: inti };
    return { awal: a, akhir: b, ganti: `~${inti}~` };
  }
  const baru = jenis === "reguler" ? 0 : BINTANG_BARU[jenis][total];
  return { awal, akhir, ganti: `${"*".repeat(baru)}${inti}${"*".repeat(baru)}` };
}

// teks, mulai, akhir: posisi blok pada textarea. Tanpa blok, kata di bawah kursor yang dipakai.
export function terapkanFormat(teks, mulai, akhir, jenis) {
  if (mulai === akhir) {
    let a = mulai, b = akhir;
    while (a > 0 && !/[\s|]/.test(teks[a - 1])) a--;
    while (b < teks.length && !/[\s|]/.test(teks[b])) b++;
    mulai = a; akhir = b;
  }
  if (mulai >= akhir) return null;

  // pecah blok per baris dan per tanda | agar penanda tidak melintasi batas
  const rentang = []; let awal = mulai;
  for (let i = mulai; i <= akhir; i++) {
    if (i === akhir || teks[i] === "\n" || teks[i] === "|") { if (i > awal) rentang.push([awal, i]); awal = i + 1; }
  }
  const perubahan = rentang.map(([a, b]) => ubahSatu(teks, a, b, jenis)).filter(Boolean);
  if (!perubahan.length) return null;

  let hasil = teks, selisih = 0;
  for (let k = perubahan.length - 1; k >= 0; k--) {
    const c = perubahan[k];
    hasil = hasil.slice(0, c.awal) + c.ganti + hasil.slice(c.akhir);
    selisih += c.ganti.length - (c.akhir - c.awal);
  }
  const mulaiBaru = perubahan[0].awal, akhirBaru = perubahan[perubahan.length - 1].akhir + selisih;
  return { teks: hasil, mulai: mulaiBaru, akhir: akhirBaru };
}

export function jalankanFormat(ta, nilai, setNilai, jenis) {
  if (!ta) return;
  const r = terapkanFormat(nilai, ta.selectionStart, ta.selectionEnd, jenis);
  if (!r) return;
  setNilai(r.teks);
  requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(r.mulai, r.akhir); });
}

// Dipasang pada onKeyDown textarea
export function tombolPintas(e, ta, nilai, setNilai) {
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
  const k = e.key.toLowerCase();
  const jenis = k === "b" ? "tebal" : k === "i" ? "miring" : k === " " ? "reguler" : null;
  if (!jenis) return;
  e.preventDefault();
  jalankanFormat(ta, nilai, setNilai, jenis);
}
