# Belegungstafel Intensivstation

Digitale Belegungstafel für eine Intensivstation mit 13 Bettplätzen – umgesetzt als
reine HTML-/CSS-/JavaScript-Anwendung ohne Framework, ohne Build-Schritt und ohne
Server-Anbindung.

## Start

`index.html` im Browser öffnen (Doppelklick genügt) oder die drei Dateien auf einem
beliebigen Webserver bereitstellen.

```
index.html    Grundgerüst und Dialoge
styles.css    Layout, Farbkodierung, Druckansicht
app.js        Spalten- und Bettenkonfiguration, Datenhaltung, Bedienlogik
slides/       Inhalte für den Bildschirmschoner (PDF, PNG, JPEG) mit Liste slides.json
```

## Bettplätze

0 a · 0 b · 1 a · 1 b · 2 · 3 · 4 a · 4 b · 5 · 6 a · 6 b · 7 · 8 (13 Plätze)

## Spalten

Anwesenheitsstatus · Bettplatz · Patientenname · Fachdisziplin · Beatmungsform ·
Kreislaufunterstützung · Dialyse · Isolation · TTM · Intervention · Therapielimitierung ·
Telefon · Pflegekraft · Kostform · privat · Physiotherapie · Devices ·
Norton / Stammblatt · Abstriche · Sonstiges

### Herkunft der Auswahlwerte

Die Auswahllisten stammen aus dem Tabellenblatt „Datenquelle“ der bisherigen
Excel-Belegungstafel und sind wörtlich übernommen:

| Spalte der Tafel | Datenquelle | Werte |
|---|---|---|
| Anwesenheitsstatus | A | ➡ (grün, Aufnahme), `●`, `NVK`, `NVK 1`, `NVK 2`, `NVK 3`, ⬅ (dunkelrot, Verlegung) |
| Patientenname | J | Freitext mit optionaler Auswahl: `Notbett`, `gesperrt`, `Reinigung`, `NA`, `OP`, `CV` |
| Fachdisziplin | B | ACH, DIAB, GAST, GCH, INF, INT, KARD, ONKO, RAD, TCH, UCH, X |
| Beatmungsform | C | INV, NIV, HFNC, NIV/HF, (INV), (NIV), (HFNC), (NIV/HF), MIRUS – mehrere Einträge kombinierbar |
| Kreislaufunterstützung | D | ECMO, ECOS, ECPELLA, ILA, IMPELLA, pass. SM, PiCCO – mehrere Einträge kombinierbar |
| Dialyse | E | CiCa, (CiCa) |
| TTM | F | ❄, ☼ |
| Kostform | G | VK, %, nüchtern, Tee/H2O … Schonkost (26 Kostformen) |
| Telefon | H | Vorschlagsliste 4149 … 4212, freie Eingabe möglich |
| Intervention | I | Angio, Broncho, CT, Endo, ggf. OP, HKL, MRT, OP, PTR, RÖ, TEE, VAC, ext. Dial. |
| Therapielimitierung | M | DNR, DNI, DND – mehrere Einträge kombinierbar |
| Devices | N | ZVK, BDK, ZVK/BDK, keins |
| Isolation | O | 3MRGN … VRE, mehrere Einträge kombinierbar, je Eintrag bestätigt oder Verdacht |
| privat | P | Ankreuzfeld, entspricht dem Wert `ja` |
| Physiotherapie | Q | Mobi, AT, Mobi+AT, passiv, Rücksprache, keine KG |

Die vier Werte `V. a. CoViD`, `V.a. C. diff.`, `V.a. Noro` und `V.a. Rota` der Datenquelle
entfallen, da der Verdacht nun je Eintrag gekennzeichnet wird. Ältere Stände werden beim
Einlesen automatisch übernommen: `V. a. …` wird als Verdacht erkannt.

Ebenso entfallen die zusammengesetzten Werte `DNR/DNI`, `DNR/DND` und `DNR/I/D` der
Therapielimitierung; sie werden beim Einlesen in die einzelnen Einträge aufgeteilt.

Die Textkürzel `A >>>` und `<<< V` der ersten Spalte sind durch einen kräftigen grünen
Pfeil nach rechts (Aufnahme) und einen dunkelroten Pfeil nach links (Verlegung) ersetzt;
vorhandene Stände werden beim Einlesen umgestellt.

Ein Eintrag aus Spalte J im Feld Patientenname (z. B. `gesperrt` oder `OP`) beschreibt
den Bettplatz statt eines Patienten: Er wird kursiv dargestellt und färbt die Zeile ein.

Ohne Vorgabe in der Datenquelle: Pflegekraft und Sonstiges (Freitext),
Norton / Stammblatt (zwei Ankreuzfelder) sowie Abstriche (Datum des nächsten
Screenings).

Die Spalten **K** (1, 2, 3) und **L** (N, S, V) der Datenquelle sind noch keiner
Spalte der Tafel zugeordnet.

### Bedienung der Felder

| Typ | Spalten | Bedienung |
|---|---|---|
| Auswahlliste | Anwesenheitsstatus, Fachdisziplin, Dialyse, TTM, Intervention, Kostform, Physiotherapie, Devices | Klick auf die Zelle, Wert wählen; leerer Eintrag setzt zurück |
| Mehrfachauswahl | Beatmungsform, Kreislaufunterstützung, Therapielimitierung | Klick öffnet Dialog, mehrere Einträge kombinierbar |
| Freitext mit Klappliste | Patientenname, Telefon | frei tippen oder über `▾` bzw. Alt + Pfeil nach unten die vollständige Liste öffnen |
| Datum | Abstriche | Klick öffnet Dialog mit Datumsfeld und den Schaltflächen „nächster Montag“, „übernächster Montag“ und „löschen“ |
| Keimliste | Isolation | Klick öffnet Dialog; Häkchen = bestätigt, zusätzlich „V. a.“ = Verdacht |
| Ankreuzfeld | privat, Norton / Stammblatt | direkt anklicken |
| Freitext | Pflegekraft, Sonstiges | direkt tippen |

## Funktionen

- **Firmenlogo**: Der quadratische Platzhalter links im Seitenkopf zeigt eine Datei
  `logo.png`, sobald sie neben `index.html` liegt; ohne Datei bleibt der Platzhalter stehen
  und wird nicht mitgedruckt. Mitgeliefert wird ein schlichtes Kreuzzeichen (`logo.png`,
  512 × 512 px mit Transparenz); die Quelle dazu liegt als `logo.svg` daneben – dort lassen
  sich Farbwert (`#E9450C`) und Strichstärke ändern, anschließend neu als PNG ausgeben
- **Autospeicherung** in den `localStorage` des Browsers
- **Farbkodierung** der Zeilen nach Anwesenheitsstatus (Aufnahme, belegt, NVK, außerhalb der
  Station, Verlegung, gesperrt), `ISO`-Kennzeichnung bei eingetragener Isolation,
  farbliche Hervorhebung einer hinterlegten Therapielimitierung
- **Kopfbereich**: belegte Betten (x / 13; belegt ist jeder Bettplatz mit gesetztem
  Anwesenheitsstatus **oder** eingetragener Fachdisziplin, unabhängig davon, welche Werte in
  den Einstellungen hinterlegt sind; `gesperrt` oder `Reinigung` im Feld Patientenname zählt
  nie), maximale Bettenzahl als Eingabefeld mit
  festem Zusatz „+ 1“ für das Notbett, Meldestatus als farbiges Auswahlfeld
  (grün / gelb / rot) und Anzahl der fälligen Screenings; darunter Schichtleitung,
  Blutzuständigkeit und Notfallequipment mit jeweils zugehöriger Telefonnummer.
  Diese Angaben gelten für die gesamte Station, werden mitgespeichert, mit exportiert
  und mitgedruckt; „Tafel leeren“ lässt sie stehen
- **Isolation**: beliebig viele Einträge je Bettplatz, jeder einzeln als bestätigt oder als
  Verdacht geführt (z. B. MRSA bestätigt und Verdacht auf VRE). Bestätigte Keime erscheinen
  als gefüllte, Verdachtsfälle als gestrichelte Marke mit vorangestelltem `V. a.`.
  Am Bettplatz steht `ISO`, sobald ein Keim bestätigt ist, und `ISO?`, solange nur
  Verdachtsfälle eingetragen sind
- **Abstriche**: nur das Datum des nächsten Screenings, wahlweise über die Schaltflächen
  „nächster Montag“ und „übernächster Montag“; ein fälliges oder überfälliges Datum wird rot
  hervorgehoben und im Kopfbereich gezählt
- **Tastatur**: Navigation durch die Tabelle mit den Pfeiltasten, Zeilenwechsel mit der
  Eingabetaste (mit Umschalt aufwärts). In Textfeldern wechseln Links und Rechts erst am
  Anfang bzw. Ende des Textes die Zelle. Auswahlfelder werden über die Anfangsbuchstaben
  oder mit Alt + Pfeil nach unten geändert, damit die Pfeiltasten zum Navigieren frei bleiben
- **Unter der Tafel**: Textfeld für geplante Aufnahmen, feste Rufnummernliste der Station
  und Textfeld für allgemeine Informationen; die beiden Textfelder werden mitgespeichert
  und exportiert
- **Hilfe** über den runden Fragezeichen-Knopf unten rechts, oberhalb des Zahnrads: eine
  Kurzanleitung für die Bedienung der Tafel – Eingabe der Felder, Zählung der belegten Betten,
  Verschieben per Ziehen und Ablegen, Kennzeichen und Zeilenfarben, Datenschutz,
  Bildschirmschoner sowie Speichern, Drucken und Austausch. Am Fuß stehen Fassung und Urheberhinweis
- **Verschieben per Ziehen und Ablegen**: Bettplatz-Zelle greifen und auf einen anderen
  Bettplatz ziehen. Ist das Ziel belegt, tauschen beide Plätze ihre Einträge; der
  letzte Vorgang lässt sich über „Rückgängig“ in der Statuszeile zurücknehmen
- **Einstellungen** über das Zahnrad unten rechts, geschützt durch eine Passwortabfrage
  (Passwort in `app.js` als `SETTINGS_PASSWORD`; der Schutz verhindert versehentliches
  Verstellen, ersetzt aber keine Zugriffskontrolle, da er im Quelltext der Seite steht): Beschriftung der Spaltenköpfe,
  Bezeichnung, Reihenfolge und Anzahl der **Bettplätze** sowie Bearbeiten der Auswahllisten
  für Anwesenheitsstatus, Fachdisziplinen, Beatmungsformen, Kreislaufunterstützung, Dialyse, Isolation,
  Interventionen, Therapielimitierung, Kostformen, Physiotherapie, der Telefonvorschläge
  der Tabelle und der Rufnummernliste unter der Tafel – Einträge lassen sich hinzufügen,
  umbenennen, sortieren und entfernen, jede Kategorie einzeln auf die Voreinstellung
  zurücksetzen. Je Kategorie lassen sich zusätzlich **Textfarbe, Hintergrundfarbe und
  Rahmenstil** festlegen (z. B. alle Isolationen gelb hinterlegt mit dunkler Schrift). Die
  Farbauswahl erfolgt über 16 feste Farbkästchen plus „Standard“; eine Beispielmarke zeigt
  das Ergebnis sofort. Die Angaben gelten in der Tabelle für das Auswahlfeld der Spalte und
  für alle Marken der Mehrfachauswahl und bleiben im Ausdruck erhalten.
  Unter „Allgemein“ als Punkt 1 der Sichtschutz und als Punkt 2 der Bildschirmschoner –
  jeweils mit Ein/Aus und Zeit in Sekunden –, unter „Bildschirmschoner“ die Inhalte der
  Diaschau, unter „Daten“ Export, Import und „Tafel leeren“.
  Ein Wert, der in einem Bettplatz steht, bleibt erhalten, auch wenn er später aus der
  Liste entfernt wird
- **Sichtschutz**: Nach der eingestellten Zeit ohne Eingabe (Voreinstellung 120 Sekunden)
  werden die patientenbezogenen Spalten – Patientenname bis
  einschließlich Therapielimitierung – sowie die beiden Textfelder unter der Tafel
  unkenntlich gemacht. Jede Mausbewegung oder Taste hebt das auf; die Schaltfläche
  „Datenschutz“ schaltet sofort um und bleibt dann bis zu einem Klick oder Tastendruck
  bestehen. Bettplatz, Anwesenheitsstatus und die Kennzahlen bleiben lesbar, der Ausdruck
  wird nie unkenntlich gemacht
- **Bildschirmschoner (Diaschau)**: zeigt bildschirmfüllend die freigegebenen Inhalte
  nacheinander – Dateien aus dem Ordner `slides` (PDF, PNG, JPEG) und in den Einstellungen
  angelegte Hinweise aus Überschrift und Infotext. Der Start erfolgt über die Schaltfläche
  „Diaschau“ im Seitenkopf oder, wenn der Bildschirmschoner eingeschaltet ist, nach der
  eingestellten Zeit ohne Eingabe (mindestens 10 Sekunden); jede Mausbewegung oder Taste
  beendet ihn wieder. Solange ein Dialog geöffnet ist, startet er nicht. Jeder Eintrag lässt
  sich einzeln an- und abschalten, in der Reihenfolge verschieben und mit einer eigenen
  Anzeigedauer versehen; ohne eigene Angabe gilt die zentrale Vorgabe (10 Sekunden).
  Patientendaten werden nie angezeigt, unten stehen Uhrzeit, Datum und die Position in der
  Schau. Da ein Browser kein Verzeichnis auslesen darf, erfährt die Tafel die Dateinamen
  über `slides/slides.json`, über die Verzeichnisübersicht des Webservers oder durch eine
  Eingabe von Hand („Ordner einlesen“ bzw. „+ Datei von Hand“ in den Einstellungen);
  Einzelheiten stehen in `slides/LIESMICH.txt`
- **Bedienleiste** oben rechts: „Datenschutz“, „Diaschau“ und „Drucken“ mit Symbol sowie die
  Hell-/Dunkel-Umschaltung. Export, Import und „Tafel leeren“ stehen in den Einstellungen
  unter „Daten“
- **Bettplatz räumen** über das `×` in der Bettspalte
- **Export/Import** als JSON (Belegung, Angaben zur Schicht und Einstellungen) sowie
  CSV-Export für Excel
- **Druckansicht**: eine Seite **A4 quer in Schwarzweiß**. Gedruckt werden belegte Betten,
  maximale Bettenzahl und Meldestatus (ausgeschrieben), Schichtleitung und Blutzuständigkeit
  mit Telefonnummer, die geplanten Aufnahmen sowie eine verkürzte Tabelle mit
  Anwesenheitsstatus, Bettplatz, Patientenname, Fachdisziplin, Isolation, Intervention,
  Therapielimitierung, Telefon und Pflegekraft, ergänzt um eine breite Spalte **Notizen**.
  Die Zeilenhöhe richtet sich nach der Anzahl der Bettplätze, damit das Blatt gefüllt wird
- Änderungen werden zwischen mehreren Browser-Tabs desselben Rechners abgeglichen

## Fassung

Die Fassung steht in `app.js` als Konstante `VERSION` und erscheint im Fuß der Hilfe
zusammen mit dem Urheberhinweis. Sie wird mit jeder Änderung erhöht:

| Stelle | wann |
|---|---|
| erste (1.x.x) | grundlegender Umbau, geänderte Datenhaltung |
| zweite (x.1.x) | neue Funktion oder spürbar geänderte Bedienung |
| dritte (x.x.1) | Korrekturen, Beschriftungen, kleine Anpassungen |

## Anpassung

Die Auswahllisten der meisten Spalten werden über das Zahnrad unten rechts gepflegt und
liegen im `localStorage` unter `belegungstafel.einstellungen`; die Werte in `app.js` sind
die Voreinstellung, auf die sich jede Kategorie zurücksetzen lässt.

Bettplätze und Spalten sind am Anfang von `app.js` in `BEDS` und `COLUMNS` hinterlegt.
Neue Spalten werden allein durch einen weiteren Eintrag in `COLUMNS` angelegt; soll eine
Liste im Einstellungsdialog erscheinen, genügt ein Eintrag in `OPTION_CATEGORIES`.

Alle 20 Spalten passen auf einem 1920 px breiten Bildschirm ohne Querscrollen nebeneinander;
auf schmaleren Geräten bleiben Anwesenheitsstatus und Bettplatz beim Scrollen stehen.

Spaltenköpfe und Zellinhalte sind mittig ausgerichtet; Ausnahme sind die beiden
Ankreuzfelder unter „Norton / Stammblatt“, die linksbündig untereinander stehen.

Fünf Spalten richten sich in der Breite nach ihrem Inhalt: gemessen werden der längste
Statuswert, die längste Bettbezeichnung sowie der längste Eintrag unter Patientenname
(96 bis 300 px), Telefon (78 bis 170 px) und Pflegekraft (62 bis 170 px); die drei
Freitextspalten werden beim Verlassen des Feldes angepasst. Platz für das Kennzeichen `ISO` kommt nur hinzu, wenn eine
Isolation eingetragen ist. Die Spalte „Sonstiges“ hat keine feste Breite und
nimmt den verbleibenden Platz auf, sodass alle übrigen Spalten genau ihre Vorgabe behalten.

## Datenschutz

Die Anwendung überträgt keine Daten. Sämtliche Eingaben verbleiben im Browser des
jeweiligen Arbeitsplatzes. Da es sich um Patientendaten handelt, gilt für den Einsatz:
nur auf Stationsrechnern innerhalb des Kliniknetzes betreiben, Bildschirmsperre nutzen
und Export-Dateien nicht ungeschützt ablegen. Ein Mehrplatzbetrieb mit gemeinsamer
Datenhaltung würde eine Server-Komponente erfordern und ist bewusst nicht enthalten.
