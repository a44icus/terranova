-- Ajout de la colonne bien_id pour les signalements d'annonces
alter table signalements
  add column if not exists bien_id uuid references biens(id) on delete cascade;

-- Remplace l'index unique (qui ne prenait en compte que reporter + reported)
-- Un utilisateur peut signaler le profil ET une annonce du même vendeur
drop index if exists signalements_unique_reporter;

create unique index signalements_unique_reporter
  on signalements(reporter_id, reported_user_id, coalesce(bien_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where statut = 'ouvert';
