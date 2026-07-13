# Brique 10 — Orchestrateur de labos ("chacun son labo")

## Objectif

Dernière étape du plan multi-utilisateurs (`docs/00-platform-plan.md`) :
qu'un utilisateur connecté puisse cliquer sur **"Lancer mon labo"** et
obtenir, à la demande, une cible isolée (surveillée par Wazuh, scopée à
son propre groupe — brique 9) et un poste attaquant avec terminal web,
sans jamais donner au dashboard un accès direct au socket Docker.

## Architecture

```
Dashboard (Next.js, sur l'hôte)
   │  POST/DELETE /api/lab (authentifié, résout userId+wazuhGroup depuis la session)
   ▼
Orchestrateur (orchestrator/src, Node/Express, port 4100 lié à 127.0.0.1 uniquement)
   │  dockerode, JAMAIS le socket Docker réel
   ▼
docker-socket-proxy (tecnativa/docker-socket-proxy)
   │  API Docker restreinte à un sous-ensemble de verbes (voir plus bas)
   ▼
Docker Engine (créé : 1 réseau + 2 conteneurs par labo)
   ├── lab-victim-<id>   (wazuh/wazuh-agent, groupe Wazuh de l'utilisateur)
   └── lab-attacker-<id> (image custom, ttyd intégré, terminal web)
```

## Décisions

- **`docker-socket-proxy` en frontal du socket Docker**, jamais monté
  ailleurs. Restreint à `CONTAINERS`, `NETWORKS`, `IMAGES`, `POST`,
  `ALLOW_START`, `ALLOW_STOP` — tout le reste explicitement à `0`,
  notamment **`EXEC=0`** (pas de `docker exec` via l'API, jamais).
- **Terminal web sans `docker exec`** : l'image "attaquant"
  (`orchestrator/attacker-image/Dockerfile`) embarque directement
  [ttyd](https://github.com/tsl0922/ttyd) — le conteneur expose son
  propre terminal, l'orchestrateur n'a jamais besoin d'exécuter quoi que
  ce soit dedans depuis l'extérieur.
- **Images fixes, jamais choisies/tirées à la demande** :
  `wazuh/wazuh-agent:4.14.6` (victime, déjà validé en brique 9) et
  `lab-attacker:latest` (construite localement une fois, référencée par
  tag uniquement — l'orchestrateur ne fait jamais de `docker pull`).
- **Réseau dédié par labo** (`lab-net-<id>`), **la victime est
  double-attachée** (réseau du labo + `single-node_default` pour parler à
  Wazuh), **l'attaquant reste seul sur le réseau du labo** — il ne peut
  jamais atteindre Wazuh/MISP/TheHive directement.
- **Limites de ressources systématiques** : `PidsLimit`, `Memory`,
  `NanoCpus` sur les deux conteneurs ; `CapDrop: ["ALL"]` +
  `no-new-privileges` sur l'attaquant (la victime garde ses capacités par
  défaut — c'est l'image officielle Wazuh, imposer `CapDrop: ALL` risquait
  de casser l'agent sans bénéfice de sécurité clair ici).
- **Enregistrement/désenregistrement automatique de l'agent Wazuh** :
  `WAZUH_AGENT_GROUP=<wazuhGroup>` à la création (brique 9) ; à l'arrêt,
  l'orchestrateur appelle l'API Manager pour supprimer l'agent
  (`orchestrator/src/wazuh.js`), pas seulement arrêter le conteneur —
  évite l'accumulation d'agents "disconnected" fantômes.
- **Le dashboard ne parle jamais directement à Docker** — seulement à
  l'orchestrateur, via une route API Next.js qui résout `userId`/
  `wazuhGroup` depuis la session serveur (jamais un paramètre client).

## Incidents techniques rencontrés

1. **Réseau `Internal: true` empêche toute publication de port.** Le
   premier essai visait l'isolation internet complète du labo (`Internal:
   true`), mais Docker refuse alors totalement le NAT de port — le
   terminal ttyd devenait injoignable depuis l'hôte. **Compromis
   assumé** : réseau standard (bridge, pas `internal`) — l'isolation
   labo-à-labo tient toujours (deux réseaux bridge distincts ne se
   routent pas entre eux par défaut), mais chaque labo garde un accès
   internet sortant. À revisiter avec un pare-feu de sortie applicatif si
   un vrai confinement réseau devient nécessaire.
2. **Port dynamique lu trop tôt.** `attacker.inspect()` juste après
   `.start()` retournait parfois un mapping de port encore vide (race
   condition côté Docker Engine). Corrigé avec une courte boucle de
   nouvelle tentative (jusqu'à 10 × 300 ms) avant d'abandonner.
3. **Suppression d'agent Wazuh rejetée silencieusement.** L'appel
   `DELETE /agents?agents_list=<id>&status=all` échouait avec « Agent is
   not eligible... older_than: 7d » — l'API Wazuh a une seconde protection
   par défaut (l'agent doit être déconnecté depuis 7 jours). Ajout du
   paramètre `older_than=0s` pour contourner explicitement ce délai (un
   labo qu'on vient d'arrêter doit pouvoir être nettoyé immédiatement).
4. **`ttyd` absent des dépôts Debian bookworm.** Remplacé par le binaire
   statique officiel téléchargé depuis les releases GitHub du projet.
5. **Route API ajoutée mais conteneur jamais reconstruit** — piège
   classique : `GET /labs?userId=` répondait `Cannot GET /labs` après
   l'avoir ajoutée au code, simplement parce que l'image Docker de
   l'orchestrateur n'avait pas été reconstruite. Rappel utile : avec
   `build:` dans `docker-compose.yml`, `docker compose up -d --build` est
   nécessaire après chaque changement de code, un simple `restart` ne
   suffit pas.

## Test réalisé

1. **Cycle de vie complet, un utilisateur** : création (réseau + 2
   conteneurs) → agent Wazuh visible et `Active` dans le bon groupe →
   terminal ttyd joignable (`HTTP 200`) → arrêt → conteneurs, réseau
   **et** agent Wazuh tous supprimés (vérifié `agent_control -l` avant/
   après, plus aucune trace).
2. **Intégration dashboard** : bouton "Lancer mon labo" (`/lab`), affiche
   le statut, nom des conteneurs, lien vers le terminal, bouton d'arrêt —
   testé via Playwright (capture d'écran + absence d'erreur console).
3. **Deux utilisateurs simultanés** (`amine4itwork@gmail.com` et
   `test2@example.com`, sessions/contextes navigateur distincts, labos
   lancés en parallèle) :
   - Deux labos avec des IDs, réseaux et conteneurs entièrement
     différents.
   - Vérifié côté Wazuh : `user-amine4itwork` contient exactement 2
     agents (`victim-win10` + son labo), `user-test2` contient
     exactement 2 agents (`test-agent-user2` + son labo) — jamais de
     chevauchement.

**Résultat : un utilisateur authentifié peut provisionner et détruire son
propre labo isolé à la demande, avec télémétrie Wazuh correctement scopée
à son groupe — les 4 briques du plan multi-utilisateurs
(auth, isolation, orchestrateur) sont posées.**

## Limites de cette étape

- **Pas d'arrêt automatique par timeout** — un labo tourne jusqu'à arrêt
  manuel. Explicitement hors périmètre Phase 1 (voir
  `docs/00-platform-plan.md`).
- **État des labos en mémoire dans l'orchestrateur** (pas de base de
  données) — redémarrer le conteneur `lab-orchestrator` fait perdre le
  suivi des labos actifs (les conteneurs eux-mêmes continuent de tourner,
  orphelins). Rencontré concrètement pendant les tests, nettoyé
  manuellement. À corriger avant un usage réel prolongé.
- **Pas de confinement internet sortant** pour les conteneurs de labo
  (voir incident technique n°1).
- **Un seul scénario de labo** (une image victime, une image attaquant) —
  pas encore de choix de scénario.
- **Brique 7 (hébergement cloud) toujours en attente** — tout ceci tourne
  encore sur le PC Windows local ; le passage sur un vrai serveur reste la
  suite logique une fois les crédits GitHub Student Pack actifs.
