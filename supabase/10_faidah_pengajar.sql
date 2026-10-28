-- ============================================================
-- KB-UMM – Pengajar dapat menulis faidah sendiri (+ nama penyampai)
-- Jalankan SETELAH 09_faidah.sql. Cukup sekali.
-- ============================================================

alter table faidah add column dibuat_oleh uuid default auth.uid() references profiles(id) on delete set null;
alter table faidah add column penulis text;      -- nama penyampai yang tampil di situs dan pada flyer

create or replace function adalah_pengajar() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'pengajar' and aktif);
$$;

-- Pengajar: hanya boleh menambah, melihat (termasuk draf), mengubah, dan menghapus faidah MILIKNYA sendiri
create policy faidah_pengajar_baca on faidah for select using (dibuat_oleh = auth.uid());
create policy faidah_pengajar_tambah on faidah for insert to authenticated
  with check (adalah_pengajar() and dibuat_oleh = auth.uid());
create policy faidah_pengajar_ubah on faidah for update to authenticated
  using (adalah_pengajar() and dibuat_oleh = auth.uid()) with check (adalah_pengajar() and dibuat_oleh = auth.uid());
create policy faidah_pengajar_hapus on faidah for delete to authenticated
  using (adalah_pengajar() and dibuat_oleh = auth.uid());
