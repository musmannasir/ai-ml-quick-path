# Build the site and deploy it as plain static files to the local IIS site "AIGuide".
# The deploy folder is a complete static site: you can upload its contents to any static host.
# Run from an elevated shell:  powershell -ExecutionPolicy Bypass -File scripts\deploy.ps1
param(
  [string]$DeployDir = 'D:\AI\GuideApp\deploy',
  [string]$SiteName = 'AIGuide',
  [int]$Port = 8091
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$appcmd = "$env:windir\System32\inetsrv\appcmd.exe"
function Run($exe, $argList) { & $exe @argList; if ($LASTEXITCODE -ne 0) { throw "$exe failed ($LASTEXITCODE)" } }

Push-Location $root
try { Run 'npm' @('run', 'build') } finally { Pop-Location }
$dist = Join-Path $root 'dist'
if (-not (Test-Path "$dist\index.html")) { throw 'dist\index.html missing after build' }

New-Item -ItemType Directory -Force $DeployDir | Out-Null
$poolExists = [bool](& $appcmd list apppool $SiteName 2>$null)
$siteExists = [bool](& $appcmd list site $SiteName 2>$null)

# One-time clean-up of the old exe-based layout (stop the pool first so the exe is not locked).
if ((Test-Path "$DeployDir\AIGuide.exe") -or (Test-Path "$DeployDir\site") -or (Test-Path "$DeployDir\logs")) {
  if ($poolExists) { & $appcmd stop apppool $SiteName | Out-Null; Start-Sleep 3 }
  Get-Process AIGuide -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Remove-Item "$DeployDir\AIGuide.exe", "$DeployDir\site", "$DeployDir\logs" -Recurse -Force -ErrorAction SilentlyContinue
}

# Mirror dist\ into the deploy folder (web.config is generated below and kept).
& robocopy $dist $DeployDir /MIR /XF web.config /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed ($LASTEXITCODE)" }

# web.config: same security headers as dist\_headers, the site's own 404 page, hidden host-config files.
$hdr = @()
foreach ($line in (Get-Content "$dist\_headers" | Select-Object -Skip 1)) {
  if ($line -match '^\s+([A-Za-z-]+):\s+(.+)$') { $hdr += '        <add name="' + $Matches[1] + '" value="' + [Security.SecurityElement]::Escape($Matches[2].Trim()) + '" />' }
}
$config = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <defaultDocument enabled="true"><files><clear /><add value="index.html" /></files></defaultDocument>
    <httpProtocol>
      <customHeaders>
$($hdr -join "`r`n")
      </customHeaders>
    </httpProtocol>
    <httpErrors errorMode="Custom" existingResponse="Replace">
      <remove statusCode="404" />
      <error statusCode="404" path="404.html" responseMode="File" />
    </httpErrors>
    <security><requestFiltering><hiddenSegments><add segment="_headers" /><add segment="staticwebapp.config.json" /></hiddenSegments></requestFiltering></security>
    <staticContent>
      <remove fileExtension=".svg" /><mimeMap fileExtension=".svg" mimeType="image/svg+xml" />
      <remove fileExtension=".json" /><mimeMap fileExtension=".json" mimeType="application/json" />
      <remove fileExtension=".js" /><mimeMap fileExtension=".js" mimeType="text/javascript" />
    </staticContent>
  </system.webServer>
</configuration>
"@
Set-Content "$DeployDir\web.config" $config -Encoding UTF8

# Create pool and site on first run; keep their settings correct afterwards.
if (-not $poolExists) { Run $appcmd @('add', 'apppool', "/name:$SiteName", '/managedRuntimeVersion:', '/managedPipelineMode:Integrated') }
if (-not $siteExists) { Run $appcmd @('add', 'site', "/name:$SiteName", "/bindings:http/*:${Port}:", "/physicalPath:$DeployDir") }
Run $appcmd @('set', 'site', $SiteName, "/bindings:http/*:${Port}:")
Run $appcmd @('set', 'app', "$SiteName/", "/applicationPool:$SiteName")
Run $appcmd @('set', 'vdir', "$SiteName/", "/physicalPath:$DeployDir")
& icacls $DeployDir /grant "IIS AppPool\${SiteName}:(OI)(CI)RX" /T /Q | Out-Null
& $appcmd start apppool $SiteName 2>$null | Out-Null
& $appcmd start site $SiteName 2>$null | Out-Null

# Smoke test: home page, headers, a lesson, and the custom 404.
$base = "http://localhost:$Port"
$ok = $false
foreach ($i in 1..10) { try { $r = Invoke-WebRequest "$base/" -UseBasicParsing -TimeoutSec 30; $ok = ($r.StatusCode -eq 200); break } catch { Start-Sleep 2 } }
if (-not $ok) { throw "Smoke test failed: $base/" }
if (-not $r.Headers['Content-Security-Policy']) { throw 'Smoke test failed: Content-Security-Policy header missing' }
$l = Invoke-WebRequest "$base/lessons/app-rag.html" -UseBasicParsing
if ($l.StatusCode -ne 200 -or $l.Content -notmatch 'class="diagram ') { throw 'Smoke test failed: lesson page or diagrams missing' }
$code = 200
try { Invoke-WebRequest "$base/no-such-page.html" -UseBasicParsing -ErrorAction Stop | Out-Null } catch { if ($_.Exception.Response) { $code = $_.Exception.Response.StatusCode.value__ } }
if ($code -ne 404) { throw "Smoke test failed: missing page returned $code, expected 404" }
Write-Host "Deployed static site: $base/  (IIS site '$SiteName', files in $DeployDir)"
