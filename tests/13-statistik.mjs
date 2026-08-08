/* Statistik je Schicht: Kennzahlen, Schichtzuordnung, Fenster, Einstellungen */
import { browserStarten, neueSeite, oeffneEinstellungen, setzeEinstellungen,
         testName, gleich, pruefe, enthaelt, keineFehler, bilanz, TIMEOUT, uebernehmen } from './lib.mjs';

testName('Statistik je Schicht');
const browser = await browserStarten();
const page = await neueSeite(browser, { zeit: '2026-03-05T09:30:00', viewport: { width: 1450, height: 980 } });

/* Belegung: vier Patienten, ein gesperrter Platz */
await page.evaluate(() => {
  state.station.maxBetten = '12';
  const setze = (id, werte) => Object.assign(state.beds[id], werte);
  setze('0a', { name: 'A', status: '●', disziplin: 'ACH', beatmung: ['INV'],
                isolation: [{ v: 'MRSA', s: 'positiv' }], dialyse: 'CiCa' });
  setze('0b', { name: 'B', status: '●', disziplin: 'INT', beatmung: ['NIV'] });
  setze('1a', { name: 'C', status: '●', disziplin: 'KARD',
                isolation: [{ v: 'VRE', s: 'verdacht' }] });
  setze('1b', { name: 'D', status: '●', disziplin: 'TCH', intervention: 'ext. Dial.' });
  setze('2', { name: 'gesperrt', status: '●' });
  buildBody(); renderStation(); renderStats(); save();
});
await page.waitForTimeout(250);

/* ---- Kennzahlen ---- */
const werte = await page.evaluate(() => statistikKennzahlen());
gleich('belegte Betten ohne gesperrte', werte.belegt, 4);
gleich('maximale Bettenzahl', werte.max, 12);
gleich('Isolationen: bestätigt und Verdacht', werte.isolation, 2);
gleich('Beatmungen', werte.beatmung, 2);
gleich('Dialysen ohne externe Dialyse', werte.dialyse, 1);

/* ---- Zuordnung zur Schicht ---- */
const schicht = t => page.evaluate(zeit => {
  const s = schichtAm(new Date(zeit));
  return s.name + ' ' + s.datum;
}, t);
gleich('09:30 ist Frühdienst', await schicht('2026-03-05T09:30:00'), 'Frühdienst 2026-03-05');
gleich('14:11 noch Frühdienst', await schicht('2026-03-05T14:11:00'), 'Frühdienst 2026-03-05');
gleich('14:12 schon Spätdienst', await schicht('2026-03-05T14:12:00'), 'Spätdienst 2026-03-05');
gleich('20:30 ist Nachtdienst', await schicht('2026-03-05T20:30:00'), 'Nachtdienst 2026-03-05');
gleich('nach Mitternacht gehört zum Vortag', await schicht('2026-03-06T03:00:00'), 'Nachtdienst 2026-03-05');
gleich('05:59 noch Nachtdienst des Vortages', await schicht('2026-03-06T05:59:00'), 'Nachtdienst 2026-03-05');

/* ---- Erfassen ---- */
const erfasse = t => page.evaluate(zeit => statistikErfassen(new Date(zeit)), t);
await erfasse('2026-03-05T09:30:00');
await erfasse('2026-03-05T13:00:00');   /* ersetzt die erste Aufnahme derselben Schicht */
gleich('je Schicht nur ein Eintrag', await page.evaluate(() => statistikLaden().length), 1);
gleich('der letzte Stand gilt',
  await page.evaluate(() => timeStr(new Date(statistikLaden()[0].zeit))), '13:00');

await page.evaluate(() => {
  state.beds['3'].name = 'E';
  state.beds['3'].status = '●';
  state.beds['3'].beatmung = ['HFNC'];
  save();
});
await erfasse('2026-03-05T15:00:00');
await erfasse('2026-03-05T22:00:00');
await erfasse('2026-03-06T03:00:00');   /* dieselbe Nachtschicht */
const eintraege = await page.evaluate(() => statistikLaden()
  .map(e => e.datum + '/' + e.schicht + '/' + e.belegt + '/' + e.beatmung).join(' | '));
gleich('drei Schichten des Tages', eintraege,
  '2026-03-05/frueh/4/2 | 2026-03-05/spaet/5/3 | 2026-03-05/nacht/5/3');

/* ---- Fenster ---- */
await page.click('#btnStats');
await page.waitForTimeout(300);
pruefe('Fenster öffnet sich', await page.isVisible('#statsDlg'));
enthaelt('Kopfzeile nennt den Umfang', await page.textContent('#statsInfo'), '3 Schichten erfasst');
const zeilen = await page.$$eval('#statsTable tbody tr',
  rs => rs.map(r => [...r.children].map(c => c.textContent).join('|')));
gleich('drei Zeilen, neueste zuerst', zeilen.length, 3);
enthaelt('erste Zeile ist der Nachtdienst', zeilen[0], 'Nachtdienst');
const summen = await page.$$eval('#statsSummary tbody tr',
  rs => rs.map(r => [...r.children].map(c => c.textContent).join(' ')));
gleich('Mittelwerte je Schicht und gesamt', summen.length, 4);
enthaelt('Mittelwert über alles', summen[3], '4,7');

/* ---- Auslastung: belegte Betten je maximal betreibbarem Platz ---- */
const kopfDetail = await page.$$eval('#statsTable thead th', ts => ts.map(t => t.textContent));
pruefe('Spalte in der Einzeltabelle', kopfDetail.includes('Ausl. %'), kopfDetail.join(' | '));
const kopfSummen = await page.$$eval('#statsSummary thead th', ts => ts.map(t => t.textContent));
pruefe('Spalte in den Mittelwerten', kopfSummen.includes('Auslastung (%)'), kopfSummen.join(' | '));
/* Frühdienst: 4 von 12 Plätzen = 33,3 % */
const frueh = zeilen.find(z => z.includes('Frühdienst'));
enthaelt('Auslastung der Schicht berechnet', frueh, '|33,3|');
/* Mittel über 4, 5 und 5 Betten bei je 12 Plätzen = 38,9 % */
enthaelt('Mittelwert der Auslastung', summen[3], '38,9');

/* Ohne eingetragene Bettenzahl bleibt die Spalte leer statt 0 */
const ohneMax = await page.evaluate(() => auslastung({ belegt: 4, max: null }));
gleich('ohne Bettenzahl kein Wert', ohneMax, null);
gleich('Notbett ergibt über 100 %',
  await page.evaluate(() => Math.round(auslastung({ belegt: 13, max: 12 }))), 108);

/* CSV */
const download = page.waitForEvent('download', { timeout: TIMEOUT });
await page.click('#statsCsv');
const datei = await download;
const { readFile } = await import('node:fs/promises');
const csv = await readFile(await datei.path(), 'utf8');
enthaelt('CSV mit Kopfzeile', csv, '"Datum";"Schicht";"Beginn"');
enthaelt('CSV enthält den Frühdienst', csv, '"Frühdienst";"06:00";"4";"12";"33,3";"2";"2";"1"');
enthaelt('CSV nennt die Auslastung im Kopf', csv, '"Auslastung (%)"');
pruefe('keine Patientennamen in der Auswertung', !csv.includes('"A"') && !csv.includes('gesperrt'));
await page.click('#statsClose');
keineFehler(page);

/* ---- Einstellungen ---- */
await oeffneEinstellungen(page, 'Statistik');
const felder = await page.$$eval('#settingsPane .entry-schicht input[type=text]', is => is.map(i => i.value));
gleich('drei Schichten hinterlegt', felder.join(','), 'Frühdienst,Spätdienst,Nachtdienst');
const zeiten = await page.$$eval('#settingsPane .timefield', is => is.map(i => i.value));
gleich('Anfangszeiten', zeiten.join(','), '06:00,14:12,20:30');

/* Schaltfläche ausblenden */
const kaesten = await page.$$('#settingsPane .setrow input[type=checkbox]');
await kaesten[1].uncheck();
await uebernehmen(page);
await page.waitForTimeout(250);
pruefe('Schaltfläche lässt sich ausblenden', !(await page.isVisible('#btnStats')));

/* Schichtzeiten ändern */
await oeffneEinstellungen(page, 'Statistik');
const zeitFelder = await page.$$('#settingsPane .timefield');
await zeitFelder[1].fill('13:00');
await uebernehmen(page);
await page.waitForTimeout(250);
gleich('geänderte Zeit wirkt sofort', await schicht('2026-03-05T13:30:00'), 'Spätdienst 2026-03-05');
gleich('Zeit gespeichert',
  await page.evaluate(() => JSON.parse(localStorage.getItem('belegungstafel.einstellungen'))
    .statistik.schichten.map(s => s.start).join(',')), '06:00,13:00,20:30');

/* Erfassung abschalten */
await setzeEinstellungen(page, { statistik: { on: false, button: true } });
gleich('ohne Erfassung kein Takt', await page.evaluate(() => statistikTimer === null), true);
await page.click('#btnStats');
await page.waitForTimeout(250);
enthaelt('Hinweis im Fenster', await page.textContent('#statsInfo'), 'Erfassung ist ausgeschaltet');
await page.click('#statsClose');

/* Erfasste Daten bleiben erhalten */
gleich('Daten bleiben erhalten', await page.evaluate(() => statistikLaden().length), 3);
keineFehler(page);

await browser.close();
bilanz();
