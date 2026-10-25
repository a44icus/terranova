-- ============================================================
-- profiles : protéger aussi annonces_actives
-- À exécuter dans Supabase > SQL Editor (après 20261026_profiles_colonnes_protegees.sql)
-- ============================================================
--
-- annonces_actives limite le nombre d'annonces publiables (src/app/publier/page.tsx).
-- Un utilisateur pouvait la remettre à 0 lui-même et contourner son quota.
--
-- Le compteur est tenu par update_annonces_actives() (trigger biens_count_trigger sur biens),
-- qui est SECURITY DEFINER : elle s'exécute avec le rôle de son propriétaire, pas
-- « authenticated ». La protection ci-dessous ne la bloque donc pas.

CREATE OR REPLACE FUNCTION protect_profile_columns() RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated')
     AND (NEW.plan                   IS DISTINCT FROM OLD.plan
       OR NEW.plan_expire_at         IS DISTINCT FROM OLD.plan_expire_at
       OR NEW.stripe_customer_id     IS DISTINCT FROM OLD.stripe_customer_id
       OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
       OR NEW.is_admin               IS DISTINCT FROM OLD.is_admin
       OR NEW.annonces_actives       IS DISTINCT FROM OLD.annonces_actives)
  THEN
    RAISE EXCEPTION 'Modification non autorisée d''une colonne protégée de profiles'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

-- Le trigger protect_profile_columns existe déjà et appelle cette fonction.

-- Recalcul de tous les compteurs, au cas où certains auraient été modifiés à la main
UPDATE profiles p SET annonces_actives = (
  SELECT count(*) FROM biens b WHERE b.user_id = p.id AND b.statut = 'publie'
)
WHERE p.annonces_actives IS DISTINCT FROM (
  SELECT count(*) FROM biens b WHERE b.user_id = p.id AND b.statut = 'publie'
);
