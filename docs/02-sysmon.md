# Brique 2 — Sysmon (visibilité endpoint Windows)

## Objectif

Avoir une VM Windows isolée, dotée de Sysmon (télémétrie process/fichier/réseau
fine) et d'un agent Wazuh actif, avec les événements Sysmon qui remontent
jusqu'au manager et sont indexés.

## Décisions

- **Hyperviseur** : Hyper-V (feature activée sur l'hôte, nécessite un
  redémarrage). Choisi plutôt que VirtualBox/VMware pour son intégration
  native à Windows 11 Pro et **PowerShell Direct**, qui permet d'exécuter des
  commandes dans la VM sans dépendre du réseau ni d'une session graphique.
- **VM** : `victim-win10`, **Generation 1 (BIOS)**, 2 vCPU, 6 Go RAM
  dynamique (min 2 Go), disque 64 Go, réseau `Default Switch` (NAT — accès
  internet pour les téléchargements, pas d'exposition au LAN physique).
  - Une première tentative en **Generation 2 (UEFI + Secure Boot)** a échoué
    avec `The boot loader failed` sur le lecteur DVD, de manière reproductible
    même après désactivation du Secure Boot. Bascule en Generation 1 : boot
    immédiat et installation sans accroc. Cause exacte non investiguée
    (probablement liée à l'ISO source) — à garder en tête si une VM Gen2 est
    nécessaire plus tard (ex. contraintes TPM pour un lab Windows 11).
- **OS** : Windows 10 Professionnel (ISO multi-édition local), compte local
  (pas de compte Microsoft), pour rester hors-ligne autant que possible.
- **Sysmon** : v15.21, config [SwiftOnSecurity](https://github.com/SwiftOnSecurity/sysmon-config)
  (référence communautaire, bon compromis signal/bruit pour démarrer).
- **Agent Wazuh** : v4.14.6 (aligné sur le manager), installé via MSI avec
  enrôlement automatique (`WAZUH_MANAGER`, `WAZUH_REGISTRATION_SERVER`)
  pointant sur l'IP de l'hôte côté `Default Switch` (`172.22.96.1` — passerelle
  vue depuis la VM, où Docker publie les ports du manager).

## Mise en œuvre

1. Activer Hyper-V (`Enable-WindowsOptionalFeature -FeatureName
   Microsoft-Hyper-V-All`) → redémarrage.
2. Créer la VM (script [`scripts/create-victim-vm.ps1`](../scripts/create-victim-vm.ps1),
   adapté en Gen1 suite à l'échec Gen2).
3. Installer Windows 10 Pro manuellement via la console Hyper-V (étape
   graphique, non scriptable).
4. Depuis l'hôte, via **PowerShell Direct** (`Invoke-Command -VMName
   victim-win10 -Credential ...`) :
   - Télécharger et installer Sysmon avec la config SwiftOnSecurity.
   - Télécharger et installer l'agent Wazuh (MSI, enrôlement auto).
   - Ajouter au `ossec.conf` de l'agent :
     ```xml
     <localfile>
       <location>Microsoft-Windows-Sysmon/Operational</location>
       <log_format>eventchannel</log_format>
     </localfile>
     ```
   - Démarrer le service `WazuhSvc`.

## Test réalisé

1. `agent_control -l` côté manager → `victim-win10`, **Active**.
2. Requête sur l'indexer (`_search` sur `wazuh-alerts-*`, filtré
   `agent.name:victim-win10`) → **521 documents** au total, incluant :
   - des événements Sysmon décodés (`data.win.eventdata.image`,
     `processGuid`, hachages MD5/SHA256/IMPHASH, chaîne parent/enfant) —
     **84 événements** spécifiquement du canal
     `Microsoft-Windows-Sysmon/Operational`.
   - des événements de sécurité Windows natifs (ouverture/fermeture de
     session, `eventID 4624/4634`) corrélés par Wazuh avec mapping **MITRE
     ATT&CK T1078 (Valid Accounts)**.
   - un scan **SCA** (Security Configuration Assessment) automatique au
     démarrage de l'agent (CIS Windows 10 Benchmark).
3. Action marqueur (`whoami /all` déclenché via PowerShell Direct) pour
   valider le pipeline en direct — les événements Sysmon associés (création
   de processus PowerShell, écriture de fichiers temporaires) apparaissent
   bien horodatés en cohérence avec l'action.

**Résultat : télémétrie endpoint fonctionnelle de bout en bout — Sysmon →
canal d'événements Windows → agent Wazuh → manager → indexeur, avec règles et
mapping MITRE déjà actifs par défaut.**

## Limites de cette étape

- Cause du blocage Gen2/Secure Boot non élucidée — si une VM Gen2 est requise
  plus tard, prévoir du temps pour diagnostiquer (ISO alternative, template
  Secure Boot différent).
- Un agent résiduel `rocky-alpha` (jamais connecté) trouvé enregistré sur le
  manager, probablement d'un essai précédent — à nettoyer si besoin, sans
  impact sur ce test.
- Aucune attaque MITRE simulée encore à ce stade : cette brique valide la
  **visibilité**, pas encore la **détection d'une chaîne d'attaque**. Cela
  viendra en s'appuyant sur cette base une fois Suricata (réseau) branché.
