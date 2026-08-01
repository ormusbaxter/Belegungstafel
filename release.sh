#!/bin/sh
# Erzeugt den Auslieferungsstand als ZIP-Archiv unter dist/.
#
# Der Inhalt kommt aus „git archive", also aus dem eingecheckten Stand – nicht
# aus dem Arbeitsverzeichnis. Was nicht mitgeliefert wird, steht in
# .gitattributes. Aufruf ohne Argumente im Projektordner:
#
#     ./release.sh
#
# Danach liegt dist/belegungstafel-<Fassung>.zip bereit. Die weiteren Schritte
# stehen in INSTALLATION.md.

set -eu

cd "$(dirname "$0")"

meldung() { printf '%s\n' "$*"; }
abbruch() { printf 'Abbruch: %s\n' "$*" >&2; exit 1; }

# 1. Nur ein sauberer Arbeitsbaum ergibt ein nachvollziehbares Archiv.
[ -z "$(git status --porcelain)" ] || abbruch \
  'Der Arbeitsbaum ist nicht sauber. Erst committen, dann ausliefern.'

# 2. Fassung aus dem Quelltext lesen.
fassung=$(sed -n "s/^const VERSION = '\([^']*\)'.*/\1/p" js/konfiguration.js)
[ -n "$fassung" ] || abbruch 'Keine VERSION in js/konfiguration.js gefunden.'

# 3. Die Fassung muss im CHANGELOG stehen – sonst weiß später niemand, was drin ist.
grep -q "^## $fassung\$" CHANGELOG.md || abbruch \
  "CHANGELOG.md hat keinen Abschnitt \"## $fassung\"."

# 4. Ohne Vorgabedatei startet jeder Rechner mit den ausgelieferten Werten
#    statt mit den Einstellungen der Station. Das ist zulässig, aber fast nie
#    gewollt – deshalb ein Hinweis, kein Abbruch.
if grep -q '^const VORGABEN = null;' js/vorgaben.js; then
  meldung ''
  meldung 'Hinweis: js/vorgaben.js enthält keine Vorgabe der Station.'
  meldung 'Jeder frisch aufgesetzte Rechner startet dann mit den eingebauten'
  meldung 'Werten – Bettplätze, Listen und Farben müssten von Hand eingerichtet'
  meldung 'werden. Erzeugen lässt sie sich über Einstellungen → Daten →'
  meldung '„Aktuelle Einstellungen als Vorgabe sichern".'
  meldung ''
fi

# 5. Archiv erzeugen.
ziel="dist/belegungstafel-$fassung.zip"
mkdir -p dist
rm -f "$ziel"
git archive --format=zip --prefix="belegungstafel-$fassung/" -o "$ziel" HEAD

# 6. Ergebnis nachweisen: Prüfsumme und Inhalt.
meldung "Erzeugt: $ziel"
if command -v sha256sum >/dev/null 2>&1; then
  meldung "SHA-256: $(sha256sum "$ziel" | cut -d' ' -f1)"
elif command -v shasum >/dev/null 2>&1; then
  meldung "SHA-256: $(shasum -a 256 "$ziel" | cut -d' ' -f1)"
fi
meldung ''
meldung 'Inhalt:'
git archive --format=tar --prefix="belegungstafel-$fassung/" HEAD | tar -t | sed 's/^/  /'
