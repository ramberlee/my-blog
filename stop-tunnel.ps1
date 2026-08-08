<#
.SYNOPSIS
  Stop the ngrok tunnel (and optionally the local backend) started by start-tunnel.ps1.

.PARAMETER StopBackend
  Also stop the local backend (node.exe processes serving this project).
#>
param(
  [switch]$StopBackend
)

Write-Host 'Stopping ngrok ...'
Get-Process -Name ngrok -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

if ($StopBackend) {
  Write-Host 'Stopping local backend (node server processes) ...'
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -match 'my-blog|tsx server|vite' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}

Write-Host 'Done.'
