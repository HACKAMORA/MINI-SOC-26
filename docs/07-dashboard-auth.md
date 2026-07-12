# Brique 8 — Authentification du dashboard

## Objectif

Première étape concrète du plan multi-utilisateurs
(`~/.claude/plans/iterative-shimmying-lighthouse.md`) : le dashboard n'avait
jusqu'ici aucune authentification — n'importe qui avec l'URL voyait tout.
Cette brique ajoute un vrai login, avec une base pour rattacher chaque
compte à son propre groupe d'agents Wazuh (isolation implémentée en
brique 9).

## Décisions

- **Auth.js (NextAuth) v5** avec un provider **Credentials** (email +
  mot de passe), session **JWT** (pas de session en base — plus simple
  pour un MVP, pas besoin des tables `Account`/`Session` de l'adapter
  Prisma standard).
- **Prisma + SQLite** (`dashboard/prisma/dev.db`, non versionné) pour la
  table `User`. Choisi pour zéro infra supplémentaire à faire tourner en
  local ; migration vers Postgres triviale plus tard si besoin (un seul
  provider à changer dans `schema.prisma`).
- **`wazuhGroup` dérivé à la création, jamais modifiable côté client** —
  calculé depuis l'email (`user-<préfixe-email>`) dans `prisma/seed.ts`.
  Prépare la brique 9 (isolation des données Wazuh par utilisateur) : la
  colonne existe déjà et est mise dans le JWT, mais rien ne l'utilise
  encore pour filtrer les requêtes.
- **Pas de page d'inscription** — création de compte uniquement via un
  script serveur (`prisma/seed.ts`), cohérent avec un usage "accès sur
  demande à l'administrateur" plutôt qu'un self-service public pour cette
  étape.

## Mise en œuvre

```bash
cd dashboard
npx prisma migrate dev --name init   # crée prisma/dev.db + la table User
npx tsx prisma/seed.ts <email> <mot-de-passe> [nom]   # crée/màj un compte
npm run dev
```

Fichiers clés :
- `auth.config.ts` — config **edge-safe** (pas de Prisma/bcrypt), consommée
  par `middleware.ts`
- `auth.ts` — config complète (provider Credentials + Prisma), consommée
  par la route API `app/api/auth/[...nextauth]/route.ts`
- `middleware.ts` — protège toutes les routes sauf `/login` et
  `/api/auth/*`
- `app/(app)/` — route group Next.js regroupant toutes les pages
  authentifiées (avec sidebar/topbar) ; `app/login/` reste en dehors, page
  autonome sans sidebar

## Incident technique : middleware et Edge Runtime

Le middleware Next.js tourne par défaut dans l'**Edge Runtime**, qui ne
supporte pas les modules Node natifs. En important directement `auth.ts`
(qui charge Prisma + bcrypt) dans `middleware.ts`, le build échouait
(`A Node.js module is loaded ('node:url')... not supported in the Edge
Runtime`). **Fix** : pattern standard Auth.js — séparer la config en un
fichier edge-safe (`auth.config.ts`, sans provider) et un fichier complet
(`auth.ts`, qui étend le premier en ajoutant le provider Credentials). Le
middleware n'importe que la version edge-safe.

## Incident technique : Prisma 7 et les adaptateurs de driver

Prisma 7 (dernière version majeure, sortie récemment) a changé
l'architecture : `new PrismaClient()` sans argument ne fonctionne plus,
un **adaptateur de driver** est désormais obligatoire même pour SQLite en
local. Résolu avec `@prisma/adapter-better-sqlite3` — l'URL de connexion
(`file:./dev.db`) doit être passée à l'adaptateur avec le préfixe `file:`
retiré (`better-sqlite3` attend un chemin de fichier brut, pas une chaîne
de connexion Prisma classique).

## Test réalisé

Vérification de bout en bout via Playwright headless (navigation +
captures + console) :
1. Visite de `/` sans session → redirection vers
   `/login?callbackUrl=...` (HTTP 200 sur `/login`, confirmé par l'URL
   finale).
2. Tentative avec mauvais mot de passe → reste sur `/login`, message
   d'erreur « Email ou mot de passe incorrect. » affiché.
3. Tentative avec le bon mot de passe → redirection vers `/`, dashboard
   affiché avec les vraies données Wazuh (485 alertes/24h à ce moment).
4. Menu utilisateur (coin supérieur droit) → affiche l'email du compte
   connecté et un bouton « Se déconnecter » fonctionnel.
5. Aucune erreur dans la console navigateur sur l'ensemble du parcours.

**Résultat : authentification fonctionnelle de bout en bout, base posée
pour l'isolation par utilisateur (brique 9).**

## Limites de cette étape

- Un seul compte créé pour l'instant, pas de gestion des comptes
  (suppression, changement de mot de passe) depuis l'interface — tout se
  fait via `prisma/seed.ts` en ligne de commande.
- `wazuhGroup` existe et est propagé dans la session JWT, mais **aucune
  route API ne l'utilise encore pour filtrer les données** — c'est
  exactement l'objet de la brique 9, à ne pas considérer comme fait.
- Pas de vérification d'email, pas de "mot de passe oublié" — hors
  périmètre MVP.
