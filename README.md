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
| 5 | TheHive + Cortex | Gestion et enrichissement automatique des incidents | ⏳ à venir |

Chaque brique est ajoutée une fois la précédente maîtrisée et testée. Voir
[docs/](docs/) pour le journal détaillé de chaque étape.

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

## Journal des briques

- [docs/01-wazuh-siem.md](docs/01-wazuh-siem.md)
- [docs/02-sysmon.md](docs/02-sysmon.md)
- [docs/03-suricata.md](docs/03-suricata.md)
- [docs/04-misp.md](docs/04-misp.md)
