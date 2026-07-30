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
Telefon · Pflegekraft · Postform · privat · Physiotherapie · Devices ·
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
| Postform | G | VK, %, nüchtern, Tee/H2O … Schonkost (26 Kostformen) |
| Telefon | H | Vorschlagsliste 4149 … 4212, freie Eingabe möglich |
| Intervention | I | Angio, Broncho, CT, Endo, ggf. OP, HKL, MRT, OP, PTR, RÖ, TEE, VAC, ext. Dial. |
| Therapielimitierung | M | DNR, DNI, DND, DNR/DNI, DNR/DND, DNR/I/D |
| Devices | N | ZVK, BDK, ZVK/BDK, keins |
| Isolation | O | 3MRGN … VRE, mehrere Einträge kombinierbar, je Eintrag bestätigt oder Verdacht |
| privat | P | Ankreuzfeld, entspricht dem Wert `ja` |
| Physiotherapie | Q | Mobi, AT, Mobi+AT, passiv, Rücksprache, keine KG |

Die vier Werte `V. a. CoViD`, `V.a. C. diff.`, `V.a. Noro` und `V.a. Rota` der Datenquelle
entfallen, da der Verdacht nun je Eintrag gekennzeichnet wird. Ältere Stände werden beim
Einlesen automatisch übernommen: `V. a. …` wird als Verdacht erkannt.

Ein Eintrag aus Spalte J im Feld Patientenname (z. B. `gesperrt` oder `OP`) beschreibt
den Bettplatz statt eines Patienten: Er wird kursiv dargestellt und färbt die Zeile ein.

Ohne Vorgabe in der Datenquelle und daher frei bzw. mit eigener Liste belegt:
Pflegekraft, Sonstiges (Freitext), Norton / Stammblatt (zwei Ankreuzfelder)
und Abstriche (Mehrfachauswahl).

Die Spalten **K** (1, 2, 3) und **L** (N, S, V) der Datenquelle sind noch keiner
Spalte der Tafel zugeordnet.

### Bedienung der Felder

| Typ | Spalten | Bedienung |
|---|---|---|
| Auswahlliste | Anwesenheitsstatus, Fachdisziplin, Beatmungsform, Kreislaufunterstützung, Dialyse, TTM, Intervention, Therapielimitierung, Postform, Physiotherapie, Devices | Klick auf die Zelle, Wert wählen; leerer Eintrag setzt zurück |
| Freitext mit Vorschlägen | Patientenname, Telefon | tippen oder Vorschlag wählen |
| Mehrfachauswahl | Abstriche | Klick öffnet Dialog, freie Einträge möglich |
| Keimliste | Isolation | Klick öffnet Dialog; Häkchen = bestätigt, zusätzlich „V. a.“ = Verdacht |
| Ankreuzfeld | privat, Norton / Stammblatt | direkt anklicken |
| Freitext | Pflegekraft, Sonstiges | direkt tippen |

## Funktionen

- **Autospeicherung** in den `localStorage` des Browsers; Uhrzeit der letzten Änderung je Bettplatz
- **Farbkodierung** der Zeilen nach Anwesenheitsstatus (Aufnahme, belegt, NVK, außerhalb der
  Station, Verlegung, gesperrt), `ISO`-Kennzeichnung bei eingetragener Isolation,
  farbliche Hervorhebung einer hinterlegten Therapielimitierung
- **Kopfbereich**: belegte Betten (x / 13), Meldestatus als farbiges Auswahlfeld
  (grün / gelb / rot) und Anzahl der fälligen Screenings; darunter Schichtleitung,
  Blutzuständigkeit und Notfallequipment mit jeweils zugehöriger Telefonnummer.
  Diese Angaben gelten für die gesamte Station, werden mitgespeichert, mit exportiert
  und mitgedruckt; „Tafel leeren“ lässt sie stehen
- **Isolation**: beliebig viele Einträge je Bettplatz, jeder einzeln als bestätigt oder als
  Verdacht geführt (z. B. MRSA bestätigt und Verdacht auf VRE). Bestätigte Keime erscheinen
  als gefüllte, Verdachtsfälle als gestrichelte Marke mit vorangestelltem `V. a.`.
  Am Bettplatz steht `ISO`, sobald ein Keim bestätigt ist, und `ISO?`, solange nur
  Verdachtsfälle eingetragen sind
- **Abstriche**: Datum des nächsten Screenings mit Schaltfläche „+ 7 Tage“; ein fälliges
  oder überfälliges Datum wird rot hervorgehoben und in den Kennzahlen gezählt
- **Verschieben per Ziehen und Ablegen**: Bettplatz-Zelle greifen und auf einen anderen
  Bettplatz ziehen. Ist das Ziel belegt, tauschen beide Plätze ihre Einträge; der
  letzte Vorgang lässt sich über „Rückgängig“ in der Statuszeile zurücknehmen
- **Suche** über alle Felder und Filter „nur belegte Betten“
- **Bettplatz räumen** über das `×` in der Bettspalte, „Tafel leeren“ für die gesamte Station
- **Export/Import** als JSON (vollständige Tafel) sowie CSV-Export für Excel
- **Druckansicht** (A3 quer) mit ausgeblendeter Bedienleiste
- **Hell-/Dunkelansicht** über die Schaltfläche ◐
- Änderungen werden zwischen mehreren Browser-Tabs desselben Rechners abgeglichen

## Anpassung

Bettplätze und Spalten sind am Anfang von `app.js` in `BEDS` und `COLUMNS` hinterlegt.
Auswahllisten lassen sich dort durch Ergänzen der `options`-Arrays an die Gepflogenheiten
der Station anpassen; neue Spalten werden allein durch einen weiteren Eintrag in `COLUMNS`
angelegt.

Alle 20 Spalten passen auf einem 1920 px breiten Bildschirm ohne Querscrollen nebeneinander;
auf schmaleren Geräten bleiben Anwesenheitsstatus und Bettplatz beim Scrollen stehen.

## Datenschutz

Die Anwendung überträgt keine Daten. Sämtliche Eingaben verbleiben im Browser des
jeweiligen Arbeitsplatzes. Da es sich um Patientendaten handelt, gilt für den Einsatz:
nur auf Stationsrechnern innerhalb des Kliniknetzes betreiben, Bildschirmsperre nutzen
und Export-Dateien nicht ungeschützt ablegen. Ein Mehrplatzbetrieb mit gemeinsamer
Datenhaltung würde eine Server-Komponente erfordern und ist bewusst nicht enthalten.
