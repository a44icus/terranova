-- Recrée la table signalements proprement (supprime l'ancienne version)
drop table if exists signalements cascade;

create table signalements (
  id                uuid primary key default gen_random_uuid(),
  reporter_id       uuid references profiles(id) on delete set null,
  reported_user_id  uuid not null references profiles(id) on delete cascade,
  motif             text not null check (motif in ('faux_pro', 'arnaque', 'contenu_inapproprie', 'autre')),
  message           text,
  statut            text not null default 'ouvert' check (statut in ('ouvert', 'ignore', 'traite')),
  created_at        timestamptz not null default now()
);

create index signalements_statut_idx
  on signalements(statut, created_at desc);

create unique index signalements_unique_reporter
  on signalements(reporter_id, reported_user_id)
  where statut = 'ouvert';

alter table signalements enable row level security;

create policy "insert_signalement" on signalements
  for insert to authenticated
  with check (reporter_id = auth.uid() and reporter_id <> reported_user_id);
