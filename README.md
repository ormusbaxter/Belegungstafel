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
| Anwesenheitsstatus | A | `A >>>`, `●`, `NVK`, `NVK 1`, `NVK 2`, `NVK 3`, `<<< V` |
| Patientenname | J | Freitext mit optionaler Auswahl: `Notbett`, `gesperrt`, `Reinigung`, `NA`, `OP`, `CV` |
| Fachdisziplin | B | ACH, DIAB, GAST, GCH, INF, INT, KARD, ONKO, RAD, TCH, UCH, X |
| Beatmungsform | C | INV, NIV, HFNC, NIV/HF, (INV), (NIV), (HFNC), (NIV/HF), MIRUS |
| Kreislaufunterstützung | D | ECMO, ECOS, ECPELLA, ILA, IMPELLA, pass. SM, PiCCO |
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
| Auswahlliste | Anwesenheitsstatus, Fachdisziplin, Beatmungsform, Kreislaufunterstützung, Dialyse, TTM, Intervention, Kostform, Physiotherapie, Devices | Klick auf die Zelle, Wert wählen; leerer Eintrag setzt zurück |
| Mehrfachauswahl | Therapielimitierung | Klick öffnet Dialog, mehrere Einträge kombinierbar |
| Freitext mit Klappliste | Patientenname, Telefon | frei tippen oder über `▾` bzw. Alt + Pfeil nach unten die vollständige Liste öffnen |
| Datum | Abstriche | Klick öffnet Dialog mit Datumsfeld und den Schaltflächen „nächster Montag“, „übernächster Montag“ und „löschen“ |
| Keimliste | Isolation | Klick öffnet Dialog; Häkchen = bestätigt, zusätzlich „V. a.“ = Verdacht |
| Ankreuzfeld | privat, Norton / Stammblatt | direkt anklicken |
| Freitext | Pflegekraft, Sonstiges | direkt tippen |

## Funktionen

- **Firmenlogo**: Der quadratische Platzhalter links im Seitenkopf zeigt eine Datei
  `logo.png`, sobald sie neben `index.html` liegt; ohne Datei bleibt der Platzhalter stehen
  und wird nicht mitgedruckt
- **Autospeicherung** in den `localStorage` des Browsers
- **Farbkodierung** der Zeilen nach Anwesenheitsstatus (Aufnahme, belegt, NVK, außerhalb der
  Station, Verlegung, gesperrt), `ISO`-Kennzeichnung bei eingetragener Isolation,
  farbliche Hervorhebung einer hinterlegten Therapielimitierung
- **Kopfbereich**: belegte Betten (x / 13), maximale Bettenzahl als Eingabefeld mit
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
- **Legende** ein- und ausklappbar, der Zustand wird gemerkt; für den Ausdruck wird sie
  automatisch aufgeklappt
- **Verschieben per Ziehen und Ablegen**: Bettplatz-Zelle greifen und auf einen anderen
  Bettplatz ziehen. Ist das Ziel belegt, tauschen beide Plätze ihre Einträge; der
  letzte Vorgang lässt sich über „Rückgängig“ in der Statuszeile zurücknehmen
- **Einstellungen** über das Zahnrad unten rechts: Bearbeiten der Auswahllisten für
  Fachdisziplinen, Beatmungsformen, Kreislaufunterstützung, Dialyse, Isolation,
  Interventionen, Therapielimitierung, Kostformen, Physiotherapie, der Telefonvorschläge
  der Tabelle und der Rufnummernliste unter der Tafel – Einträge lassen sich hinzufügen,
  umbenennen, sortieren und entfernen, jede Kategorie einzeln auf die Voreinstellung
  zurücksetzen. Je Kategorie lassen sich zusätzlich **Textfarbe, Hintergrundfarbe und
  Rahmenstil** festlegen (z. B. alle Isolationen gelb hinterlegt mit dunkler Schrift). Die
  Farbauswahl erfolgt über 16 feste Farbkästchen plus „Standard“; eine Beispielmarke zeigt
  das Ergebnis sofort. Die Angaben gelten in der Tabelle für das Auswahlfeld der Spalte und
  für alle Marken der Mehrfachauswahl und bleiben im Ausdruck erhalten.
  Unter „Allgemein“ der Sichtschutz mit Ein/Aus und Zeit in Sekunden.
  Ein Wert, der in einem Bettplatz steht, bleibt erhalten, auch wenn er später aus der
  Liste entfernt wird
- **Sichtschutz**: Nach der eingestellten Zeit ohne Eingabe (Voreinstellung 120 Sekunden)
  werden die patientenbezogenen Spalten – Patientenname bis
  einschließlich Therapielimitierung – sowie die beiden Textfelder unter der Tafel
  unkenntlich gemacht. Jede Mausbewegung oder Taste hebt das auf; die Schaltfläche
  „Abdunkeln“ schaltet sofort um und bleibt dann bis zu einem Klick oder Tastendruck
  bestehen. Bettplatz, Anwesenheitsstatus und die Kennzahlen bleiben lesbar, der Ausdruck
  wird nie unkenntlich gemacht
- **Suche** über alle Felder und Filter „nur belegte Betten“
- **Bettplatz räumen** über das `×` in der Bettspalte, „Tafel leeren“ für die gesamte Station
- **Export/Import** als JSON (vollständige Tafel) sowie CSV-Export für Excel
- **Druckansicht** (A3 quer) mit ausgeblendeter Bedienleiste
- **Hell-/Dunkelansicht** über die Schaltfläche ◐
- Änderungen werden zwischen mehreren Browser-Tabs desselben Rechners abgeglichen

## Anpassung

Die Auswahllisten der meisten Spalten werden über das Zahnrad unten rechts gepflegt und
liegen im `localStorage` unter `belegungstafel.einstellungen`; die Werte in `app.js` sind
die Voreinstellung, auf die sich jede Kategorie zurücksetzen lässt.

Bettplätze und Spalten sind am Anfang von `app.js` in `BEDS` und `COLUMNS` hinterlegt.
Neue Spalten werden allein durch einen weiteren Eintrag in `COLUMNS` angelegt; soll eine
Liste im Einstellungsdialog erscheinen, genügt ein Eintrag in `OPTION_CATEGORIES`.

Alle 20 Spalten passen auf einem 1920 px breiten Bildschirm ohne Querscrollen nebeneinander;
auf schmaleren Geräten bleiben Anwesenheitsstatus und Bettplatz beim Scrollen stehen. Die
Statusspalte trägt keine Überschrift und ist nur so breit wie ihre Werte; der Versatz der
fixierten Bettplatz-Spalte wird aus der gemessenen Breite abgeleitet.

## Datenschutz

Die Anwendung überträgt keine Daten. Sämtliche Eingaben verbleiben im Browser des
jeweiligen Arbeitsplatzes. Da es sich um Patientendaten handelt, gilt für den Einsatz:
nur auf Stationsrechnern innerhalb des Kliniknetzes betreiben, Bildschirmsperre nutzen
und Export-Dateien nicht ungeschützt ablegen. Ein Mehrplatzbetrieb mit gemeinsamer
Datenhaltung würde eine Server-Komponente erfordern und ist bewusst nicht enthalten.
