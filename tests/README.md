# Prüfungen der Belegungstafel

Die Tests fahren die Tafel in einem echten Browser (Chromium über Playwright) und prüfen das
Ergebnis so, wie es auf der Station sichtbar wäre – belegte Betten, Zeilenfarben, Ausdruck,
Zoom, Bildschirmschoner, Tag-/Nachtansicht, Verlauf, Sicherung und Einstellungen.

Die Tafel selbst bleibt abhängigkeitsfrei; Playwright wird ausschließlich hier gebraucht.

## Einmalig einrichten

```
cd tests
npm install
npx playwright install chromium
```

Liegt Playwright bereits an anderer Stelle (etwa global), genügt der Pfad in einer
Umgebungsvariablen, dann entfällt `npm install`:

```
PLAYWRIGHT_PFAD=/pfad/zu/playwright/index.mjs node run.mjs
```

## Ausführen

```
node run.mjs            alle Tests
node run.mjs 04 07      nur Dateien, deren Name „04“ oder „07“ enthält
npm test                dasselbe wie „node run.mjs“
```

Jede Datei meldet ihre Einzelprüfungen und endet mit `bestanden` oder `FEHLGESCHLAGEN`;
`run.mjs` fasst am Ende zusammen und gibt bei einem Fehler den Rückgabewert 1 zurück.

## Aufbau

| Datei | prüft |
|---|---|
| `01-belegung.mjs` | Zählung der belegten Betten, Zeilenfarben, Bettplatz räumen |
| `02-status-pfeile.mjs` | Pfeile der ersten Spalte, Übernahme alter Textkürzel |
| `03-drucken.mjs` | Druckansicht: Spaltenauswahl, Schwarzweiß, ausgeblendete Teile |
| `04-zoom.mjs` | Schieberegler 25–300 %, Vorschau, Bestand, Grenzwerte |
| `05-schoner.mjs` | Diaschau: Start, Weiterschalten, Zufall, Einpassen, Seitenangabe |
| `06-tagnacht.mjs` | drei Zustände der Ansicht, einstellbare Nachtspanne |
| `07-verlauf.mjs` | Zurücknehmen einzelner Schritte, Verlaufsfenster, Strg + Z |
| `08-sicherung.mjs` | tägliche Sicherung, Merkzettel, Kennung der Tafel |
| `09-einstellungen.mjs` | Passwort, Listen, Bettplätze, Ordner einlesen (mit Webserver) |
| `10-pflichtangaben.mjs` | fehlende Angaben bei belegtem Bett, roter Screening-Hinweis |
| `11-physio-druck.mjs` | Blatt für die Physiotherapie: Spalten, Zeilen, Schriftgrößen, eine Seite |
| `12-vorgaben.mjs` | Vorgabedatei erzeugen, Geltung, Zurücksetzen, fehlerhafte Datei |
| `13-statistik.mjs` | Kennzahlen, Schichtzuordnung über Mitternacht, Fenster, Einstellungen |
| `14-datenschutz-verstorben.mjs` | Umfang des Sichtschutzes, Kreuz und dunkle Namenszelle |
| `15-ausgaben-sicherheit.mjs` | Formeln in der CSV, Prüfung importierter Statistik, Freitext bleibt Text |
| `16-uebergabe-norton.mjs` | Norton-Fälligkeit, Klammerwerte, Plausibilität, Übergabezettel |

`lib.mjs` enthält die gemeinsamen Hilfen: Browserstart, Prüfungen, das Setzen von
Einstellungen ohne Umweg über den Dialog und einen kleinen Webserver für die Prüfungen,
die einen solchen voraussetzen.

## Eine Prüfung ergänzen

Neue Datei nach dem Muster `17-name.mjs` anlegen:

```js
import { browserStarten, neueSeite, testName, gleich, keineFehler, bilanz } from './lib.mjs';

testName('Kurzer Titel');
const browser = await browserStarten();
const page = await neueSeite(browser);

gleich('was geprüft wird', await page.textContent('#statBelegt'), '0 / 13');

keineFehler(page);
await browser.close();
bilanz();
```

`keineFehler(page)` schlägt an, sobald der Browser einen Skript- oder Konsolenfehler
gemeldet hat – das hat in der Vergangenheit mehrere Fehler aufgedeckt, die man der Oberfläche
nicht ansah. `browserStarten(true)` öffnet den Browser sichtbar, was beim Suchen hilft;
PDF-Inhalte erscheinen nur so, im unsichtbaren Betrieb bleibt die Fläche weiß.
