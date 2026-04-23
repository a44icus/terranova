-- ════════════════════════════════════════════════════════════════════
--  Migration : table map_ads + map_ad_events
--  À exécuter dans Supabase → SQL Editor
-- ════════════════════════════════════════════════════════════════════

-- ── Table principale ─────────────────────────────────────────────────────────
create table if not exists public.map_ads (
  id           uuid primary key default gen_random_uuid(),

  -- Contenu
  titre        text             not null,
  description  text,
  image_url    text,
  lien_url     text,
  emoji        text,

  -- Affichage carte
  format       text             not null default 'pin'
               check (format in ('pin', 'banner', 'card')),
  lat          double precision not null,
  lng          double precision not null,
  couleur      text             default '#F59E0B',

  -- Planification
  actif        boolean          not null default true,
  date_debut   timestamptz,
  date_fin     timestamptz,

  -- Ciblage géographique
  visibility_radius_km double precision,   -- null = visible partout

  -- Métadonnées
  created_at   timestamptz      not null default now(),
  updated_at   timestamptz      not null default now()
);

-- Mise à jour auto de updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists map_ads_updated_at on public.map_ads;
create trigger map_ads_updated_at
  before update on public.map_ads
  for each row execute procedure public.set_updated_at();

-- ── RLS map_ads ───────────────────────────────────────────────────────────────
alter table public.map_ads enable row level security;

-- Lecture publique des pubs actives
drop policy if exists "map_ads_public_read" on public.map_ads;
create policy "map_ads_public_read"
  on public.map_ads for select
  using (actif = true);

-- Écriture réservée aux admins (app_metadata.role, non modifiable par l'utilisateur)
drop policy if exists "map_ads_admin_all" on public.map_ads;
create policy "map_ads_admin_all"
  on public.map_ads for all
  using  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ── Table événements ─────────────────────────────────────────────────────────
create table if not exists public.map_ad_events (
  id           uuid primary key default gen_random_uuid(),
  ad_id        uuid        not null references public.map_ads(id) on delete cascade,
  event_type   text        not null check (event_type in ('impression', 'click')),
  ip           text,                    -- pour déduplication côté serveur
  created_at   timestamptz not null default now()
);

-- Index pour les requêtes de stats et déduplication
create index if not exists map_ad_events_ad_id_idx       on public.map_ad_events(ad_id);
create index if not exists map_ad_events_dedup_idx        on public.map_ad_events(ad_id, event_type, ip, created_at);

-- ── RLS map_ad_events ─────────────────────────────────────────────────────────
alter table public.map_ad_events enable row level security;

-- Insertion publique uniquement (pas de lecture directe côté client)
drop policy if exists "map_ad_events_insert" on public.map_ad_events;
create policy "map_ad_events_insert"
  on public.map_ad_events for insert
  with check (true);

-- Lecture réservée aux admins
drop policy if exists "map_ad_events_admin_read" on public.map_ad_events;
create policy "map_ad_events_admin_read"
  on public.map_ad_events for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ── Vue de stats (utilisée par la page admin) ─────────────────────────────────
create or replace view public.map_ad_stats as
select
  a.*,
  coalesce(imp.cnt, 0)                                              as impressions,
  coalesce(clk.cnt, 0)                                              as clicks,
  case
    when coalesce(imp.cnt, 0) = 0 then 0
    else round((coalesce(clk.cnt, 0)::numeric / imp.cnt) * 100, 1)
  end                                                               as ctr
from public.map_ads a
left join (
  select ad_id, count(*) as cnt
  from public.map_ad_events where event_type = 'impression'
  group by ad_id
) imp on imp.ad_id = a.id
left join (
  select ad_id, count(*) as cnt
  from public.map_ad_events where event_type = 'click'
  group by ad_id
) clk on clk.ad_id = a.id;

-- ── Données de démo ───────────────────────────────────────────────────────────
insert into public.map_ads (titre, description, format, lat, lng, couleur, emoji, lien_url, actif)
values
  ('Agence Centrale',   'Estimation gratuite en 48h', 'banner', 48.8566, 2.3522, '#7C3AED', '🏡', 'https://example.com', true),
  ('Résidence Lumière', 'T3 neufs dès 285 000 €',     'card',   48.8600, 2.3600, '#0891B2', '✨', 'https://example.com', true),
  ('Notaire Dupont',    null,                          'pin',    48.8530, 2.3480, '#F59E0B', '⚖️', null,                  true)
on conflict do nothing;

-- ════════════════════════════════════════════════════════════════════
--  Migration additive : nouvelles colonnes pour les évolutions
--  (à exécuter si la table map_ads existe déjà)
-- ════════════════════════════════════════════════════════════════════

-- Ciblage par zone de carte (bbox)
ALTER TABLE public.map_ads ADD COLUMN IF NOT EXISTS bbox_north double precision;
ALTER TABLE public.map_ads ADD COLUMN IF NOT EXISTS bbox_south double precision;
ALTER TABLE public.map_ads ADD COLUMN IF NOT EXISTS bbox_east  double precision;
ALTER TABLE public.map_ads ADD COLUMN IF NOT EXISTS bbox_west  double precision;

-- Capping d'impressions journalier
ALTER TABLE public.map_ads ADD COLUMN IF NOT EXISTS impressions_max_par_jour integer;

-- Colonne ip dans map_ad_events (si pas déjà présente)
ALTER TABLE public.map_ad_events ADD COLUMN IF NOT EXISTS ip text;

-- Index de déduplication impressions
CREATE INDEX IF NOT EXISTS map_ad_events_dedup_idx
  ON public.map_ad_events(ad_id, event_type, ip, created_at);
