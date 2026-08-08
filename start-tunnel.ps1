<#
.SYNOPSIS
  One-click: ensure local backend + ngrok tunnel are running, update the
  GitHub Pages deploy variable, and trigger deployment.

.DESCRIPTION
  - Starts the local backend (npm run server -> localhost:3001) if it is down.
  - Starts the ngrok tunnel (http -> 3001) if it is not running.
  - Reads the public tunnel URL from the ngrok local API (127.0.0.1:4040).
  - Updates the repo variable VITE_API_BASE (used by .github/workflows/deploy.yml).
  - Triggers "Deploy to GitHub Pages" only when the tunnel URL changed.

.PARAMETER SkipDeploy
  Start services only; do not update the GitHub variable or trigger deploy.

.EXAMPLE
  .\start-tunnel.ps1
.EXAMPLE
  .\start-tunnel.ps1 -SkipDeploy
#>
param(
  [switch]$SkipDeploy
)

$ErrorActionPreference = 'Stop'
$Repo = 'ramberlee/my-blog'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogDir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Find-Ngrok {
  $candidates = @(
    (Join-Path $env:USERPROFILE 'ngrok\ngrok.exe'),
    (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe')
  )
  foreach ($c in $candidates) {
    if (Test-Path -LiteralPath $c) {
      try {
        & $c version 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { return $c }
      } catch { }
    }
  }
  $cmd = Get-Command ngrok -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  throw 'ngrok not found. Install it (winget install ngrok) or place ngrok.exe under ~\ngrok\.'
}

function Wait-Healthy {
  param([int]$TimeoutSeconds = 30)
  for ($i = 0; $i -lt $TimeoutSeconds; $i++) {
    try {
      $r = Invoke-RestMethod -Uri 'http://localhost:3001/api/health' -TimeoutSec 2
      if ($r.status -eq 'ok') { return $true }
    } catch { }
    Start-Sleep -Seconds 1
  }
  return $false
}

# 1. Local backend
Write-Host '[1/4] Checking local backend (localhost:3001) ...'
if (Wait-Healthy -TimeoutSeconds 3) {
  Write-Host '      backend already running'
} else {
  Write-Host '      starting backend (npm run server) ...'
  Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'server' `
    -WorkingDirectory $Root -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $LogDir 'server.out.log') `
    -RedirectStandardError (Join-Path $LogDir 'server.err.log')
  if (-not (Wait-Healthy)) {
    throw 'backend failed to start. Check logs\server.err.log'
  }
  Write-Host '      backend is up'
}

# 2. ngrok tunnel
Write-Host '[2/4] Checking ngrok tunnel ...'
$tunnels = $null
try {
  $tunnels = (Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 3).tunnels
} catch { }

if ($tunnels -and $tunnels.Count -gt 0) {
  Write-Host '      tunnel already running'
} else {
  $ngrok = Find-Ngrok
  Write-Host "      starting ngrok ($ngrok) ..."
  Start-Process -FilePath $ngrok -ArgumentList 'http', '3001', '--log=stdout' `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $LogDir 'ngrok.out.log') `
    -RedirectStandardError (Join-Path $LogDir 'ngrok.err.log')
}

$tunnelUrl = $null
for ($i = 0; $i -lt 30; $i++) {
  try {
    $t = (Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 2).tunnels |
      Where-Object { $_.public_url -like 'https://*' } |
      Select-Object -First 1
    if ($t) { $tunnelUrl = $t.public_url; break }
  } catch { }
  Start-Sleep -Seconds 1
}
if (-not $tunnelUrl) { throw 'could not obtain ngrok tunnel URL (is ngrok authenticated?)' }

$apiBase = "$tunnelUrl/api"
Write-Host "      tunnel URL: $tunnelUrl"

# 3. Sanity check: tunnel -> backend
Write-Host '[3/4] Verifying tunnel -> backend ...'
$ok = $false
for ($i = 0; $i -lt 15; $i++) {
  try {
    $r = Invoke-RestMethod -Uri "$apiBase/health" -TimeoutSec 10
    if ($r.status -eq 'ok') { $ok = $true; break }
  } catch { }
  Start-Sleep -Seconds 1
}
if (-not $ok) { throw "tunnel is up but backend is not reachable through it: $apiBase/health" }
Write-Host '      OK - tunnel reaches the backend'

# 4. Update repo variable + trigger deploy
if ($SkipDeploy) {
  Write-Host '[4/4] Skipped deploy (-SkipDeploy)'
} else {
  Write-Host '[4/4] Updating GitHub Pages deploy variable ...'
  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Warning 'gh CLI not found - skipping variable update and deploy'
  } else {
    $current = (gh variable get VITE_API_BASE --repo $Repo 2>$null | Out-String).Trim()
    if ($current -eq $apiBase) {
      Write-Host '      tunnel URL unchanged - no redeploy needed'
    } else {
      gh variable set VITE_API_BASE --repo $Repo --body $apiBase
      Write-Host "      VITE_API_BASE -> $apiBase"
      gh workflow run deploy.yml --repo $Repo
      Write-Host '      deployment triggered: https://github.com/ramberlee/my-blog/actions'
    }
  }
}

Write-Host ''
Write-Host 'Done.'
Write-Host "  Tunnel:      $tunnelUrl"
Write-Host "  Site:        https://ramberlee.github.io/my-blog/"
Write-Host "  Local dev:   http://localhost:5173/ (if vite is running)"
