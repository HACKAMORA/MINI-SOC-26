# Brique 5 — TheHive + Cortex (gestion et enrichissement d'incidents)

## Objectif

Boucler le moteur de détection avec un vrai outil de gestion d'incidents :
TheHive pour créer/suivre des cas (le travail concret d'un analyste — ouvrir
une investigation, y attacher des observables, documenter), et Cortex pour
lancer des analyseurs automatiques sur ces observables (enrichissement).

## Décisions

- **Déploiement** : Docker Compose, dépôt officiel
  [`StrangeBeeCorp/docker`](https://github.com/StrangeBeeCorp/docker),
  profil **`testing`** (le seul profil mono-machine du dépôt — les profils
  `prod1-*`/`prod2-*` supposent une infra multi-hôtes, hors sujet pour un
  lab). Historique git retiré comme pour `wazuh/` et `misp/`.
- **Versions** (fichier `versions.env`) : Cassandra 4.1.11, Elasticsearch
  8.19.15, TheHive 5.7.1, Cortex 4.0.1.
- **Pas de Nginx** : le profil officiel inclut un reverse-proxy Nginx en
  HTTPS sur le port 443 — déjà occupé par le dashboard Wazuh sur cette
  machine. Service retiré du `docker-compose.yml` ; accès direct en HTTP sur
  les ports natifs `9000` (TheHive) et `9001` (Cortex).
- **Pas de directives `user: ${UID}:${GID}`** : présentes dans le compose
  officiel pour que les fichiers créés dans les volumes appartiennent à
  l'utilisateur hôte sous Linux. Retirées ici — les UID/GID renvoyés par
  `id -u`/`id -g` sous Git Bash sur Windows sont des identifiants Windows
  traduits, sans rapport avec un UID Linux réel côté conteneur ; les garder
  aurait risqué des erreurs de permissions.
- **Initialisation manuelle** (pas le script `init.sh` officiel) : ce script
  est interactif (`read -p` pour le hostname) et suppose un shell Linux
  classique — incompatible avec une exécution non-interactive. Génération
  manuelle des mêmes fichiers (mot de passe Elasticsearch, `secret.conf` de
  TheHive et Cortex, `.env`) en suivant exactement la même logique.

## Mise en œuvre

```bash
cd thehive/testing
# génération manuelle de index.conf / secret.conf / .env (voir docs/README du dépôt)
docker compose up -d
```

Composants démarrés : `cassandra` (stockage), `elasticsearch` (indexation),
`thehive` (application), `cortex` (moteur d'analyse).

### Incident opérationnel : OOM lié à une limite mémoire WSL2 oubliée

Au premier démarrage, `elasticsearch` mourait en boucle (`exit code 137` =
tué par le noyau pour dépassement mémoire, healthcheck jamais atteint). Le
conteneur Docker Desktop tourne dans une VM WSL2, et un fichier
`%USERPROFILE%\.wslconfig` limitait cette VM à **4 Go de RAM au total** —
réglage fait lors du dépannage réseau de la brique 3 (tentative de faire
communiquer Kali WSL2 et la VM victime) et jamais annulé depuis. Avec Wazuh
+ MISP + Cassandra + Elasticsearch simultanément, 4 Go est très insuffisant.
**Fix** : `.wslconfig` remonté à `memory=24GB` (sur 64 Go hôte), puis
`wsl --shutdown` + redémarrage de Docker Desktop. Résolu immédiatement.

Un second incident sans rapport (Docker Desktop devenu injoignable, erreurs
500 sur toutes les commandes `docker`) a nécessité un redémarrage complet de
Docker Desktop — tous les conteneurs (`restart: unless-stopped`) sont
repartis automatiquement sans perte d'état.

## Test réalisé

1. `docker compose ps` → les 4 services **healthy**.
2. `curl http://localhost:9000/thehive/api/status` et
   `curl http://localhost:9001/cortex/api/status` → **HTTP 200** chacun.
3. Assistants de premier démarrage complétés dans le navigateur : organisation
   `admin` créée dans TheHive, organisation `cortex` créée dans Cortex.
4. Utilisateur de service `thehive-service` créé dans Cortex (profil
   `analyze`), clé API générée.
5. Serveur Cortex ajouté dans TheHive (Gestion de la plateforme →
   Connecteurs → Cortex), URL interne Docker `http://cortex:9001/cortex`.
6. **Test de connexion** depuis l'interface TheHive → succès (« La
   configuration Cortex a été testée avec succès »), confirmé côté serveur
   dans les logs `thehive` :
   ```
   PUT /thehive/api/v1/admin/config/cortex → 204
   cortex.servers config was updated, current=[cortex-local] - added=[cortex-local]
   POST /thehive/api/v1/admin/config/cortex/test → 200
   ```

**Résultat : TheHive et Cortex fonctionnels et reliés entre eux — la brique
gestion/enrichissement d'incidents est opérationnelle.** Les 5 briques du
moteur de détection sont maintenant en place (Wazuh, Sysmon, Suricata, MISP,
TheHive+Cortex).

## Limites de cette étape

- Aucun analyseur Cortex encore configuré/activé (ex. VirusTotal, dépendent
  de clés API tierces) — pour l'instant seule la connectivité TheHive↔Cortex
  est validée, pas encore un enrichissement réel d'observable.
- MISP (brique 4) n'est pas encore connecté à TheHive (même principe que
  Cortex : ajouter un serveur MISP dans Gestion de la plateforme →
  Connecteurs → MISP). Prochaine étape logique avant la plateforme finale.
- Pas de création de cas de test encore réalisée pour valider le flux complet
  alerte → cas → investigation → clôture.
