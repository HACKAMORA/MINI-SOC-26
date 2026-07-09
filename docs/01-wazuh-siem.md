# Brique 1 — Wazuh (SIEM)

## Objectif

Avoir un SIEM fonctionnel (manager + indexer + dashboard) capable de recevoir
des événements et de les corréler en alertes, avant de brancher la moindre
source de logs réelle.

## Décisions

- **Déploiement** : Docker Compose (stack officielle `wazuh/wazuh-docker`,
  variante `single-node`), plutôt qu'une VM dédiée. Rapide à monter, facile à
  détruire/refaire, réversible à 100% — adapté à une construction itérative
  brique par brique.
- **Version** : v4.14.6 (dernier tag stable au 2026-07-09).
- Un ancien déploiement Wazuh (v4.7.2, non versionné) existait déjà dans
  `C:\Users\Ayman\mini-soc-project`. Il a été arrêté (`docker compose down`)
  et remplacé par ce déploiement versionné dans ce repo, pour repartir sur
  une base propre et suivie par git.

## Mise en œuvre

```bash
cd wazuh/single-node
docker compose -f generate-indexer-certs.yml run --rm generator
docker compose up -d
```

Composants démarrés :
- `single-node-wazuh.manager-1` — moteur de règles / corrélation
- `single-node-wazuh.indexer-1` — stockage des événements (OpenSearch)
- `single-node-wazuh.dashboard-1` — interface web (Kibana-like)

Les certificats TLS générés (`config/wazuh_indexer_ssl_certs/`) sont exclus
du repo via `.gitignore` — ils sont régénérés localement, jamais commités.

## Test réalisé

1. `docker ps` → les 3 conteneurs `Up`, aucun restart loop.
2. `curl -sk https://localhost:443` → `HTTP 302` (redirection vers la page
   de login du dashboard, comportement attendu).
3. `curl -sk -u admin:SecretPassword https://localhost:9200/_cluster/health`
   → `"status":"green"`, `"number_of_nodes":1`, `74 active_shards`, aucun
   shard non assigné.

**Résultat : stack saine, dashboard accessible, pipeline manager → indexer →
dashboard opérationnel.**

## Limites de cette étape

Sans agent connecté, Wazuh ne surveille encore aucune source réelle — les
seules données dans l'indexer sont les logs internes du manager. Il n'y a
donc pas encore d'« attaque » à détecter : c'est l'objet de la brique 2.

## Prochaine étape (brique 2 — Sysmon)

Nécessite une VM Windows isolée comme victime. Hyper-V n'est pas encore
activé sur cette machine (`Get-WindowsOptionalFeature Microsoft-Hyper-V-All`
→ `Disabled`) — l'activer requiert un accès administrateur et un redémarrage,
donc décision à valider explicitement avant de l'activer.

Une fois la VM prête :
1. Installer l'agent Wazuh dessus, vérifier qu'elle apparaît "active" dans
   le dashboard (`Agents` → statut).
2. Installer Sysmon avec une config de référence (ex. SwiftOnSecurity ou
   Olaf Hartong) pour la visibilité process/réseau/registre.
3. Test : déclencher un événement simple et documenté (ex. techniques
   Atomic Red Team T1059 - Command and Scripting Interpreter) depuis Kali
   (WSL2), et vérifier l'apparition de l'alerte correspondante dans Wazuh.
