-- ============================================================
-- KB-UMM – Skema Tahap 1 (halaman publik + login)
-- Jalankan di Supabase > SQL Editor > New query > Run
-- ============================================================

create type peran as enum ('peserta', 'pengajar', 'admin');
create type jk as enum ('Ikhwan', 'Akhwat');
create type tingkat_kelas as enum ('Pemula', 'Lanjutan', 'Kelas Khusus');

-- Profil pengguna (1 baris per akun di auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  kode text unique not null,                 -- mis. KBUMM-001 / ADMIN-001
  auth_email text unique not null,           -- email internal untuk Supabase Auth
  nama_lengkap text not null,
  jenis_kelamin jk,
  role peran not null default 'peserta',
  email text check (email = lower(email)),   -- email asli huruf kecil (opsional, diisi nanti)
  whatsapp text,                             -- format 62xxxxxxxxxx (opsional)
  wajib_ganti_password boolean not null default true,
  aktif boolean not null default true,
  dibuat_pada timestamptz not null default now()
);
create unique index profiles_email_uniq on profiles (lower(email)) where email is not null;
create unique index profiles_wa_uniq on profiles (whatsapp) where whatsapp is not null;

create table kelas (
  id uuid primary key default gen_random_uuid(),
  jenis_kelamin jk not null,
  tingkat tingkat_kelas not null,
  unique (jenis_kelamin, tingkat)
);

create table pengajar (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles(id) on delete set null,  -- satu pengajar = satu akun
  nama text unique not null,                 -- sesuai kolom "pengajar" di CSV
  bio text,
  foto_url text,
  tampil_publik boolean not null default true
);

create table grup (
  id uuid primary key default gen_random_uuid(),
  kelas_id uuid not null references kelas(id) on delete restrict,
  nama text not null,
  pengajar_id uuid references pengajar(id) on delete set null,
  link_gabung text,                          -- Zoom / Meet / grup WhatsApp
  unique (kelas_id, nama)
);

create table pendiri (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  peran text,
  biografi text,
  foto_url text,
  urutan int not null default 0
);

create table pengumuman (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  isi text not null,
  terbit boolean not null default true,
  dibuat_pada timestamptz not null default now()
);

create table jadwal (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  waktu_mulai timestamptz not null,
  keterangan text,
  tampil boolean not null default true
);

create table konten_halaman (
  kunci text primary key,                    -- 'profil_sejarah', 'profil_visi', 'profil_misi', 'tentang_program'
  isi text not null
);

-- Fungsi bantu (security definer agar tidak rekursif pada RLS)
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and aktif);
$$;

-- ---------------- RLS ----------------
alter table profiles enable row level security;
alter table kelas enable row level security;
alter table pengajar enable row level security;
alter table grup enable row level security;
alter table pendiri enable row level security;
alter table pengumuman enable row level security;
alter table jadwal enable row level security;
alter table konten_halaman enable row level security;

-- profiles: HANYA baris sendiri; admin semua. Tidak ada akses publik.
create policy profil_sendiri on profiles for select using (id = auth.uid());
create policy profil_admin   on profiles for all    using (is_admin()) with check (is_admin());

-- Data publik (tidak memuat data pribadi peserta)
create policy kelas_baca  on kelas  for select using (true);
create policy grup_baca   on grup   for select using (true);
create policy pengajar_baca on pengajar for select using (tampil_publik);
create policy pendiri_baca on pendiri for select using (true);
create policy pengumuman_baca on pengumuman for select using (terbit);
create policy jadwal_baca on jadwal for select using (tampil);
create policy konten_baca on konten_halaman for select using (true);

-- Admin boleh mengelola semuanya
create policy kelas_admin  on kelas  for all using (is_admin()) with check (is_admin());
create policy grup_admin   on grup   for all using (is_admin()) with check (is_admin());
create policy pengajar_admin on pengajar for all using (is_admin()) with check (is_admin());
create policy pendiri_admin on pendiri for all using (is_admin()) with check (is_admin());
create policy pengumuman_admin on pengumuman for all using (is_admin()) with check (is_admin());
create policy jadwal_admin on jadwal for all using (is_admin()) with check (is_admin());
create policy konten_admin on konten_halaman for all using (is_admin()) with check (is_admin());

-- ---------------- Data awal: kelas, pengajar, grup (sesuai CSV) ----------------
insert into kelas (jenis_kelamin, tingkat) values
  ('Ikhwan','Pemula'), ('Ikhwan','Lanjutan'), ('Ikhwan','Kelas Khusus'),
  ('Akhwat','Pemula'), ('Akhwat','Lanjutan');

insert into pengajar (nama) values
  ('Ustadz Bintang, S.Pd'), ('Ustadz Daffa, S.Pd'), ('Ustadz Aan, S.Pd'),
  ('Ustadz Haris Al Hafidz'), ('Ustadzah Irbah, B.Sh.');

insert into grup (kelas_id, nama, pengajar_id)
select k.id, v.grup, p.id
from (values
  ('Ikhwan','Lanjutan','Imam Al Khalil Bin Ahmad Al Farahidi','Ustadz Bintang, S.Pd'),
  ('Ikhwan','Kelas Khusus','Imam Sibawaih','Ustadz Daffa, S.Pd'),
  ('Ikhwan','Lanjutan','Imam Ibnu Hisyam','Ustadz Daffa, S.Pd'),
  ('Ikhwan','Pemula','Imam Abul Aswad Ad-Du''aliy','Ustadz Aan, S.Pd'),
  ('Ikhwan','Pemula','Imam Al Kisa''i','Ustadz Haris Al Hafidz'),
  ('Akhwat','Lanjutan','Kelas Lanjutan','Ustadzah Irbah, B.Sh.'),
  ('Akhwat','Pemula','Kelas Pemula','Ustadzah Irbah, B.Sh.')
) as v(jk, tingkat, grup, pengajar)
join kelas k on k.jenis_kelamin = v.jk::jk and k.tingkat = v.tingkat::tingkat_kelas
join pengajar p on p.nama = v.pengajar;
