-- ============================================================
-- Sécurité admin : ne plus s'appuyer sur profiles.is_admin
-- À exécuter dans Supabase > SQL Editor
-- ============================================================
--
-- Les politiques de prix-alerts.sql donnaient accès à email_config (dont la clé API
-- Resend) et à prix_alerts_queue à tout utilisateur ayant profiles.is_admin = true.
-- Si une politique permet à un utilisateur de modifier sa propre ligne profiles, il
-- pouvait s'octroyer ce droit.
--
-- Le code n'utilise plus is_admin : la définition d'admin est désormais partout
-- app_metadata.role = 'admin' ou ADMIN_EMAILS (src/lib/isAdmin.ts), et ces deux tables
-- ne sont plus lues ou écrites que côté serveur avec le service role, qui ignore la RLS.
-- On retire donc les politiques : RLS activée sans politique = aucun accès anon/authenticated.

DROP POLICY IF EXISTS "email_config_admin_only" ON email_config;
DROP POLICY IF EXISTS "prix_alerts_admin"       ON prix_alerts_queue;

ALTER TABLE email_config      ENABLE ROW LEVEL SECURITY;
ALTER TABLE prix_alerts_queue ENABLE ROW LEVEL SECURITY;

-- La colonne profiles.is_admin n'est plus lue nulle part. Elle est conservée pour ne rien
-- casser ; à supprimer une fois vérifié qu'aucun outil externe ne s'en sert :
-- ALTER TABLE profiles DROP COLUMN is_admin;

-- À vérifier à la main : les politiques UPDATE de profiles.
-- SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'profiles';
