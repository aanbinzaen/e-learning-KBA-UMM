# Faidah oleh pengajar + flyer, dan Diagram hierarki otomatis

## Pasang
1. Supabase → SQL Editor → jalankan `supabase/10_faidah_pengajar.sql` (sekali; setelah 09_faidah.sql).
2. Unggah isi paket ini ke GitHub (Add file → Upload files → Commit changes), tunggu deploy Vercel Ready.

## Faidah (menu pengajar: Faidah)
- Pengajar menulis faidah (judul, kutipan Arab, isi, sumber), memilih terbitkan atau draf.
- Nama pengajar otomatis tercantum sebagai penyampai di situs dan di flyer.
- Tombol Lihat pratinjau dan Unduh gambar: 4:5, 9:16, 1:1, 5:4, 16:9.
- Pengajar hanya bisa melihat dan mengubah faidah MILIKNYA; admin bisa semua.

## Diagram hierarki (menu pengajar: Diagram)
Tulis butir berjenjang, satu per baris:
```
Kalam
  Isim
    Marfu'
  Fi'il
  Harf
```
Jenjang = spasi di depan, atau nomor 1 / 1.1 / 1.2.1. Tata letak otomatis memilih yang paling pas;
bisa juga atas-bawah, kiri-kanan, atau kanan-kiri (Arab). Ukuran: 4:5, 5:4, 9:16, 16:9, 1:1. Kualitas Standar atau HD 2x.
Batas: 200 butir, 8 jenjang.
