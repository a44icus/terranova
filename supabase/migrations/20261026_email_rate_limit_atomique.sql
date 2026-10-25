-- ============================================================
-- Rate limiting email atomique + purge
-- À exécuter dans Supabase > SQL Editor (après 20260429_email_rate_limits.sql)
-- ============================================================
--
-- Avant : le code faisait un SELECT count puis un INSERT. Deux requêtes simultanées
-- pouvaient lire le même compteur et dépasser la limite. La table grossissait sans fin
-- (purge_email_rate_limits n'était appelée nulle part).
--
-- Maintenant : une seule fonction, appelée via RPC par src/lib/emailRateLimit.ts.
-- Un verrou consultatif par (clé, route) sérialise les appels concurrents pour la même
-- clé, sans bloquer les autres. Environ 1 appel sur 100 purge les lignes de plus de 2 h.

CREATE OR REPLACE FUNCTION email_rate_limit_hit(
  p_key    text,
  p_route  text,
  p_max    integer  DEFAULT 5,
  p_window interval DEFAULT interval '1 hour'
) RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_key || '|' || p_route, 0));

  SELECT count(*) INTO n
  FROM email_rate_limits
  WHERE ip = p_key AND route = p_route AND created_at >= now() - p_window;

  IF n >= p_max THEN
    RETURN true;   -- limite atteinte : bloquer
  END IF;

  INSERT INTO email_rate_limits (ip, route) VALUES (p_key, p_route);

  IF random() < 0.01 THEN
    DELETE FROM email_rate_limits WHERE created_at < now() - interval '2 hours';
  END IF;

  RETURN false;
END;
$$;

-- Appelable uniquement côté serveur (service role)
REVOKE ALL ON FUNCTION email_rate_limit_hit(text, text, integer, interval) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION email_rate_limit_hit(text, text, integer, interval) TO service_role;

-- Purge initiale de l'historique accumulé
DELETE FROM email_rate_limits WHERE created_at < now() - interval '2 hours';
