-- Migration : features par plan + gestion catégories actives
-- À exécuter dans Supabase > SQL Editor

-- ── 1. Colonnes supplémentaires sur plan_config ───────────────────
ALTER TABLE plan_config
  ADD COLUMN IF NOT EXISTS label       text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS actif       boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS features    text[]  NOT NULL DEFAULT '{}';

-- ── 2. Valeurs par défaut des features ───────────────────────────
UPDATE plan_config SET
  label       = 'Gratuit',
  description = 'Pour découvrir la plateforme',
  features    = ARRAY[
    'messagerie', 'demande_visite', 'score_quartier'
  ]
WHERE plan = 'gratuit';

UPDATE plan_config SET
  label       = 'Pro Mensuel',
  description = 'Pour les particuliers et indépendants',
  features    = ARRAY[
    'messagerie', 'demande_visite', 'score_quartier',
    'badge_pro', 'stats_avancees', 'photos_360',
    'alerte_email', 'ref_agence', 'estimation', 'support_prioritaire'
  ]
WHERE plan = 'pro_mensuel';

UPDATE plan_config SET
  label       = 'Pro Annuel',
  description = 'Pour les professionnels et agences',
  features    = ARRAY[
    'messagerie', 'demande_visite', 'score_quartier',
    'badge_pro', 'stats_avancees', 'photos_360',
    'alerte_email', 'ref_agence', 'estimation',
    'annonces_mises_en_avant', 'coup_de_coeur',
    'multi_utilisateurs', 'api_acces', 'support_prioritaire'
  ]
WHERE plan = 'pro_annuel';
