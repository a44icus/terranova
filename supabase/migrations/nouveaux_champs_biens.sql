-- Migration : ajout des nouveaux champs sur la table biens
-- À exécuter dans l'éditeur SQL de Supabase

ALTER TABLE biens
  ADD COLUMN IF NOT EXISTS chambres          integer,
  ADD COLUMN IF NOT EXISTS nb_wc             integer,
  ADD COLUMN IF NOT EXISTS surface_terrain   numeric(10,2),
  ADD COLUMN IF NOT EXISTS fibre             boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS conso_energie     numeric(8,2),
  ADD COLUMN IF NOT EXISTS emissions_co2     numeric(8,2),
  ADD COLUMN IF NOT EXISTS depenses_energie_min integer,
  ADD COLUMN IF NOT EXISTS depenses_energie_max integer;

-- Commentaires descriptifs
COMMENT ON COLUMN biens.chambres              IS 'Nombre de chambres';
COMMENT ON COLUMN biens.nb_wc                 IS 'Nombre de WC';
COMMENT ON COLUMN biens.surface_terrain       IS 'Surface du terrain en m²';
COMMENT ON COLUMN biens.fibre                 IS 'Fibre optique déployée';
COMMENT ON COLUMN biens.conso_energie         IS 'DPE : consommation énergétique kWh/m².an';
COMMENT ON COLUMN biens.emissions_co2         IS 'DPE : émissions GES kgCO2/m².an';
COMMENT ON COLUMN biens.depenses_energie_min  IS 'DPE : dépenses annuelles min €';
COMMENT ON COLUMN biens.depenses_energie_max  IS 'DPE : dépenses annuelles max €';

-- Si vous utilisez une vue biens_publics, mettez-la à jour également.
-- Exemple (adaptez à votre définition exacte de la vue) :
-- CREATE OR REPLACE VIEW biens_publics AS
--   SELECT ..., chambres, nb_wc, surface_terrain, fibre,
--          conso_energie, emissions_co2, depenses_energie_min, depenses_energie_max
--   FROM biens
--   WHERE statut = 'publie';
