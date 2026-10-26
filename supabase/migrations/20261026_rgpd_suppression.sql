-- ============================================================
-- RGPD : suppression des données d'un utilisateur (droit à l'effacement, art. 17)
-- À exécuter dans Supabase > SQL Editor
-- ============================================================
--
-- Appelée par l'action « Supprimer mon compte » (src/app/compte/profil/rgpd-actions.ts),
-- avant la suppression du compte auth. Chaque table n'est traitée que si elle et sa
-- colonne existent : la fonction reste valable si le schéma évolue.
-- Le journal admin_audit_log est conservé (obligation de traçabilité).

CREATE OR REPLACE FUNCTION supprimer_donnees_utilisateur(p_user uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  cible record;
BEGIN
  -- Photos des annonces de l'utilisateur, puis tout ce qui le référence
  IF to_regclass('public.photos') IS NOT NULL THEN
    DELETE FROM photos WHERE bien_id IN (SELECT id FROM biens WHERE user_id = p_user);
  END IF;

  FOR cible IN
    SELECT * FROM (VALUES
      ('favoris', 'user_id'), ('alertes', 'user_id'), ('recherches', 'user_id'),
      ('prix_alerts_queue', 'user_id'), ('contact_replies', 'auteur_id'),
      ('contacts', 'acheteur_id'), ('contacts', 'vendeur_id'),
      ('contacts_chercheurs', 'chercheur_id'),
      ('visites', 'demandeur_id'), ('visites', 'vendeur_id'),
      ('avis_agents', 'auteur_id'), ('avis_agents', 'agent_id'),
      ('signalements', 'reported_user_id'),
      ('biens', 'user_id')
    ) AS t(tbl, col)
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = cible.tbl AND column_name = cible.col) THEN
      EXECUTE format('DELETE FROM %I WHERE %I = $1', cible.tbl, cible.col) USING p_user;
    END IF;
  END LOOP;

  DELETE FROM profiles WHERE id = p_user;
END;
$$;

REVOKE ALL ON FUNCTION supprimer_donnees_utilisateur(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION supprimer_donnees_utilisateur(uuid) TO service_role;
