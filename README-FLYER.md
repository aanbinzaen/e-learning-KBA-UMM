# Pengumuman & Flyer

Menu **Pengumuman** (pengajar) dan **Pengumuman & Flyer** (admin), alamat `/guru/pengumuman`.

- Templat: ajakan hadir, kelas dimulai, kuis terbit, rekaman terbit, dan pengumuman bebas. Semua isian bisa diubah, rincian bisa ditambah atau dihapus.
- Tiga warna (hijau klasik, hijau gelap & emas, krem elegan) dan tiga ukuran (4:5, story 9:16, 1:1).
- Hasil berupa gambar PNG plus teks siap tempel WhatsApp.
- Kirim: di ponsel memakai menu bagikan (gambar dan teks ikut). Di komputer gambar disalin ke papan klip, diunduh, dan grup WhatsApp dibuka.
- Admin memilih salah satu dari enam grup resmi. Pengajar langsung ke grupnya sendiri (tautan dari menu Kelas & Grup, atau dicocokkan lewat nama grup).
- Daftar grup resmi dan tautannya ada di `GRUP_WA` pada `lib/flyer.js`.
- Tidak ada SQL baru.

## Materi berupa gambar (PNG/JPG)
Jalankan sekali di Supabase SQL Editor: `supabase/14_materi_gambar.sql`
(jika error pada baris `alter type`, jalankan baris itu sendiri dulu, lalu sisanya).
Setelah itu di halaman pertemuan pengajar/admin muncul "+ Unggah gambar (PNG/JPG)".

## Klip kajian (potongan rekaman YouTube)
Jalankan sekali: `supabase/15_klip_kajian.sql` SEBELUM/bersamaan dengan upload kode.
Di form "Rekaman YouTube" isi "Klip mulai" dan "Klip selesai" (mis. 12:30 dan 15:45) untuk memutar potongan saja.

## Reels klip kajian
Menu "Reels" (pengajar) / "Reels Klip" (admin) -> /guru/reels. Unggah video kajian dari HP/komputer, isi judul dan menit.detik (mis. 10.22),
lalu "Buat Reels". Direkam di peramban (Chrome terbaru menghasilkan MP4). Tanpa SQL tambahan.
## Tandai selesai
Peserta yang tercatat HADIR otomatis selesai (materi & rekaman). Sakit/izin/alpa tetap memakai tombol. Klip kajian tidak memakai tombol dan tidak dihitung progres.

## Login, lupa sandi, beranda (SQL 16)
Jalankan sekali: `supabase/16_gabung_kelas_tautan_guru.sql` (fungsi gabung_kelas & atur_tautan_kelas).
- Login: tab Peserta/Pengajar/Admin mengisi awalan BISMILLAH- / PGJ- / ADMIN-; cukup ketik angka. Awalan lama KBUMM- tetap dikenali.
- Lupa sandi: pilih kelas -> WhatsApp ke Ustadz Satria (Abul Aswad, Kisai) atau Ustadz Syahrul (Khalil, Ibnu Hisyam, Sibawaih). Ubah nomor di lib/adminKelas.js.
- Peserta: Gabung Kelas (hadir otomatis 30 menit sebelum s.d. 3 jam sesudah jam pertemuan), absen mandiri, kuis, rekaman di beranda.
- Pengajar: link kelas & absensi di atas halaman Kelola Kelas. Admin: pintasan di Beranda Admin. Setelah login, admin/pengajar langsung ke berandanya.
