-- ============================================================
-- KB-UMM – Pembaruan absensi: peserta memilih Hadir / Izin / Sakit
-- Jalankan SETELAH 04_skema_tahap4.sql. Cukup sekali.
-- ============================================================

create or replace function isi_absensi(pid uuid, st text) returns text
language plpgsql security definer set search_path = public as $$
declare p record; lama record;
begin
  if st not in ('hadir', 'izin', 'sakit') then return 'status_salah'; end if;
  select grup_id, absensi_buka into p from pertemuan where id = pid;
  if not found then return 'tidak_ada'; end if;
  if not anggota_grup(p.grup_id) then return 'bukan_anggota'; end if;
  if not p.absensi_buka then return 'tutup'; end if;

  select status, dicatat_oleh into lama from absensi where pertemuan_id = pid and profile_id = auth.uid();
  if found then
    -- catatan yang diisi pengajar tidak bisa diubah peserta
    if lama.dicatat_oleh = 'pengajar' then return 'dikunci'; end if;
  end if;

  -- satu baris per peserta per pertemuan (kunci utama), pilihan boleh diganti selama absensi masih dibuka
  insert into absensi (pertemuan_id, profile_id, status, dicatat_oleh)
    values (pid, auth.uid(), st::status_hadir, 'peserta')
    on conflict (pertemuan_id, profile_id)
    do update set status = excluded.status, waktu = now()
    where absensi.dicatat_oleh = 'peserta';
  return 'ok';
end $$;

revoke all on function isi_absensi(uuid, text) from public, anon;
grant execute on function isi_absensi(uuid, text) to authenticated;

drop function if exists isi_hadir(uuid);
