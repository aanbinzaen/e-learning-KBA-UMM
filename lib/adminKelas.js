// Admin kelas yang dihubungi saat peserta lupa password.
export const ADMIN_KELAS = [
  { nama: "Ustadz Satria", wa: "62895367092826", tampil: "+62 895-3670-92826", kelas: ["Kelas Abul Aswad", "Kelas Imam Kisai"] },
  { nama: "Ustadz Syahrul", wa: "6285211391496", tampil: "+62 852-1139-1496", kelas: ["Kelas Imam Khalil", "Kelas Imam Ibnu Hisyam", "Kelas Imam Sibawaih"] },
];
export const DAFTAR_KELAS = ADMIN_KELAS.flatMap((a) => a.kelas.map((k) => ({ kelas: k, admin: a })));
export const linkWaAdmin = (admin, teks) => `https://wa.me/${admin.wa}?text=${encodeURIComponent(teks)}`;
