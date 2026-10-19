# KB-UMM E-Learning – Tahap 2: Impor Peserta dan Kelas

Tambahan di tahap ini:
- Area admin: Ringkasan, Peserta, Impor, Kelas & Grup, Kode & Password.
- Impor CSV/Excel dengan pratinjau, laporan baris gagal, dan pencegahan data ganda (nama + grup).
- Kode peserta otomatis (KBUMM-001, dst.) dan password awal acak. Peserta wajib menggantinya saat login pertama.
- Dashboard peserta: kelas, grup, pengajar, tombol Gabung Kelas, dan daftar teman satu grup (hanya nama).
- Profil Saya: peserta menambah email/WhatsApp, lalu bisa masuk dengan itu juga.

## 1. Perbarui database
Supabase → **SQL Editor → New query** → tempel isi `supabase/02_skema_tahap2.sql` → **Run**.
(Jalankan hanya sekali, setelah file tahap 1.)
Link kelas dipindahkan ke tabel `grup_tautan` agar tidak terbaca publik.

## 2. Perbarui kode
Ganti folder proyek dengan versi baru, lalu jalankan `npm install` (ada dua paket baru: papaparse dan read-excel-file).
Di Vercel, push ke GitHub; Vercel otomatis deploy ulang.
Tambahkan di Environment Variables (opsional): `AUTH_EMAIL_DOMAIN` (bawaan `peserta.kbumm.local`).

## 3. Impor peserta_KB-UMM.csv
1. Masuk sebagai admin → menu **Impor**.
2. Pilih `peserta_KB-UMM.csv` (boleh juga .xlsx dengan kolom yang sama).
3. Periksa pratinjau: harus tampil 74 baris "baru". Grup, kelas, dan pengajar sudah ada dari tahap 1, jadi tidak ada catatan "baru".
4. Klik **Impor 74 peserta** dan tunggu sampai laporan muncul.
5. Buka **Kode & Password**, pilih grup, lalu **Cetak** atau **Unduh CSV**, dan kirim ke pengajar grup tersebut.
   Password awal otomatis hilang dari daftar begitu peserta menggantinya.

Mengimpor berkas yang sama dua kali aman: baris yang sudah ada ditandai "duplikat" dan dilewati.

## 4. Akun pengajar
Menu **Kelas & Grup → Pengajar → Buat akun**. Satu pengajar = satu akun, walau mengampu banyak grup.
Kode (PGJ-001, dst.) dan password awalnya ada di bagian Pengajar pada menu Kode & Password.

## 5. Mengatur kelas dan grup
Menu **Kelas & Grup**: ubah nama grup, ganti pengajar, tempel link Zoom/Meet/grup WhatsApp, atau tambah grup.
Memindahkan peserta: menu **Peserta** → klik nama → ubah "Kelas dan grup" → Simpan.

## Jika pembuatan akun gagal
Pesan "email tidak valid" berarti Supabase menolak domain email internal. Isi `AUTH_EMAIL_DOMAIN` dengan domain yang Anda miliki (mis. `peserta.domainanda.id`). Tidak ada email yang dikirim.

## Catatan keamanan
- Password disimpan terenkripsi oleh Supabase Auth. Tabel `password_awal` hanya menyimpan password SEMENTARA agar admin bisa mencetaknya; hanya admin yang dapat membacanya, dan barisnya dihapus saat peserta mengganti password.
- Email/WhatsApp hanya terlihat oleh admin dan pemiliknya. Teman satu grup hanya melihat nama.
