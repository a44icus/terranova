-- ============================================================
-- Configuration des plans : une seule source, la table plan_config
-- À exécuter dans Supabase > SQL Editor
-- ============================================================
--
-- Avant : chiffres et Stripe dans plan_config, mais label / description / actif / features
-- dans le JSON site_settings.plans_meta. Après cette migration, tout est dans plan_config
-- (src/lib/plan.ts et src/app/admin/parametres/actions.ts ne lisent et n'écrivent plus que là).
-- Idempotente : peut être rejouée sans risque.

-- 1. Colonnes (déjà présentes si add_plan_features_categories.sql a été exécutée)
ALTER TABLE plan_config
  ADD COLUMN IF NOT EXISTS label       text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS actif       boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS features    text[]  NOT NULL DEFAULT '{}';

-- 2. Reprise des valeurs saisies dans l'admin (plans_meta est la version la plus récente)
UPDATE plan_config pc SET
  label       = COALESCE(m.value->>'label', pc.label),
  description = COALESCE(m.value->>'description', pc.description),
  actif       = COALESCE((m.value->>'actif')::boolean, pc.actif),
  features    = CASE
                  WHEN jsonb_typeof(m.value->'features') = 'array'
                    THEN ARRAY(SELECT jsonb_array_elements_text(m.value->'features'))
                  ELSE pc.features
                END
FROM site_settings s,
     jsonb_each(COALESCE(s.settings->'plans_meta', '{}'::jsonb)) AS m
WHERE s.id = 1
  AND m.key = pc.plan;

-- 3. Une fois l'admin vérifié (/admin/parametres affiche bien les libellés et features),
--    l'ancienne copie peut être supprimée :
-- UPDATE site_settings SET settings = settings - 'plans_meta' WHERE id = 1;
