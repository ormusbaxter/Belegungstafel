# Änderungen

Die Fassung steht in `js/konfiguration.js` als `VERSION` und erscheint im Fuß der Hilfe.
Erste Stelle: grundlegender Umbau oder geänderte Datenhaltung. Zweite: neue Funktion oder
spürbar geänderte Bedienung. Dritte: Korrekturen und kleine Anpassungen.

## 2.1.0

- **Fällige Screenings** werden im Kopfbereich rot hervorgehoben
- **Fehlende Pflichtangaben** bei belegtem Bettplatz – Kostform, Devices, Norton / Stammblatt
  und Abstriche – werden in der jeweiligen Zelle dezent rot markiert; angekündigte Aufnahmen
  und Plätze wie „gesperrt“ bleiben außen vor

## 2.0.0

**Umbau der Dateistruktur.** `app.js` ist auf sechs Dateien im Ordner `js/` aufgeteilt:
`konfiguration.js`, `daten.js`, `tabelle.js`, `einstellungen.js`, `schoner.js`, `tafel.js`.
Sie werden von `index.html` in dieser Reihenfolge geladen und teilen sich einen gemeinsamen
Namensraum – bewusst keine ES-Module, weil der Browser diese beim Öffnen von der Festplatte
sperrt.

- **Automatische Sicherung** (Einstellungen → Daten): einmal am Tag eine vollständige
  JSON-Sicherung, wahlweise in einen gewählten Ordner oder in den Download-Ordner des
  Browsers; ältere Sicherungen werden nach einer einstellbaren Zahl entfernt
- **Kennung der Tafel** über `data-instanz` in `index.html`: trennt den Browser-Speicher
  mehrerer Kopien auf einem Rechner, damit eine Testkopie nicht in die Echtdaten schreibt
- **Verlauf** der letzten 20 Änderungen mit „Rückgängig“, Strg + Z und einem Fenster, in dem
  sich einzelne Schritte zurücknehmen lassen – auch Räumen, Verschieben, Leeren und Import
- **Seitenangabe je Diaeintrag**: eine mehrseitige PDF lässt sich mehrfach mit verschiedenen
  Seiten eintragen
- **Prüfungen** im Ordner `tests/`: neun Testdateien, die die Tafel in einem echten Browser
  bedienen; `node tests/run.mjs` führt sie aus
- Ohne Webserver unterbleiben die zwecklosen `fetch`-Versuche, die bisher Fehlermeldungen in
  der Browserkonsole hinterließen

## 1.7.0

- Zeitspanne der dunklen Ansicht einstellbar (Vorgabe 19:00 bis 07:00), minutengenau und über
  Mitternacht hinweg
- „Ordner wählen …“ übernimmt alle Dateien des Diaordners über den Dateidialog – der Weg ohne
  Webserver; dabei wird auch das Seitenformat der PDF aus den Dateien gelesen

## 1.6.1

- Eine fehlerhafte `slides/slides.json` wird beim Einlesen gemeldet statt stillschweigend
  übergangen

## 1.6.0

- Automatische Tag- und Nachtansicht: die Schaltfläche im Seitenkopf führt durch drei
  Zustände (Auto, dunkel, hell), „Auto“ richtet sich nach der Uhrzeit

## 1.5.1

- Diaschau wahlweise in zufälliger Reihenfolge

## 1.5.0

- Größe der Darstellung über einen Schieberegler von 25 % bis 300 %

## 1.4.1

- Dias werden vollständig eingepasst: PDF nach dem Seitenverhältnis der Seite, Bilder
  formatfüllend, zu lange Hinweistexte verkleinert

## 1.4.0

- Bildschirmschoner als Diaschau aus dem Ordner `slides` und eigenen Hinweisen, mit Start
  nach Zeit ohne Eingabe oder von Hand

## 1.3.0

- Aufnahme und Verlegung erscheinen als grüner bzw. dunkelroter Pfeil statt als Textkürzel

## 1.2.1

- Eigenes Logo (`logo.png`) ergänzt

## 1.2.0

- Druckansicht auf A4 quer in Schwarzweiß umgestellt, mit verkürzter Spaltenauswahl und
  einer Spalte für handschriftliche Notizen

## 1.1.1

- Passwortabfrage vor den Einstellungen

## 1.0.1

- Eine eingetragene Fachdisziplin allein zählt als belegtes Bett

## 1.0.0

- Hilfe-Fenster statt Legende, Fassung und Urheberhinweis

## Davor

Aufbau der Tafel: Tabelle mit 13 Bettplätzen und 20 Spalten, Auswahllisten aus der
Datenquelle der bisherigen Excel-Tafel, Isolation mit Verdacht je Keim, Screening-Datum,
Verschieben per Ziehen und Ablegen, Kopfbereich mit Meldestatus und Angaben zur Schicht,
Tastaturnavigation, Sichtschutz, Einstellungsfenster mit Bettplätzen, Spaltenköpfen,
Auswahllisten und Farben.
