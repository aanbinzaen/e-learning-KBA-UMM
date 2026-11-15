# Rapor peserta dan laporan

## Pasang
1. Supabase → SQL Editor → jalankan `supabase/13_rapor.sql` (sekali; setelah 12).
2. Unggah isi paket ke GitHub (termasuk `package.json` dan `next.config.mjs`), tunggu deploy Vercel Ready.
   Dua paket baru (`docx`, `jszip`) dipasang Vercel otomatis; tidak ada variabel lingkungan baru.

## Siapa melihat apa
- **Peserta:** menu **Rapor** (rapor miliknya sendiri).
- **Pengajar:** menu **Rapor** (semua peserta di grup yang diampu) dan **Laporan**.
- **Admin:** semua grup; menu **Laporan & Rapor**; dapat mengubah bobot skor.

## Isi rapor
Skor akhir, predikat, kehadiran (hadir/izin/sakit/alpa), nilai tiap kuis, progres belajar (materi, rekaman, kuis),
riwayat kehadiran per pertemuan, dan catatan pengajar. Dapat disaring per periode (tanggal).

## Cara menghitung
- Kehadiran = Hadir ÷ pertemuan yang sudah berlangsung. Tanpa catatan absensi = Alpa.
- Nilai kuis = rata-rata nilai terbaik tiap kuis yang diterbitkan. Kuis belum dikerjakan = 0. Esai yang belum dinilai belum dihitung.
- Progres = materi + rekaman + kuis yang sudah ditandai selesai ÷ seluruhnya (tidak mengikuti filter periode).
- Skor akhir = bobot kehadiran / kuis / progres (bawaan 40/40/20, ubah di halaman Laporan oleh admin).
  Komponen yang belum punya data tidak dihitung.
- Predikat: Mumtaz ≥ 90 · Jayyid Jiddan 80–89 · Jayyid 70–79 · Maqbul 60–69 · di bawah 60 Perlu Bimbingan.

## Unduhan
- **Gambar PNG/JPG** (rapor dan laporan; opsi HD 2×), **Word**, **Excel**, serta **PDF A4**. PDF dan gambar PNG/JPG dibuat per halaman A4: isi yang tidak muat mengalir ke halaman berikutnya (kepala lanjutan + nomor halaman). Gambar lebih dari satu halaman diunduh sebagai zip. Guru juga dapat mengunduh satu PDF berisi rapor semua peserta grup.
- Rapor satu grup sekaligus: Word (satu halaman per peserta) dan Excel (rekap, matriks kehadiran, matriks nilai kuis).
- Laporan umum: opsi menyembunyikan nama peserta (untuk laporan anonim).
