-- ============================================================
-- KB-UMM – Skema Tahap 5 (kuis, nilai, progres)
-- Jalankan SETELAH 05_perbarui_absensi_peserta.sql. Cukup sekali.
-- ============================================================

create table kuis (
  id uuid primary key default gen_random_uuid(),
  pertemuan_id uuid not null references pertemuan(id) on delete cascade,
  grup_id uuid not null references grup(id) on delete cascade,
  judul text not null,
  diterbitkan boolean not null default false,
  boleh_ulang boolean not null default true,
  dibuat_pada timestamptz not null default now()
);
create index kuis_pertemuan_idx on kuis (pertemuan_id);

create table soal (
  id uuid primary key default gen_random_uuid(),
  kuis_id uuid not null references kuis(id) on delete cascade,
  urutan int not null default 0,
  pertanyaan text not null,
  opsi jsonb not null check (jsonb_typeof(opsi) = 'array' and jsonb_array_length(opsi) between 2 and 5),
  jawaban_benar int not null,
  pembahasan text,
  dibuat_pada timestamptz not null default now(),
  constraint jawaban_dalam_opsi check (jawaban_benar >= 0 and jawaban_benar < jsonb_array_length(opsi))
);
create index soal_kuis_idx on soal (kuis_id, urutan);

create table percobaan (
  id uuid primary key default gen_random_uuid(),
  kuis_id uuid not null references kuis(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  jawaban jsonb not null,
  benar int not null,
  total int not null,
  nilai int not null,
  waktu timestamptz not null default now()
);
create index percobaan_idx on percobaan (kuis_id, profile_id);

create or replace function kuis_kelola(kid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from kuis k where k.id = kid and bisa_kelola_grup(k.grup_id));
$$;

alter table kuis enable row level security;
alter table soal enable row level security;
alter table percobaan enable row level security;

-- Peserta hanya melihat kuis yang sudah diterbitkan di grupnya
create policy kuis_baca on kuis for select using (bisa_kelola_grup(grup_id) or (diterbitkan and bisa_lihat_grup(grup_id)));
create policy kuis_kelola_semua on kuis for all using (bisa_kelola_grup(grup_id)) with check (bisa_kelola_grup(grup_id));

-- Tabel soal MENYIMPAN KUNCI JAWABAN: hanya pengajar/admin yang boleh membaca langsung.
create policy soal_kelola on soal for all using (kuis_kelola(kuis_id)) with check (kuis_kelola(kuis_id));

-- Percobaan: peserta hanya melihat miliknya; pengajar/admin melihat grupnya. Penulisan hanya lewat fungsi kirim_kuis.
create policy percobaan_baca on percobaan for select using (profile_id = auth.uid() or kuis_kelola(kuis_id));

-- Soal untuk peserta: TANPA kunci jawaban dan pembahasan
create or replace function soal_kuis(kid uuid)
returns table (id uuid, urutan int, pertanyaan text, opsi jsonb)
language sql stable security definer set search_path = public as $$
  select s.id, s.urutan, s.pertanyaan, s.opsi
  from soal s join kuis k on k.id = s.kuis_id
  where s.kuis_id = kid and k.diterbitkan and anggota_grup(k.grup_id)
  order by s.urutan, s.dibuat_pada;
$$;
revoke all on function soal_kuis(uuid) from public, anon;
grant execute on function soal_kuis(uuid) to authenticated;

-- Penghitung internal (tidak bisa dipanggil langsung oleh pengguna)
create or replace function hitung_rincian(kid uuid, jawaban jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare s record; total int := 0; benar int := 0; pil numeric; hasil jsonb := '[]'::jsonb;
begin
  for s in select * from soal where kuis_id = kid order by urutan, dibuat_pada loop
    total := total + 1;
    pil := case when jsonb_typeof(jawaban -> (s.id::text)) = 'number' then (jawaban ->> (s.id::text))::numeric else null end;
    if pil is not null and pil = s.jawaban_benar then benar := benar + 1; end if;
    hasil := hasil || jsonb_build_object('id', s.id, 'pertanyaan', s.pertanyaan, 'opsi', s.opsi,
                                         'pilihan', pil, 'benar_idx', s.jawaban_benar, 'pembahasan', s.pembahasan);
  end loop;
  return jsonb_build_object('total', total, 'benar', benar,
    'nilai', case when total = 0 then 0 else round(benar * 100.0 / total)::int end, 'rincian', hasil);
end $$;
revoke all on function hitung_rincian(uuid, jsonb) from public, anon, authenticated;

-- Peserta mengirim jawaban: nilai dihitung di server, hasil dan pembahasan baru dikembalikan setelah mengirim
create or replace function kirim_kuis(kid uuid, jawaban jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare k record; h jsonb; sudah int;
begin
  select id, grup_id, diterbitkan, boleh_ulang into k from kuis where id = kid;
  if not found or not k.diterbitkan then return jsonb_build_object('galat', 'tidak_ada'); end if;
  if not anggota_grup(k.grup_id) then return jsonb_build_object('galat', 'bukan_anggota'); end if;
  select count(*) into sudah from percobaan where kuis_id = kid and profile_id = auth.uid();
  if sudah > 0 and not k.boleh_ulang then return jsonb_build_object('galat', 'sudah_mengerjakan'); end if;
  h := hitung_rincian(kid, jawaban);
  if (h ->> 'total')::int = 0 then return jsonb_build_object('galat', 'kosong'); end if;
  insert into percobaan (kuis_id, profile_id, jawaban, benar, total, nilai)
    values (kid, auth.uid(), jawaban, (h ->> 'benar')::int, (h ->> 'total')::int, (h ->> 'nilai')::int);
  insert into progres (profile_id, jenis, item_id) values (auth.uid(), 'kuis', kid) on conflict do nothing;
  return h;
end $$;
revoke all on function kirim_kuis(uuid, jsonb) from public, anon;
grant execute on function kirim_kuis(uuid, jsonb) to authenticated;

-- Hasil percobaan terakhir beserta pembahasan (untuk dibuka kembali)
create or replace function rincian_kuis(kid uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare k record; j jsonb;
begin
  select grup_id, diterbitkan into k from kuis where id = kid;
  if not found or not k.diterbitkan or not anggota_grup(k.grup_id) then return jsonb_build_object('galat', 'tidak_ada'); end if;
  select jawaban into j from percobaan where kuis_id = kid and profile_id = auth.uid() order by waktu desc limit 1;
  if not found then return jsonb_build_object('galat', 'belum'); end if;
  return hitung_rincian(kid, j);
end $$;
revoke all on function rincian_kuis(uuid) from public, anon;
grant execute on function rincian_kuis(uuid) to authenticated;

-- Bersihkan progres bila materi/rekaman/kuis dihapus
create or replace function hapus_progres_item() returns trigger
language plpgsql security definer set search_path = public as $$
begin delete from progres where item_id = old.id; return old; end $$;
create trigger materi_hapus_progres after delete on materi for each row execute function hapus_progres_item();
create trigger rekaman_hapus_progres after delete on rekaman for each row execute function hapus_progres_item();
create trigger kuis_hapus_progres after delete on kuis for each row execute function hapus_progres_item();
