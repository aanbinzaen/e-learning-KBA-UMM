-- ============================================================
-- KB-UMM – Faidah Ilmu (ditampilkan di Beranda dan halaman /faidah, dikelola admin)
-- Jalankan SETELAH 08. Cukup sekali.
-- ============================================================

create table faidah (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  teks_arab text,                        -- kutipan Arab (opsional)
  isi text not null,
  sumber text,
  terbit boolean not null default true,
  dibuat_pada timestamptz not null default now()
);
create index faidah_terbit_idx on faidah (terbit, dibuat_pada desc);

alter table faidah enable row level security;
create policy faidah_baca on faidah for select using (terbit);
create policy faidah_admin on faidah for all using (is_admin()) with check (is_admin());
