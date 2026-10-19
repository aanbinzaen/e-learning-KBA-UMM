# KB-UMM E-Learning – Tahap 3: Pertemuan, Materi, dan Rekaman

Tambahan di tahap ini:
- **Pengajar** (menu *Kelola Kelas*, alamat `/guru`): tambah pertemuan, unggah PDF, tulis catatan, tambah rekaman YouTube, pilih grup di bagian atas bila mengampu lebih dari satu.
- **Peserta** (menu *Kelas*): daftar pertemuan, tombol Gabung Kelas, materi (catatan dan PDF), rekaman YouTube (thumbnail dulu, video baru dimuat saat diputar), tombol Tandai selesai, dan persen progres di Dashboard.
- **Admin** (menu *Konten*): pengumuman, jadwal terdekat, teks Sejarah/Visi/Misi, dan profil pendiri.
- Perbaikan kecil: tata letak hero di layar lebar, contoh kode login `BISMILLAH-001`.

## 1. Jalankan SQL tahap 3 (sekali saja)
Supabase → **SQL Editor → New query** → tempel isi `supabase/03_skema_tahap3.sql` → **Run**.
Ini membuat tabel pertemuan, materi, rekaman, progres, dan penyimpanan PDF yang privat.

## 2. Perbarui kode
Unggah semua isi folder ke GitHub (menimpa yang lama). Vercel akan deploy otomatis. Tidak ada variabel baru.

## 3. Hubungkan pengajar ke akunnya
1. Menu **Admin → Kelas & Grup → Pengajar → Buat akun** untuk tiap pengajar.
2. Kode dan password awal pengajar ada di **Kode & Password** (bagian Pengajar).
3. Pengajar masuk, ganti password, lalu membuka **Kelola Kelas**.
Admin juga bisa membuka **Kelola Kelas** untuk mencoba semua grup.

## 4. Alur pengajar menambah isi
1. **Kelola Kelas** → pilih grup → **Tambah pertemuan** (judul, tanggal, jam WIB).
2. Buka pertemuan itu:
   - **Unggah PDF**: judul + berkas (maks. 20 MB).
   - **Tulis catatan**: teks langsung (teks Arab didukung).
   - **Rekaman YouTube**: tempel tautan dari tombol *Bagikan* (youtu.be, watch, shorts, live).
3. Isi langsung terlihat oleh peserta satu grup.
Link Zoom/Meet/WhatsApp diatur admin di **Kelas & Grup**.

## Catatan keamanan
- PDF disimpan di penyimpanan **privat**. Peserta membukanya lewat tautan sementara (5 menit), dan hanya anggota grup itu yang berhak.
- Pengajar hanya bisa mengubah grup yang diampunya; aturan ini dijaga database (RLS), bukan hanya tampilan.
- Video memakai youtube-nocookie.com dan baru dimuat saat tombol putar ditekan agar hemat kuota.

## Batas gratis yang perlu diketahui
Supabase gratis menyediakan penyimpanan 1 GB. Untuk video, tetap pakai YouTube (tidak diunggah ke sini).
