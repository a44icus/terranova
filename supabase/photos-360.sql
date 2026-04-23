-- ============================================================
-- Terranova — Visite virtuelle 360°
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- Colonne is_360 sur la table photos
ALTER TABLE photos ADD COLUMN IF NOT EXISTS is_360 boolean NOT NULL DEFAULT false;
