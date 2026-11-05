-- ============================================================
-- KB-UMM – Ruang Pengajar: perpustakaan bahan/kitab + diskusi
-- Jalankan SETELAH 11_notifikasi.sql. Cukup sekali.
-- Hanya akun pengajar dan admin (aktif) yang dapat membaca dan menulis.
-- ============================================================

create or replace function adalah_staf() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('pengajar', 'admin') and aktif);
$$;

-- Perpustakaan: berkas (disimpan di Storage) atau tautan
create table ruang_bahan (
  id uuid primary key default gen_random_uuid(),
  judul text not null check (char_length(judul) <= 200),
  deskripsi text check (char_length(deskripsi) <= 2000),
  kategori text not null default 'materi' check (kategori in ('kitab', 'materi', 'lainnya')),
  jenis text not null check (jenis in ('berkas', 'tautan')),
  file_path text,
  nama_berkas text,
  ukuran bigint,
  tautan text,
  dibuat_oleh uuid default auth.uid() references profiles(id) on delete set null,
  penulis text,
  dibuat_pada timestamptz not null default now(),
  check ((jenis = 'berkas' and file_path is not null) or (jenis = 'tautan' and tautan is not null))
);
create index ruang_bahan_idx on ruang_bahan (kategori, dibuat_pada desc);

-- Diskusi: topik berisi pesan-pesan
create table ruang_topik (
  id uuid primary key default gen_random_uuid(),
  judul text not null check (char_length(judul) <= 150),
  dibuat_oleh uuid default auth.uid() references profiles(id) on delete set null,
  penulis text,
  dibuat_pada timestamptz not null default now(),
  aktivitas timestamptz not null default now()
);
create index ruang_topik_idx on ruang_topik (aktivitas desc);

create table ruang_pesan (
  id uuid primary key default gen_random_uuid(),
  topik_id uuid not null references ruang_topik(id) on delete cascade,
  isi text not null check (char_length(isi) between 1 and 3000),
  dibuat_oleh uuid default auth.uid() references profiles(id) on delete set null,
  penulis text,
  dibuat_pada timestamptz not null default now()
);
create index ruang_pesan_idx on ruang_pesan (topik_id, dibuat_pada);

create or replace function ruang_pesan_baru() returns trigger
language plpgsql security definer set search_path = public as $$
begin update ruang_topik set aktivitas = now() where id = new.topik_id; return new; end $$;
create trigger ruang_pesan_aktivitas after insert on ruang_pesan for each row execute function ruang_pesan_baru();

alter table ruang_bahan enable row level security;
alter table ruang_topik enable row level security;
alter table ruang_pesan enable row level security;

-- Semua pengajar/admin boleh membaca dan menambah; mengubah/menghapus hanya milik sendiri (admin: semua)
create policy bahan_baca on ruang_bahan for select using (adalah_staf());
create policy bahan_tambah on ruang_bahan for insert with check (adalah_staf() and dibuat_oleh = auth.uid());
create policy bahan_ubah on ruang_bahan for update using (adalah_staf() and (dibuat_oleh = auth.uid() or is_admin())) with check (adalah_staf());
create policy bahan_hapus on ruang_bahan for delete using (adalah_staf() and (dibuat_oleh = auth.uid() or is_admin()));

create policy topik_baca on ruang_topik for select using (adalah_staf());
create policy topik_tambah on ruang_topik for insert with check (adalah_staf() and dibuat_oleh = auth.uid());
create policy topik_ubah on ruang_topik for update using (adalah_staf() and (dibuat_oleh = auth.uid() or is_admin())) with check (adalah_staf());
create policy topik_hapus on ruang_topik for delete using (adalah_staf() and (dibuat_oleh = auth.uid() or is_admin()));

create policy pesan_baca on ruang_pesan for select using (adalah_staf());
create policy pesan_tambah on ruang_pesan for insert with check (adalah_staf() and dibuat_oleh = auth.uid());
create policy pesan_hapus on ruang_pesan for delete using (adalah_staf() and (dibuat_oleh = auth.uid() or is_admin()));

-- Penyimpanan berkas (privat, maks. 30 MB). Nama berkas: <id_pengguna>/<acak>.<ekstensi>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ruang-pengajar', 'ruang-pengajar', false, 31457280, array[
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy ruang_berkas_baca on storage.objects for select to authenticated
  using (bucket_id = 'ruang-pengajar' and adalah_staf());
create policy ruang_berkas_tambah on storage.objects for insert to authenticated
  with check (bucket_id = 'ruang-pengajar' and adalah_staf() and (storage.foldername(name))[1] = auth.uid()::text);
create policy ruang_berkas_hapus on storage.objects for delete to authenticated
  using (bucket_id = 'ruang-pengajar' and adalah_staf() and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));
