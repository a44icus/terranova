-- ── Ajout du statut "vendue" à l'enum + vue biens_publics ───────────────────

-- 1. Ajouter la valeur à l'enum (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'vendue'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'bien_statut')
  ) THEN
    ALTER TYPE bien_statut ADD VALUE 'vendue';
  END IF;
END $$;

-- 2. Mettre à jour la vue biens_publics pour inclure les biens vendus
--    (ils restent visibles avec badge "Vendu" mais ne remontent pas dans les alertes)
DROP VIEW IF EXISTS biens_publics;

CREATE VIEW biens_publics AS
  SELECT
    b.*,
    (
      SELECT p.url
      FROM photos p
      WHERE p.bien_id = b.id
        AND p.is_360 = false
      ORDER BY p.principale DESC, p.ordre ASC
      LIMIT 1
    ) AS photo_url
  FROM biens b
  WHERE b.statut IN ('publie', 'vendue');
