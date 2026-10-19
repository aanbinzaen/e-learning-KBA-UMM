export const SITE = {
  nama: "KB-UMM",
  namaPanjang: "Kuliah Bahasa Arab Untuk Meraih Mahabatullah",
  penyelenggara: "Rumah Dakwah Malang & Pesantren Online",
  wa: process.env.NEXT_PUBLIC_KONTAK_WA || "",
  email: process.env.NEXT_PUBLIC_KONTAK_EMAIL || "",
  alamat: process.env.NEXT_PUBLIC_KONTAK_ALAMAT || "Malang, Jawa Timur",
};
export const linkWA = (teks = "") =>
  SITE.wa ? `https://wa.me/${SITE.wa}${teks ? `?text=${encodeURIComponent(teks)}` : ""}` : null;
