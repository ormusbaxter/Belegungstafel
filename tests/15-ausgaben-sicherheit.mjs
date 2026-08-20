/* Sicherheit der Ausgaben: Formeln in der CSV, Prüfung importierter Statistik,
   Freitext bleibt Text */
import { browserStarten, neueSeite, testName, gleich, pruefe, enthaelt,
         keineFehler, bilanz, TIMEOUT } from './lib.mjs';

testName('Sicherheit der Ausgaben');
const browser = await browserStarten();
const page = await neueSeite(browser, { zeit: '2026-03-05T09:30:00' });

/* Holt den Inhalt der Datei, die eine Ausgabe erzeugt. */
async function ausgabe(aufruf) {
  const laden = page.waitForEvent('download', { timeout: TIMEOUT });
  await page.evaluate(fn => window[fn](), aufruf);
  const datei = await laden;
  const { readFile } = await import('node:fs/promises');
  return await readFile(await datei.path(), 'utf8');
}

/* ---- Formeln in der Belegungs-CSV ---- */
await page.fill('tr[data-bed="0a"] td.col-name input', '=1+1');
await page.fill('tr[data-bed="0b"] td.col-name input', 'Meier, Anna');
await page.fill('tr[data-bed="1a"] td.col-name input', '@SUM(A1:A9)');
await page.fill('tr[data-bed="1b"] td.col-name input', '-Vorname, Name');
await page.fill('tr[data-bed="2"] td.col-telefon input', '+4949');
await page.fill('#noteInfos', '=cmd|\'/c calc\'!A0');
await page.waitForTimeout(400);

const csv = await ausgabe('exportCsv');
enthaelt('führendes Gleichheitszeichen entschärft', csv, '"\'=1+1"');
enthaelt('führendes At entschärft', csv, '"\'@SUM(A1:A9)"');
enthaelt('führender Bindestrich entschärft', csv, '"\'-Vorname, Name"');
enthaelt('führendes Plus entschärft', csv, '"\'+4949"');
enthaelt('Formel im Textfeld entschärft', csv, '"\'=cmd|\'/c calc\'!A0"');
enthaelt('gewöhnlicher Name unverändert', csv, '"Meier, Anna"');
pruefe('keine unentschärfte Formel in der Datei', !/[;\r\n]"=/.test(csv));

/* ---- Formeln in der Statistik-CSV ---- */
await page.evaluate(() => {
  settings.statistik.schichten[0].name = '-Frühdienst';
  statistikErfassen(new Date('2026-03-05T09:30:00'));
});
const statCsv = await ausgabe('statistikCsv');
enthaelt('Schichtbezeichnung entschärft', statCsv, '"\'-Frühdienst"');

/* ---- Import: verdorbene Statistik wird geprüft ---- */
const datei = JSON.stringify({
  beds: {},
  statistik: [
    { datum: '2026-03-04', schicht: 'frueh', name: 'Frühdienst', start: '06:00',
      zeit: '2026-03-04T09:00:00.000Z', belegt: 7, max: 12, isolation: 1, beatmung: 2, dialyse: 0 },
    { datum: '2026-03-04', schicht: 'spaet', name: 'Spätdienst', belegt: '=1+1', max: 'viele' },
    { datum: 'kaputt', schicht: 'frueh', belegt: 3 },
    { __proto__: { vergiftet: true } },
    'kein Eintrag'
  ]
});
await page.setInputFiles('#fileInput', {
  name: 'sicherung.json', mimeType: 'application/json', buffer: Buffer.from(datei)
});
await page.waitForTimeout(500);

const nachImport = await page.evaluate(() => statistikLaden());
gleich('nur geprüfte Einträge übernommen', nachImport.length, 2);
gleich('gültiger Eintrag bleibt vollständig', nachImport[0].belegt, 7);
gleich('Text in einer Kennzahl wird verworfen', nachImport[1].belegt, null);
gleich('unbrauchbarer Wert wird nicht gerechnet', nachImport[1].max, null);
pruefe('kein zusätzliches Feld übernommen',
  Object.keys(nachImport[1]).join(',') === 'datum,schicht,name,start,zeit,belegt,max,isolation,beatmung,dialyse,' +
    'belegtMittel,belegtTief,belegtSpitze,dauer,aufnahmen',
  Object.keys(nachImport[1]).join(','));
gleich('Object.prototype unberührt', await page.evaluate(() => ({}).vergiftet), undefined);
gleich('fehlende Startzeit bleibt leer', nachImport[1].start, '');

/* ---- Freitext bleibt Text ---- */
await page.fill('tr[data-bed="3"] td.col-name input', '<img src=x onerror="window.__xss=1">');
await page.fill('#noteAufnahmen', '<script>window.__xss=1<\/script>');
await page.waitForTimeout(400);
await page.reload();
await page.waitForTimeout(400);

gleich('kein Skript ausgeführt', await page.evaluate(() => window.__xss), undefined);
gleich('kein Element aus der Eingabe entstanden',
  await page.evaluate(() => document.querySelectorAll('#tbody img, #tbody script').length), 0);
gleich('Eingabe steht unverändert im Feld',
  await page.inputValue('tr[data-bed="3"] td.col-name input'),
  '<img src=x onerror="window.__xss=1">');

keineFehler(page);
await browser.close();
bilanz();
