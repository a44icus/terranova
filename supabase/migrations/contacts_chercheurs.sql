-- Table pour stocker les contacts vendeur → chercheur
create table if not exists contacts_chercheurs (
  id           uuid primary key default gen_random_uuid(),
  chercheur_id uuid not null references auth.users(id) on delete cascade,
  vendeur_nom  text not null,
  vendeur_email text not null,
  vendeur_tel  text,
  message      text not null,
  lu           boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table contacts_chercheurs enable row level security;

-- Le chercheur peut lire et marquer lu ses propres contacts
create policy "chercheur_read_own" on contacts_chercheurs
  for select using (auth.uid() = chercheur_id);

create policy "chercheur_update_lu" on contacts_chercheurs
  for update using (auth.uid() = chercheur_id);

-- Index pour accélerer les requêtes par chercheur
create index if not exists contacts_chercheurs_chercheur_id_idx on contacts_chercheurs(chercheur_id);
