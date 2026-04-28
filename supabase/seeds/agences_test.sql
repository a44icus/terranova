-- ============================================================
-- SEED : Agences & Agents de test — Terranova
-- À exécuter dans Supabase SQL Editor (service role)
-- ============================================================

DO $$
DECLARE
  -- UUIDs réseaux
  r_century21   uuid := 'a1000000-0000-0000-0000-000000000001';
  r_orpi        uuid := 'a1000000-0000-0000-0000-000000000002';
  r_laforet     uuid := 'a1000000-0000-0000-0000-000000000003';
  r_guidehome   uuid := 'a1000000-0000-0000-0000-000000000004'; -- réseau sans agent

  -- UUIDs agents (auth.users + profiles)
  u_martin      uuid := 'b1000000-0000-0000-0000-000000000001';
  u_leblanc     uuid := 'b1000000-0000-0000-0000-000000000002';
  u_dupont      uuid := 'b1000000-0000-0000-0000-000000000003';
  u_garcia      uuid := 'b1000000-0000-0000-0000-000000000004';
  u_bernard     uuid := 'b1000000-0000-0000-0000-000000000005';
  u_petit       uuid := 'b1000000-0000-0000-0000-000000000006';
  u_indep1      uuid := 'b1000000-0000-0000-0000-000000000007'; -- indépendant
  u_indep2      uuid := 'b1000000-0000-0000-0000-000000000008'; -- indépendant

BEGIN

-- ── 1. RÉSEAUX ──────────────────────────────────────────────

INSERT INTO reseaux (id, nom, slug, type_reseau, description, site_web, created_at, updated_at)
VALUES
  (r_century21, 'Century 21', 'century-21', 'franchise',
   'Premier réseau d''agences immobilières en France avec plus de 900 agences.',
   'https://www.century21.fr', now(), now()),

  (r_orpi, 'Orpi', 'orpi', 'groupement',
   'Coopérative immobilière regroupant plus de 1 300 agences partout en France.',
   'https://www.orpi.com', now(), now()),

  (r_laforet, 'Laforêt Immobilier', 'laforet', 'franchise',
   'Réseau national présent dans plus de 700 villes avec des agences de proximité.',
   'https://www.laforet.com', now(), now()),

  (r_guidehome, 'GuideHome Réseau', 'guidehome', 'groupement',
   'Nouveau réseau régional en cours de développement.',
   null, now(), now())

ON CONFLICT (id) DO NOTHING;


-- ── 2. AUTH USERS (fictifs) ──────────────────────────────────

INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
)
VALUES
  (u_martin,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'martin.dupuis@test-terranova.fr',  crypt('Test1234!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', false),

  (u_leblanc, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'sophie.leblanc@test-terranova.fr', crypt('Test1234!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', false),

  (u_dupont,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'jean.dupont@test-terranova.fr',    crypt('Test1234!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', false),

  (u_garcia,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'maria.garcia@test-terranova.fr',   crypt('Test1234!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', false),

  (u_bernard, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'luc.bernard@test-terranova.fr',    crypt('Test1234!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', false),

  (u_petit,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'claire.petit@test-terranova.fr',   crypt('Test1234!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', false),

  (u_indep1,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'thomas.roux@test-terranova.fr',    crypt('Test1234!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', false),

  (u_indep2,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'anne.moreau@test-terranova.fr',    crypt('Test1234!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', false)

ON CONFLICT (id) DO NOTHING;


-- ── 3. PROFILS AGENTS ───────────────────────────────────────

INSERT INTO profiles (
  id, type, prenom, nom, agence, bio, telephone,
  ville, plan, annonces_actives, reseau_id, created_at, updated_at
)
VALUES
  -- Century 21 — Paris
  (u_martin, 'pro', 'Martin', 'Dupuis', 'Century 21 Opéra',
   'Spécialiste des appartements parisiens depuis 12 ans. Je vous accompagne dans tous vos projets d''achat et de vente.',
   '06 11 22 33 44', 'Paris', 'gratuit', 3, r_century21, now(), now()),

  -- Century 21 — Lyon
  (u_leblanc, 'pro', 'Sophie', 'Leblanc', 'Century 21 Bellecour',
   'Experte immobilière lyonnaise, je connais chaque quartier de la métropole.',
   '06 55 44 33 22', 'Lyon', 'gratuit', 5, r_century21, now(), now()),

  -- Orpi — Bordeaux
  (u_dupont, 'pro', 'Jean', 'Dupont', 'Orpi Chartrons',
   'Passionné par l''immobilier bordelais, je vous aide à trouver la perle rare.',
   '06 77 88 99 00', 'Bordeaux', 'gratuit', 2, r_orpi, now(), now()),

  -- Orpi — Nantes
  (u_garcia, 'pro', 'Maria', 'Garcia', 'Orpi Nantes Centre',
   'Forte de 8 ans d''expérience dans l''immobilier nantais.',
   '06 12 34 56 78', 'Nantes', 'gratuit', 4, r_orpi, now(), now()),

  -- Laforêt — Marseille
  (u_bernard, 'pro', 'Luc', 'Bernard', 'Laforêt Vieux-Port',
   'Négociateur immobilier spécialisé dans les biens de prestige marseillais.',
   '06 98 76 54 32', 'Marseille', 'gratuit', 1, r_laforet, now(), now()),

  -- Laforêt — Toulouse
  (u_petit, 'pro', 'Claire', 'Petit', 'Laforêt Capitole',
   'Votre partenaire immobilier à Toulouse et ses alentours depuis 6 ans.',
   '06 22 33 44 55', 'Toulouse', 'gratuit', 6, r_laforet, now(), now()),

  -- Indépendants (sans réseau)
  (u_indep1, 'pro', 'Thomas', 'Roux', 'Roux Immobilier',
   'Agence familiale indépendante spécialisée dans les maisons de caractère en Bretagne.',
   '06 61 72 83 94', 'Rennes', 'gratuit', 7, null, now(), now()),

  (u_indep2, 'pro', 'Anne', 'Moreau', null,
   'Agent immobilier indépendante, je travaille principalement sur Lille et la métropole.',
   '06 45 67 89 01', 'Lille', 'gratuit', 2, null, now(), now())

ON CONFLICT (id) DO UPDATE SET
  type             = EXCLUDED.type,
  prenom           = EXCLUDED.prenom,
  nom              = EXCLUDED.nom,
  agence           = EXCLUDED.agence,
  bio              = EXCLUDED.bio,
  telephone        = EXCLUDED.telephone,
  ville            = EXCLUDED.ville,
  plan             = EXCLUDED.plan,
  annonces_actives = EXCLUDED.annonces_actives,
  reseau_id        = EXCLUDED.reseau_id,
  updated_at       = now();


-- ── Résultat ─────────────────────────────────────────────────
RAISE NOTICE '✓ 4 réseaux insérés (dont 1 sans agent)';
RAISE NOTICE '✓ 6 agents affiliés à des réseaux (Century21×2, Orpi×2, Laforêt×2)';
RAISE NOTICE '✓ 2 agents indépendants';

END $$;
