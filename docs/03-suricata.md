# Brique 3 — Suricata (détection réseau)

## Objectif

Détecter du trafic réseau suspect (scan, reconnaissance) dirigé vers la VM
victime, et faire remonter ces alertes dans Wazuh aux côtés des événements
Sysmon (brique 2).

## Décisions et détours (importants pour comprendre l'architecture finale)

Cette brique a demandé plusieurs changements de plan suite à des blocages
techniques réels — documentés ici plutôt qu'effacés, ils font partie du
travail d'investigation normal en SOC/infra.

### 1. Topologie réseau attaquant → victime

Le plan initial (Kali via WSL2 comme attaquant) s'est heurté à une
**isolation réseau volontaire de Windows** entre les réseaux virtuels
`Default Switch` (VM Hyper-V) et `WSL (Hyper-V firewall)` (WSL2) :
- Activer le routage IP hôte (`IPEnableRouter` + `netsh forwarding`,
  nécessitant un redémarrage) n'a pas suffi.
- Placer la VM victime directement sur le switch de WSL2 (carte réseau
  secondaire, IP statique dans le même sous-réseau) a échoué aussi —
  `Destination Host Unreachable` même avec un port TCP explicitement
  autorisé. Le switch `WSL (Hyper-V firewall)` filtre le trafic non-WSL par
  conception (son nom l'indique).
- Le mode réseau **mirrored** de WSL2 (`.wslconfig`) ne mappe pas non plus
  les switches Hyper-V internes.
- Complication additionnelle découverte en cours de route : les sous-réseaux
  NAT de `Default Switch` et `WSL switch` **changent après chaque
  redémarrage de l'hôte** (comportement Hyper-V connu, non documenté
  clairement par Microsoft) — l'IP de la VM victime et celle de Kali WSL ont
  changé plusieurs fois pendant les tests.

**Décision finale** : l'attaquant est l'**hôte Windows lui-même** (Nmap
installé dessus), qui atteint la VM victime sans problème via `Default
Switch` — combinaison déjà validée dans la brique 2. Ça sacrifie un peu de
réalisme (l'attaquant et le poste d'analyse SOC sont la même machine) mais
élimine un point de blocage réseau qui aurait consommé un temps disproportionné.
Kali WSL2 reste disponible pour des usages ne nécessitant pas d'atteindre la
VM (ex. brique MISP plus tard).

### 2. Crash de Suricata en mode capture live

Le build Windows officiel de Suricata 7.0.7 (MSI) **crashe systématiquement**
(Access Violation, `0xc0000005` dans `msvcrt.dll`) dès qu'il tente d'ouvrir
une interface en capture live (`-i`), quelle que soit l'interface (testé sur
`vEthernet (Default Switch)` et `WLAN`) et indépendamment de la taille du
ruleset. Cause non résolue en profondeur (bug probable de cette build avec
Npcap sur ce système) — le mode `-r` (lecture de fichier pcap) fonctionne
en revanche parfaitement.

**Contournement retenu** : **dumpcap** (Wireshark/Npcap, capture réputée
stable) capture le trafic par tranches de 30 secondes ; Suricata analyse
chaque tranche en mode fichier (`-r`) juste après, et les alertes s'accumulent
dans un seul `eve.json` (Suricata l'ouvre en append par défaut). Boucle
implémentée dans
[`scripts/suricata-capture-loop.ps1`](../scripts/suricata-capture-loop.ps1).

### 3. Ruleset ET Open et `HOME_NET`

- Les règles ET Open modernes visent du trafic **`$EXTERNAL_NET →
  $HOME_NET`**. Avec un `HOME_NET` par défaut couvrant tout le bloc RFC1918
  (`172.16.0.0/12`), l'hôte-attaquant (dans ce même bloc) était classé
  "interne" au même titre que la victime → aucune règle ne matchait.
  **Fix** : `HOME_NET` restreint à l'IP de la VM victime uniquement
  (`172.21.2.58/32`) — conceptuellement correct de toute façon : HOME_NET
  doit désigner l'actif protégé, pas tout le plan d'adressage privé.
- Les signatures historiques de détection de scan Nmap (`ET SCAN NMAP -sS
  window 2048`, etc.) sont **commentées/dépréciées** dans le ruleset ET Open
  gratuit actuel (trop de faux positifs) — un scan Nmap classique ne
  déclenche donc aucune alerte par défaut.
  **Fix** : règles custom dans
  [`rules/local.rules`](../wazuh/single-node — non versionné, voir install
  Suricata) pour un scan basé sur seuil (`threshold: count 10, seconds 5`),
  plus proche de la détection réelle utilisée en production.
- `emerging-exploit.rules` (mot-clé `file.magic` non supporté par cette
  build) et deux fichiers référencés mais absents de l'archive téléchargée
  (`emerging-icmp_info.rules`, `emerging-policy.rules`) ont été exclus de
  `rule-files`.

### 4. Intégration à Wazuh

Plutôt qu'un agent Wazuh supplémentaire sur l'hôte, le dossier
`C:\suricata-live` (où la boucle écrit `eve.json`) est monté directement en
lecture seule dans le conteneur `wazuh.manager`
(`docker-compose.yml` → `C:\suricata-live:/suricata-logs:ro`), avec un
`<localfile>` au format `json` ajouté dans `wazuh_manager.conf`. Wazuh
dispose d'un décodeur Suricata natif — aucune règle custom nécessaire côté
Wazuh.

## Mise en œuvre (résumé)

1. Suricata 7.0.7 + règles ET Open (moins les fichiers problématiques) +
   règles custom (`local.rules`) installés sur l'hôte.
2. Boucle `dumpcap` (tranches 30s) → `suricata -r` → `C:\suricata-live\eve.json`,
   lancée en tâche de fond (`scripts/suricata-capture-loop.ps1`).
3. `C:\suricata-live` monté dans `wazuh.manager`, `<localfile>` json ajouté,
   conteneur recréé.
4. Après recréation du conteneur, l'agent `victim-win10` s'est retrouvé
   déconnecté (même cause que le point 1 : IP du manager changée après
   redémarrage) — reconfiguré (`ossec.conf` de l'agent, IP à jour) et
   reconnecté.

## Test réalisé

1. Scan Nmap (`-sS -sV -O -T4 -p 1-2000`) depuis l'hôte vers la VM victime.
2. Capture confirmée (2367 paquets, 218 Ko de pcap).
3. Analyse Suricata → **235 alertes** générées (`LAB Custom - Possible port
   scan`), correctement attribuées (`src_ip: 172.21.0.1` → `dest_ip:
   172.21.2.58`).
4. Chaîne complète bout-en-bout vérifiée via l'indexer Wazuh : **191
   alertes** avec `rule.groups: suricata` indexées et interrogeables,
   `data.alert.signature`, IPs et ports correctement décodés par Wazuh.

**Résultat : détection réseau fonctionnelle. Suricata observe le trafic vers
la VM victime, génère des alertes sur un scan réel, et celles-ci remontent
jusqu'au SIEM au même titre que la télémétrie endpoint (Sysmon).**

## Limites de cette étape

- L'attaquant est l'hôte Windows, pas un poste réellement séparé — à
  reconsidérer si une vraie segmentation réseau devient nécessaire pour une
  brique future (ex. simulation de mouvement latéral).
- Capture par tranches de 30s = latence de détection de l'ordre de la
  minute, pas du temps réel strict. Acceptable pour un lab, à noter comme
  limite si présenté comme "production".
- Cause racine du crash de Suricata en mode live non identifiée (juste
  contournée) — à réessayer avec une version différente de Suricata si le
  besoin de capture réellement temps réel se présente.
- Les sous-réseaux `Default Switch`/`WSL switch` changent après chaque
  redémarrage hôte : toute IP codée en dur (agent, HOME_NET, scripts) doit
  être revérifiée après un reboot.
