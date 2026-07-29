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

Feldtypen:

| Typ | Spalten | Bedienung |
|---|---|---|
| Auswahlliste | Anwesenheitsstatus, Fachdisziplin, Beatmungsform, Dialyse, Isolation, TTM, Therapielimitierung, Postform | Klick auf die Zelle, Wert wählen |
| Mehrfachauswahl | Kreislaufunterstützung, Physiotherapie, Devices, Abstriche | Klick öffnet Dialog, freie Einträge möglich |
| Ankreuzfeld | privat, Norton / Stammblatt | direkt anklicken |
| Freitext | Patientenname, Intervention, Telefon, Pflegekraft, Sonstiges | direkt tippen |

## Funktionen

- **Autospeicherung** in den `localStorage` des Browsers; Uhrzeit der letzten Änderung je Bettplatz
- **Farbkodierung** der Zeilen nach Anwesenheitsstatus, `ISO`-Kennzeichnung bei aktiver Isolation,
  farbliche Hervorhebung einer hinterlegten Therapielimitierung
- **Kennzahlen** im Kopf: belegt, frei, invasiv beatmet, Katecholamine, Dialyse, Isolation
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

Die Spalte **„Postform“** ist mit den üblichen Kostformen (nüchtern, Vollkost, enteral,
parenteral …) vorbelegt. Ist eine andere Bedeutung gemeint, genügt es, `options` bzw.
`label` dieses Eintrags zu ändern.

## Datenschutz

Die Anwendung überträgt keine Daten. Sämtliche Eingaben verbleiben im Browser des
jeweiligen Arbeitsplatzes. Da es sich um Patientendaten handelt, gilt für den Einsatz:
nur auf Stationsrechnern innerhalb des Kliniknetzes betreiben, Bildschirmsperre nutzen
und Export-Dateien nicht ungeschützt ablegen. Ein Mehrplatzbetrieb mit gemeinsamer
Datenhaltung würde eine Server-Komponente erfordern und ist bewusst nicht enthalten.
