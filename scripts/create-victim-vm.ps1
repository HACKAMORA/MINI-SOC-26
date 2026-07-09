#Requires -RunAsAdministrator
<#
Crée la VM Windows victime (Hyper-V) pour la brique 2 (Sysmon).
Isolée sur "Default Switch" (NAT) : accès internet pour Windows Update /
téléchargement de Sysmon, mais pas exposée au réseau local physique.
#>

param(
    [string]$VmName     = "victim-win10",
    [string]$IsoPath    = "C:\Users\Ayman\Downloads\Windows.iso",
    [string]$VmRoot     = "C:\Users\Ayman\PROJET-SOC-7-26\vms",
    [int]   $MemoryGB   = 6,
    [int]   $DiskGB     = 64,
    [int]   $CpuCount   = 2
)

$ErrorActionPreference = "Stop"

$vmPath  = Join-Path $VmRoot $VmName
$vhdPath = Join-Path $vmPath "$VmName.vhdx"

New-Item -ItemType Directory -Path $vmPath -Force | Out-Null

New-VM -Name $VmName `
    -Generation 2 `
    -MemoryStartupBytes ($MemoryGB * 1GB) `
    -NewVHDPath $vhdPath `
    -NewVHDSizeBytes ($DiskGB * 1GB) `
    -Path $VmRoot `
    -SwitchName "Default Switch"

Set-VMProcessor -VMName $VmName -Count $CpuCount
Set-VMMemory -VMName $VmName -DynamicMemoryEnabled $true -MinimumBytes 2GB -MaximumBytes ($MemoryGB * 1GB) -StartupBytes ($MemoryGB * 1GB)

Add-VMDvdDrive -VMName $VmName -Path $IsoPath
$dvd = Get-VMDvdDrive -VMName $VmName

Set-VMFirmware -VMName $VmName -EnableSecureBoot On -SecureBootTemplate "MicrosoftWindows" -FirstBootDevice $dvd

Enable-VMIntegrationService -VMName $VmName -Name "Guest Service Interface"

Write-Host "VM '$VmName' créée. Démarrage..."
Start-VM -Name $VmName

Write-Host "Ouvre la console avec : vmconnect.exe localhost `"$VmName`""
