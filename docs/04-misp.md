# Brique 4 — MISP (Threat Intelligence)

## Objectif

Disposer d'une plateforme de renseignement sur la menace (indicateurs de
compromission, taxonomies, galaxies MITRE ATT&CK) qui pourra, dans une étape
ultérieure, enrichir automatiquement les alertes Wazuh/Suricata (ex : IP
source d'un scan croisée avec une feed MISP de mauvaise réputation).

## Décisions

- **Déploiement** : Docker Compose, dépôt officiel
  [`MISP/misp-docker`](https://github.com/MISP/misp-docker) cloné dans
  `misp/` (historique git retiré, comme pour `wazuh/single-node`, pour que
  les fichiers soient suivis directement par ce repo).
- **Version** : MISP core v2.5.42 (dernier tag stable au 2026-07-10).
- **Ports** : `8081`/`8443` au lieu des ports par défaut `80`/`443`, déjà
  occupés par le dashboard Wazuh sur cette machine. `BASE_URL` ajusté en
  conséquence (`https://localhost:8443`).
- **Identité lab** : `ADMIN_EMAIL=admin@mini-soc.local`,
  `ADMIN_ORG=MINI-SOC`, le reste (clés de chiffrement, mot de passe MySQL,
  Redis, GPG) auto-généré par le script d'initialisation officiel.

## Mise en œuvre

```bash
cd misp
cp template.env .env
# éditer .env : BASE_URL, CORE_HTTP_PORT, CORE_HTTPS_PORT, ADMIN_EMAIL, ADMIN_ORG
docker compose up -d
```

Composants démarrés : `misp-core` (app + nginx), `db` (MariaDB), `redis`,
`misp-modules` (enrichissement), `mail` (relais SMTP local, non configuré
pour un envoi réel).

Premier démarrage : ~10-15 minutes (import des taxonomies, galaxies MITRE
ATT&CK, warninglists, object templates en base — normal, pas un
disfonctionnement).

Mot de passe admin initial non fourni en clair dans les logs pour cette
version → défini explicitement via l'outil CLI intégré :
```bash
docker exec misp-misp-core-1 /var/www/MISP/app/Console/cake user change_pw admin@mini-soc.local '<mot de passe>'
```

## Test réalisé

1. `docker ps` → `misp-db`, `misp-redis`, `misp-modules` **healthy** dès le
   démarrage ; `misp-core` reste **unhealthy** en apparence (voir limite
   ci-dessous), mais les logs confirment explicitement
   `MISP is now live. Users can now log in.`
2. `curl -sk https://localhost:8443/users/login` → **HTTP 200**, page de
   login servie correctement.
3. `cake user list` → confirme l'utilisateur admin
   (`admin@mini-soc.local`) présent en base.
4. Mot de passe réinitialisé via CLI sans erreur.

**Résultat : instance MISP fonctionnelle et accessible, prête à recevoir des
événements/indicateurs et, plus tard, à être interrogée par Wazuh pour
l'enrichissement des alertes.**

## Limites de cette étape

- **Healthcheck Docker cassé (cosmétique)** : `docker-compose.yml` définit le
  healthcheck comme `curl ${BASE_URL}/users/heartbeat`. Comme `BASE_URL`
  pointe vers le port **externe** (`8443`, celui exposé côté hôte), le curl
  exécuté *à l'intérieur* du conteneur échoue puisque nginx y écoute en
  interne sur le port 443. Le conteneur reste marqué "unhealthy" alors que
  l'application fonctionne réellement (vérifié indépendamment par requête
  HTTP directe). Sans impact fonctionnel ici (rien ne dépend de ce
  `service_healthy`), mais à corriger si un `depends_on: condition:
  service_healthy` venait à s'appuyer dessus.
- Pas encore d'intégration avec Wazuh (le module MISP de Wazuh pour
  corréler automatiquement IOC ↔ alertes n'est pas branché) — prévu comme
  suite logique une fois MISP peuplé d'au moins quelques indicateurs de
  test.
- Aucune feed threat intel externe encore configurée (MISP démarre "vide" —
  normal, à peupler manuellement ou via feeds communautaires dans un usage
  réel).
- Relais mail (`mail`) présent mais non configuré pour un envoi réel — les
  notifications MISP par email ne fonctionneront pas telles quelles.
