/* Monatlich gestaffelte Auswertung: Übersicht im Fenster und CSV je Monat */
import { browserStarten, neueSeite,
         testName, gleich, pruefe, enthaelt, keineFehler, bilanz } from './lib.mjs';

testName('Monatliche Staffelung');
const browser = await browserStarten();
const page = await neueSeite(browser, { viewport: { width: 1600, height: 1000 } });

/* Drei Monate mit unterschiedlicher Belegung. Der Juli hat nur eine Schicht –
   daran muss die Spalte „Schichten" erkennbar sein. */
await page.evaluate(() => {
  const eintrag = (datum, schicht, belegt, faecher) => ({
    datum, schicht, name: { frueh: 'Frühdienst', spaet: 'Spätdienst', nacht: 'Nachtdienst' }[schicht],
    start: { frueh: '06:00', spaet: '14:12', nacht: '20:30' }[schicht],
    zeit: datum + 'T08:00:00.000Z',
    belegt, max: 13, isolation: 2, beatmung: 5, dialyse: 1,
    ...(faecher ? { faecher } : {})
  });
  const stand = [
    eintrag('2026-07-31', 'nacht', 6, { INT: 4, KARD: 2 }),
    eintrag('2026-08-01', 'frueh', 10, { INT: 7, KARD: 3 }),
    eintrag('2026-08-01', 'spaet', 12, { INT: 8, KARD: 4 }),
    eintrag('2026-08-15', 'frueh', 8, { INT: 5, KARD: 3 }),
    /* Eine Schicht ohne Aufteilung – sie zählt bei den Kennzahlen mit,
       bei den Fachabteilungen nicht. */
    eintrag('2026-08-20', 'nacht', 14, null),
    eintrag('2026-09-02', 'frueh', 9, { INT: 6, KARD: 3 }),
    eintrag('2026-09-03', 'spaet', 11, { INT: 7, KARD: 4 })
  ];
  localStorage.setItem('belegungstafel.statistik', JSON.stringify(stand));
});

/* ---- Bündelung ---- */
const monate = await page.evaluate(() => {
  statistikZeitraumSetzen(0);
  return monateAuswerten(statistikZeitraumDaten())
    .map(m => ({ monat: m.monat, name: m.name, schichten: m.liste.length, spitze: m.spitze }));
});
gleich('drei Monate, der jüngste zuerst', monate.map(m => m.monat).join(', '),
  '2026-09, 2026-08, 2026-07');
gleich('mit deutschem Namen', monate[0].name, 'September 2026');
gleich('Schichten je Monat', monate.map(m => m.schichten).join(','), '2,4,1');
gleich('höchste Belegung im August', monate[1].spitze, 14);

gleich('Mittel der Belegung im August',
  await page.evaluate(() => {
    const august = monateAuswerten(statistikZeitraumDaten()).find(m => m.monat === '2026-08');
    return Math.round(mittel(august.liste, STATS_FELDER[0]) * 100) / 100;
  }), 11);

/* ---- Übersicht im Fenster ---- */
await page.click('#btnStats');
await page.waitForSelector('#statsDlg[open]');
await page.evaluate(() => { statistikZeitraumSetzen(0); renderStatistik(); });
await page.waitForTimeout(200);

enthaelt('eigener Abschnitt', await page.textContent('#statsMonate h3'), 'Monatsübersicht');
gleich('eine Zeile je Monat',
  await page.$$eval('#statsMonate tbody tr', rs => rs.length), 3);
gleich('erste Zeile ist der jüngste Monat',
  await page.textContent('#statsMonate tbody tr:first-child td'), 'September 2026');
gleich('Spalten: Monat, Schichten, Kennzahlen, Spitze',
  await page.$$eval('#statsMonate thead th', ths => ths.map(t => t.textContent).join('|')),
  'Monat|Schichten|belegt|max.|Ausl. %|Isolation|Beatmung|Dialyse|Spitze');
gleich('der Juli beruht auf einer Schicht',
  await page.textContent('#statsMonate tbody tr:last-child td:nth-child(2)'), '1');

/* Ein Zeitraum in einem einzigen Monat zeigt statt der Tabelle einen Hinweis. */
await page.evaluate(() => {
  const stand = JSON.parse(localStorage.getItem('belegungstafel.statistik'))
    .filter(e => e.datum.startsWith('2026-08'));
  localStorage.setItem('belegungstafel.statistik', JSON.stringify(stand));
  renderStatistik();
});
await page.waitForTimeout(150);
gleich('bei einem Monat keine Tabelle',
  await page.$$eval('#statsMonate table', ts => ts.length), 0);
enthaelt('sondern ein Hinweis', await page.textContent('#statsMonate p'),
  'einen größeren Zeitraum wählen');

/* ---- CSV je Monat ---- */
await page.evaluate(() => {
  const stand = [
    { datum: '2026-07-31', schicht: 'nacht', name: 'Nachtdienst', start: '20:30',
      zeit: '2026-07-31T21:00:00.000Z', belegt: 6, max: 13, isolation: 2, beatmung: 5,
      dialyse: 1, faecher: { INT: 4, KARD: 2 } },
    { datum: '2026-08-01', schicht: 'frueh', name: 'Frühdienst', start: '06:00',
      zeit: '2026-08-01T07:00:00.000Z', belegt: 10, max: 13, isolation: 2, beatmung: 5,
      dialyse: 1, faecher: { INT: 7, KARD: 3 } },
    { datum: '2026-08-02', schicht: 'frueh', name: 'Frühdienst', start: '06:00',
      zeit: '2026-08-02T07:00:00.000Z', belegt: 14, max: 13, isolation: 2, beatmung: 5,
      dialyse: 1 }
  ];
  localStorage.setItem('belegungstafel.statistik', JSON.stringify(stand));
});

const csv = await page.evaluate(() => {
  let name = '', inhalt = '';
  const echt = window.download;
  window.download = (n, text) => { name = n; inhalt = text; };
  statistikZeitraumSetzen(0);
  statistikCsvMonate();
  window.download = echt;
  return { name, inhalt };
});
enthaelt('eigener Dateiname', csv.name, 'statistik-monate-');
const zeilen = csv.inhalt.split('\r\n');
enthaelt('Kopfzeile nennt den Monat', zeilen[0], '"Monat";"Schichten"');
enthaelt('und die Fachabteilungen', zeilen[0], '"INT (Mittel)";"KARD (Mittel)"');
enthaelt('Mittelwerte tragen den Zusatz', zeilen[0], '"belegte Betten (Mittel)"');
gleich('zwei Monate, der jüngste zuerst', zeilen.length - 1, 2);
enthaelt('August zuerst', zeilen[1], '"August 2026";"2"');
enthaelt('mit dem Mittel der Belegung (10 und 14)', zeilen[1], '"12,0"');
enthaelt('und der Spitze', zeilen[1], '"14"');
/* Nur die eine Augustschicht führt die Aufteilung – über sie wird gemittelt. */
enthaelt('Fachabteilung über die Schichten mit Angabe', zeilen[1], '"7,0";"3,0"');
enthaelt('Juli danach', zeilen[2], '"Juli 2026";"1"');

/* Die Schaltfläche ist im Fenster erreichbar. */
pruefe('Schaltfläche „CSV je Monat"', await page.isVisible('#statsCsvMonat'));
gleich('die bisherige heißt jetzt „CSV je Schicht"',
  await page.textContent('#statsCsv'), 'CSV je Schicht');

keineFehler(page);
await browser.close();
bilanz();
