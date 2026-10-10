param(
  [switch]$OpenBrowser,
  [switch]$EnablePhoneCamera
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$frontendPort = 5186
$backendPort = 5055
$logDir = Join-Path $root "runtime-logs"
$venvPython = Join-Path $root ".venv\Scripts\python.exe"
$frontendLog = Join-Path $logDir "frontend.log"
$frontendErrorLog = Join-Path $logDir "frontend-error.log"
$backendLog = Join-Path $logDir "backend.log"
$backendErrorLog = Join-Path $logDir "backend-error.log"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
if ($EnablePhoneCamera) {
  $env:VITAL_HOST = "0.0.0.0"
} else {
  $env:VITAL_HOST = "127.0.0.1"
}

function Find-CommandPath([string]$name) {
  $command = Get-Command $name -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -eq $command) { return $null }
  return $command.Source
}

function Test-ListeningPort([int]$port) {
  return $null -ne (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1)
}

function Get-HttpResponse([string]$url) {
  try { return Invoke-WebRequest -Uri $url -TimeoutSec 2 -UseBasicParsing } catch { return $null }
}

function Wait-ForHttp([string]$url, [int]$seconds) {
  for ($attempt = 0; $attempt -lt $seconds; $attempt++) {
    $response = Get-HttpResponse $url
    if ($null -ne $response -and $response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { return $response }
    Start-Sleep -Seconds 1
  }
  return $null
}

$npm = Find-CommandPath "npm.cmd"
$node = Find-CommandPath "node.exe"
if (-not $npm -or -not $node) {
  throw "Node.js 20 or newer is required. Install it from https://nodejs.org, then run START VITAL.cmd again."
}

if (-not (Test-Path (Join-Path $root "node_modules"))) {
  Write-Host "Installing VITAL frontend dependencies (first run only)..."
  & $npm ci
  if ($LASTEXITCODE -ne 0) { throw "npm ci failed. See the message above, then retry START VITAL.cmd." }
}

if (-not (Test-Path $venvPython)) {
  $python = Find-CommandPath "py.exe"
  if ($python) {
    & $python -3 -m venv (Join-Path $root ".venv")
  } else {
    $python = Find-CommandPath "python.exe"
    if (-not $python) { throw "Python 3.10 or newer is required. Install it from https://www.python.org/downloads/windows/, then retry START VITAL.cmd." }
    & $python -m venv (Join-Path $root ".venv")
  }
  if ($LASTEXITCODE -ne 0) { throw "Could not create VITAL's Python environment." }
  Write-Host "Installing VITAL backend dependencies (first run only)..."
  & $venvPython -m pip install --upgrade pip
  if ($LASTEXITCODE -ne 0) { throw "Could not prepare pip for VITAL." }
  & $venvPython -m pip install -r (Join-Path $root "backend\requirements.txt")
  if ($LASTEXITCODE -ne 0) { throw "Could not install backend dependencies." }
}

$distIndex = Join-Path $root "dist\index.html"
$builtAssets = @(Get-ChildItem (Join-Path $root "dist\assets") -File -ErrorAction SilentlyContinue)
$latestBuiltAsset = $builtAssets | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$sourceFiles = @(
  Get-ChildItem (Join-Path $root "src") -Recurse -File -ErrorAction SilentlyContinue
  Get-ChildItem (Join-Path $root "public") -Recurse -File -ErrorAction SilentlyContinue
  Get-Item (Join-Path $root "index.html"), (Join-Path $root "package.json"), (Join-Path $root "vite.config.ts") -ErrorAction SilentlyContinue
)
$latestSourceFile = $sourceFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$frontendNeedsBuild = -not (Test-Path $distIndex) -or $null -eq $latestBuiltAsset -or ($null -ne $latestSourceFile -and $latestSourceFile.LastWriteTime -gt $latestBuiltAsset.LastWriteTime)
if ($frontendNeedsBuild) {
  Write-Host "Building VITAL frontend from the latest project files..."
  & $npm run build
  if ($LASTEXITCODE -ne 0) { throw "VITAL frontend build failed." }
}

$backendHealth = Get-HttpResponse "http://127.0.0.1:$backendPort/api/health"
if ($null -ne $backendHealth) {
  $listener = Get-NetTCPConnection -LocalPort $backendPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  $owner = if ($listener) { Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)" -ErrorAction SilentlyContinue } else { $null }
  $expectedServerPath = Join-Path $root "backend\server.py"
  $ownerIsVitalBackend = $owner -and (
    $owner.CommandLine -like "*$expectedServerPath*" -or
    $owner.CommandLine -match '(?:^|\s)["'']?backend[\\/]server\.py(?:["'']|\s|$)'
  )
  $latestBackendSource = Get-ChildItem (Join-Path $root "backend") -Filter "*.py" -Recurse -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  $backendEnvFile = Get-Item (Join-Path $root "backend\.env") -ErrorAction SilentlyContinue
  $backendCodeChanged = $latestBackendSource -and $latestBackendSource.LastWriteTime -gt $owner.CreationDate
  $backendConfigChanged = $backendEnvFile -and $backendEnvFile.LastWriteTime -gt $owner.CreationDate
  if ($ownerIsVitalBackend -and ($backendCodeChanged -or $backendConfigChanged)) {
    Write-Host "Restarting the VITAL backend to load updated API code or SMS configuration..."
    Stop-Process -Id $owner.ProcessId -Force
    for ($attempt = 0; $attempt -lt 10 -and (Test-ListeningPort $backendPort); $attempt++) { Start-Sleep -Seconds 1 }
    if (Test-ListeningPort $backendPort) { throw "Could not restart the VITAL backend on port $backendPort." }
    $backendHealth = $null
  }
}
if ($EnablePhoneCamera -and $null -ne $backendHealth) {
  $listenerAddresses = Get-NetTCPConnection -LocalPort $backendPort -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty LocalAddress -Unique
  $connection = Get-NetTCPConnection -LocalPort $backendPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  $owner = if ($connection) { Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)" -ErrorAction SilentlyContinue } else { $null }
  $expectedServerPath = Join-Path $root "backend\server.py"
  $ownerIsVitalBackend = $owner -and (
    $owner.CommandLine -like "*$expectedServerPath*" -or
    $owner.CommandLine -match '(?:^|\s)["'']?backend[\\/]server\.py(?:["'']|\s|$)'
  )
  $latestBackendSource = Get-ChildItem (Join-Path $root "backend") -Filter "*.py" -Recurse -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  $serverSourceChanged = $ownerIsVitalBackend -and $latestBackendSource -and $latestBackendSource.LastWriteTime -gt $owner.CreationDate
  $cameraBackendNeedsRestart = ($listenerAddresses -notcontains "0.0.0.0" -and $listenerAddresses -notcontains "::") -or $serverSourceChanged
  if ($cameraBackendNeedsRestart) {
    if (-not $ownerIsVitalBackend) {
      throw "Port $backendPort is serving a non-VITAL process or its owner could not be verified. Close that service before enabling the phone camera."
    }
    Write-Host "Restarting the VITAL backend with the latest camera-alert code and private Wi-Fi access..."
    Stop-Process -Id $owner.ProcessId -Force
    for ($attempt = 0; $attempt -lt 10 -and (Test-ListeningPort $backendPort); $attempt++) { Start-Sleep -Seconds 1 }
    if (Test-ListeningPort $backendPort) { throw "Could not restart the existing VITAL backend on private Wi-Fi." }
    $backendHealth = $null
  }
}
if ($null -eq $backendHealth) {
  if (Test-ListeningPort $backendPort) {
    throw "Port $backendPort is occupied by a service that did not answer VITAL's health check. Close that service, then retry."
  }
  Write-Host "Starting VITAL backend..."
  # Pass the backend path relative to WorkingDirectory so Start-Process does not
  # hand Python an extra layer of literal quotes on Windows paths containing spaces.
  Start-Process -FilePath $venvPython -ArgumentList @("-u", "backend\server.py") -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $backendLog -RedirectStandardError $backendErrorLog | Out-Null
  $backendHealth = Wait-ForHttp "http://127.0.0.1:$backendPort/api/health" 30
  if ($null -eq $backendHealth) {
    $errorTail = if (Test-Path $backendErrorLog) { (Get-Content $backendErrorLog -Tail 20) -join "`n" } else { "No backend log was created." }
    throw "VITAL backend did not become healthy. Details: $errorTail"
  }
} else {
  Write-Host "VITAL backend is healthy."
}

$frontendResponse = Get-HttpResponse "http://127.0.0.1:$frontendPort/"
if ($null -eq $frontendResponse) {
  if (Test-ListeningPort $frontendPort) {
    throw "Port $frontendPort is occupied by a service that did not return a VITAL page. Close that service, then retry."
  }
  Write-Host "Starting VITAL frontend..."
  $viteEntry = Join-Path $root "node_modules\vite\bin\vite.js"
  Start-Process -FilePath $node -ArgumentList @("node_modules\vite\bin\vite.js", "preview", "--host", "127.0.0.1", "--port", "$frontendPort", "--strictPort") -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $frontendLog -RedirectStandardError $frontendErrorLog | Out-Null
  $frontendResponse = Wait-ForHttp "http://127.0.0.1:$frontendPort/" 30
  if ($null -eq $frontendResponse -or $frontendResponse.Content -notmatch 'id="root"') {
    $errorTail = if (Test-Path $frontendErrorLog) { (Get-Content $frontendErrorLog -Tail 20) -join "`n" } else { "No frontend log was created." }
    throw "VITAL frontend did not become healthy. Details: $errorTail"
  }
} elseif ($frontendResponse.Content -notmatch 'id="root"') {
  throw "Port $frontendPort is responding, but it is not serving the VITAL application. Close that service, then retry."
} else {
  Write-Host "VITAL frontend is healthy."
}

Write-Host "VITAL is ready at http://127.0.0.1:$frontendPort"
if ($EnablePhoneCamera) {
  $defaultRoute = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -AddressFamily IPv4 -ErrorAction SilentlyContinue | Sort-Object RouteMetric, InterfaceMetric | Select-Object -First 1
  $phoneAddresses = if ($defaultRoute) {
    Get-NetIPAddress -InterfaceIndex $defaultRoute.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue |
      Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and $_.AddressState -eq "Preferred" } |
      Select-Object -ExpandProperty IPAddress -Unique
  }
  if (-not $phoneAddresses) {
    $phoneAddresses = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
      Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and $_.AddressState -eq "Preferred" } |
      Select-Object -ExpandProperty IPAddress -Unique
  }
  Write-Host "Phone camera LAN mode is enabled. Enter this Wi-Fi address in the Android app:"
  foreach ($address in $phoneAddresses) { Write-Host "  http://${address}:5055" }
  Write-Host "Keep this computer running and both devices on the same trusted Wi-Fi."
}
if ($OpenBrowser) { Start-Process "http://127.0.0.1:$frontendPort/" }
