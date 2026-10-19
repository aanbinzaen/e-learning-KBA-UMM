# KB-UMM E-Learning – Tahap 5: Kuis dan Progres (tahap terakhir)

## Yang baru
- **Pengajar:** di halaman pertemuan ada kotak **Kuis**. Buat kuis, tambah soal pilihan ganda (2–5 pilihan, kunci jawaban, pembahasan), ubah/hapus soal, lalu **Terbitkan**. Hasil peserta terlihat di halaman kuis dan di **Peserta & Rekap** (tabel *Nilai kuis*, bisa diunduh CSV).
- **Peserta:** di halaman pertemuan ada bagian **Kuis**. Mengerjakan, nilai muncul otomatis, lengkap dengan benar/salah dan pembahasan. Kuis boleh diulang bila pengajar mengizinkan; **nilai terbaik** yang dipakai.
- **Progres belajar:** persen di Dashboard kini menghitung materi + rekaman + kuis. Kuis dihitung selesai setelah dikerjakan sekali.
- Teks Arab pada soal, pilihan, dan pembahasan tampil benar (arah teks otomatis).

## Cara memasang
1. Supabase → **SQL Editor** → tempel isi `supabase/06_skema_tahap5.sql` → **Run** (sekali saja).
2. Unggah semua isi folder ke GitHub (timpa yang lama); tunggu deploy **Ready**. Tidak ada variabel baru.

## Alur pengajar
1. **Kelola Kelas → buka pertemuan → Kuis → Buat kuis.**
2. **Tambah soal** satu per satu. Pilih huruf jawaban benar dan isi pembahasan.
3. Centang **Terbitkan** lalu **Simpan pengaturan**. Kuis baru terlihat peserta setelah diterbitkan.
4. Pantau di **Peserta & Rekap → Nilai kuis**.

## Keamanan
- Kunci jawaban tersimpan di tabel yang **tidak bisa dibaca peserta**. Peserta menerima soal tanpa kunci; benar/salah dan pembahasan baru dikirim setelah jawaban dikirim.
- Nilai dihitung di database, bukan di peramban, sehingga tidak bisa dimanipulasi dari sisi peserta.
- Pengajar hanya mengelola kuis grup yang diampunya.

## Catatan
- Urutan soal dan pilihan sama untuk semua peserta (belum diacak).
- Admin dapat melihat nilai semua grup lewat menu **Kelola Kelas** (pilih grup di bagian atas).

---

# Pembaruan Tahap 5: soal esai dan impor soal otomatis

Jalankan `supabase/07_kuis_esai_dan_impor.sql` di SQL Editor (sekali, setelah 06), lalu unggah kode terbaru.

## Tiga cara membuat soal (admin atau pengajar)
Buka **Kelola Kelas → pertemuan → Kuis → pilih kuis**.
1. **Tulis langsung:** *+ Tulis soal langsung*. Pilih jenis **Pilihan ganda** (dinilai otomatis) atau **Esai** (dinilai pengajar), isi bobot dan pembahasan.
2. **Tempel teks dari Word/catatan:** *+ Impor soal dari berkas atau teks*, tempel soal lalu klik **Baca soal dari teks**. Format:
```
1. Apa arti kata كِتَابٌ?
A. Pena
B. Meja
*C. Buku
D. Pintu
Pembahasan: Kitab berarti buku.

2. Manakah yang termasuk isim?
A. ذَهَبَ
B. مُحَمَّدٌ
Jawaban: B
Bobot: 2

3. [Esai] Jelaskan perbedaan isim dan fi'il!
Kunci: Isim menunjukkan nama, fi'il menunjukkan pekerjaan.
Bobot: 5
```
   Tanda `*` atau baris `Jawaban: B` menentukan jawaban benar. Soal tanpa pilihan otomatis menjadi esai.
3. **Unggah berkas:** `.csv`, `.xlsx` (kolom `tipe, pertanyaan, a, b, c, d, e, jawaban, bobot, pembahasan`) atau `.txt` (format teks di atas). Tombol **Unduh templat CSV** menyediakan contohnya.

Sistem menampilkan **pratinjau** dulu: soal yang benar bertanda ✓, yang bermasalah bertanda ✗ beserta alasannya. Hanya soal ✓ yang disimpan.

## Cara kerja nilai
- Pilihan ganda: benar = nilai penuh sesuai bobot, salah = 0.
- Esai: pengajar memberi skor 0 sampai bobot di halaman **Nilai esai** (tombol muncul di kuis yang punya esai), bisa disertai catatan.
- Nilai akhir = jumlah skor ÷ jumlah bobot × 100. Selama esai belum dinilai, peserta melihat **nilai sementara** (hanya dari pilihan ganda) dan nilai akhir kosong.
- Kuis yang memuat esai hanya boleh dikerjakan satu kali (agar penilaian tidak menumpuk).
- Rekap *Nilai kuis* hanya memakai nilai yang sudah final.

## Batasan yang perlu diketahui
- Berkas **Word (.docx) dan PDF belum dibaca langsung**. Salin isinya lalu tempel sebagai teks (cara 2) atau simpan sebagai .txt. Pembacaan otomatis dari PDF/Word yang bebas format memerlukan layanan AI berbayar dan dapat ditambahkan terpisah jika diperlukan.
- Esai dinilai manual; belum ada penilaian otomatis oleh AI.
