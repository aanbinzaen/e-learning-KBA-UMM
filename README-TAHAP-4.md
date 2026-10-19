# KB-UMM E-Learning – Tahap 4: Absensi dan Rekap

## Yang baru
- **Peserta** (menu *Absensi*): tombol **Hadir** pada pertemuan yang dibuka pengajar (nama, kelas, grup terisi otomatis), tidak bisa ganda, riwayat, dan persen kehadiran. Dashboard menampilkan pita kuning saat absensi dibuka.
- **Pengajar** (*Kelola Kelas*): di halaman pertemuan ada kotak **Absensi** (Buka/Tutup) dan **Isi kehadiran manual** (Hadir / Izin / Sakit / Alpa). Menu **Peserta & Rekap** menampilkan daftar peserta grup, rekap kehadiran, filter tanggal, dan unduhan CSV.
- **Admin** (*Rekap Absensi*): semua grup, filter jenis kelamin, kelas, grup, dan tanggal; unduh CSV ringkasan atau rinci per pertemuan. Saklar "Pisahkan Ikhwan dan Akhwat" di Ringkasan mengatur apakah tabel dipisah per jenis kelamin.

## Cara memasang
1. Supabase → **SQL Editor** → tempel isi `supabase/04_skema_tahap4.sql` → **Run** (sekali saja).
2. Unggah semua isi folder ke GitHub (timpa yang lama). Vercel deploy otomatis. Tidak ada variabel baru.

## Cara kerja perhitungan
- Yang dihitung hanya pertemuan yang waktunya **sudah lewat**.
- **Kehadiran (%) = jumlah Hadir ÷ pertemuan yang sudah berlangsung.** Izin dan sakit ditampilkan terpisah (tidak dihitung hadir).
- Peserta tanpa catatan pada pertemuan yang sudah lewat dihitung **Alpa**.
- Jika pengajar menandai peserta secara manual setelah peserta menekan Hadir, catatan terakhir dari pengajar yang berlaku.

## Alur sehari-hari
1. Pengajar membuat pertemuan (Tahap 3), lalu saat kelas dimulai menekan **Buka absensi**.
2. Peserta membuka **Absensi** dan menekan **Hadir**.
3. Pengajar menekan **Tutup absensi**. Yang berhalangan bisa diisi manual (izin/sakit).
4. Rekap ada di **Peserta & Rekap** (pengajar) dan **Rekap Absensi** (admin).

## Catatan keamanan
- Peserta tidak menulis tabel absensi langsung. Ia hanya bisa memanggil fungsi yang memeriksa: anggota grup itu, absensi dibuka, dan belum tercatat.
- Pengajar hanya bisa mengubah dan melihat absensi grup yang diampunya; daftar peserta untuk pengajar hanya memuat nama dan kode (tanpa email/WhatsApp).
- CSV mengamankan sel yang diawali = + - @ agar tidak dieksekusi sebagai rumus Excel.
