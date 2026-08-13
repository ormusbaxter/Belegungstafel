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
node run.mjs            die regulären Tests, vier nebeneinander   (~45 s)
node run.mjs --alle     zusätzlich die optionalen                 (~50 s)
node run.mjs 04 07      nur Dateien, deren Name „04“ oder „07“ enthält
node run.mjs --reihe    nacheinander statt nebeneinander
node run.mjs -j 8       Zahl der gleichzeitig laufenden Tests
npm test                dasselbe wie „node run.mjs“
```

Jede Datei meldet ihre Einzelprüfungen und endet mit `bestanden` oder `FEHLGESCHLAGEN`;
`run.mjs` fasst am Ende zusammen und gibt bei einem Fehler den Rückgabewert 1 zurück. Weil
mehrere Tests gleichzeitig laufen, wird die Ausgabe je Datei gesammelt und erst am Stück
gezeigt – sonst fielen sie sich zeilenweise ins Wort.

### Optionale und exklusive Tests

`05-schoner.mjs` läuft **nicht** im normalen Durchlauf mit. Er prüft Zeitverhalten und ist
damit der langsamste Test; er gehört vor eine Auslieferung, nicht in jeden Durchlauf während
der Arbeit. Mit `--alle` oder durch Nennen (`node run.mjs 05`) läuft er mit.

`12-vorgaben.mjs` läuft **allein**, nach den übrigen. Er schreibt `js/vorgaben.js` – eine
Datei, die jede andere Testseite mitlädt; nebenher sähen die übrigen Tests zwischendurch eine
fremde oder absichtlich fehlerhafte Vorgabe. Beide Listen stehen oben in `run.mjs`.

### Zeit vorspulen statt abwarten

`neueSeite(browser, { uhr: true })` stellt die Uhr der Seite und **hält sie an**; `vorspulen(page, ms)`
rückt sie dann um die angegebene Spanne vor, worauf die Zeitgeber der Seite sofort feuern. Aus
elf Sekunden Warten wird ein Sekundenbruchteil – `05-schoner.mjs` braucht dadurch 8 statt 55 s.

Zwei Dinge sind dabei zu beachten:

* **Die Uhr muss angehalten sein.** Läuft sie daneben weiter, addieren sich vorgespulte und
  echte Zeit; in der Diaschau hat das reproduzierbar Schritte verschluckt. `zeit:` allein
  stellt nur das Datum und lässt die Uhr laufen, `uhr: true` hält sie an.
* **Was der Browser selbst betreibt, spult nicht mit** – Übergänge, Bildaufbau, Laden von
  Dateien. Dafür weiter echt warten. `vorspulen` hängt deshalb einen kurzen echten Nachlauf an,
  damit das Angestoßene noch dargestellt wird.

## Aufbau

| Datei | prüft |
|---|---|
| `01-belegung.mjs` | Zählung der belegten Betten, Zeilenfarben, Bettplatz räumen |
| `02-status-pfeile.mjs` | Pfeile der ersten Spalte, Übernahme alter Textkürzel |
| `03-drucken.mjs` | Druckansicht: Spaltenauswahl, Schwarzweiß, ausgeblendete Teile |
| `04-zoom.mjs` | Schieberegler 25–300 %, Vorschau, Bestand, Grenzwerte |
| `05-schoner.mjs` | Diaschau: Start, Weiterschalten, Zufall, Einpassen, Seitenangabe – **optional** |
| `06-tagnacht.mjs` | drei Zustände der Ansicht, einstellbare Nachtspanne |
| `07-verlauf.mjs` | Zurücknehmen einzelner Schritte, Verlaufsfenster, Strg + Z |
| `08-sicherung.mjs` | tägliche Sicherung, Merkzettel, Kennung der Tafel |
| `09-einstellungen.mjs` | Passwort, Listen, Bettplätze, Berechtigungen, Bezeichnung der Tafel |
| `10-pflichtangaben.mjs` | fehlende Angaben bei belegtem Bett, roter Screening-Hinweis |
| `11-physio-druck.mjs` | Blatt für die Physiotherapie: Spalten, Zeilen, Schriftgrößen, eine Seite |
| `12-vorgaben.mjs` | Vorgabedatei erzeugen, Geltung, Zurücksetzen, fehlerhafte Datei – **läuft allein** |
| `13-statistik.mjs` | Kennzahlen, Schichtzuordnung über Mitternacht, Fenster, Einstellungen |
| `14-datenschutz-verstorben.mjs` | Umfang des Sichtschutzes, Kreuz und dunkle Namenszelle |
| `15-ausgaben-sicherheit.mjs` | Formeln in der CSV, Prüfung importierter Statistik, Freitext bleibt Text |
| `16-uebergabe-norton.mjs` | Norton-Fälligkeit, Klammerwerte, Plausibilität, Übergabezettel |
| `17-hilfe.mjs` | Kurzanleitung: Menü der Abschnitte, keine Inhalte für die Administration |
| `18-termine.mjs` | Termine: Wiederholungen, eigenes Fenster, rechter Teil der Diaschau, Umzug alter Stände |
| `19-diaordner.mjs` | Ordner für die Diaschau: Übernahme mit Inhalt aus einem beliebigen Ordner, Auffrischen, Entfernen |
| `20-doppelseite.mjs` | Zweiseitige Hochkant-PDF nebeneinander: Erkennung, Bühnenbreite, Nachtragen |
| `21-faecher-iso.mjs` | Belegung je Fachabteilung (Erfassung, Mittelwerte, CSV), Gelbfärbung isolierter Zeilen |
| `22-monate.mjs` | Monatliche Staffelung: Bündelung, Übersicht im Fenster, CSV je Monat |

`lib.mjs` enthält die gemeinsamen Hilfen: Browserstart, Prüfungen, das Setzen von
Einstellungen ohne Umweg über den Dialog und einen kleinen Webserver für die Prüfungen,
die einen solchen voraussetzen.

## Eine Prüfung ergänzen

Neue Datei nach dem Muster `23-name.mjs` anlegen:

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
