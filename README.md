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
| Anwesenheitsstatus | A + J | `A >>>`, `●`, `NVK`, `NVK 1–3`, `<<< V` (Gruppe „Belegung“); `Notbett`, `gesperrt`, `Reinigung`, `NA`, `OP`, `CV` (Gruppe „Bettplatz / Aufenthaltsort“) |
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
| Isolation | O | 3MRGN … VRE (25 Einträge) |
| privat | P | Ankreuzfeld, entspricht dem Wert `ja` |
| Physiotherapie | Q | Mobi, AT, Mobi+AT, passiv, Rücksprache, keine KG |

Ohne Vorgabe in der Datenquelle und daher frei bzw. mit eigener Liste belegt:
Patientenname, Pflegekraft, Sonstiges (Freitext), Norton / Stammblatt (zwei
Ankreuzfelder) und Abstriche (Mehrfachauswahl).

Die Spalten **K** (1, 2, 3) und **L** (N, S, V) der Datenquelle sind noch keiner
Spalte der Tafel zugeordnet.

### Bedienung der Felder

| Typ | Spalten | Bedienung |
|---|---|---|
| Auswahlliste | Anwesenheitsstatus, Fachdisziplin, Beatmungsform, Kreislaufunterstützung, Dialyse, Isolation, TTM, Intervention, Therapielimitierung, Postform, Physiotherapie, Devices | Klick auf die Zelle, Wert wählen; leerer Eintrag setzt zurück |
| Freitext mit Vorschlägen | Telefon | tippen oder Vorschlag wählen |
| Mehrfachauswahl | Abstriche | Klick öffnet Dialog, freie Einträge möglich |
| Ankreuzfeld | privat, Norton / Stammblatt | direkt anklicken |
| Freitext | Patientenname, Pflegekraft, Sonstiges | direkt tippen |

## Funktionen

- **Autospeicherung** in den `localStorage` des Browsers; Uhrzeit der letzten Änderung je Bettplatz
- **Farbkodierung** der Zeilen nach Anwesenheitsstatus (Aufnahme, belegt, NVK, außerhalb der
  Station, Verlegung, gesperrt), `ISO`-Kennzeichnung bei eingetragener Isolation,
  farbliche Hervorhebung einer hinterlegten Therapielimitierung
- **Kennzahlen** im Kopf: belegt, frei, gesperrt, NVK, INV, Kreislauf, Dialyse, Isolation
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
