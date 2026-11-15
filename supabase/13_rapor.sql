-- ============================================================
-- KB-UMM – Rapor peserta dan laporan
-- Jalankan SETELAH 12_ruang_pengajar.sql. Cukup sekali.
-- ============================================================

-- Catatan pengajar pada rapor (satu catatan per peserta)
create table rapor_catatan (
  profile_id uuid primary key references profiles(id) on delete cascade,
  catatan text not null check (char_length(catatan) <= 1500),
  penulis text,
  diubah_oleh uuid references profiles(id) on delete set null,
  diubah_pada timestamptz not null default now()
);
alter table rapor_catatan enable row level security;

-- Pengajar grup peserta itu (dan admin) boleh mengelola peserta tersebut
create or replace function bisa_kelola_peserta(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from peserta_grup pg where pg.profile_id = pid and bisa_kelola_grup(pg.grup_id));
$$;

create policy catatan_sendiri on rapor_catatan for select using (profile_id = auth.uid());
create policy catatan_kelola on rapor_catatan for all
  using (bisa_kelola_peserta(profile_id)) with check (bisa_kelola_peserta(profile_id));

-- Pengajar boleh melihat progres belajar peserta di grupnya (untuk rapor)
create policy progres_pengajar on progres for select using (bisa_kelola_peserta(profile_id));

-- Bobot nilai rapor: kehadiran, kuis, progres (dapat diubah admin)
insert into pengaturan (kunci, nilai) values ('rapor_bobot', '40,40,20') on conflict (kunci) do nothing;
