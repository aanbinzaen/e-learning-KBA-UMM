-- ============================================================
-- KB-UMM – Skema Tahap 3 (pertemuan, materi, rekaman, progres)
-- Jalankan SETELAH 02_skema_tahap2.sql. Cukup sekali.
-- ============================================================

create type jenis_materi as enum ('pdf', 'catatan');

create table pertemuan (
  id uuid primary key default gen_random_uuid(),
  grup_id uuid not null references grup(id) on delete cascade,
  judul text not null,
  waktu timestamptz not null,
  keterangan text,
  dibuat_oleh uuid default auth.uid() references profiles(id) on delete set null,
  dibuat_pada timestamptz not null default now()
);
create index pertemuan_grup_idx on pertemuan (grup_id, waktu desc);

create table materi (
  id uuid primary key default gen_random_uuid(),
  pertemuan_id uuid not null references pertemuan(id) on delete cascade,
  grup_id uuid not null references grup(id) on delete cascade,
  jenis jenis_materi not null,
  judul text not null,
  catatan text,
  file_path text,
  dibuat_pada timestamptz not null default now(),
  check ((jenis = 'catatan' and catatan is not null) or (jenis = 'pdf' and file_path is not null))
);
create index materi_pertemuan_idx on materi (pertemuan_id);

create table rekaman (
  id uuid primary key default gen_random_uuid(),
  pertemuan_id uuid not null references pertemuan(id) on delete cascade,
  grup_id uuid not null references grup(id) on delete cascade,
  judul text not null,
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  dibuat_pada timestamptz not null default now()
);
create index rekaman_pertemuan_idx on rekaman (pertemuan_id);

-- Penanda "Selesai" (jenis 'kuis' dipakai di tahap 5)
create table progres (
  profile_id uuid not null references profiles(id) on delete cascade,
  jenis text not null check (jenis in ('materi', 'rekaman', 'kuis')),
  item_id uuid not null,
  selesai_pada timestamptz not null default now(),
  primary key (profile_id, jenis, item_id)
);

-- Fungsi bantu
create or replace function bisa_lihat_grup(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_admin() or anggota_grup(gid) or pengajar_grup(gid);
$$;
create or replace function bisa_kelola_grup(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_admin() or pengajar_grup(gid);
$$;

alter table pertemuan enable row level security;
alter table materi enable row level security;
alter table rekaman enable row level security;
alter table progres enable row level security;

create policy pertemuan_baca on pertemuan for select using (bisa_lihat_grup(grup_id));
create policy pertemuan_kelola on pertemuan for all using (bisa_kelola_grup(grup_id)) with check (bisa_kelola_grup(grup_id));
create policy materi_baca on materi for select using (bisa_lihat_grup(grup_id));
create policy materi_kelola on materi for all using (bisa_kelola_grup(grup_id)) with check (bisa_kelola_grup(grup_id));
create policy rekaman_baca on rekaman for select using (bisa_lihat_grup(grup_id));
create policy rekaman_kelola on rekaman for all using (bisa_kelola_grup(grup_id)) with check (bisa_kelola_grup(grup_id));

create policy progres_sendiri on progres for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy progres_admin on progres for select using (is_admin());

-- Pengajar boleh membaca barisnya sendiri walau tidak tampil di halaman publik
create policy pengajar_sendiri on pengajar for select using (profile_id = auth.uid());

-- Penyimpanan PDF (privat). Struktur nama berkas: <grup_id>/<acak>.pdf
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('materi', 'materi', false, 20971520, array['application/pdf'])
on conflict (id) do nothing;

create policy materi_berkas_baca on storage.objects for select to authenticated
  using (bucket_id = 'materi' and bisa_lihat_grup(((storage.foldername(name))[1])::uuid));
create policy materi_berkas_tambah on storage.objects for insert to authenticated
  with check (bucket_id = 'materi' and bisa_kelola_grup(((storage.foldername(name))[1])::uuid));
create policy materi_berkas_hapus on storage.objects for delete to authenticated
  using (bucket_id = 'materi' and bisa_kelola_grup(((storage.foldername(name))[1])::uuid));
