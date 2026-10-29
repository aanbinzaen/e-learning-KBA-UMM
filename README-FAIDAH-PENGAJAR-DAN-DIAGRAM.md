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

## Keterangan pada diagram
- **Keterangan per kotak:** tambahkan tanda `|` lalu tulisan singkat. Contoh: `Isim | kata benda`. Tulisan setelah tanda `|` tampil kecil di bawah nama (maks. 140 karakter).
- **Keterangan diagram (catatan umum):** kolom khusus di bawah isi diagram; tampil sebagai kotak catatan di atas pita bawah (maks. sekitar 5 baris). Teks Arab otomatis rata kanan.

## Gaya tulisan dan rata teks pada diagram
Bagian "Gaya tulisan" di halaman Diagram:
- Gaya huruf (Otomatis / Reguler / Tebal / Miring / Tebal miring) untuk: nama butir, keterangan di dalam kotak, dan keterangan diagram.
- Rata tulisan di dalam kotak: tengah, kiri, kanan, atau rata kanan-kiri. Rata keterangan diagram diatur terpisah.
- Gaya per butir lewat penanda yang membungkus seluruh nama atau seluruh keterangan: `**tebal**`, `*miring*`, `***tebal miring***`, `~reguler~`.
  Contoh: `**Ilmu Nahwu** | *tentang akhir kata*`. Penanda per butir mengalahkan pilihan global.
- Gaya miring hanya berlaku untuk tulisan Latin; huruf Arab tetap tegak.
- Teks campuran Indonesia + Arab: arah dasar mengikuti huruf pertama, kata Arab memakai Amiri, huruf Latin memakai Poppins.

## Tebal dan miring dengan Ctrl+B / Ctrl+I
- Di kolom isi diagram dan kolom keterangan diagram: blok tulisan (satu kata atau kalimat), lalu tekan **Ctrl+B** (tebal) atau **Ctrl+I** (miring). **Ctrl+Spasi** menghapus gaya. Tombol **B**, **I**, dan **Reguler** di atas kolom melakukan hal yang sama (juga untuk HP).
- Tekan lagi pada blok yang sama untuk membatalkan. Tanpa blok, kata di bawah kursor yang diformat.
- Di dalam kolom, gaya tampak sebagai penanda: `**tebal**`, `*miring*`, `***tebal miring***`, `~reguler~`. Hasil sebenarnya terlihat di pratinjau gambar.
- Berlaku untuk sebagian kata di tengah kalimat, termasuk kalimat campuran Indonesia dan Arab. Miring hanya untuk huruf Latin.
- Pilihan di "Gaya tulisan" menjadi gaya dasar; blok Ctrl+B / Ctrl+I ditambahkan di atasnya.

## Ukuran tulisan pada diagram
- **Otomatis (terbesar yang muat):** tulisan diperbesar sampai gambar penuh. Mesin mencoba beberapa lebar kotak dan memilih yang membuat tulisan paling besar.
- **Kecil / Sedang / Besar / Sangat besar:** ukuran tetap, tidak diperbesar otomatis; hanya dikecilkan bila isinya tidak muat.
- Penggeser untuk nama butir, keterangan di kotak, keterangan diagram, dan judul (60% sampai 220%), serta jarak antar kotak (Rapat / Normal / Lega).
- Kolom Pratinjau menampilkan ukuran tulisan terkecil di gambar (px) beserta penilaian: nyaman, agak kecil, atau terlalu kecil untuk HP.
- Jarak antarbaris untuk tulisan Arab bertanda baca dilonggarkan agar harakat tidak saling menimpa; pita judul menyesuaikan tinggi judul.
