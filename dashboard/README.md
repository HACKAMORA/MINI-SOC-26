# Mini-SOC — Dashboard

Interface unifiée du Mini-SOC : vue d'ensemble des alertes, agents, et
topologie réseau. Consomme l'API Wazuh (indexer + manager) en lecture seule,
côté serveur (Next.js API routes), pour ne jamais exposer les identifiants
au navigateur.

Voir [docs/06-dashboard.md](../docs/06-dashboard.md) pour les décisions
d'architecture et le détail des pages.

## Démarrage

```bash
cp .env.example .env.local   # renseigner les identifiants Wazuh réels
npm install
npm run dev
```

Ouvrir http://localhost:3000. Nécessite la stack Wazuh (`wazuh/single-node`)
démarrée au préalable.

## Pages

- `/` — vue d'ensemble (compteurs par sévérité, alertes récentes, agents)
- `/alerts` — toutes les alertes, filtrables (sévérité, agent, source)
- `/agents` — liste des agents Wazuh et leur statut
- `/topology` — graphe de l'infrastructure, liens animés en direct selon
  les alertes réelles ; distingue clairement les nœuds réels des nœuds
  simulés (parc illustratif)

## Variables d'environnement

Voir `.env.example`. Jamais commitées (`.env*` est dans `.gitignore`).
