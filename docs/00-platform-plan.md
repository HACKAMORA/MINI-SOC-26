# Plan — Mini-SOC en plateforme multi-utilisateurs ("chacun son labo")

## Contexte

Le projet Mini-SOC (Wazuh, Sysmon, Suricata, MISP, TheHive+Cortex, dashboard
custom) tourne aujourd'hui entièrement sur le PC Windows personnel de
l'utilisateur, en usage strictement local et mono-utilisateur. L'utilisateur
veut en faire un outil que plusieurs personnes peuvent utiliser en même
temps, chacune avec son propre labo isolé (sa propre cible à attaquer, ses
propres alertes), pas juste un dashboard en lecture partagée.

Deux obstacles structurels rendent ça impossible tel quel :
1. **La "victime" actuelle est une VM Hyper-V Windows réelle** (6 Go RAM,
   64 Go disque) — impossible à dupliquer par utilisateur (coût, licence,
   complexité de provisioning).
2. **Tout tourne sur un PC Windows perso** via Docker Desktop + WSL2 +
   Hyper-V, dont on a subi à plusieurs reprises la fragilité réseau
   (plages de ports réallouées dynamiquement par Windows après chaque
   redémarrage, cassant les mappings Docker — vécu 3 fois ce projet).

Ce plan couvre la bascule vers une architecture multi-tenant réaliste,
construite **brique par brique comme le reste du projet**, avec un test de
bout en bout à chaque étape avant de passer à la suivante.

## Décisions d'architecture (issues de l'analyse)

- **Hébergement** : serveur Linux cloud (élimine complètement la fragilité
  Hyper-V/WSL2 constatée). Candidat recommandé : **Oracle Cloud Free Tier**
  (instances ARM gratuites à vie, 4 vCPU/24 Go RAM sur le tier "Always
  Free") — évite tout engagement budgétaire pour un projet étudiant, tout
  en étant une vraie machine Linux dédiée. À confirmer avec l'utilisateur
  (voir section Décisions à valider).
- **"Victime" par utilisateur** : abandon de Windows/Sysmon pour la version
  multi-tenant — remplacé par des **conteneurs Linux** (service
  volontairement vulnérable + agent Wazuh avec auditd). Techniques MITRE
  couvertes : reconnaissance, brute force, exploitation web, exécution/
  persistance visibles via auditd, mouvement latéral entre conteneurs.
  Perdu par rapport à l'existant : télémétrie Sysmon (arborescence de
  process, registre, LSASS...), tout ce qui est spécifique Windows/AD — à
  documenter explicitement comme réduction de périmètre assumée, pas
  cachée. La VM Windows existante reste utilisable comme démo mono-poste,
  elle n'est pas supprimée.
- **Wazuh reste unique et partagé** (pas une stack par utilisateur — trop
  coûteux). Isolation par **groupes d'agents Wazuh** (`user-<id>`) + filtrage
  strictement côté serveur dans les routes API du dashboard (jamais un
  paramètre client de confiance).
- **Orchestration des labos** : un **service orchestrateur séparé**
  (Node/Express + `dockerode`), pas d'accès direct au socket Docker depuis
  le dashboard public. Le socket Docker est exposé à l'orchestrateur via
  **`docker-socket-proxy`** (tecnativa/docker-socket-proxy), restreint aux
  seuls verbes nécessaires (création/arrêt de conteneurs et réseaux) — la
  mitigation la plus efficace et la mieux connue pour ce niveau de risque,
  non négociable dès la Phase 1.
- **Conteneurs de labo** : images fixes et pré-approuvées uniquement (pas de
  `docker pull` à la demande), `--cap-drop=ALL`, pas de `--privileged`, pas
  de bind mount, pas de `--network host`, réseau Docker dédié par
  utilisateur (`lab-net-<userId>`, isolé des autres tenants et du réseau où
  vivent Wazuh/MISP/TheHive).
- **Authentification du dashboard** (inexistante aujourd'hui) :
  **Auth.js (NextAuth)** + **Prisma/SQLite** (zéro infra supplémentaire à
  faire tourner, migration triviale vers Postgres plus tard si besoin).
  Chaque utilisateur a un `wazuhGroup` dérivé de son id, jamais modifiable
  côté client.

## Feuille de route en briques (construction progressive, comme l'existant)

| # | Brique | Objectif | Test de validation |
|---|--------|----------|---------------------|
| 7 | Hébergement cloud | Migrer Wazuh + MISP + TheHive/Cortex + dashboard sur un serveur Linux dédié | Stack accessible depuis internet, plus aucun souci de port Windows/Hyper-V |
| 8 | Authentification dashboard | Auth.js + Prisma/SQLite, login requis pour accéder au dashboard | Accès refusé sans compte ; connexion fonctionnelle |
| 9 | Isolation Wazuh par utilisateur | Groupes d'agents Wazuh + filtrage serveur systématique dans les routes API | Deux comptes de test ne voient jamais les données l'un de l'autre |
| 10 | Orchestrateur de labos | `docker-socket-proxy` + service orchestrateur + 1 image victime + 1 image attaquant + bouton "Lancer mon labo" | Deux utilisateurs lancent un labo simultanément, isolation réseau et Wazuh vérifiée, arrêt manuel fonctionnel |

**Périmètre explicitement hors Phase 1** (à traiter plus tard) : arrêt
automatique par timeout (reaper cron), plusieurs scénarios de labo,
quotas/facturation, intégration MISP/TheHive par tenant, haute
disponibilité de l'orchestrateur.

## Décisions validées

1. **Fournisseur cloud** : Oracle Cloud Free Tier et Google Cloud (300$/90j)
   ont tous deux échoué à l'inscription (souci de vérification carte
   bancaire côté utilisateur, non résolu). Bascule sur le
   **GitHub Student Developer Pack** (candidature approuvée le
   2026-07-12, avantages actifs sous 72h) — donne accès à des crédits
   cloud (DigitalOcean notamment) sans carte bancaire requise. Brique 7 en
   attente de l'activation.
2. **VM Windows existante (`victim-win10`)** : arrêtée (ressources
   libérées), conservée telle quelle comme démo locale mono-poste
   documentée dans les briques 1-6, indépendante du chantier
   multi-utilisateurs.

## Fichiers clés identifiés (pour la suite de l'implémentation)

- `dashboard/lib/wazuh.ts` — couche d'accès Wazuh à faire évoluer pour
  accepter un filtre de groupe systématique
- `dashboard/app/api/agents/route.ts`, `dashboard/app/api/alerts/route.ts` —
  routes à sécuriser (filtrage serveur par groupe utilisateur)
- `dashboard/package.json` — ajout d'Auth.js, Prisma, dockerode côté
  orchestrateur (nouveau service, pas dans ce package)
- `wazuh/single-node/docker-compose.yml` — référence de style pour les
  futurs `docker-compose.yml` (orchestrateur, proxy socket)
- `docs/` — poursuivre la numérotation (`07-hosting.md`,
  `08-dashboard-auth.md`, etc.) dans le même style que l'existant

## Vérification de bout en bout

Chaque brique suit le même principe déjà appliqué (1 à 6) : déploiement,
test concret documenté dans `docs/0N-*.md`, mise à jour du tableau de statut
dans `README.md`, commit + push. La brique 10 (orchestrateur) doit en plus
être testée avec **deux sessions utilisateur simultanées** pour prouver
l'isolation réseau et Wazuh, pas seulement un scénario mono-utilisateur.
