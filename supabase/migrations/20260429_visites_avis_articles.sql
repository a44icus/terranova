-- ── 1. Planification de visites ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visites (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bien_id         uuid REFERENCES biens(id) ON DELETE CASCADE,
  vendeur_id      uuid REFERENCES profiles(id) ON DELETE CASCADE,
  demandeur_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  demandeur_nom   text NOT NULL,
  demandeur_email text NOT NULL,
  demandeur_tel   text,
  date_souhaitee  date NOT NULL,
  creneau         text,           -- ex : '10h-11h', 'matin', 'après-midi'
  message         text,
  statut          text NOT NULL DEFAULT 'en_attente',  -- en_attente | confirme | annule
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE visites ENABLE ROW LEVEL SECURITY;

-- Le vendeur voit ses demandes; le demandeur voit les siennes
CREATE POLICY "visites_vendeur" ON visites
  FOR ALL USING (vendeur_id = auth.uid());

CREATE POLICY "visites_demandeur" ON visites
  FOR SELECT USING (demandeur_id = auth.uid());

-- Insertion publique (authentifiée ou non - le visiteur peut demander sans compte)
CREATE POLICY "visites_insert" ON visites
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_visites_vendeur   ON visites(vendeur_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visites_bien      ON visites(bien_id);
CREATE INDEX IF NOT EXISTS idx_visites_demandeur ON visites(demandeur_id);

-- ── 2. Avis et notations des agents ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avis_agents (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  auteur_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  auteur_nom   text NOT NULL,
  note         smallint NOT NULL CHECK (note BETWEEN 1 AND 5),
  commentaire  text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE avis_agents ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "avis_select" ON avis_agents
  FOR SELECT USING (true);

-- Seuls les utilisateurs connectés peuvent laisser un avis
CREATE POLICY "avis_insert" ON avis_agents
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auteur_id = auth.uid());

-- Seul l'auteur peut supprimer son avis
CREATE POLICY "avis_delete" ON avis_agents
  FOR DELETE USING (auteur_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_avis_agent ON avis_agents(agent_id, created_at DESC);

-- ── 3. Blog / Articles SEO ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        text UNIQUE NOT NULL,
  titre       text NOT NULL,
  chapeau     text,               -- sous-titre / description courte
  contenu     text NOT NULL,      -- HTML ou Markdown (stocké en HTML)
  categorie   text DEFAULT 'guide',  -- guide | actualite | conseil | marche
  auteur_nom  text DEFAULT 'Terranova',
  photo_url   text,
  publie      boolean DEFAULT false,
  publie_at   timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Lecture publique des articles publiés
CREATE POLICY "articles_select_publie" ON articles
  FOR SELECT USING (publie = true);

-- Admins gèrent tout via admin client (service_role bypass RLS)
-- Pas de policy INSERT/UPDATE/DELETE nécessaire pour les admins (service_role)

CREATE INDEX IF NOT EXISTS idx_articles_publie    ON articles(publie, publie_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug      ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_categorie ON articles(categorie);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS articles_updated_at ON articles;
CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
