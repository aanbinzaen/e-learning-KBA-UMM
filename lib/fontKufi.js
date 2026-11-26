// Font Noto Kufi Arabic untuk semua tulisan Arab pada gambar (flyer, rapor, laporan).
// Dimuat langsung dari /fonts supaya kanvas dapat memakainya pada beberapa ketebalan.
const BERKAS = { 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold" };
export const KUFI = '"Noto Kufi KBA"';
const dimuat = new Map();

export function muatKufi(bobot = [400, 500, 600, 700]) {
  return Promise.all(bobot.map((b) => {
    if (!dimuat.has(b)) {
      dimuat.set(b, (async () => {
        try {
          const face = new FontFace("Noto Kufi KBA", `url(/fonts/NotoKufiArabic-${BERKAS[b]}.ttf)`, { weight: String(b), style: "normal" });
          await face.load(); document.fonts.add(face);
        } catch { /* tanpa font ini, kanvas memakai font Arab cadangan */ }
      })());
    }
    return dimuat.get(b);
  }));
}

// Daftar font Arab: Noto Kufi lebih dulu, lalu Amiri bawaan situs sebagai cadangan.
export const keluargaArab = (varAmiri) => `${KUFI}, ${varAmiri || "Amiri"}, serif`;
