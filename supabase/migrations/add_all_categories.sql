-- Migration : ajout de toutes les nouvelles catégories de biens
-- À exécuter dans Supabase > SQL Editor
-- Note : ALTER TYPE ... ADD VALUE ne peut pas s'exécuter dans une transaction
--        Exécuter ce script complet d'un coup dans l'éditeur SQL Supabase.

-- ── 1. Nouvelles valeurs ENUM ─────────────────────────────────────────────────
ALTER TYPE bien_categorie ADD VALUE IF NOT EXISTS 'studio';
ALTER TYPE bien_categorie ADD VALUE IF NOT EXISTS 'villa';
ALTER TYPE bien_categorie ADD VALUE IF NOT EXISTS 'chalet';
ALTER TYPE bien_categorie ADD VALUE IF NOT EXISTS 'loft';
ALTER TYPE bien_categorie ADD VALUE IF NOT EXISTS 'colocation';
ALTER TYPE bien_categorie ADD VALUE IF NOT EXISTS 'restaurant';
ALTER TYPE bien_categorie ADD VALUE IF NOT EXISTS 'entrepot';
ALTER TYPE bien_categorie ADD VALUE IF NOT EXISTS 'hotel';
ALTER TYPE bien_categorie ADD VALUE IF NOT EXISTS 'fonds_commerce';
ALTER TYPE bien_categorie ADD VALUE IF NOT EXISTS 'murs_commerciaux';
ALTER TYPE bien_categorie ADD VALUE IF NOT EXISTS 'terrain_agricole';
ALTER TYPE bien_categorie ADD VALUE IF NOT EXISTS 'terrain_constructible';

-- ── 2. Colonnes spécifiques restaurant ───────────────────────────────────────
ALTER TABLE biens
  ADD COLUMN IF NOT EXISTS licence_restaurant  text     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS couverts            smallint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fonds_commerce_incl boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS cuisine_pro         boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS terrasse_ext        boolean  DEFAULT false;

COMMENT ON COLUMN biens.licence_restaurant  IS 'Licence alcool restaurant : II, III, IV ou NULL';
COMMENT ON COLUMN biens.couverts            IS 'Capacité d''accueil (nombre de couverts)';
COMMENT ON COLUMN biens.fonds_commerce_incl IS 'true si la vente inclut le fonds de commerce';
COMMENT ON COLUMN biens.cuisine_pro         IS 'true si cuisine professionnelle équipée';
COMMENT ON COLUMN biens.terrasse_ext        IS 'true si terrasse extérieure avec droits inclus';

-- ── 3. Colonnes spécifiques hôtel ────────────────────────────────────────────
ALTER TABLE biens
  ADD COLUMN IF NOT EXISTS nb_chambres_hotel smallint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS nb_etoiles        smallint DEFAULT NULL;

COMMENT ON COLUMN biens.nb_chambres_hotel IS 'Nombre de chambres (hôtel)';
COMMENT ON COLUMN biens.nb_etoiles        IS 'Classement étoiles (hôtel, 1-5)';

-- ── 4. Colonnes spécifiques colocation ───────────────────────────────────────
ALTER TABLE biens
  ADD COLUMN IF NOT EXISTS nb_colocataires smallint DEFAULT NULL;

COMMENT ON COLUMN biens.nb_colocataires IS 'Nombre de colocataires maximum';

-- ── 5. Recréer la vue biens_publics ──────────────────────────────────────────
--    SELECT * est figé à la création — obligatoire après chaque ALTER TABLE
DROP VIEW IF EXISTS biens_publics;
CREATE VIEW biens_publics AS
  SELECT
    b.*,
    (
      SELECT p.url
      FROM photos p
      WHERE p.bien_id = b.id
        AND p.is_360 = false
      ORDER BY p.principale DESC, p.ordre ASC
      LIMIT 1
    ) AS photo_url
  FROM biens b
  WHERE b.statut = 'publie';
