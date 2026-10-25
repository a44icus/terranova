-- POI OpenStreetMap stockés par bien
-- À exécuter dans l'éditeur SQL de Supabase.
--
-- Les POI (commerces, santé, écoles, transports…) autour de chaque bien sont
-- récupérés une fois via Overpass puis stockés ici : la carte et la fiche
-- annonce ne dépendent plus d'Overpass au moment de l'affichage.

alter table public.biens
  add column if not exists pois             jsonb,        -- { pois: [...], radiusKm, score }
  add column if not exists pois_updated_at  timestamptz,  -- date du dernier calcul réussi
  add column if not exists pois_attempt_at  timestamptz;  -- dernière tentative (réussie ou non)

-- Les biens en attente de POI, pour la tâche automatique
create index if not exists biens_pois_a_calculer_idx
  on public.biens (pois_attempt_at nulls first)
  where pois is null;

-- Si le bien est déplacé, ses POI et son score ne sont plus valables :
-- on les efface pour qu'ils soient recalculés.
create or replace function public.biens_reset_pois_si_deplace()
returns trigger
language plpgsql
as $$
begin
  if new.lat is distinct from old.lat or new.lng is distinct from old.lng then
    new.pois            := null;
    new.pois_updated_at := null;
    new.pois_attempt_at := null;
    new.score_quartier  := null;
  end if;
  return new;
end;
$$;

drop trigger if exists biens_reset_pois_si_deplace on public.biens;
create trigger biens_reset_pois_si_deplace
  before update of lat, lng on public.biens
  for each row
  execute function public.biens_reset_pois_si_deplace();

-- Les scores à 0 enregistrés pendant les pannes d'Overpass sont faux :
-- on les efface pour qu'ils soient recalculés.
update public.biens set score_quartier = null where score_quartier = 0;
