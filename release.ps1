# Erzeugt den Auslieferungsstand als ZIP-Archiv unter dist\.
#
# Entspricht release.sh, für Windows-Arbeitsplätze. Aufruf im Projektordner:
#
#     powershell -ExecutionPolicy Bypass -File .\release.ps1
#
# Der Inhalt kommt aus "git archive", also aus dem eingecheckten Stand. Was
# nicht mitgeliefert wird, steht in .gitattributes; die weiteren Schritte in
# INSTALLATION.md.

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

function Abbruch($text) { Write-Error "Abbruch: $text"; exit 1 }

# 1. Nur ein sauberer Arbeitsbaum ergibt ein nachvollziehbares Archiv.
if (git status --porcelain) {
  Abbruch 'Der Arbeitsbaum ist nicht sauber. Erst committen, dann ausliefern.'
}

# 2. Fassung aus dem Quelltext lesen.
$treffer = Select-String -Path 'js/konfiguration.js' -Pattern "^const VERSION = '([^']*)'"
if (-not $treffer) { Abbruch 'Keine VERSION in js/konfiguration.js gefunden.' }
$fassung = $treffer.Matches[0].Groups[1].Value

# 3. Die Fassung muss im CHANGELOG stehen.
if (-not (Select-String -Path 'CHANGELOG.md' -Pattern "^## $([regex]::Escape($fassung))$")) {
  Abbruch "CHANGELOG.md hat keinen Abschnitt `"## $fassung`"."
}

# 4. Fehlende Vorgabe der Station ist zulässig, aber fast nie gewollt.
if (Select-String -Path 'js/vorgaben.js' -Pattern '^const VORGABEN = null;' -Quiet) {
  Write-Host ''
  Write-Host 'Hinweis: js/vorgaben.js enthält keine Vorgabe der Station.'
  Write-Host 'Jeder frisch aufgesetzte Rechner startet dann mit den eingebauten'
  Write-Host 'Werten. Erzeugen über Einstellungen -> Daten ->'
  Write-Host '"Aktuelle Einstellungen als Vorgabe sichern".'
  Write-Host ''
}

# 5. Archiv erzeugen.
$ziel = "dist/belegungstafel-$fassung.zip"
New-Item -ItemType Directory -Force -Path 'dist' | Out-Null
if (Test-Path $ziel) { Remove-Item $ziel }
git archive --format=zip --prefix="belegungstafel-$fassung/" -o $ziel HEAD

# 6. Ergebnis nachweisen.
Write-Host "Erzeugt: $ziel"
Write-Host "SHA-256: $((Get-FileHash $ziel -Algorithm SHA256).Hash.ToLower())"
Write-Host ''
Write-Host 'Inhalt:'
Expand-Archive -Path $ziel -DestinationPath "$env:TEMP\belegungstafel-inhalt" -Force
Get-ChildItem -Recurse -File "$env:TEMP\belegungstafel-inhalt" |
  ForEach-Object { '  ' + $_.FullName.Substring("$env:TEMP\belegungstafel-inhalt".Length + 1) }
Remove-Item -Recurse -Force "$env:TEMP\belegungstafel-inhalt"
