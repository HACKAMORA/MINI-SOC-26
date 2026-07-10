# Brique 6 — Dashboard custom (plateforme unifiée)

## Objectif

Les 5 briques précédentes forment un moteur de détection fonctionnel, mais
chacune a sa propre interface (Wazuh, MISP, TheHive/Cortex). Cette étape
construit une interface unique, pensée comme un vrai produit, qui agrège les
données en lecture seule — première pierre de la « plateforme » évoquée dans
le README, à étendre avec MISP/TheHive dans une itération future.

## Décisions

- **Stack** : Next.js 16 (App Router) + React 19 + Tailwind CSS v4 +
  TypeScript. Toutes les requêtes vers l'API Wazuh passent par des routes
  serveur (`app/api/*/route.ts`) — les identifiants et les certificats
  auto-signés ne quittent jamais le serveur, le navigateur ne voit que du
  JSON déjà nettoyé.
- **Node.js mis à niveau** (18 → 24 LTS via winget) : Next.js 16 exige
  Node ≥ 20 ; la version installée sur cette machine datait d'un usage WSL
  antérieur.
- **Design** : thème sombre, palette indigo/violet + couleurs de sévérité
  (rouge/orange/bleu/vert), typographie Geist — inspiré d'une référence
  Figma « enterprise-grade security » fournie par l'utilisateur, adapté aux
  conventions des dashboards SOC (thème sombre pour un usage prolongé).
- **Périmètre v1** : lecture seule. Vue d'ensemble (compteurs par
  sévérité, alertes récentes, agents), page Alertes filtrable, page Agents,
  et une page **Topologie** (graphe réseau animé).

## Topologie réseau : réel + simulé, explicitement distingués

À la demande de l'utilisateur, la page `/topology` mélange deux types de
nœuds :
- **Réels** : hôte (attaquant + capteur Suricata), `victim-win10`,
  `wazuh-manager`, MISP, TheHive+Cortex — positions fixes, mais statut et
  alertes tirés en direct de l'indexer/API Wazuh.
- **Simulés** : 5 postes fictifs (PC-Comptabilité, PC-RH, PC-Direction,
  serveur de fichiers, imprimante) pour donner l'impression d'un vrai parc
  d'entreprise sans le déployer réellement.

Pour ne jamais induire en erreur (l'utilisateur comme un futur relecteur —
encadrant, jury), les nœuds/liens simulés sont **systématiquement**
distingués visuellement (bordure en pointillés, badge « simulé », pas
d'animation colorée par sévérité) et une légende explicite est affichée en
haut de la page. Les liens vers MISP/TheHive sont marqués « prévu » : ils
représentent le travail d'intégration restant (brique suivante), pas une
fonctionnalité déjà câblée.

Bibliothèque : [`@xyflow/react`](https://reactflow.dev/) (React Flow) —
composants de nœuds/arêtes custom, pas d'auto-layout (positions calculées à
la main pour un rendu stable et prévisible).

## Incidents techniques rencontrés

1. **`fetch` de Next.js incompatible avec un dispatcher TLS custom** :
   nécessaire pour accepter les certificats auto-signés de l'indexer/API
   Wazuh. Passer un `https.Agent` natif via l'option `agent` échoue
   silencieusement (« fetch failed ») ; passer un dispatcher `undici`
   installé séparément lève `InvalidArgumentError: invalid onRequestStart
   method` (conflit de version avec l'undici interne à Next.js/Turbopack).
   **Fix** : contourner complètement `fetch` pour ces appels serveur et
   utiliser `node:https` directement (voir `lib/wazuh.ts`) — aucun
   intermédiaire, aucun risque de conflit de version.
2. **Port 55000 (API Wazuh) injoignable depuis l'hôte** malgré un mapping
   Docker valide. Cause : Windows avait placé ce port dans une **plage
   d'exclusion réservée par Hyper-V** (`netsh interface ipv4 show
   excludedportrange`), probablement suite aux manipulations réseau des
   briques précédentes. Contourné en republiant l'API sur le port hôte
   `58000` plutôt que de toucher aux réservations Hyper-V (risque pour le
   réseau des VMs).
3. **Champ `select=os` invalide** pour l'endpoint `/agents` de l'API
   Wazuh — seuls des sous-champs comme `os.name`/`os.platform` sont
   acceptés. Corrigé après lecture du message d'erreur (utile : l'API
   Wazuh liste les champs valides dans sa réponse 400).

## Test réalisé

Vérification visuelle en conditions réelles via Playwright headless
(navigation + captures d'écran + vérification de la console navigateur) :
- `/` : compteurs corrects (1378 alertes/24h, 4 critiques), tableau
  d'alertes et panneau agents peuplés avec les vraies données.
- `/alerts` : filtres fonctionnels, pagination des résultats.
- `/topology` : graphe rendu correctement, liens réels animés en couleur
  selon la sévérité (vert = faible, cohérent avec le trafic Suricata en
  cours), nœuds simulés visuellement distincts, légende présente.
- Aucune erreur dans la console navigateur sur les 3 pages.

**Résultat : première brique de la plateforme unifiée opérationnelle,
consommant les vraies données Wazuh en lecture seule, avec un rendu visuel
conforme à l'objectif « produit professionnel ».**

## Limites de cette étape

- Lecture seule : pas encore d'action possible depuis le dashboard (créer
  un cas TheHive depuis une alerte, interroger MISP pour un IOC, etc.) —
  périmètre v1 volontairement restreint, voir README pour la suite.
- Pas d'authentification sur le dashboard lui-même (identifiants Wazuh
  côté serveur uniquement, mais l'interface est accessible sans connexion
  — acceptable pour un lab local, à traiter avant toute exposition réseau).
- Node du dashboard non versionné dans les identifiants d'agent Wazuh —
  la page Topologie ne montre que `victim-win10` comme point réel du parc,
  les autres proviennent uniquement de leur définition statique
  (`lib/topology.ts`).
