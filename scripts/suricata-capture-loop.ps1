<#
Boucle de capture/analyse Suricata pour Windows.

Le mode de capture live de Suricata 7.0.7 (build Windows officielle) crashe
systematiquement sur cette machine (Access Violation dans msvcrt.dll, voir
docs/03-suricata.md). Contournement : dumpcap (Npcap, stable) capture le
trafic par tranches de N secondes, puis Suricata analyse chaque tranche en
mode fichier (-r), qui ne crashe pas. Les alertes s'accumulent dans un seul
eve.json (Suricata l'ouvre en mode append par defaut).
#>

param(
    [string]$Interface = "vEthernet (Default Switch)",
    [string]$WorkDir = "C:\suricata-live",
    [string]$SuricataExe = "C:\Program Files\Suricata\suricata.exe",
    [string]$SuricataConf = "C:\Program Files\Suricata\suricata.yaml",
    [string]$Dumpcap = "C:\Program Files\Wireshark\dumpcap.exe",
    [int]$SliceSeconds = 30
)

New-Item -ItemType Directory -Path $WorkDir -Force | Out-Null
$pcapFile = Join-Path $WorkDir "slice.pcap"

while ($true) {
    if (Test-Path $pcapFile) { Remove-Item $pcapFile -Force }
    & $Dumpcap -i $Interface -a duration:$SliceSeconds -w $pcapFile 2>$null | Out-Null
    if (Test-Path $pcapFile) {
        & $SuricataExe -c $SuricataConf -r $pcapFile -l $WorkDir -k none 2>$null | Out-Null
    }
}
