-- ============================================================
-- KB-UMM – Skema Tahap 2 (impor peserta, kelas, grup, kode peserta)
-- Jalankan SETELAH 01_skema_tahap1.sql
-- ============================================================

-- Penomoran kode (hanya bisa dipanggil dari server dengan service role)
create sequence kode_peserta_seq start 1;
create sequence kode_pengajar_seq start 1;

create or replace function kode_berikutnya(prefix text) returns text
language plpgsql security definer set search_path = public as $$
begin
  if prefix = 'KBUMM' then return 'KBUMM-' || lpad(nextval('kode_peserta_seq')::text, 3, '0');
  elsif prefix = 'PGJ' then return 'PGJ-' || lpad(nextval('kode_pengajar_seq')::text, 3, '0');
  else raise exception 'prefix tidak dikenal'; end if;
end $$;
revoke all on function kode_berikutnya(text) from public, anon, authenticated;
grant execute on function kode_berikutnya(text) to service_role;

-- Keanggotaan: satu peserta berada di satu grup
create table peserta_grup (
  profile_id uuid primary key references profiles(id) on delete cascade,
  grup_id uuid not null references grup(id) on delete restrict
);
create index peserta_grup_grup_idx on peserta_grup (grup_id);

-- Password awal: SEMENTARA, hanya admin yang bisa baca, dihapus otomatis saat peserta mengganti password
create table password_awal (
  profile_id uuid primary key references profiles(id) on delete cascade,
  password text not null,
  dibuat_pada timestamptz not null default now()
);

create table pengaturan (
  kunci text primary key,
  nilai text not null
);
insert into pengaturan (kunci, nilai) values ('pisah_ikhwan_akhwat', 'true');

-- Tautan Zoom/Meet/WhatsApp dipisah dari tabel grup agar tidak terbaca publik
create table grup_tautan (
  grup_id uuid primary key references grup(id) on delete cascade,
  link text not null
);
insert into grup_tautan (grup_id, link)
  select id, link_gabung from grup where link_gabung is not null and link_gabung <> '';
alter table grup drop column link_gabung;

-- Fungsi bantu RLS
create or replace function anggota_grup(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from peserta_grup where profile_id = auth.uid() and grup_id = gid);
$$;
create or replace function pengajar_grup(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from grup g join pengajar p on p.id = g.pengajar_id
                 where g.id = gid and p.profile_id = auth.uid());
$$;

-- Daftar teman satu grup: HANYA nama, tanpa email/WhatsApp
create or replace function teman_grup() returns table (nama_lengkap text)
language sql stable security definer set search_path = public as $$
  select p.nama_lengkap
  from peserta_grup saya
  join peserta_grup lain on lain.grup_id = saya.grup_id and lain.profile_id <> saya.profile_id
  join profiles p on p.id = lain.profile_id and p.aktif
  where saya.profile_id = auth.uid()
  order by p.nama_lengkap;
$$;

alter table peserta_grup enable row level security;
alter table password_awal enable row level security;
alter table pengaturan enable row level security;
alter table grup_tautan enable row level security;

create policy pg_sendiri on peserta_grup for select using (profile_id = auth.uid());
create policy pg_pengajar on peserta_grup for select using (pengajar_grup(grup_id));
create policy pg_admin on peserta_grup for all using (is_admin()) with check (is_admin());

create policy pwawal_admin on password_awal for all using (is_admin()) with check (is_admin());

create policy pengaturan_baca on pengaturan for select to authenticated using (true);
create policy pengaturan_admin on pengaturan for all using (is_admin()) with check (is_admin());

create policy tautan_baca on grup_tautan for select using (anggota_grup(grup_id) or pengajar_grup(grup_id));
create policy tautan_admin on grup_tautan for all using (is_admin()) with check (is_admin());
