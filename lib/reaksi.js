// Umpan balik saat tombol ditekan: getar (HP yang mendukung), bunyi lembut, dan pengaturan hidup/mati.
// Tanpa pustaka tambahan; bunyi dibuat dengan Web Audio sehingga tidak ada berkas suara.
const KUNCI = "kbumm-reaksi";
let audio = null;

export function bacaPengaturan() {
  try {
    const v = JSON.parse(localStorage.getItem(KUNCI) || "{}");
    return { suara: v.suara !== false, getar: v.getar !== false };
  } catch { return { suara: true, getar: true }; }
}
export function simpanPengaturan(p) { try { localStorage.setItem(KUNCI, JSON.stringify(p)); } catch { /* penyimpanan tidak tersedia */ } }

function konteks() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audio) audio = new AC();
  if (audio.state === "suspended") audio.resume();
  return audio;
}

function nada(c, frek, mulai, durasi, volume, jenis = "sine") {
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + mulai;
  o.type = jenis; o.frequency.setValueAtTime(frek, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(volume, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + durasi);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + durasi + 0.02);
}

const GETAR = { klik: 14, sukses: [20, 50, 20], galat: [70, 45, 70] };

export function reaksi(jenis = "klik") {
  if (typeof window === "undefined") return;
  const p = bacaPengaturan();
  if (p.getar && typeof navigator.vibrate === "function") { try { navigator.vibrate(GETAR[jenis] || GETAR.klik); } catch { /* diabaikan */ } }
  if (!p.suara) return;
  try {
    const c = konteks(); if (!c) return;
    if (jenis === "klik") nada(c, 720, 0, 0.05, 0.06, "triangle");
    else if (jenis === "sukses") { nada(c, 660, 0, 0.11, 0.07); nada(c, 880, 0.1, 0.16, 0.07); }
    else nada(c, 190, 0, 0.2, 0.06, "sawtooth");
  } catch { /* bunyi tidak tersedia */ }
}

// Kelas hasil: { galat } atau { ok: ... } atau { ok: false }
export function jenisHasil(s) {
  if (!s) return null;
  if (s.galat || s.ok === false) return "galat";
  if (s.ok) return "sukses";
  return null;
}
