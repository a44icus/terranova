-- Migration: add category-specific fields
-- Date: 2026-05-04

-- ── Universal fields ──────────────────────────────────────────────
ALTER TABLE biens ADD COLUMN IF NOT EXISTS type_chauffage text;
ALTER TABLE biens ADD COLUMN IF NOT EXISTS exposition text;
ALTER TABLE biens ADD COLUMN IF NOT EXISTS charges_copro integer;

-- ── Colocation ───────────────────────────────────────────────────
ALTER TABLE biens ADD COLUMN IF NOT EXISTS loyer_par_chambre integer;
ALTER TABLE biens ADD COLUMN IF NOT EXISTS charges_incluses boolean;

-- ── Bureau / Local ───────────────────────────────────────────────
ALTER TABLE biens ADD COLUMN IF NOT EXISTS open_space boolean;
ALTER TABLE biens ADD COLUMN IF NOT EXISTS nb_postes_travail smallint;
ALTER TABLE biens ADD COLUMN IF NOT EXISTS bail_commercial boolean;
ALTER TABLE biens ADD COLUMN IF NOT EXISTS droit_au_bail integer;

-- ── Entrepôt ─────────────────────────────────────────────────────
ALTER TABLE biens ADD COLUMN IF NOT EXISTS hauteur_sous_plafond numeric(4,1);
ALTER TABLE biens ADD COLUMN IF NOT EXISTS quai_chargement boolean;
ALTER TABLE biens ADD COLUMN IF NOT EXISTS porte_sectionnelle boolean;
ALTER TABLE biens ADD COLUMN IF NOT EXISTS surface_bureau_incluse integer;

-- ── Fonds de commerce + Murs commerciaux (loyer_annuel shared) ──
ALTER TABLE biens ADD COLUMN IF NOT EXISTS chiffre_affaires integer;
ALTER TABLE biens ADD COLUMN IF NOT EXISTS loyer_annuel integer;
ALTER TABLE biens ADD COLUMN IF NOT EXISTS duree_bail_restant smallint;
ALTER TABLE biens ADD COLUMN IF NOT EXISTS effectif smallint;

-- ── Murs commerciaux ─────────────────────────────────────────────
ALTER TABLE biens ADD COLUMN IF NOT EXISTS bail_en_cours boolean;
ALTER TABLE biens ADD COLUMN IF NOT EXISTS rendement_locatif numeric(4,1);

-- ── Terrains (tous) ──────────────────────────────────────────────
ALTER TABLE biens ADD COLUMN IF NOT EXISTS viabilise boolean;

-- ── Terrain agricole ─────────────────────────────────────────────
ALTER TABLE biens ADD COLUMN IF NOT EXISTS nature_terrain text;

-- ── Terrain constructible ────────────────────────────────────────
ALTER TABLE biens ADD COLUMN IF NOT EXISTS zone_plu text;

-- ── Parking ──────────────────────────────────────────────────────
ALTER TABLE biens ADD COLUMN IF NOT EXISTS type_parking text;
ALTER TABLE biens ADD COLUMN IF NOT EXISTS acces_24h boolean;

-- ── Recreate biens_publics view ──────────────────────────────────
DROP VIEW IF EXISTS biens_publics;
CREATE VIEW biens_publics AS
  SELECT
    b.*,
    (SELECT p.url FROM photos p WHERE p.bien_id = b.id AND p.is_360 = false ORDER BY p.principale DESC, p.ordre ASC LIMIT 1) AS photo_url
  FROM biens b
  WHERE b.statut = 'publie';
