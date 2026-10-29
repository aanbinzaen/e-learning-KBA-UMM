# Notifikasi di HP (Web Push)

## Pasang
1. Supabase → SQL Editor → jalankan `supabase/11_notifikasi.sql` (sekali; setelah 10).
2. Unggah isi paket ini ke GitHub (Add file → Upload files → Commit changes). Vercel akan memasang paket baru `web-push` otomatis. Tunggu deploy Ready.
3. Tidak ada kunci/variabel yang perlu diisi: kunci VAPID dibuat otomatis oleh server saat pertama dipakai.

## Cara pengguna mengaktifkan
Dashboard (atau Profil Saya) → kartu **Notifikasi di HP** → **Aktifkan notifikasi** → izinkan.
- Android/komputer (Chrome, Edge, Firefox): langsung bisa.
- iPhone/iPad (iOS 16.4+): situs harus ditambahkan ke Layar Utama dulu (Safari → Bagikan → Tambah ke Layar Utama), lalu dibuka dari ikonnya.
- Pengguna dapat memilih topik (kelas, kuis, pengumuman, jadwal, faidah), mengirim notifikasi uji, atau mematikannya.

## Kapan notifikasi terkirim
| Kejadian | Penerima |
|---|---|
| Pertemuan baru dibuat (kotak centang "Kirim notifikasi") | Peserta grup itu |
| Absensi dibuka | Peserta grup itu |
| Tombol "Kirim pengingat ke peserta" (halaman pertemuan) | Peserta grup itu |
| Kuis diterbitkan | Peserta grup itu |
| Nilai esai selesai dinilai | Peserta yang bersangkutan |
| Pengumuman baru / jadwal baru (kotak centang) | Semua pengguna |
| Faidah terbit (kotak centang) | Semua pengguna |
| Admin → Notifikasi → Kirim pesan khusus | Semua / satu grup |

Pengirim tidak menerima notifikasinya sendiri. Akun nonaktif tidak dikirimi.

## Keamanan
- Kunci pribadi notifikasi tersimpan di tabel yang tidak bisa dibaca dari peramban (hanya server).
- Alamat perangkat hanya diterima dari layanan push resmi (Google, Mozilla, Apple, Microsoft).
- Maksimal 10 perangkat per akun. Perangkat yang sudah tidak berlaku dihapus otomatis.
