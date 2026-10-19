# KB-UMM E-Learning – Tahap 1: Halaman Publik dan Login

Isi tahap ini: Beranda, Profil Rumah Dakwah, Pendiri, Pengajar, Masuk (kode peserta / email / WhatsApp),
Lupa password, Ganti password wajib saat login pertama, dan Dashboard sederhana.
Database dasar: profil pengguna, kelas, pengajar, grup, pendiri, pengumuman, jadwal, konten halaman (dengan RLS).

## A. Siapkan Supabase (gratis)
1. Buka https://supabase.com → Sign up → **New project**. Beri nama `kbumm`, buat database password (simpan), pilih region terdekat (Singapore).
2. Tunggu proyek selesai dibuat (±2 menit).
3. Menu **SQL Editor → New query** → tempel seluruh isi `supabase/01_skema_tahap1.sql` → **Run**. Hasilnya "Success".
4. Menu **Authentication → Sign In / Providers → Email**: matikan **Allow new users to sign up** (akun dibuat admin), lalu Save.
5. Menu **Project Settings → API**: salin `Project URL`, `anon public key`, dan `service_role key`.
   `service_role` itu RAHASIA, jangan dibagikan atau ditaruh di GitHub.

## B. Jalankan di komputer (opsional, untuk uji coba)
1. Pasang Node.js versi LTS dari https://nodejs.org
2. Di folder proyek: salin `.env.example` menjadi `.env.local`, isi nilainya.
3. Jalankan `npm install` lalu `npm run dev`, buka http://localhost:3000

## C. Buat akun admin pertama
1. Supabase → **Authentication → Users → Add user → Create new user**: isi email dan password, centang **Auto Confirm User**.
2. **SQL Editor**, jalankan (ganti email dan nama):
```sql
insert into profiles (id, kode, auth_email, nama_lengkap, role, email, wajib_ganti_password)
select id, 'ADMIN-001', email, 'Nama Admin', 'admin', lower(email), false
from auth.users where email = 'admin@contoh.com';
```
3. Di halaman Masuk, login dengan `ADMIN-001` (atau email tadi) dan password Anda.

## D. Deploy gratis ke Vercel
1. Unggah folder proyek ke GitHub (repository baru; `.env.local` tidak ikut karena ada di `.gitignore`).
2. https://vercel.com → **Add New → Project** → pilih repository → **Environment Variables**: isi semua isi `.env.example`
   (`NEXT_PUBLIC_SITE_URL` isi alamat Vercel Anda, mis. `https://kbumm.vercel.app`).
3. **Deploy**. Selesai: situs sudah online.

## E. Mengisi konten publik
Supabase → **Table Editor**:
- `konten_halaman`: tambah baris `kunci` = `profil_sejarah`, `profil_visi`, `profil_misi`, `tentang_program`, kolom `isi` berisi teks.
- `pendiri`: nama, peran, biografi, foto_url, urutan.
- `pengumuman` dan `jadwal`: isi sesuai kebutuhan (admin akan mendapat layar khusus di tahap berikutnya).
- `pengajar`: foto_url dan bio boleh diisi. Daftar pengajar dan grup sudah terisi dari CSV.

## Catatan
- Sebelum ada data di database, halaman Profil/Pendiri menampilkan teks pengganti. Teks sejarah, visi, misi, dan biografi sengaja tidak saya karang; mohon isi dari sumber resmi Rumah Dakwah.
- Pengaturan kontak (WhatsApp, email, alamat) lewat variabel `NEXT_PUBLIC_KONTAK_*`.
