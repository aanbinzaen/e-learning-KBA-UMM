-- ============================================================
-- KB-UMM – Pembaruan kuis: soal ESAI, bobot, penilaian manual, impor soal
-- Jalankan SETELAH 06_skema_tahap5.sql. Cukup sekali.
-- ============================================================

-- 1) Tabel soal: tipe, bobot, kunci esai; pilihan dan jawaban benar boleh kosong untuk esai
do $$
declare c record;
begin
  for c in select conname from pg_constraint where conrelid = 'public.soal'::regclass and contype = 'c' loop
    execute format('alter table public.soal drop constraint %I', c.conname);
  end loop;
end $$;

alter table soal add column tipe text not null default 'pilihan_ganda' check (tipe in ('pilihan_ganda', 'esai'));
alter table soal add column bobot int not null default 1 check (bobot between 1 and 100);
alter table soal add column kunci_esai text;
alter table soal alter column opsi drop not null;
alter table soal alter column jawaban_benar drop not null;
alter table soal add constraint soal_valid check (
  tipe = 'esai'
  or (jsonb_typeof(opsi) = 'array' and jsonb_array_length(opsi) between 2 and 5
      and jawaban_benar is not null and jawaban_benar >= 0 and jawaban_benar < jsonb_array_length(opsi))
);

-- 2) Tabel percobaan: status penilaian dan skor
alter table percobaan add column skor_pg numeric not null default 0;
alter table percobaan add column total_bobot numeric not null default 0;
alter table percobaan add column penilaian jsonb not null default '{}'::jsonb;
alter table percobaan add column status text not null default 'selesai' check (status in ('selesai', 'menunggu'));
alter table percobaan alter column nilai drop not null;   -- kosong selama esai belum dinilai

-- 3) Soal untuk peserta: tanpa kunci jawaban dan pembahasan
drop function if exists soal_kuis(uuid);
create function soal_kuis(kid uuid)
returns table (id uuid, urutan int, tipe text, pertanyaan text, opsi jsonb, bobot int)
language sql stable security definer set search_path = public as $$
  select s.id, s.urutan, s.tipe, s.pertanyaan, s.opsi, s.bobot
  from soal s join kuis k on k.id = s.kuis_id
  where s.kuis_id = kid and k.diterbitkan and anggota_grup(k.grup_id)
  order by s.urutan, s.dibuat_pada;
$$;
revoke all on function soal_kuis(uuid) from public, anon;
grant execute on function soal_kuis(uuid) to authenticated;

-- 4) Penghitung internal: pilihan ganda otomatis, esai memakai penilaian pengajar
create or replace function hitung_rincian(kid uuid, jawaban jsonb, penilaian jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  s record; n_pg int := 0; benar int := 0; total_bobot numeric := 0; skor_total numeric := 0;
  esai_total int := 0; esai_dinilai int := 0; pil numeric; teks text; sk numeric; cat text;
  hasil jsonb := '[]'::jsonb; nilai_s int;
begin
  for s in select * from soal where kuis_id = kid order by urutan, dibuat_pada loop
    total_bobot := total_bobot + s.bobot;
    pil := null; teks := null; sk := null; cat := null;
    if s.tipe = 'pilihan_ganda' then
      n_pg := n_pg + 1;
      if jsonb_typeof(jawaban -> (s.id::text)) = 'number' then pil := (jawaban ->> (s.id::text))::numeric; end if;
      if pil is not null and pil = s.jawaban_benar then benar := benar + 1; sk := s.bobot; else sk := 0; end if;
    else
      esai_total := esai_total + 1;
      if jsonb_typeof(jawaban -> (s.id::text)) = 'string' then teks := jawaban ->> (s.id::text); end if;
      if jsonb_typeof(penilaian -> (s.id::text) -> 'skor') = 'number' then
        sk := least(greatest((penilaian -> (s.id::text) ->> 'skor')::numeric, 0), s.bobot);
        esai_dinilai := esai_dinilai + 1;
      end if;
      cat := penilaian -> (s.id::text) ->> 'catatan';
    end if;
    skor_total := skor_total + coalesce(sk, 0);
    hasil := hasil || jsonb_build_object(
      'id', s.id, 'tipe', s.tipe, 'pertanyaan', s.pertanyaan, 'opsi', s.opsi, 'pilihan', pil,
      'benar_idx', s.jawaban_benar, 'teks', teks, 'skor', sk, 'bobot', s.bobot, 'catatan', cat,
      'pembahasan', s.pembahasan, 'kunci', s.kunci_esai);
  end loop;
  nilai_s := case when total_bobot = 0 then 0 else round(skor_total * 100 / total_bobot)::int end;
  return jsonb_build_object(
    'total', n_pg + esai_total, 'benar', benar, 'total_pg', n_pg, 'total_bobot', total_bobot, 'skor', skor_total,
    'ada_esai', esai_total > 0, 'menunggu', esai_dinilai < esai_total,
    'nilai', case when esai_dinilai < esai_total then null else nilai_s end,
    'nilai_sementara', nilai_s, 'rincian', hasil);
end $$;
revoke all on function hitung_rincian(uuid, jsonb, jsonb) from public, anon, authenticated;

-- 5) Kirim jawaban. Kuis yang memuat esai hanya boleh dikerjakan satu kali (agar penilaian tidak menumpuk)
create or replace function kirim_kuis(kid uuid, jawaban jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare k record; h jsonb; sudah int; ada_esai boolean;
begin
  select id, grup_id, diterbitkan, boleh_ulang into k from kuis where id = kid;
  if not found or not k.diterbitkan then return jsonb_build_object('galat', 'tidak_ada'); end if;
  if not anggota_grup(k.grup_id) then return jsonb_build_object('galat', 'bukan_anggota'); end if;
  select exists (select 1 from soal where kuis_id = kid and tipe = 'esai') into ada_esai;
  select count(*) into sudah from percobaan where kuis_id = kid and profile_id = auth.uid();
  if sudah > 0 and (ada_esai or not k.boleh_ulang) then return jsonb_build_object('galat', 'sudah_mengerjakan'); end if;
  h := hitung_rincian(kid, jawaban, '{}'::jsonb);
  if (h ->> 'total')::int = 0 then return jsonb_build_object('galat', 'kosong'); end if;
  insert into percobaan (kuis_id, profile_id, jawaban, benar, total, skor_pg, total_bobot, penilaian, status, nilai)
    values (kid, auth.uid(), jawaban, (h ->> 'benar')::int, (h ->> 'total')::int, (h ->> 'skor')::numeric,
            (h ->> 'total_bobot')::numeric, '{}'::jsonb,
            case when (h ->> 'menunggu')::boolean then 'menunggu' else 'selesai' end, (h ->> 'nilai')::int);
  insert into progres (profile_id, jenis, item_id) values (auth.uid(), 'kuis', kid) on conflict do nothing;
  return h;
end $$;
revoke all on function kirim_kuis(uuid, jsonb) from public, anon;
grant execute on function kirim_kuis(uuid, jsonb) to authenticated;

-- 6) Membuka kembali hasil terakhir (termasuk skor esai dari pengajar)
create or replace function rincian_kuis(kid uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare k record; j jsonb; pn jsonb;
begin
  select grup_id, diterbitkan into k from kuis where id = kid;
  if not found or not k.diterbitkan or not anggota_grup(k.grup_id) then return jsonb_build_object('galat', 'tidak_ada'); end if;
  select jawaban, penilaian into j, pn from percobaan where kuis_id = kid and profile_id = auth.uid() order by waktu desc limit 1;
  if not found then return jsonb_build_object('galat', 'belum'); end if;
  return hitung_rincian(kid, j, pn);
end $$;
revoke all on function rincian_kuis(uuid) from public, anon;
grant execute on function rincian_kuis(uuid) to authenticated;

-- 7) Pengajar/admin menilai esai satu percobaan
create or replace function nilai_esai(pid uuid, penilaian jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p record; h jsonb;
begin
  select id, kuis_id, jawaban into p from percobaan where id = pid;
  if not found or not kuis_kelola(p.kuis_id) then return jsonb_build_object('galat', 'tidak_diizinkan'); end if;
  h := hitung_rincian(p.kuis_id, p.jawaban, penilaian);
  update percobaan
     set penilaian = nilai_esai.penilaian,
         status = case when (h ->> 'menunggu')::boolean then 'menunggu' else 'selesai' end,
         nilai = (h ->> 'nilai')::int
   where id = pid;
  return jsonb_build_object('nilai', h -> 'nilai', 'menunggu', h -> 'menunggu');
end $$;
revoke all on function nilai_esai(uuid, jsonb) from public, anon;
grant execute on function nilai_esai(uuid, jsonb) to authenticated;

-- 8) Fungsi lama (dua argumen) tidak dipakai lagi
drop function if exists hitung_rincian(uuid, jsonb);
