# JazzImmo (projet terranova)

Plateforme d'annonces immobilières avec carte interactive, comptes vendeurs, abonnements et back-office.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase (Postgres, Auth, Storage), MapLibre GL, Zustand, Stripe (abonnements) et Resend (emails). Hébergement sur Vercel, déploiement automatique depuis la branche `main`.

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run dev
```

Le site tourne sur http://localhost:3000.

## Structure

```
src/
  app/          pages, routes API et server actions (App Router)
  components/   composants React par domaine (map, sidebar, compte, admin…)
  hooks/        hooks client (carte, biens, géolocalisation, POI…)
  lib/          logique partagée : auth, plans, Supabase, géo, rate limiting
  store/        état global Zustand de la carte
  proxy.ts      middleware (session, maintenance, accès admin)
public/         fichiers statiques et pages internes (changelog, roadmap…)
supabase/       scripts SQL et migrations à exécuter dans Supabase
docs/           documentation interne
```

## Base de données

Les scripts SQL de `supabase/` et `supabase/migrations/` s'exécutent dans l'éditeur SQL de Supabase.

## Tâches planifiées

`/api/cron/new-biens` et `/api/cron/price-alerts` attendent un POST avec l'en-tête `x-cron-secret` égal à `CRON_SECRET`.
