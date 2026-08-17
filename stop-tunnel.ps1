<#
.SYNOPSIS
  Stop the Sakura Frp / ngrok tunnels (and optionally the local backend / DSH) started by start-tunnel.ps1.

.PARAMETER StopBackend
  Also stop the local backend (node.exe processes serving this project).

.PARAMETER StopAssistant
  Also stop the DeepSeek Harness (DSH) process managed by start-tunnel.ps1.
#>
param(
  [switch]$StopBackend,
  [switch]$StopAssistant
)

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogDir = Join-Path $Root 'logs'

Write-Host 'Stopping frpc (Sakura Frp) ...'
$frpcPidFile = Join-Path $LogDir '.frpc.pid'
$frpcPid = 0
if (Test-Path -LiteralPath $frpcPidFile) {
  [int]::TryParse(([System.IO.File]::ReadAllText($frpcPidFile)).Trim(), [ref]$frpcPid) | Out-Null
}
if ($frpcPid -gt 0) {
  & taskkill.exe /PID $frpcPid /T /F 2>$null | Out-Null
}
Get-Process -Name 'frpc*' -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -LiteralPath $frpcPidFile -Force -ErrorAction SilentlyContinue

Write-Host 'Stopping ngrok ...'
Get-Process -Name ngrok -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

if ($StopBackend) {
  Write-Host 'Stopping local backend (node server processes) ...'
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -match 'my-blog|tsx server|vite' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}

if ($StopAssistant) {
  $pidFile = Join-Path $LogDir '.dsh.pid'
  $hostFile = Join-Path $LogDir '.assistant-host'
  # NOTE: use $dshPid, not $pid - $PID is a read-only automatic variable.
  $dshPid = 0
  if (Test-Path -LiteralPath $pidFile) {
    [int]::TryParse(([System.IO.File]::ReadAllText($pidFile)).Trim(), [ref]$dshPid) | Out-Null
  }
  if ($dshPid -gt 0) {
    Write-Host 'Stopping DeepSeek Harness (DSH) ...'
    & taskkill.exe /PID $dshPid /T /F 2>$null | Out-Null
  } else {
    Write-Warning 'No DSH PID file found (DSH may have been started manually). Stop it separately if needed.'
  }
  Remove-Item -LiteralPath $pidFile, $hostFile -Force -ErrorAction SilentlyContinue
}

Write-Host 'Done.'
