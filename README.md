# Mini-SOC — Simulation de détection et réponse à incident

Environnement de Security Operations Center simulant une petite entreprise :
détection, investigation et documentation d'une chaîne d'attaque complète
reproduisant des techniques MITRE ATT&CK réelles.

Objectif : reproduire le travail réel d'un analyste SOC — recevoir une alerte,
l'enrichir de contexte, ouvrir une investigation, produire un rapport d'incident.
Pas juste "installer des outils".

## Architecture des briques (construction progressive)

| # | Brique | Rôle | Statut |
|---|--------|------|--------|
| 1 | Wazuh | SIEM — collecte et corrélation de logs | ✅ déployé |
| 2 | Sysmon | Visibilité fine endpoint Windows | ✅ déployé |
| 3 | Suricata | Détection réseau | ✅ déployé |
| 4 | MISP | Threat Intel — enrichissement | ✅ déployé |
| 5 | TheHive + Cortex | Gestion et enrichissement automatique des incidents | ✅ déployé |
| 6 | Dashboard custom | Plateforme unifiée (Next.js), vue alertes + topologie | ✅ v1 déployée |

Chaque brique est ajoutée une fois la précédente maîtrisée et testée. Voir
[docs/](docs/) pour le journal détaillé de chaque étape.

Les 5 briques du moteur de détection sont en place, et une première version
du dashboard unifié consomme déjà les données Wazuh en lecture seule.

### Phase 2 — plateforme multi-utilisateurs

Plan complet : [docs/00-platform-plan.md](docs/00-platform-plan.md).
Objectif : que plusieurs personnes utilisent le Mini-SOC en même temps,
chacune avec son propre labo isolé.

| # | Brique | Objectif | Statut |
|---|--------|----------|--------|
| 7 | Hébergement cloud | Migrer sur un serveur Linux dédié (fin de la fragilité Hyper-V/WSL2) | ⏳ en attente (GitHub Student Pack approuvé, actif dans 72h) |
| 8 | Authentification dashboard | Auth.js + Prisma/SQLite, login requis | ✅ déployé |
| 9 | Isolation Wazuh par utilisateur | Groupes d'agents + filtrage serveur | ⏳ à venir |
| 10 | Orchestrateur de labos | Conteneurs à la demande, isolés par utilisateur | ⏳ à venir |

## Environnement

- **SIEM (Wazuh)** : Docker Compose, sur cette machine hôte (Windows 11 + Docker Desktop)
- **Victime** : VM Windows isolée (Hyper-V, Gen1), `victim-win10`, Windows 10
  Pro + Sysmon + agent Wazuh
- **Attaquant** : hôte Windows (Nmap) — Kali WSL2 disponible mais non routé
  vers la VM victime (isolation réseau Hyper-V/WSL non contournée, voir
  [docs/03-suricata.md](docs/03-suricata.md))
- **IDS réseau (Suricata)** : sur l'hôte, capture `vEthernet (Default
  Switch)` via dumpcap + analyse par tranches (voir
  `scripts/suricata-capture-loop.ps1`)
- **Threat Intel (MISP)** : Docker Compose, `misp/`, sur cette même machine
- **Gestion d'incidents (TheHive + Cortex)** : Docker Compose,
  `thehive/testing/`, sur cette même machine
- **Dashboard unifié** : Next.js, `dashboard/`, consomme l'API Wazuh en
  lecture seule côté serveur

## Démarrage rapide — Wazuh

```bash
cd wazuh/single-node
docker compose -f generate-indexer-certs.yml run --rm generator   # une seule fois
docker compose up -d
```

Dashboard : https://localhost — utilisateur `admin`, mot de passe par défaut
`SecretPassword` (voir `docker-compose.yml`, à changer avant tout usage exposé).

## Démarrage rapide — MISP

```bash
cd misp
docker compose up -d
```

Interface : https://localhost:8443 — utilisateur `admin@mini-soc.local`
(voir `misp/.env`, mot de passe défini via `cake user change_pw`, non
versionné). Premier démarrage lent (10-15 min, voir
[docs/04-misp.md](docs/04-misp.md)).

## Démarrage rapide — TheHive + Cortex

```bash
cd thehive/testing
docker compose up -d
```

TheHive : http://localhost:9000/thehive — Cortex : http://localhost:9001/cortex.
Voir [docs/05-thehive-cortex.md](docs/05-thehive-cortex.md) pour
l'initialisation (fichiers `secret.conf`/`index.conf`/`.env` non versionnés,
à régénérer localement) et l'incident mémoire WSL2 rencontré.

## Démarrage rapide — Dashboard

```bash
cd dashboard
cp .env.example .env.local   # renseigner les identifiants Wazuh + AUTH_SECRET
npm install
npx prisma migrate dev --name init
npx tsx prisma/seed.ts <email> <mot-de-passe>   # créer un compte
npm run dev
```

Interface : http://localhost:3000 (login requis). Voir
[docs/06-dashboard.md](docs/06-dashboard.md) et
[docs/07-dashboard-auth.md](docs/07-dashboard-auth.md).

## Journal des briques

- [docs/01-wazuh-siem.md](docs/01-wazuh-siem.md)
- [docs/02-sysmon.md](docs/02-sysmon.md)
- [docs/03-suricata.md](docs/03-suricata.md)
- [docs/04-misp.md](docs/04-misp.md)
- [docs/05-thehive-cortex.md](docs/05-thehive-cortex.md)
- [docs/06-dashboard.md](docs/06-dashboard.md)
- [docs/07-dashboard-auth.md](docs/07-dashboard-auth.md)
- [docs/00-platform-plan.md](docs/00-platform-plan.md) — plan de la phase 2 (multi-utilisateurs)
