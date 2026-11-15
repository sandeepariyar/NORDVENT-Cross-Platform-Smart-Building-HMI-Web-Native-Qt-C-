# NORDVENT Engineering Lab — publish the complete source to the creator's repository.
# © 2026 Sandeep Pariyar. All rights reserved.
# Usage (from an extracted copy of this package):
#   powershell -File .\Publish-NORDVENT.ps1
# Requires Git for Windows, an authenticated Git credential manager, and Git identity.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$RepoUrl = 'https://github.com/sandeepariyar/NORDVENT-Cross-Platform-Smart-Building-HMI-Web-Native-Qt-C-.git'
$SourceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git for Windows is required: https://git-scm.com/downloads/win' }
foreach ($check in @('README.md', 'LICENSE.md', '.github\workflows\pages.yml', 'docs\index.html', 'docs\web\index.html', 'native-qt\CMakeLists.txt')) {
    if (-not (Test-Path -LiteralPath (Join-Path $SourceRoot $check))) { throw "Missing project file: $check" }
}
$TempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('nordvent-publish-' + [Guid]::NewGuid().ToString('N'))
Write-Host 'Cloning only the NORDVENT repository...' -ForegroundColor Cyan
& git clone --branch main $RepoUrl $TempRoot
if ($LASTEXITCODE -ne 0) { throw 'Git clone failed: check network and repository access.' }
try {
    Write-Host 'Copying the complete HTML, Qt, simulator and portfolio assets...' -ForegroundColor Cyan
    Get-ChildItem -LiteralPath $SourceRoot -Force | Where-Object { $_.Name -notin @('.git','build') } | ForEach-Object {
        $destination = Join-Path $TempRoot $_.Name
        Copy-Item -LiteralPath $_.FullName -Destination $destination -Recurse -Force
    }
    & git -C $TempRoot add --all
    if ($LASTEXITCODE -ne 0) { throw 'Git staging failed.' }
    & git -C $TempRoot diff --cached --quiet
    if ($LASTEXITCODE -eq 0) { Write-Host 'All files are already on GitHub.' -ForegroundColor Green; return }
    & git -C $TempRoot commit -m 'feat: publish NORDVENT dual-implementation engineering lab'
    if ($LASTEXITCODE -ne 0) { throw 'Commit failed: set git user.name and user.email first.' }
    & git -C $TempRoot push origin main
    if ($LASTEXITCODE -ne 0) { throw 'Push failed: inspect Git credentials and remote changes; no force-push was attempted.' }
    Write-Host 'Published successfully. Enable GitHub Pages once: Settings > Pages > Source: GitHub Actions.' -ForegroundColor Green
    Write-Host 'https://github.com/sandeepariyar/NORDVENT-Cross-Platform-Smart-Building-HMI-Web-Native-Qt-C-'
}
finally {
    # Leave the temporary clone for troubleshooting if an error occurred.
    Write-Host "Temporary publishing clone: $TempRoot"
}
