$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$launcher = Join-Path $root "start-vital.ps1"
if (-not (Test-Path -LiteralPath $launcher)) { throw "VITAL launcher not found beside this installer." }

$startup = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup"
New-Item -ItemType Directory -Force -Path $startup | Out-Null
$target = Join-Path $startup "VITAL Medicine App.cmd"
$command = "@echo off`r`npowershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcher`" -OpenBrowser`r`n"
Set-Content -LiteralPath $target -Value $command -Encoding ASCII
if (-not (Test-Path -LiteralPath $target)) { throw "Could not install VITAL startup entry." }
Write-Host "VITAL will start in the background and open in your browser when you sign in to Windows."
Write-Host "Folder: $root"
