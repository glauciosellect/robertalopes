-- ============================================================
-- Site institucional de mandato — Roberta Lopes
-- Execute UMA vez no SQL Editor do Supabase (projeto do site).
-- Não altera nenhuma tabela existente.
-- ============================================================

-- Itens editáveis: projetos, proposicoes, noticias, videos, municipios,
-- emendas, resultados, eventos, discursos, golacos, fotos
create table if not exists public.mandato_itens (
  id         uuid primary key default gen_random_uuid(),
  tipo       text not null,
  titulo     text not null default '',
  dados      jsonb not null default '{}'::jsonb,
  publicado  boolean not null default true,
  ordem      int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mandato_itens_tipo_idx on public.mandato_itens (tipo, publicado, ordem);

-- Números e textos configuráveis (números de impacto, contadores, redes, contato)
create table if not exists public.mandato_config (
  chave      text primary key,
  valor      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.mandato_itens  enable row level security;
alter table public.mandato_config enable row level security;

-- Leitura pública apenas do que está publicado
drop policy if exists "mandato_itens_leitura" on public.mandato_itens;
create policy "mandato_itens_leitura" on public.mandato_itens
  for select using (publicado = true or exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "mandato_config_leitura" on public.mandato_config;
create policy "mandato_config_leitura" on public.mandato_config for select using (true);

-- Escrita somente para quem tem perfil no painel (admin ou colaborador)
drop policy if exists "mandato_itens_escrita" on public.mandato_itens;
create policy "mandato_itens_escrita" on public.mandato_itens
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "mandato_config_escrita" on public.mandato_config;
create policy "mandato_config_escrita" on public.mandato_config
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid()));

-- Fotos enviadas pelo painel
insert into storage.buckets (id, name, public) values ('mandato', 'mandato', true)
on conflict (id) do nothing;

drop policy if exists "mandato_midia_leitura" on storage.objects;
create policy "mandato_midia_leitura" on storage.objects for select using (bucket_id = 'mandato');

drop policy if exists "mandato_midia_upload" on storage.objects;
create policy "mandato_midia_upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'mandato' and exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "mandato_midia_exclusao" on storage.objects;
create policy "mandato_midia_exclusao" on storage.objects for delete to authenticated
  using (bucket_id = 'mandato' and exists (select 1 from public.profiles p where p.id = auth.uid()));
