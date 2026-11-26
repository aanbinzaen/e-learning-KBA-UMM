-- Klip kajian: rekaman YouTube boleh dibatasi dari menit/detik mulai sampai selesai.
alter table public.rekaman add column if not exists mulai_detik int;
alter table public.rekaman add column if not exists selesai_detik int;
alter table public.rekaman drop constraint if exists rekaman_klip_check;
alter table public.rekaman add constraint rekaman_klip_check check (
  (mulai_detik is null or mulai_detik >= 0)
  and (selesai_detik is null or selesai_detik > coalesce(mulai_detik, 0))
);
