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
| 2 | Sysmon | Visibilité fine endpoint Windows | ⏳ à venir |
| 3 | Suricata | Détection réseau | ⏳ à venir |
| 4 | MISP | Threat Intel — enrichissement | ⏳ à venir |
| 5 | TheHive + Cortex | Gestion et enrichissement automatique des incidents | ⏳ à venir |

Chaque brique est ajoutée une fois la précédente maîtrisée et testée. Voir
[docs/](docs/) pour le journal détaillé de chaque étape.

## Environnement

- **SIEM (Wazuh)** : Docker Compose, sur cette machine hôte (Windows 11 + Docker Desktop)
- **Victime** : VM Windows isolée (Hyper-V) — à provisionner en brique 2
- **Attaquant** : Kali via WSL2

## Démarrage rapide — Wazuh

```bash
cd wazuh/single-node
docker compose -f generate-indexer-certs.yml run --rm generator   # une seule fois
docker compose up -d
```

Dashboard : https://localhost — utilisateur `admin`, mot de passe par défaut
`SecretPassword` (voir `docker-compose.yml`, à changer avant tout usage exposé).

## Journal des briques

- [docs/01-wazuh-siem.md](docs/01-wazuh-siem.md)
