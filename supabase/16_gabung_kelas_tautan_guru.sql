-- 1) Peserta menekan "Gabung Kelas" pada jam kelas -> kehadiran otomatis "hadir".
--    Jam kelas = 30 menit sebelum sampai 3 jam setelah waktu pertemuan. Catatan dari pengajar tidak ditimpa.
create or replace function gabung_kelas() returns uuid
language plpgsql security definer set search_path = public as $$
declare gid uuid; pid uuid;
begin
  if auth.uid() is null then return null; end if;
  select grup_id into gid from peserta_grup where profile_id = auth.uid() limit 1;
  if gid is null then return null; end if;
  select id into pid from pertemuan
   where grup_id = gid and waktu between now() - interval '3 hours' and now() + interval '30 minutes'
   order by abs(extract(epoch from (waktu - now()))) limit 1;
  if pid is null then return null; end if;
  insert into absensi (pertemuan_id, profile_id, status, dicatat_oleh)
  values (pid, auth.uid(), 'hadir', 'peserta')
  on conflict (pertemuan_id, profile_id) do update set status = 'hadir', waktu = now()
   where absensi.dicatat_oleh = 'peserta' and absensi.status <> 'hadir';
  return pid;
end $$;
revoke all on function gabung_kelas() from public, anon;
grant execute on function gabung_kelas() to authenticated;

-- 2) Pengajar mengatur sendiri tautan kelas grupnya (admin juga boleh).
create or replace function atur_tautan_kelas(gid uuid, tautan text) returns text
language plpgsql security definer set search_path = public as $$
begin
  if not (is_admin() or pengajar_grup(gid)) then return 'dilarang'; end if;
  tautan := nullif(btrim(tautan), '');
  if tautan is null then delete from grup_tautan where grup_id = gid; return 'ok'; end if;
  if tautan !~* '^https://' then return 'format'; end if;
  insert into grup_tautan (grup_id, link) values (gid, tautan)
  on conflict (grup_id) do update set link = excluded.link;
  return 'ok';
end $$;
revoke all on function atur_tautan_kelas(uuid, text) from public, anon;
grant execute on function atur_tautan_kelas(uuid, text) to authenticated;
