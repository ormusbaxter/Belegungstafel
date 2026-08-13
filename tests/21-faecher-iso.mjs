/* Belegung je Fachabteilung in der Statistik, Gelbfärbung isolierter Zeilen */
import { browserStarten, neueSeite, setzeEinstellungen, oeffneEinstellungen, uebernehmen,
         testName, gleich, pruefe, enthaelt, keineFehler, bilanz } from './lib.mjs';

testName('Fachabteilungen und Isolationsfarbe');
const browser = await browserStarten();
const page = await neueSeite(browser, { viewport: { width: 1600, height: 900 } });

/* Station besetzen: vier Abteilungen, einer ohne Angabe, zwei isoliert. */
const besetzen = () => page.evaluate(() => {
  const plan = [
    ['INT', true], ['INT', false], ['INT', false], ['KARD', true], ['KARD', false],
    ['ACH', false], ['GAST', false], ['', false]
  ];
  BEDS.forEach((bed, i) => {
    const daten = state.beds[bed.id];
    if (i >= plan.length) { daten.status = ''; daten.name = ''; daten.disziplin = ''; daten.isolation = []; return; }
    daten.status = '●';
    daten.name = 'Patient ' + (i + 1);
    daten.disziplin = plan[i][0];
    daten.isolation = plan[i][1] ? [{ v: 'MRSA', s: 'bestaetigt' }] : [];
  });
  /* Ein Verdacht ohne bestätigten Keim – auch dort wird isoliert. */
  state.beds[BEDS[5].id].isolation = [{ v: 'VRE', s: 'verdacht' }];
  save();
  buildBody();
  return BEDS.length;
});
await besetzen();

/* ---- Die Momentaufnahme führt die Aufteilung ---- */
const werte = await page.evaluate(() => statistikKennzahlen());
gleich('belegte Betten gezählt', werte.belegt, 8);
gleich('je Fachabteilung gezählt', JSON.stringify(werte.faecher),
  JSON.stringify({ INT: 3, KARD: 2, ACH: 1, GAST: 1, '': 1 }));
gleich('Isolation zählt auch den Verdacht', werte.isolation, 3);

/* ---- Auswertung über mehrere Schichten ---- */
await page.evaluate(() => {
  /* Drei Schichten mit unterschiedlicher Aufteilung, direkt abgelegt. */
  const stand = [
    { datum: '2026-08-01', schicht: 'frueh', name: 'Frühdienst', start: '06:00',
      zeit: '2026-08-01T07:00:00.000Z', belegt: 10, max: 13, isolation: 2, beatmung: 5,
      dialyse: 1, faecher: { INT: 6, KARD: 3, ACH: 1 } },
    { datum: '2026-08-01', schicht: 'spaet', name: 'Spätdienst', start: '14:12',
      zeit: '2026-08-01T15:00:00.000Z', belegt: 8, max: 13, isolation: 1, beatmung: 4,
      dialyse: 0, faecher: { INT: 4, KARD: 3, '': 1 } },
    /* Ein Stand aus einer früheren Fassung – ohne die Aufteilung. */
    { datum: '2026-08-01', schicht: 'nacht', name: 'Nachtdienst', start: '20:30',
      zeit: '2026-08-01T21:00:00.000Z', belegt: 12, max: 13, isolation: 3, beatmung: 6,
      dialyse: 2 }
  ];
  localStorage.setItem('belegungstafel.statistik', JSON.stringify(stand));
});

const auswertung = await page.evaluate(() => {
  statistikZeitraum = 0;
  return faecherAuswerten(statistikZeitraumDaten());
});
gleich('nur Schichten mit Angabe gehen ein', auswertung.schichten, 2);
gleich('Reihenfolge nach Mittelwert, „ohne Angabe" zuletzt',
  auswertung.zeilen.map(z => z.name).join(' | '),
  'INT | KARD | ACH | ohne Angabe');
gleich('Mittel von INT', auswertung.zeilen[0].mittel, 5);
gleich('Höchstwert von INT', auswertung.zeilen[0].hoechst, 6);
/* ACH kam nur in einer der beiden Schichten vor: 1 und 0 → 0,5 */
gleich('eine Abteilung ohne Bett zählt dort als null', auswertung.zeilen[2].mittel, 0.5);
gleich('Anteil von INT an der mittleren Belegung (9)',
  Math.round(auswertung.zeilen[0].anteil * 10) / 10, 55.6);

/* ---- Das Fenster zeigt sie ---- */
await page.click('#btnStats');
await page.waitForSelector('#statsDlg[open]');
await page.evaluate(() => { statistikZeitraum = 0; renderStatistik(); });
await page.waitForTimeout(200);
enthaelt('eigener Abschnitt im Fenster',
  await page.textContent('#statsFaecher h3'), 'Belegung je Fachabteilung');
gleich('eine Zeile je Abteilung',
  await page.$$eval('#statsFaecher tbody tr', rs => rs.length), 4);
gleich('erste Zeile ist die stärkste Abteilung',
  await page.textContent('#statsFaecher tbody tr:first-child td'), 'INT');
pruefe('„ohne Angabe" ist als solche gekennzeichnet',
  await page.evaluate(() =>
    document.querySelector('#statsFaecher tbody tr:last-child').classList.contains('ohnefach')));
gleich('die große Tabelle bleibt schmal',
  await page.$$eval('#statsTable thead th', ths => ths.length), 9);
await page.click('#statsClose');
await page.waitForTimeout(150);

/* ---- CSV: eine Spalte je Abteilung ---- */
const csv = await page.evaluate(() => {
  let inhalt = '';
  const echt = window.download;
  window.download = (name, text) => { inhalt = text; };
  statistikCsv();
  window.download = echt;
  return inhalt;
});
const kopfzeile = csv.split('\r\n')[0];
enthaelt('CSV führt die Abteilungen', kopfzeile, '"INT";"KARD"');
enthaelt('und „ohne Angabe" am Ende der Gruppe', kopfzeile, '"ohne Angabe"');
gleich('die Schicht ohne Aufteilung lässt die Felder leer',
  csv.split('\r\n')[3].includes(';"";"";"";"";'), true);

/* ---- Gelbfärbung isolierter Zeilen ---- */
const farbe = async () => await page.evaluate(() => {
  const iso = document.querySelector('#tbody tr:first-child');
  const ohne = document.querySelector('#tbody tr:nth-child(2)');
  return { iso: getComputedStyle(iso).backgroundColor,
           ohne: getComputedStyle(ohne).backgroundColor,
           hatKlasse: iso.classList.contains('has-iso') };
});
let stand = await farbe();
pruefe('die isolierte Zeile ist erkannt', stand.hatKlasse);
gleich('ab Werk ohne besondere Farbe', stand.iso, stand.ohne);

await setzeEinstellungen(page, { isoZeile: true });
await besetzen();
stand = await farbe();
pruefe('eingeschaltet wird sie gelb hinterlegt', stand.iso !== stand.ohne,
  stand.iso + ' gegen ' + stand.ohne);
gleich('und zwar im Gelbton der Ansicht', stand.iso, 'rgb(255, 243, 196)');

/* Auch ein bloßer Verdacht färbt – isoliert wird in beiden Fällen. */
gleich('ein Verdacht färbt ebenso',
  await page.evaluate(() =>
    getComputedStyle(document.querySelector('#tbody tr:nth-child(6)')).backgroundColor),
  'rgb(255, 243, 196)');

/* Sie geht den Statusfarben vor und gilt auch ohne Zeilenfarben. */
await setzeEinstellungen(page, { isoZeile: true, zeilenfarben: false });
await besetzen();
stand = await farbe();
gleich('ohne Zeilenfarben bleibt sie stehen', stand.iso, 'rgb(255, 243, 196)');
pruefe('die übrigen Zeilen sind dann einfarbig', stand.ohne !== stand.iso);

/* ---- Die Einstellung ist im Fenster erreichbar ---- */
await setzeEinstellungen(page, {});
await oeffneEinstellungen(page, 'Allgemein');
await page.check('#settingsPane .setblock:has-text("Farbige Zeilen") input[type=checkbox] >> nth=1');
await uebernehmen(page);
await page.waitForTimeout(200);
gleich('über die Einstellungen schaltbar',
  await page.evaluate(() => settings.isoZeile), true);
pruefe('und sofort wirksam',
  await page.evaluate(() => document.body.classList.contains('iso-zeile')));

keineFehler(page);
await browser.close();
bilanz();
