-- Video Pendek: hasil Reels bisa disimpan langsung ke kumpulan rekaman kelas. Jalankan sekali di SQL Editor Supabase.
-- 1) rekaman boleh berupa berkas video (bukan hanya YouTube)
alter table public.rekaman add column if not exists video_path text;
alter table public.rekaman alter column youtube_id drop not null;
do $$
declare c text;
begin
  for c in select conname from pg_constraint where conrelid = 'public.rekaman'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%youtube_id%' loop
    execute format('alter table public.rekaman drop constraint %I', c);
  end loop;
end $$;
alter table public.rekaman drop constraint if exists rekaman_sumber_check;
alter table public.rekaman add constraint rekaman_sumber_check check (
  (youtube_id is not null and youtube_id ~ '^[A-Za-z0-9_-]{11}$' and video_path is null)
  or (youtube_id is null and video_path is not null)
);

-- 2) gudang berkas khusus video pendek (privat, maks. 50 MB per berkas)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('video-pendek', 'video-pendek', false, 52428800, array['video/mp4', 'video/webm'])
on conflict (id) do update set file_size_limit = 52428800, allowed_mime_types = array['video/mp4', 'video/webm'];

drop policy if exists video_pendek_baca on storage.objects;
drop policy if exists video_pendek_tambah on storage.objects;
drop policy if exists video_pendek_hapus on storage.objects;
create policy video_pendek_baca on storage.objects for select to authenticated
  using (bucket_id = 'video-pendek' and bisa_lihat_grup(((storage.foldername(name))[1])::uuid));
create policy video_pendek_tambah on storage.objects for insert to authenticated
  with check (bucket_id = 'video-pendek' and bisa_kelola_grup(((storage.foldername(name))[1])::uuid));
create policy video_pendek_hapus on storage.objects for delete to authenticated
  using (bucket_id = 'video-pendek' and bisa_kelola_grup(((storage.foldername(name))[1])::uuid));
