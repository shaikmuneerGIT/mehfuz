# Builds the React storefront and the ASP.NET Core API into a single
# self-contained publish folder ready to upload to Windows Server/Plesk.
#
# Usage: .\publish.ps1
# Output: .\publish\  (upload the CONTENTS of this folder via FTP)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "==> Building React client" -ForegroundColor Cyan
Push-Location "$root\client"
npm install
npm run build
Pop-Location

Write-Host "==> Publishing ASP.NET Core API (self-contained, win-x86)" -ForegroundColor Cyan
# Self-contained bundles the .NET runtime itself, so the app runs even if
# the ASP.NET Core Hosting Bundle isn't installed on the server — the
# safer default for shared/Plesk hosting where you don't control that.
# win-x86, not win-x64: HostingRaja's IIS app pool runs 32-bit (confirmed
# via the "HTTP Error 500.32 — different bitness" error from a win-x64
# build) — match the actual server rather than depend on someone changing
# the app pool's "Enable 32-Bit Applications" setting in Plesk.
Push-Location "$root\api"
dotnet publish -c Release -r win-x86 --self-contained true -o "$root\publish"
Pop-Location

Write-Host "==> Copying client build into publish\client-dist" -ForegroundColor Cyan
# dotnet publish only carries files MSBuild knows about — a plain folder
# copy has to happen as a separate step after publish, not before.
$clientDist = "$root\publish\client-dist"
if (Test-Path $clientDist) { Remove-Item $clientDist -Recurse -Force }
Copy-Item "$root\client\dist" $clientDist -Recurse

Write-Host "==> Done. Upload the contents of .\publish\ via FTP." -ForegroundColor Green
Write-Host "    See README.md for the Plesk/IIS setup steps." -ForegroundColor Green
