-- Migration : ajout de la catégorie "restaurant" et de ses champs spécifiques
-- À exécuter dans Supabase > SQL Editor

-- 1. Ajouter la valeur 'restaurant' à l'ENUM bien_categorie
--    (PostgreSQL ne permet pas ALTER TYPE dans une transaction — exécuter séparément si besoin)
ALTER TYPE bien_categorie ADD VALUE IF NOT EXISTS 'restaurant';

-- 2. Ajouter les colonnes spécifiques restaurant à la table biens
ALTER TABLE biens
  ADD COLUMN IF NOT EXISTS licence_restaurant text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS couverts          smallint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fonds_commerce    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cuisine_pro       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS terrasse_ext      boolean DEFAULT false;

COMMENT ON COLUMN biens.licence_restaurant IS 'Licence alcool du restaurant : II, III, IV ou NULL';
COMMENT ON COLUMN biens.couverts           IS 'Capacité d''accueil en nombre de couverts';
COMMENT ON COLUMN biens.fonds_commerce     IS 'true si la vente inclut le fonds de commerce';
COMMENT ON COLUMN biens.cuisine_pro        IS 'true si le bien dispose d''une cuisine professionnelle équipée';
COMMENT ON COLUMN biens.terrasse_ext       IS 'true si le bien dispose d''une terrasse extérieure avec droits de terrasse';

-- 3. Recréer la vue biens_publics pour inclure les nouvelles colonnes
--    (SELECT * figé à la création — doit être recréé après chaque ALTER TABLE)
DROP VIEW IF EXISTS biens_publics;
CREATE VIEW biens_publics AS
  SELECT * FROM biens
  WHERE statut = 'publie';
