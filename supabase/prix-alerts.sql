-- ============================================================
-- Terranova — Alertes prix (baisse de prix sur biens favoris)
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- 1. Colonne is_admin sur profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2. Config email (singleton — id = 1 toujours)
CREATE TABLE IF NOT EXISTS email_config (
  id        integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  api_key   text,
  from_email text NOT NULL DEFAULT 'no-reply@terranova.fr',
  from_name  text NOT NULL DEFAULT 'Terranova',
  enabled    boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO email_config (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE email_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_config_admin_only" ON email_config
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- 3. Queue des alertes de baisse de prix
CREATE TABLE IF NOT EXISTS prix_alerts_queue (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bien_id     uuid REFERENCES biens(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid NOT NULL,
  ancien_prix numeric NOT NULL,
  nouveau_prix numeric NOT NULL,
  sent        boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  sent_at     timestamptz
);

ALTER TABLE prix_alerts_queue ENABLE ROW LEVEL SECURITY;
-- L'admin peut tout lire ; l'API route utilise le service role (bypass RLS)
CREATE POLICY "prix_alerts_admin" ON prix_alerts_queue
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- 4. Trigger : insère dans la queue quand le prix d'un bien publié baisse
CREATE OR REPLACE FUNCTION notify_prix_baisse()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.prix < OLD.prix AND NEW.statut = 'publie' THEN
    INSERT INTO prix_alerts_queue (bien_id, user_id, ancien_prix, nouveau_prix)
    SELECT NEW.id, f.user_id, OLD.prix, NEW.prix
    FROM   favoris f
    WHERE  f.bien_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prix_baisse ON biens;
CREATE TRIGGER trigger_prix_baisse
  AFTER UPDATE ON biens
  FOR EACH ROW EXECUTE FUNCTION notify_prix_baisse();

-- 5. Désigner un admin (remplacez l'email)
-- UPDATE profiles SET is_admin = true WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'votre@email.fr'
-- );
