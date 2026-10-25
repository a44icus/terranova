-- ============================================================
-- profiles : colonnes protégées contre les écritures des utilisateurs
-- À exécuter dans Supabase > SQL Editor, APRÈS le déploiement du code
-- (le checkout Stripe doit écrire stripe_customer_id avec le service role).
-- ============================================================
--
-- La politique « Utilisateur modifie son propre profil » (UPDATE, auth.uid() = id,
-- sans WITH CHECK ni restriction de colonnes) laissait chaque utilisateur modifier
-- n'importe quelle colonne de sa ligne depuis le navigateur, par exemple :
--   - plan / plan_expire_at → s'offrir le plan Agence sans payer ;
--   - stripe_customer_id    → pointer vers le client Stripe de quelqu'un d'autre et ouvrir
--                             son portail de facturation ;
--   - is_admin.
--
-- La politique reste en place (le logo et l'onboarding écrivent depuis le navigateur),
-- mais ce trigger refuse toute modification de ces colonnes par les rôles anon et
-- authenticated. Le service role (webhook Stripe, actions admin) et le SQL Editor
-- (rôle postgres) ne sont pas concernés.

CREATE OR REPLACE FUNCTION protect_profile_columns() RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated')
     AND (NEW.plan                   IS DISTINCT FROM OLD.plan
       OR NEW.plan_expire_at         IS DISTINCT FROM OLD.plan_expire_at
       OR NEW.stripe_customer_id     IS DISTINCT FROM OLD.stripe_customer_id
       OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
       OR NEW.is_admin               IS DISTINCT FROM OLD.is_admin)
  THEN
    RAISE EXCEPTION 'Modification non autorisée d''une colonne protégée de profiles'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_columns ON profiles;
CREATE TRIGGER protect_profile_columns
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_columns();

-- La politique UPDATE n'avait pas de WITH CHECK : on l'ajoute pour qu'un utilisateur
-- ne puisse pas non plus changer l'id de sa ligne.
ALTER POLICY "Utilisateur modifie son propre profil" ON profiles
  WITH CHECK (auth.uid() = id);

-- ── Vérification (rien n'est modifié grâce au ROLLBACK) ──────────────────────
-- Remplacez l'UUID par celui d'un compte de test. Attendu : une erreur
-- « Modification non autorisée d'une colonne protégée de profiles ».
--
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims = '{"sub":"UUID-DU-COMPTE-TEST","role":"authenticated"}';
-- UPDATE profiles SET plan = 'agence_annuel' WHERE id = 'UUID-DU-COMPTE-TEST';
-- ROLLBACK;
