-- ============================================================
-- KB-UMM – Profil publik: nama tampil, jabatan, urutan pengajar + penyimpanan foto
-- Jalankan SETELAH 07. Cukup sekali.
-- ============================================================

alter table pengajar add column nama_tampil text;          -- nama di halaman publik (boleh beda dari nama pada data impor)
alter table pengajar add column jabatan text;              -- mis. "Pengajar Kelas Pemula"
alter table pengajar add column urutan int not null default 0;

-- Foto profil (publik, maks. 2 MB). Hanya admin yang boleh mengunggah/mengubah/menghapus.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('foto', 'foto', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy foto_tambah on storage.objects for insert to authenticated
  with check (bucket_id = 'foto' and is_admin());
create policy foto_ubah on storage.objects for update to authenticated
  using (bucket_id = 'foto' and is_admin()) with check (bucket_id = 'foto' and is_admin());
create policy foto_hapus on storage.objects for delete to authenticated
  using (bucket_id = 'foto' and is_admin());
