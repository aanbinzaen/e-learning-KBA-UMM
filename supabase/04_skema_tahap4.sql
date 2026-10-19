-- ============================================================
-- KB-UMM – Skema Tahap 4 (absensi dan rekap)
-- Jalankan SETELAH 03_skema_tahap3.sql. Cukup sekali.
-- ============================================================

alter table pertemuan add column absensi_buka boolean not null default false;

create type status_hadir as enum ('hadir', 'izin', 'sakit', 'alpa');

create table absensi (
  pertemuan_id uuid not null references pertemuan(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  status status_hadir not null,
  dicatat_oleh text not null default 'pengajar' check (dicatat_oleh in ('peserta', 'pengajar')),
  waktu timestamptz not null default now(),
  primary key (pertemuan_id, profile_id)          -- kunci ini mencegah absen ganda
);
create index absensi_profil_idx on absensi (profile_id);

-- Fungsi bantu (security definer agar aman dan tidak rekursif)
create or replace function pertemuan_kelola(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from pertemuan p where p.id = pid and bisa_kelola_grup(p.grup_id));
$$;

create or replace function anggota_pertemuan(pid uuid, uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from peserta_grup pg join pertemuan p on p.grup_id = pg.grup_id
                 where p.id = pid and pg.profile_id = uid);
$$;

-- Daftar peserta aktif satu grup untuk pengajar/admin (nama dan kode saja, tanpa kontak)
create or replace function anggota_grup_daftar(gid uuid)
returns table (profile_id uuid, kode text, nama_lengkap text, jenis_kelamin jk)
language sql stable security definer set search_path = public as $$
  select p.id, p.kode, p.nama_lengkap, p.jenis_kelamin
  from peserta_grup pg join profiles p on p.id = pg.profile_id
  where pg.grup_id = gid and p.aktif and bisa_kelola_grup(gid)
  order by p.nama_lengkap;
$$;

-- Peserta menekan "Hadir": hanya lewat fungsi ini (bukan menulis tabel langsung)
create or replace function isi_hadir(pid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare p record;
begin
  select grup_id, absensi_buka into p from pertemuan where id = pid;
  if not found then return 'tidak_ada'; end if;
  if not anggota_grup(p.grup_id) then return 'bukan_anggota'; end if;
  if not p.absensi_buka then return 'tutup'; end if;
  insert into absensi (pertemuan_id, profile_id, status, dicatat_oleh)
    values (pid, auth.uid(), 'hadir', 'peserta')
    on conflict (pertemuan_id, profile_id) do nothing;
  if found then return 'ok'; else return 'sudah'; end if;
end $$;
revoke all on function isi_hadir(uuid) from public, anon;
grant execute on function isi_hadir(uuid) to authenticated;

alter table absensi enable row level security;
create policy absensi_sendiri on absensi for select using (profile_id = auth.uid());
create policy absensi_kelola on absensi for all
  using (pertemuan_kelola(pertemuan_id))
  with check (pertemuan_kelola(pertemuan_id) and anggota_pertemuan(pertemuan_id, profile_id));
