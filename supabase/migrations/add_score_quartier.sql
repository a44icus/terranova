-- Migration : ajout du score de quartier pré-calculé sur les biens
-- À exécuter dans Supabase > SQL Editor

ALTER TABLE biens
  ADD COLUMN IF NOT EXISTS score_quartier smallint DEFAULT NULL;

COMMENT ON COLUMN biens.score_quartier IS
  'Score de quartier calculé côté serveur via Overpass/OSM au moment de la publication (0-10). NULL = pas encore calculé.';

-- Recréer la vue biens_publics pour inclure la nouvelle colonne
-- (PostgreSQL ne met pas à jour automatiquement les vues avec SELECT *)
-- Remplacez cette définition par celle de votre vue existante si elle est différente :
-- SELECT * FROM biens_publics; pour vérifier les colonnes actuelles.
