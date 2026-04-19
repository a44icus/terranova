-- Table d'historique des vues par bien et par jour
CREATE TABLE IF NOT EXISTS vues_stats (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  bien_id    uuid    NOT NULL REFERENCES biens(id) ON DELETE CASCADE,
  date       date    NOT NULL DEFAULT CURRENT_DATE,
  count      integer NOT NULL DEFAULT 1,
  UNIQUE(bien_id, date)
);

-- Index pour requêtes rapides par bien
CREATE INDEX IF NOT EXISTS vues_stats_bien_id_idx ON vues_stats(bien_id);
CREATE INDEX IF NOT EXISTS vues_stats_date_idx    ON vues_stats(date);

-- RLS : les propriétaires voient uniquement leurs propres stats
ALTER TABLE vues_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select" ON vues_stats
  FOR SELECT USING (
    bien_id IN (SELECT id FROM biens WHERE user_id = auth.uid())
  );

-- Insert/upsert autorisé côté service (admin client uniquement)

-- Fonction atomique pour incrémenter ou créer la stat du jour
CREATE OR REPLACE FUNCTION increment_vue_stat(p_bien_id uuid, p_date date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO vues_stats (bien_id, date, count)
  VALUES (p_bien_id, p_date, 1)
  ON CONFLICT (bien_id, date)
  DO UPDATE SET count = vues_stats.count + 1;
END;
$$;
