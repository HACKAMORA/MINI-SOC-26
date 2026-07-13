# Brique 9 — Isolation Wazuh par utilisateur

## Objectif

Deuxième étape du plan multi-utilisateurs
(`docs/00-platform-plan.md`) : le `wazuhGroup` posé en brique 8 existait
dans la session mais rien ne l'utilisait. Cette brique fait en sorte que
**chaque compte ne voie jamais que les données de son propre groupe
d'agents Wazuh**, avec un filtrage strictement côté serveur — jamais un
paramètre de confiance venant du client.

## Découverte importante : le champ groupe n'existe pas dans l'indexeur

Hypothèse de départ (`docs/00-platform-plan.md`) : filtrer les alertes en
ajoutant `{"match": {"agent.groups": "..."}}` directement dans les
requêtes OpenSearch. **Faux** — vérifié en inspectant un document
d'alerte réel : `agent` n'y contient que `id`, `name`, `ip`, jamais son
groupe. Le groupe n'existe que côté **API du Manager Wazuh**
(`GET /agents?group=...`), pas dans les documents indexés.

**Conséquence sur l'implémentation** : filtrage en deux temps pour
chaque requête protégée —
1. Résoudre le groupe de l'utilisateur en liste d'IDs d'agents via l'API
   Manager (`getAgentIdsForGroup`, nouveau dans `lib/wazuh.ts`).
2. Injecter ces IDs comme `{"terms": {"agent.id": [...]}}` dans la
   requête OpenSearch (alertes, stats), ou passer `?group=` directement à
   l'API Manager (déjà supporté nativement pour `/agents`).

Si le groupe ne contient aucun agent, la fonction retourne un résultat
vide immédiatement (pas de requête OpenSearch inutile, pas de fuite par
défaut en cas de groupe mal résolu).

## Décisions

- **`group` obligatoire, jamais optionnel** dans les signatures de
  `getAlerts`, `getSeverityCounts`, `getAgents` (`lib/wazuh.ts`) — impossible
  d'oublier le filtre par erreur d'appel.
- **Chaque route API** (`/api/alerts`, `/api/stats`, `/api/agents`)
  résout le groupe depuis `auth()` (la session serveur), avec un contrôle
  explicite `if (!session?.user) return 401` en plus de la protection déjà
  assurée par le middleware — défense en profondeur, redondant en usage
  normal mais couvre le cas où le middleware serait un jour mal configuré.
- **Deuxième "locataire" de test** : plutôt que de simuler l'isolation en
  théorie, un vrai deuxième agent Wazuh a été créé pour générer de vraies
  données à isoler — un conteneur Linux léger (`wazuh/wazuh-agent:4.14.6`)
  sur le réseau Docker du manager :
  ```bash
  docker run -d --name test-agent-user2 --network single-node_default \
    -e WAZUH_MANAGER_SERVER=wazuh.manager \
    -e WAZUH_AGENT_NAME=test-agent-user2 \
    -e WAZUH_AGENT_GROUP=user-test2 \
    --restart unless-stopped \
    wazuh/wazuh-agent:4.14.6
  ```
  Env var correcte trouvée en lisant `/etc/cont-init.d/0-wazuh-init` dans
  l'image (`WAZUH_MANAGER_SERVER`, pas `WAZUH_MANAGER` comme tenté
  initialement — `WAZUH_AGENT_GROUP` est nativement supporté par l'image
  officielle, pas besoin de réassignation manuelle après coup).
- **Groupes créés côté manager** : `user-amine4itwork` (contient l'agent
  réel `victim-win10`) et `user-test2` (contient `test-agent-user2`), via
  `agent_groups -a -g <nom>` puis `agent_groups -a -i <id> -g <nom>`.

## Test réalisé

Deux comptes de test connectés séparément (sessions/contextes navigateur
distincts), requêtes API + captures d'écran pour chacun :

| | `amine4itwork@gmail.com` (groupe `user-amine4itwork`) | `test2@example.com` (groupe `user-test2`) |
|---|---|---|
| Agents visibles | `victim-win10` uniquement | `test-agent-user2` uniquement |
| Agents dans les alertes | `victim-win10` uniquement | `test-agent-user2` uniquement |
| Total alertes (échantillon) | 483 | 188 |

Aucun chevauchement — confirmé à la fois par les réponses JSON des routes
API et visuellement (dashboard de `test2@example.com` ne montre que
`test-agent-user2`, jamais `victim-win10`).

Vérification complémentaire de la protection d'accès : requête `curl`
sans cookie de session vers `/api/alerts` → **HTTP 307** redirigé vers
`/login`, jamais de données réelles renvoyées (le test initial via
`fetch()` du navigateur affichait à tort "200" parce que `fetch` suit les
redirections automatiquement — la vraie réponse HTTP avant redirection a
bien été vérifiée directement en `curl`).

**Résultat : isolation des données par utilisateur fonctionnelle et
vérifiée de bout en bout avec deux comptes et deux sources de données
réelles distinctes.**

## Limites de cette étape

- La page `/topology` référence encore un graphe statique
  (`lib/topology.ts`) pensé pour l'usage mono-utilisateur d'origine — elle
  reste fonctionnelle et sûre (les sévérités affichées proviennent des
  routes déjà filtrées), mais visuellement elle ne s'adapte pas encore par
  utilisateur (ex. le nœud `victim-win10` reste affiché même pour un
  utilisateur dont le groupe ne le contient pas). À revoir avec la
  brique 10 quand la topologie deviendra réellement dynamique par labo.
- `test-agent-user2` est un conteneur créé manuellement (`docker run`),
  pas géré par un `docker-compose.yml` — c'est un point de départ pour la
  brique 10 (orchestrateur), pas encore l'automatisation finale.
- Pas encore de UI d'administration pour créer des comptes/groupes —
  toujours via `prisma/seed.ts` + CLI Wazuh manuellement.
