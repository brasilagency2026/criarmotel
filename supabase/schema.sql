-- ============================================================
-- MOTEL BUILDER — Supabase Schema
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Extensão para UUID
create extension if not exists "uuid-ossp";

-- ── TABELA: motels ───────────────────────────────────────────
create table public.motels (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  slug        text unique not null,
  name        text not null,
  slogan      text,
  description text not null,
  address     text not null,
  phone       text not null,
  whatsapp    text,
  hero_photo  text,  -- URL do Supabase Storage
  published   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── TABELA: suites ───────────────────────────────────────────
create table public.suites (
  id          uuid primary key default uuid_generate_v4(),
  motel_id    uuid references public.motels(id) on delete cascade not null,
  name        text not null,
  description text,
  services    text,  -- texto livre separado por vírgula
  position    integer default 0,
  created_at  timestamptz default now()
);

-- ── TABELA: suite_photos ─────────────────────────────────────
create table public.suite_photos (
  id         uuid primary key default uuid_generate_v4(),
  suite_id   uuid references public.suites(id) on delete cascade not null,
  url        text not null,
  position   integer default 0
);

-- ── TABELA: suite_prices ─────────────────────────────────────
create table public.suite_prices (
  id       uuid primary key default uuid_generate_v4(),
  suite_id uuid references public.suites(id) on delete cascade not null,
  period   text not null,
  value    text not null,
  position integer default 0
);

-- ── STORAGE BUCKET ───────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('motel-photos', 'motel-photos', true)
on conflict do nothing;

-- ── UPDATED_AT TRIGGER ───────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger motels_updated_at
  before update on public.motels
  for each row execute function update_updated_at();

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
alter table public.motels      enable row level security;
alter table public.suites      enable row level security;
alter table public.suite_photos enable row level security;
alter table public.suite_prices enable row level security;

-- motels: proprietário gerencia os seus
create policy "owner_all_motels" on public.motels
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- motels: leitura pública dos publicados
create policy "public_read_motels" on public.motels
  for select using (published = true);

-- suites: proprietário via motel
create policy "owner_all_suites" on public.suites
  for all using (
    exists (select 1 from public.motels where id = suites.motel_id and user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.motels where id = suites.motel_id and user_id = auth.uid())
  );

create policy "public_read_suites" on public.suites
  for select using (
    exists (select 1 from public.motels where id = suites.motel_id and published = true)
  );

-- suite_photos: mesma lógica
create policy "owner_all_suite_photos" on public.suite_photos
  for all using (
    exists (
      select 1 from public.suites s
      join public.motels m on m.id = s.motel_id
      where s.id = suite_photos.suite_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.suites s
      join public.motels m on m.id = s.motel_id
      where s.id = suite_photos.suite_id and m.user_id = auth.uid()
    )
  );

create policy "public_read_suite_photos" on public.suite_photos
  for select using (
    exists (
      select 1 from public.suites s
      join public.motels m on m.id = s.motel_id
      where s.id = suite_photos.suite_id and m.published = true
    )
  );

-- suite_prices: mesma lógica
create policy "owner_all_suite_prices" on public.suite_prices
  for all using (
    exists (
      select 1 from public.suites s
      join public.motels m on m.id = s.motel_id
      where s.id = suite_prices.suite_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.suites s
      join public.motels m on m.id = s.motel_id
      where s.id = suite_prices.suite_id and m.user_id = auth.uid()
    )
  );

create policy "public_read_suite_prices" on public.suite_prices
  for select using (
    exists (
      select 1 from public.suites s
      join public.motels m on m.id = s.motel_id
      where s.id = suite_prices.suite_id and m.published = true
    )
  );

-- Storage: proprietário faz upload, público lê
create policy "owner_upload_photos" on storage.objects
  for insert with check (bucket_id = 'motel-photos' and auth.role() = 'authenticated');

create policy "owner_delete_photos" on storage.objects
  for delete using (bucket_id = 'motel-photos' and auth.uid() = owner);

create policy "public_read_photos" on storage.objects
  for select using (bucket_id = 'motel-photos');
