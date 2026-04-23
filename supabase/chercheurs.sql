-- ============================================================
-- Terranova — Mode chercheur actif
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS recherches (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  actif        boolean NOT NULL DEFAULT true,
  type         text CHECK (type IN ('vente', 'location')),
  categories   text[] NOT NULL DEFAULT '{}',
  ville        text,
  code_postal  text,
  rayon_km     integer,
  prix_min     integer,
  prix_max     integer,
  surface_min  integer,
  surface_max  integer,
  pieces_min   integer,
  description  text,
  budget_visible boolean NOT NULL DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE recherches ENABLE ROW LEVEL SECURITY;

-- L'utilisateur gère sa propre fiche
CREATE POLICY "recherches_own" ON recherches
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Tout le monde peut lire les fiches actives
CREATE POLICY "recherches_public_read" ON recherches
  FOR SELECT USING (actif = true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_recherches_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_recherches_updated_at ON recherches;
CREATE TRIGGER trg_recherches_updated_at
  BEFORE UPDATE ON recherches
  FOR EACH ROW EXECUTE FUNCTION set_recherches_updated_at();
