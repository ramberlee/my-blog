<#
.SYNOPSIS
  One-click: ensure local backend + DSH + two tunnels are running,
  update the GitHub Pages deploy variables, and trigger deployment.

.DESCRIPTION
  - Starts the local backend (npm run server -> localhost:3001) if it is down.
  - Starts two tunnels (Sakura Frp by default, ngrok with -Tunnel ngrok):
    blog -> 3001, assistant -> 3080.
  - Ensures DeepSeek Harness (DSH) is running on 127.0.0.1:3080 with the
    current assistant tunnel host passed as --trusted-host.
  - Sakura Frp: starts frpc with `-f <token>:<blogId>,<assistantId>` and reads
    the public URLs from logs\frpc.out.log ("Your X proxy is available now.
    Use >>Y<<" lines). Tunnels must be named "blog" and "assistant" in the
    Sakura Frp panel; credentials come from sakura-frp.json.
  - ngrok: reads both public tunnel URLs from the ngrok local API (127.0.0.1:4040).
  - Updates repo variables VITE_API_BASE and VITE_ASSISTANT_URL.
  - Triggers "Deploy to GitHub Pages" only when either variable changed.

.PARAMETER Tunnel
  Tunnel provider: 'sakura' (default) or 'ngrok'. Starting one stops the other.

.PARAMETER SkipDeploy
  Start services only; do not update the GitHub variables or trigger deploy.
#>
param(
  [ValidateSet('sakura', 'ngrok')]
  [string]$Tunnel = 'sakura',
  [switch]$SkipDeploy
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogDir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$Utf8 = New-Object System.Text.UTF8Encoding($false)
$BlogPort = if ($env:PORT) { $env:PORT } else { '3001' }
$AssistantPort = 3080
$NgrokConfig = Join-Path $Root 'ngrok.yml'
$SakuraConfig = Join-Path $Root 'sakura-frp.json'
$FrpcOutLog = Join-Path $LogDir 'frpc.out.log'
$FrpcErrLog = Join-Path $LogDir 'frpc.err.log'
$FrpcPidFile = Join-Path $LogDir '.frpc.pid'

function Get-GitHubRepo {
  $remote = git -C $Root remote get-url origin 2>$null
  if ($remote -match 'github\.com[:/]([^/]+/[^/]+?)(\.git)?$') {
    return $Matches[1]
  }
  $fromGh = gh repo view --json nameWithOwner --jq .nameWithOwner 2>$null
  if ($fromGh) { return $fromGh }
  throw 'could not determine GitHub repo (git remote or gh CLI)'
}

function Invoke-Gh {
  <#
  .SYNOPSIS
    运行 gh 命令；遇到 GitHub API 瞬时故障（5xx / 429 / 网络错误）自动重试。
    gh variable get 变量不存在（404 / not found）时返回空字符串（视为未设置）。
  #>
  param(
    [Parameter(Mandatory)][string[]]$Arguments,
    [int]$MaxRetries = 5,
    [int]$BaseDelaySec = 3
  )
  # gh 将错误写入 stderr；脚本顶部 $ErrorActionPreference='Stop' 在 Windows
  # PowerShell 5.1 下会把原生命令 stderr 变成终止错误（即使 2>$null 也无法抑制），
  # 因此这里临时改为 Continue，自行根据退出码处理结果。
  $oldEap = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    for ($attempt = 0; $attempt -le $MaxRetries; $attempt++) {
      $out = & gh @Arguments 2>&1
      $code = $LASTEXITCODE
      $text = ($out | Out-String).Trim()
      if ($code -eq 0) { return $text }
      if ($Arguments[0] -eq 'variable' -and $Arguments[1] -eq 'get' -and $text -match 'not found|404') {
        return ''
      }
      if ($attempt -lt $MaxRetries) {
        $delay = [int]($BaseDelaySec * [Math]::Pow(2, $attempt))
        Write-Warning "gh $($Arguments -join ' ') failed (exit $code): $text - retry $($attempt + 1)/$MaxRetries in ${delay}s"
        Start-Sleep -Seconds $delay
      } else {
        throw "gh $($Arguments -join ' ') still failing after $($MaxRetries + 1) attempts: $text"
      }
    }
  } finally {
    $ErrorActionPreference = $oldEap
  }
}

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

function Find-Frpc {
  param([string]$ConfiguredPath)
  if ($ConfiguredPath) {
    if (-not (Test-Path -LiteralPath $ConfiguredPath)) {
      throw "sakura-frp.json: frpc not found at '$ConfiguredPath'"
    }
    return $ConfiguredPath
  }
  $candidates = @(
    (Join-Path $env:USERPROFILE 'sakura-frp\frpc_windows_amd64.exe'),
    (Join-Path $env:USERPROFILE 'sakura-frp\frpc.exe'),
    (Join-Path $env:USERPROFILE 'SakuraFrp\frpc_windows_amd64.exe'),
    (Join-Path $env:USERPROFILE 'SakuraFrp\frpc.exe'),
    (Join-Path $Root 'tools\frpc_windows_amd64.exe'),
    (Join-Path $Root 'tools\frpc.exe')
  )
  foreach ($c in $candidates) {
    if (Test-Path -LiteralPath $c) {
      try {
        & $c -v 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { return $c }
      } catch { }
    }
  }
  $cmd = Get-Command frpc -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  throw 'frpc not found. Download frpc_windows_amd64.exe from the Sakura Frp panel (Software Download) and put it in ~\sakura-frp\ (see TUNNEL.md).'
}

function Get-SakuraConfig {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "sakura-frp.json not found. Copy sakura-frp.example.json to sakura-frp.json and fill in your Sakura Frp access token and tunnel IDs (see TUNNEL.md)."
  }
  try {
    $cfg = Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json
  } catch {
    throw "sakura-frp.json is not valid JSON: $($_.Exception.Message)"
  }
  # '<PASTE' keeps the check working even if PowerShell 5.1 misreads
  # the UTF-8 (no BOM) script as ANSI and garbles the Chinese alternatives.
  if (-not $cfg.token -or $cfg.token -match '<PASTE|填入|替换|your[-_]?token') {
    throw 'sakura-frp.json: "token" is missing or still the placeholder value.'
  }
  $blogId = 0
  $assistantId = 0
  try {
    $blogId = [int64]$cfg.tunnels.blog
    $assistantId = [int64]$cfg.tunnels.assistant
  } catch { }
  if ($blogId -le 0 -or $assistantId -le 0) {
    throw 'sakura-frp.json: "tunnels.blog" and "tunnels.assistant" must be the Sakura Frp tunnel IDs (positive integers).'
  }
  return $cfg
}

function Get-LogText {
  param([string]$LogPath)
  if (-not (Test-Path -LiteralPath $LogPath)) { return '' }
  try {
    # frpc holds the log file open while running, so read with shared access.
    $fs = New-Object System.IO.FileStream($LogPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
    try {
      $reader = New-Object System.IO.StreamReader($fs, [System.Text.Encoding]::UTF8)
      $text = $reader.ReadToEnd()
      $reader.Close()
      return $text
    } finally {
      $fs.Close()
    }
  } catch {
    return ''
  }
}

function Get-SakuraTunnelUrls {
  param([string]$LogPath)
  $text = Get-LogText -LogPath $LogPath
  if (-not $text) { return @{} }
  $lines = $text -split "`r?`n"
  $map = @{}

  # Pass 1: English frpc log puts name and address on one line.
  foreach ($line in $lines) {
    if ($line -match 'Your (.+?) proxy is available now\. Use >>(.+?)<< to connect\.') {
      $map[$Matches[1]] = $Matches[2]
    }
  }

  # Pass 2: Chinese frpc log splits them across two lines. The patterns are
  # intentionally ASCII-only (the >>host:port<< shape and the [account.name]
  # bracket): this script file is UTF-8 without BOM, and Windows PowerShell 5.1
  # reads such files as ANSI, which would garble Chinese literals in a regex.
  $names = @()
  $addrs = @()
  for ($i = 0; $i -lt $lines.Count; $i++) {
    # Name line: "[account.blog] ...". Certificate lines also contain the
    # bracket but always include >>...<<, so the '>>' guard excludes them.
    if ($lines[$i] -notmatch '>>' -and $lines[$i] -match '\[[^\[\]]*\.(?<name>blog|assistant)\]\s*') {
      $names += ,@{ Name = $Matches['name']; Index = $i }
    }
    # Address line: "使用 >>host:port<< ..." (or bare domain, or >>ip:port<<).
    if ($lines[$i] -match '>>(?<addr>[A-Za-z0-9][A-Za-z0-9.\-]*(?::\d+)?)<<') {
      $addrs += ,@{ Addr = $Matches['addr']; Index = $i }
    }
  }

  # Pair each name with the best address announced just before it: prefer the
  # canonical "使用 >>host<< ..." line (trailing text after <<) over alternative
  # forms such as ">>node-ip:port<<" sitting at the end of a line or lines that
  # mention the node IP explicitly.
  foreach ($n in $names) {
    $before = @($addrs | Where-Object { $_.Index -lt $n.Index })
    if ($before.Count -eq 0) { continue }
    $canon = @($before | Where-Object { $lines[$_.Index] -notmatch '<<\s*$' -and $lines[$_.Index] -notmatch ' IP ' })
    if ($canon.Count -gt 0) { $map[$n.Name] = $canon[$canon.Count - 1].Addr }
    else { $map[$n.Name] = $before[$before.Count - 1].Addr }
  }
  return $map
}

function Start-SakuraTunnels {
  $cfg = Get-SakuraConfig -Path $SakuraConfig
  $blogId = [int64]$cfg.tunnels.blog
  $assistantId = [int64]$cfg.tunnels.assistant

  $storedPid = 0
  if (Test-Path -LiteralPath $FrpcPidFile) {
    [int]::TryParse(([System.IO.File]::ReadAllText($FrpcPidFile)).Trim(), [ref]$storedPid) | Out-Null
  }

  # Only trust the log while the managed frpc process is actually alive,
  # otherwise stale URLs from a previous run would be reused.
  $urls = @{}
  if (Test-ProcessAlive -ProcessId $storedPid) {
    $urls = Get-SakuraTunnelUrls -LogPath $FrpcOutLog
  }

  if (-not $urls['blog'] -or -not $urls['assistant']) {
    Write-Host '      starting frpc (blog + assistant) ...'
    if ($storedPid -gt 0) { Stop-ProcessTree -ProcessId $storedPid }
    Get-Process -Name 'frpc*' -ErrorAction SilentlyContinue | Stop-Process -Force
    # Only one provider runs at a time; switching to Sakura Frp stops ngrok.
    Get-Process -Name ngrok -ErrorAction SilentlyContinue | Stop-Process -Force
    Remove-Item -LiteralPath $FrpcPidFile -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    [System.IO.File]::WriteAllText($FrpcOutLog, '', $Utf8)
    [System.IO.File]::WriteAllText($FrpcErrLog, '', $Utf8)
    $frpc = Find-Frpc -ConfiguredPath $cfg.frpc
    $target = "$($cfg.token):$blogId,$assistantId"
    # Isolated working dir so frpc's frpc.ini cache never pollutes the repo root.
    $workDir = Join-Path $LogDir 'sakura-frp'
    New-Item -ItemType Directory -Force -Path $workDir | Out-Null
    $proc = Start-Process -FilePath $frpc -ArgumentList @('-f', $target, '--disable_log_color', '-n') -WorkingDirectory $workDir -WindowStyle Hidden -RedirectStandardOutput $FrpcOutLog -RedirectStandardError $FrpcErrLog -PassThru
    [System.IO.File]::WriteAllText($FrpcPidFile, "$($proc.Id)", $Utf8)
  }

  for ($i = 0; $i -lt 30; $i++) {
    $urls = Get-SakuraTunnelUrls -LogPath $FrpcOutLog
    if ($urls['blog'] -and $urls['assistant']) { break }
    Start-Sleep -Seconds 1
  }
  if (-not $urls['blog'] -or -not $urls['assistant']) {
    $found = ($urls.Keys | Sort-Object) -join ', '
    $outText = Get-LogText -LogPath $FrpcOutLog
    $errText = Get-LogText -LogPath $FrpcErrLog
    throw "could not obtain both Sakura Frp tunnel URLs (tunnels must be named 'blog' and 'assistant' in the panel; found: '$found'). frpc output: $outText`nfrpc stderr: $errText"
  }
  $blogUrl = Resolve-TunnelUrl -HostPort $urls['blog']
  if ($blogUrl -notlike 'https://*') {
    throw "blog tunnel answered over plain HTTP ($blogUrl). The GitHub Pages site is https, so browsers would block mixed-content API calls. Enable 'auto HTTPS' on the blog tunnel in the Sakura Frp panel (or use an HTTPS tunnel type bound to your own domain). If frpc did not reconnect after the change, stop it (.\stop-tunnel.ps1) and run this script again."
  }
  if (-not (Test-CertTrusted -Url $blogUrl)) {
    Write-Warning "blog tunnel certificate is not trusted by browsers (self-signed?). API calls from the https site would be blocked even though curl -k can reach it. Apply for a free nyat.app subdomain (panel: 'Subdomain Binding'), bind it to the blog tunnel, restart the tunnel and run this script again."
  }
  # Assistant stays as raw host:port for now: its scheme is resolved after DSH
  # is guaranteed to be running (probing earlier would fail while DSH was down).
  return @{ BlogUrl = $blogUrl; AssistantUrl = $urls['assistant'] }
}

function Get-NgrokTunnels {
  try {
    return @(Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 3).tunnels
  } catch {
    return @()
  }
}

function Get-HttpsTunnelUrl {
  param([array]$Tunnels, [string]$Name)
  $t = $Tunnels | Where-Object { $_.name -eq $Name -and $_.public_url -like 'https://*' } | Select-Object -First 1
  if ($t) { return $t.public_url }
  return $null
}

function Start-NgrokTunnels {
  # Only one provider runs at a time; switching to ngrok stops frpc.
  $storedPid = 0
  if (Test-Path -LiteralPath $FrpcPidFile) {
    [int]::TryParse(([System.IO.File]::ReadAllText($FrpcPidFile)).Trim(), [ref]$storedPid) | Out-Null
  }
  if ($storedPid -gt 0) { Stop-ProcessTree -ProcessId $storedPid }
  Get-Process -Name 'frpc*' -ErrorAction SilentlyContinue | Stop-Process -Force
  Remove-Item -LiteralPath $FrpcPidFile -Force -ErrorAction SilentlyContinue

  $tunnels = Get-NgrokTunnels
  $blogUrl = Get-HttpsTunnelUrl -Tunnels $tunnels -Name 'blog'
  $assistantUrl = Get-HttpsTunnelUrl -Tunnels $tunnels -Name 'assistant'

  if (-not $blogUrl -or -not $assistantUrl) {
    if ($tunnels.Count -gt 0) {
      Write-Host '      tunnel set incomplete, restarting ngrok with ngrok.yml ...'
    } else {
      Write-Host '      starting ngrok (blog + assistant) ...'
    }
    Get-Process -Name ngrok -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 1
    $ngrok = Find-Ngrok
    Start-Process -FilePath $ngrok -ArgumentList @('--config', $NgrokConfig, 'start', '--all', '--log=stdout') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $LogDir 'ngrok.out.log') -RedirectStandardError (Join-Path $LogDir 'ngrok.err.log')
  }

  for ($i = 0; $i -lt 30; $i++) {
    $tunnels = Get-NgrokTunnels
    $blogUrl = Get-HttpsTunnelUrl -Tunnels $tunnels -Name 'blog'
    $assistantUrl = Get-HttpsTunnelUrl -Tunnels $tunnels -Name 'assistant'
    if ($blogUrl -and $assistantUrl) { break }
    Start-Sleep -Seconds 1
  }
  if (-not $blogUrl -or -not $assistantUrl) {
    throw 'could not obtain both ngrok tunnel URLs (is ngrok authenticated and ngrok.yml present?)'
  }
  return @{ BlogUrl = $blogUrl; AssistantUrl = $assistantUrl }
}

function Wait-Healthy {
  param([int]$TimeoutSeconds = 30)
  for ($i = 0; $i -lt $TimeoutSeconds; $i++) {
    try {
      $r = Invoke-RestMethod -Uri "http://localhost:$BlogPort/api/health" -TimeoutSec 2
      if ($r.status -eq 'ok') { return $true }
    } catch { }
    Start-Sleep -Seconds 1
  }
  return $false
}

function Test-TcpPort {
  param([int]$Port, [int]$TimeoutMs = 500)
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $task = $client.ConnectAsync('127.0.0.1', $Port)
    if ($task.Wait($TimeoutMs) -and $client.Connected) { return $true }
    return $false
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Test-HttpReachable {
  param([string]$Url, [int]$TimeoutSec = 8)
  try {
    $client = New-Object System.Net.Http.HttpClient
    $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSec)
    $response = $client.GetAsync($Url).GetAwaiter().GetResult()
    $response.Dispose()
    $client.Dispose()
    return $true
  } catch {
    return $false
  }
}

function Test-TunnelHealth {
  param([string]$Url, [int]$TimeoutSec = 10)
  # curl -k: Sakura Frp auto-HTTPS tunnels use a self-signed certificate,
  # which Invoke-RestMethod / HttpClient would reject.
  $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
  if ($curl) {
    try {
      $body = (& $curl.Source -ks --max-time $TimeoutSec $Url 2>$null) -join "`n"
      if ($LASTEXITCODE -eq 0 -and $body -match '"status"\s*:\s*"ok"') { return $true }
    } catch { }
  }
  try {
    $r = Invoke-RestMethod -Uri $Url -TimeoutSec $TimeoutSec
    if ($r.status -eq 'ok') { return $true }
  } catch { }
  return $false
}

function Test-UrlReachable {
  param([string]$Url, [int]$TimeoutSec = 8)
  $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
  if ($curl) {
    try {
      $code = (& $curl.Source -ks -o NUL -w '%{http_code}' --max-time $TimeoutSec $Url 2>$null) -join ''
      if ($LASTEXITCODE -eq 0 -and $code -match '^[23]\d\d$') { return $true }
    } catch { }
  }
  return (Test-HttpReachable -Url $Url -TimeoutSec $TimeoutSec)
}

function Resolve-TunnelUrl {
  param([string]$HostPort)
  if ($HostPort -like 'https://*' -or $HostPort -like 'http://*') { return $HostPort }
  # Sakura Frp TCP tunnels log "host:port" without a scheme: auto-HTTPS tunnels
  # speak TLS on the port, plain ones speak HTTP. Probe to find out which.
  $https = "https://$HostPort"
  if (Test-UrlReachable -Url $https -TimeoutSec 5) { return $https }
  $http = "http://$HostPort"
  if (Test-UrlReachable -Url $http -TimeoutSec 5) { return $http }
  return $https
}

function Test-CertTrusted {
  param([string]$Url, [int]$TimeoutSec = 6)
  # Unlike Test-UrlReachable this validates the certificate chain (no -k):
  # a self-signed cert (Sakura Frp auto-HTTPS without a bound domain) fails here
  # even though curl -k can reach the endpoint.
  $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
  if (-not $curl) { return $true }
  try {
    $code = (& $curl.Source -s -o NUL -w '%{http_code}' --max-time $TimeoutSec $Url 2>$null) -join ''
    if ($LASTEXITCODE -eq 0 -and $code -match '^[23]\d\d$') { return $true }
  } catch { }
  return $false
}

function Start-Dsh {
  param([string]$TrustedHost)
  $outLog = Join-Path $LogDir 'dsh.out.log'
  $errLog = Join-Path $LogDir 'dsh.err.log'
  if ($env:DSH_CMD) {
    $full = "$($env:DSH_CMD) --host 127.0.0.1 --port $AssistantPort --trusted-host $TrustedHost"
    $proc = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', $full) -WorkingDirectory $Root -WindowStyle Hidden -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
  } else {
    $proc = Start-Process -FilePath 'npx.cmd' -ArgumentList @('@deepseek-ai/dsh', 'web', '--host', '127.0.0.1', '--port', "$AssistantPort", '--trusted-host', $TrustedHost) -WorkingDirectory $Root -WindowStyle Hidden -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
  }
  return $proc.Id
}

function Stop-ProcessTree {
  # NOTE: parameter is $ProcessId, not $Pid - $PID is a read-only automatic variable.
  param([int]$ProcessId)
  if ($ProcessId -le 0) { return }
  & taskkill.exe /PID $ProcessId /T /F 2>$null | Out-Null
}

function Test-ProcessAlive {
  param([int]$ProcessId)
  if ($ProcessId -le 0) { return $false }
  try {
    $p = Get-Process -Id $ProcessId -ErrorAction Stop
    return $true
  } catch {
    return $false
  }
}

# 0. Repository info
$Repo = Get-GitHubRepo
$Owner = ($Repo -split '/')[0]
$RepoName = ($Repo -split '/')[1]
$SiteUrl = "https://$Owner.github.io/$RepoName/"

# 1. Local backend
Write-Host "[1/5] Checking local backend (localhost:$BlogPort) ..."
if (Wait-Healthy -TimeoutSeconds 3) {
  Write-Host '      backend already running'
} else {
  Write-Host '      starting backend (npm run server) ...'
  Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'server' -WorkingDirectory $Root -WindowStyle Hidden -RedirectStandardOutput (Join-Path $LogDir 'server.out.log') -RedirectStandardError (Join-Path $LogDir 'server.err.log')
  if (-not (Wait-Healthy)) {
    throw 'backend failed to start. Check logs\server.err.log'
  }
  Write-Host '      backend is up'
}

# 2. Tunnels (blog -> 3001, assistant -> 3080)
Write-Host "[2/5] Checking $Tunnel tunnels ..."
if ($Tunnel -eq 'sakura') {
  $info = Start-SakuraTunnels
} else {
  $info = Start-NgrokTunnels
}
$blogUrl = $info.BlogUrl
$assistantUrl = $info.AssistantUrl
$apiBase = "$blogUrl/api"
# Authority includes the port for Sakura Frp TCP tunnels (https://node:port),
# which matches the Host header DSH receives; for ngrok it is just the hostname.
# Sakura Frp logs host:port without a scheme, so give the URI a placeholder scheme.
$assistantAuthority = if ($assistantUrl -like '*://*') { $assistantUrl } else { "http://$assistantUrl" }
$assistantHost = ([uri]$assistantAuthority).Authority
Write-Host "      blog:      $blogUrl"
Write-Host "      assistant: $assistantUrl"

# 3. DeepSeek Harness (DSH) on 127.0.0.1:3080
Write-Host "[3/5] Checking DeepSeek Harness (127.0.0.1:$AssistantPort) ..."
$pidFile = Join-Path $LogDir '.dsh.pid'
$hostFile = Join-Path $LogDir '.assistant-host'
$storedHost = ''
if (Test-Path -LiteralPath $hostFile) { $storedHost = ([System.IO.File]::ReadAllText($hostFile)).Trim() }
$storedPid = 0
if (Test-Path -LiteralPath $pidFile) { [int]::TryParse(([System.IO.File]::ReadAllText($pidFile)).Trim(), [ref]$storedPid) | Out-Null }

$dshReachable = Test-TcpPort -Port $AssistantPort
$managedAlive = Test-ProcessAlive -ProcessId $storedPid

if (-not $dshReachable) {
  Write-Host "      starting DSH with --trusted-host $assistantHost ..."
  $newPid = Start-Dsh -TrustedHost $assistantHost
  [System.IO.File]::WriteAllText($pidFile, "$newPid", $Utf8)
  [System.IO.File]::WriteAllText($hostFile, $assistantHost, $Utf8)
  for ($i = 0; $i -lt 30; $i++) {
    if (Test-TcpPort -Port $AssistantPort) { break }
    Start-Sleep -Seconds 1
  }
  if (-not (Test-TcpPort -Port $AssistantPort)) {
    throw 'DSH failed to start on 127.0.0.1:3080. Check logs\dsh.err.log'
  }
  Write-Host '      DSH is up'
} elseif ($storedHost -and $storedHost -ne $assistantHost) {
  if ($managedAlive) {
    Write-Host "      assistant host changed ($storedHost -> $assistantHost), restarting managed DSH ..."
    Stop-ProcessTree -ProcessId $storedPid
    Start-Sleep -Seconds 1
    $newPid = Start-Dsh -TrustedHost $assistantHost
    [System.IO.File]::WriteAllText($pidFile, "$newPid", $Utf8)
    [System.IO.File]::WriteAllText($hostFile, $assistantHost, $Utf8)
    for ($i = 0; $i -lt 30; $i++) {
      if (Test-TcpPort -Port $AssistantPort) { break }
      Start-Sleep -Seconds 1
    }
    if (-not (Test-TcpPort -Port $AssistantPort)) {
      throw 'DSH failed to restart. Check logs\dsh.err.log'
    }
    Write-Host '      DSH restarted'
  } else {
    Write-Warning "DSH is already running but was not started by this script. Restart it with:"
    Write-Warning "  npx @deepseek-ai/dsh web --host 127.0.0.1 --port $AssistantPort --trusted-host $assistantHost"
  }
} else {
  Write-Host '      DSH already running with matching trusted-host'
  if ($storedHost -ne $assistantHost) {
    [System.IO.File]::WriteAllText($hostFile, $assistantHost, $Utf8)
  }
}

# DSH is guaranteed to be running now; resolve the assistant tunnel scheme for
# real (probing earlier could fail while DSH was still down).
if ($Tunnel -eq 'sakura') {
  $assistantUrl = Resolve-TunnelUrl -HostPort $assistantUrl
  if ($assistantUrl -notlike 'https://*') {
    Write-Warning "assistant tunnel answered over plain HTTP ($assistantUrl). Consider enabling 'auto HTTPS' on the assistant tunnel in the Sakura Frp panel."
  }
}

# 4. Sanity checks through the tunnels
Write-Host '[4/5] Verifying tunnels ...'
$ok = $false
for ($i = 0; $i -lt 15; $i++) {
  if (Test-TunnelHealth -Url "$apiBase/health" -TimeoutSec 10) { $ok = $true; break }
  Start-Sleep -Seconds 1
}
if (-not $ok) { throw "tunnel is up but backend is not reachable through it: $apiBase/health" }
Write-Host '      OK - blog tunnel reaches the backend'

if (Test-UrlReachable -Url $assistantUrl -TimeoutSec 8) {
  Write-Host '      OK - assistant tunnel reaches DSH'
} else {
  Write-Warning 'assistant tunnel did not respond (DSH may still be starting, or the tunnel certificate must be accepted in a browser once)'
}

# 5. Update repo variables + trigger deploy
if ($SkipDeploy) {
  Write-Host '[5/5] Skipped deploy (-SkipDeploy)'
} else {
  Write-Host '[5/5] Updating GitHub Pages deploy variables ...'
  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Warning 'gh CLI not found - skipping variable update and deploy'
  } else {
    $changed = $false
    $currentApi = Invoke-Gh 'variable', 'get', 'VITE_API_BASE', '--repo', $Repo
    if ($currentApi -ne $apiBase) {
      Invoke-Gh 'variable', 'set', 'VITE_API_BASE', '--repo', $Repo, '--body', $apiBase
      Write-Host "      VITE_API_BASE -> $apiBase"
      $changed = $true
    }
    $currentAssistant = Invoke-Gh 'variable', 'get', 'VITE_ASSISTANT_URL', '--repo', $Repo
    if ($currentAssistant -ne $assistantUrl) {
      Invoke-Gh 'variable', 'set', 'VITE_ASSISTANT_URL', '--repo', $Repo, '--body', $assistantUrl
      Write-Host "      VITE_ASSISTANT_URL -> $assistantUrl"
      $changed = $true
    }
    if ($changed) {
      Invoke-Gh 'workflow', 'run', 'deploy.yml', '--repo', $Repo
      Write-Host "      deployment triggered: https://github.com/$Repo/actions"
    } else {
      Write-Host '      tunnel URLs unchanged - no redeploy needed'
    }
  }
}

Write-Host ''
Write-Host 'Done.'
Write-Host "  Tunnel provider:  $Tunnel"
Write-Host "  Blog tunnel:      $blogUrl"
Write-Host "  Assistant tunnel: $assistantUrl"
Write-Host "  Site:             $SiteUrl"
Write-Host "  Local dev:        http://localhost:5173/ (if vite is running)"
Write-Host '  Assistant nav opens in a new tab; configure DSH auth locally if needed.'
