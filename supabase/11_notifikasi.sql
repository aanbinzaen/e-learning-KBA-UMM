-- ============================================================
-- KB-UMM – Notifikasi push ke HP pengguna
-- Jalankan SETELAH 10. Cukup sekali.
-- Kedua tabel sengaja TANPA kebijakan RLS: hanya server (service role) yang boleh membaca/menulis.
-- ============================================================

-- Kunci VAPID (dibuat otomatis oleh server saat pertama kali dipakai)
create table push_kunci (
  id int primary key check (id = 1),
  publik text not null,
  privat text not null
);
alter table push_kunci enable row level security;

-- Perangkat yang mengaktifkan notifikasi (satu baris per perangkat/peramban)
create table push_langganan (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  topik text[] not null default '{kelas,kuis,pengumuman,jadwal,faidah}',
  dibuat_pada timestamptz not null default now()
);
create index push_langganan_profil_idx on push_langganan (profile_id);
alter table push_langganan enable row level security;
