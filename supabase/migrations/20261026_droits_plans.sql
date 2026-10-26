-- ============================================================
-- Droits par plan, vérifiés en base
-- À exécuter dans Supabase > SQL Editor (après 20261026_plan_config_unifie.sql)
-- ============================================================
--
-- Les annonces, photos et contacts sont écrits directement depuis le navigateur.
-- Les limites du plan n'étaient vérifiées que dans l'interface : il suffisait d'appeler
-- Supabase à la main pour publier sans limite, ajouter des photos 360° ou se mettre
-- en avant. Ces triggers appliquent les règles pour les rôles anon / authenticated ;
-- le service role (admin, webhook, crons) n'est pas concerné.
-- Idempotente : peut être rejouée.

-- ── Plan effectif et features ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION plan_effectif(p_user uuid) RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
           WHEN p.plan::text <> 'gratuit' AND p.plan_expire_at IS NOT NULL AND p.plan_expire_at < now()
             THEN 'gratuit'
           ELSE coalesce(p.plan::text, 'gratuit')
         END
  FROM profiles p WHERE p.id = p_user;
$$;

CREATE OR REPLACE FUNCTION plan_a_feature(p_user uuid, p_feature text) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT coalesce((
    SELECT p_feature = ANY(pc.features) FROM plan_config pc
    WHERE pc.plan = coalesce(plan_effectif(p_user), 'gratuit')
  ), false);
$$;

CREATE OR REPLACE FUNCTION plan_limite(p_user uuid, p_quoi text) RETURNS integer
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE p_quoi WHEN 'annonces' THEN pc.annonces ELSE pc.photos END
  FROM plan_config pc WHERE pc.plan = coalesce(plan_effectif(p_user), 'gratuit');
$$;

-- ── Annonces : quota, référence agence, badge Pro, mise en avant ─────────────

CREATE OR REPLACE FUNCTION biens_droits_plan() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  n   integer;
  lim integer;
BEGIN
  -- current_user est l'appelant tant que la fonction n'est pas SECURITY DEFINER ;
  -- ici on lit le rôle de la requête PostgREST.
  IF coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  -- Quota d'annonces actives (en attente de modération comprises)
  IF NEW.statut IN ('en_attente', 'publie')
     AND (TG_OP = 'INSERT' OR OLD.statut NOT IN ('en_attente', 'publie')) THEN
    lim := coalesce(plan_limite(NEW.user_id, 'annonces'), 1);
    SELECT count(*) INTO n FROM biens
    WHERE user_id = NEW.user_id AND statut IN ('en_attente', 'publie') AND id <> NEW.id;
    IF n >= lim THEN
      RAISE EXCEPTION 'Votre plan autorise % annonce(s) active(s). Archivez une annonce ou changez de plan.', lim
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF NOT plan_a_feature(NEW.user_id, 'ref_agence') THEN
    NEW.ref_agence := NULL;
  END IF;

  -- Avantages fixés par le plan, jamais par l'utilisateur
  NEW.pro := plan_a_feature(NEW.user_id, 'badge_pro');
  IF TG_OP = 'INSERT' THEN
    NEW.featured      := plan_a_feature(NEW.user_id, 'annonces_mises_en_avant');
    NEW.coup_de_coeur := false;
  ELSE
    NEW.featured      := OLD.featured;
    NEW.coup_de_coeur := OLD.coup_de_coeur;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS biens_droits_plan ON biens;
CREATE TRIGGER biens_droits_plan
  BEFORE INSERT OR UPDATE ON biens
  FOR EACH ROW EXECUTE FUNCTION biens_droits_plan();

-- ── Photos : nombre maximum et photos 360° ───────────────────────────────────

CREATE OR REPLACE FUNCTION photos_droits_plan() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  proprio uuid;
  n       integer;
  lim     integer;
BEGIN
  IF coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO proprio FROM biens WHERE id = NEW.bien_id;

  IF coalesce(NEW.is_360, false) THEN
    IF NOT plan_a_feature(proprio, 'photos_360') THEN
      RAISE EXCEPTION 'Les photos 360° ne sont pas incluses dans votre plan.' USING ERRCODE = '42501';
    END IF;
  ELSE
    lim := coalesce(plan_limite(proprio, 'photos'), 10);
    SELECT count(*) INTO n FROM photos WHERE bien_id = NEW.bien_id AND NOT coalesce(is_360, false);
    IF n >= lim THEN
      RAISE EXCEPTION 'Votre plan autorise % photo(s) par annonce.', lim USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS photos_droits_plan ON photos;
CREATE TRIGGER photos_droits_plan
  BEFORE INSERT ON photos
  FOR EACH ROW EXECUTE FUNCTION photos_droits_plan();

-- ── Contacts : messagerie du vendeur, et vendeur déduit du bien ──────────────

CREATE OR REPLACE FUNCTION contacts_droits_plan() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  -- Le vendeur est celui du bien, pas celui envoyé par le navigateur
  SELECT user_id INTO NEW.vendeur_id FROM biens WHERE id = NEW.bien_id AND statut = 'publie';
  IF NEW.vendeur_id IS NULL THEN
    RAISE EXCEPTION 'Annonce introuvable' USING ERRCODE = '42501';
  END IF;
  IF NOT plan_a_feature(NEW.vendeur_id, 'messagerie') THEN
    RAISE EXCEPTION 'Le contact via la plateforme n''est pas disponible pour cette annonce.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contacts_droits_plan ON contacts;
CREATE TRIGGER contacts_droits_plan
  BEFORE INSERT ON contacts
  FOR EACH ROW EXECUTE FUNCTION contacts_droits_plan();

-- ── Resynchronisation des avantages quand le plan change ─────────────────────

CREATE OR REPLACE FUNCTION sync_biens_plan(p_user uuid DEFAULT NULL) RETURNS void
  LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE biens b SET
    pro           = plan_a_feature(b.user_id, 'badge_pro'),
    featured      = plan_a_feature(b.user_id, 'annonces_mises_en_avant'),
    coup_de_coeur = b.coup_de_coeur AND plan_a_feature(b.user_id, 'coup_de_coeur'),
    ref_agence    = CASE WHEN plan_a_feature(b.user_id, 'ref_agence') THEN b.ref_agence END
  WHERE (p_user IS NULL OR b.user_id = p_user);
$$;

CREATE OR REPLACE FUNCTION profiles_sync_biens() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM sync_biens_plan(NEW.id);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS profiles_sync_biens ON profiles;
CREATE TRIGGER profiles_sync_biens
  AFTER UPDATE OF plan, plan_expire_at ON profiles
  FOR EACH ROW
  WHEN (OLD.plan IS DISTINCT FROM NEW.plan OR OLD.plan_expire_at IS DISTINCT FROM NEW.plan_expire_at)
  EXECUTE FUNCTION profiles_sync_biens();

-- ── Plans expirés (appelé par le cron /api/cron/plans-expires) ──────────────

CREATE OR REPLACE FUNCTION expirer_plans() RETURNS integer
  LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  WITH maj AS (
    UPDATE profiles SET plan = 'gratuit', plan_expire_at = NULL
    WHERE plan::text <> 'gratuit' AND plan_expire_at IS NOT NULL AND plan_expire_at < now()
    RETURNING 1
  )
  SELECT count(*)::integer FROM maj;
$$;

-- Fonctions internes : appelables seulement côté serveur
REVOKE ALL ON FUNCTION sync_biens_plan(uuid), expirer_plans() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION sync_biens_plan(uuid), expirer_plans() TO service_role;

-- Mise en conformité des annonces existantes avec les plans actuels
SELECT sync_biens_plan();
