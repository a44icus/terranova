-- ════════════════════════════════════════════════════════════════════
--  Migration : table map_ads
--  À exécuter dans Supabase → SQL Editor
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.map_ads (
  id           uuid primary key default gen_random_uuid(),

  -- Contenu
  titre        text        not null,
  description  text,
  image_url    text,
  lien_url     text,
  emoji        text,

  -- Affichage carte
  format       text        not null default 'pin'
               check (format in ('pin', 'banner', 'card')),
  lat          double precision not null,
  lng          double precision not null,
  couleur      text        default '#F59E0B',

  -- Planification
  actif        boolean     not null default true,
  date_debut   timestamptz,
  date_fin     timestamptz,

  -- Métadonnées
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
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

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.map_ads enable row level security;

-- Lecture publique des pubs actives
create policy "map_ads_public_read"
  on public.map_ads for select
  using (actif = true);

-- Écriture réservée aux admins (adapte le role_check selon ton setup)
create policy "map_ads_admin_all"
  on public.map_ads for all
  using  (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- ── Données de démo ───────────────────────────────────────────────────────────
insert into public.map_ads (titre, description, format, lat, lng, couleur, emoji, lien_url, actif)
values
  ('Agence Centrale',  'Estimation gratuite en 48h',   'banner', 48.8566,  2.3522,  '#7C3AED', '🏡', 'https://example.com', true),
  ('Résidence Lumière','T3 neufs dès 285 000 €',       'card',   48.8600,  2.3600,  '#0891B2', '✨', 'https://example.com', true),
  ('Notaire Dupont',   null,                            'pin',    48.8530,  2.3480,  '#F59E0B', '⚖️', null,                  true);
