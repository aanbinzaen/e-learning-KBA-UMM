-- Materi berupa gambar (PNG/JPG). Jalankan sekali di SQL Editor Supabase.
-- 1) jenis materi baru
alter type jenis_materi add value if not exists 'gambar';

-- 2) aturan isi: catatan wajib berteks, jenis lain (pdf, gambar) wajib berkas
do $$
declare c text;
begin
  for c in select conname from pg_constraint where conrelid = 'public.materi'::regclass and contype = 'c' loop
    execute format('alter table public.materi drop constraint %I', c);
  end loop;
end $$;
alter table public.materi add constraint materi_isi_check
  check ((jenis = 'catatan' and catatan is not null) or (jenis <> 'catatan' and file_path is not null));

-- 3) gudang berkas menerima PNG dan JPG selain PDF
update storage.buckets set allowed_mime_types = array['application/pdf', 'image/png', 'image/jpeg'] where id = 'materi';
