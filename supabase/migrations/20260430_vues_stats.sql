-- ─────────────────────────────────────────────────────────────────
-- Table vues_stats : historique journalier des vues par bien
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.vues_stats (
  id       uuid primary key default gen_random_uuid(),
  bien_id  uuid not null references public.biens(id) on delete cascade,
  date     date not null,
  count    integer not null default 1,
  constraint vues_stats_bien_date_unique unique (bien_id, date)
);

create index if not exists vues_stats_bien_id_idx on public.vues_stats(bien_id);
create index if not exists vues_stats_date_idx    on public.vues_stats(date);

-- RLS : lecture publique, écriture uniquement via service_role (admin client)
alter table public.vues_stats enable row level security;

create policy "lecture publique vues_stats"
  on public.vues_stats for select
  using (true);

-- ─────────────────────────────────────────────────────────────────
-- Fonction RPC : incrémenter ou créer la ligne du jour
-- ─────────────────────────────────────────────────────────────────

create or replace function public.increment_vue_stat(p_bien_id uuid, p_date date)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.vues_stats (bien_id, date, count)
  values (p_bien_id, p_date, 1)
  on conflict (bien_id, date)
  do update set count = vues_stats.count + 1;
end;
$$;
