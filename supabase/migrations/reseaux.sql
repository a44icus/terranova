-- ══════════════════════════════════════════════════════
--  Table reseaux : réseaux & enseignes immobilières
-- ══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reseaux (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nom          text        NOT NULL,
  slug         text        NOT NULL UNIQUE,
  logo_url     text,
  description  text,
  site_web     text,
  -- franchise (ex: Century 21), mandataires (ex: iAd), groupement, enseigne
  type_reseau  text        NOT NULL DEFAULT 'enseigne'
                           CHECK (type_reseau IN ('franchise', 'mandataires', 'groupement', 'enseigne')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reseaux ENABLE ROW LEVEL SECURITY;

-- Lecture publique (page /agences visible par tous)
CREATE POLICY "reseaux_public_read" ON reseaux
  FOR SELECT USING (true);

-- Index pour les slugs (lookup page réseau)
CREATE INDEX IF NOT EXISTS reseaux_slug_idx ON reseaux(slug);

-- ── Lier les profils pros à un réseau ──────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS reseau_id uuid REFERENCES reseaux(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_reseau_id_idx ON profiles(reseau_id);
