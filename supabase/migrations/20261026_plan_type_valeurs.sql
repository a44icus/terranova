-- ============================================================
-- Enum plan_type : ajouter les plans manquants
-- À exécuter dans Supabase > SQL Editor (seule, hors transaction)
-- ============================================================
--
-- Le code connaît 5 plans (src/lib/types.ts, PlanType) mais l'enum de la base n'en
-- contenait pas tous : « agence_annuel » au moins était refusé. Un achat de ce plan
-- était donc payé chez Stripe mais jamais enregistré par le webhook
-- (invalid input value for enum plan_type).
--
-- ADD VALUE IF NOT EXISTS ne touche pas aux valeurs déjà présentes : sans risque.

ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'gratuit';
ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'pro_mensuel';
ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'pro_annuel';
ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'agence_mensuel';
ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'agence_annuel';

-- Vérification : doit lister les 5 valeurs
-- SELECT unnest(enum_range(NULL::plan_type));
