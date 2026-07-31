/* Pfeile der ersten Spalte, Übernahme alter Textkürzel */
import { browserStarten, neueSeite, testName, gleich, pruefe, enthaelt, keineFehler, bilanz } from './lib.mjs';

testName('Anwesenheitsstatus als Pfeile');
const PFEIL_AUF = '➡︎';
const PFEIL_AB = '⬅︎';

const browser = await browserStarten();
const page = await neueSeite(browser);

/* Alter Stand mit Textkürzeln, wie ihn frühere Fassungen abgelegt haben */
await page.evaluate(() => localStorage.setItem('belegungstafel.intensiv.v1', JSON.stringify({
  version: 1,
  beds: {
    '0a': { name: 'Alt Aufnahme', status: 'A >>>' },
    '0b': { name: 'Alt Verlegung', status: '<<< V' },
    '1a': { name: 'Umbenannt', status: 'A >>' }
  }
})));
await page.reload();
await page.waitForTimeout(400);

const wert = id => page.locator(`tr[data-bed="${id}"] td.col-status select`).inputValue();
const zeile = id => page.locator(`tr[data-bed="${id}"]`).evaluate(e => e.className.trim());

gleich('A >>> wird zum Pfeil nach rechts', await wert('0a'), PFEIL_AUF);
gleich('<<< V wird zum Pfeil nach links', await wert('0b'), PFEIL_AB);
gleich('auch die Kurzform A >>', await wert('1a'), PFEIL_AUF);
gleich('Zeilenfarbe Aufnahme', await zeile('0a'), 'st-aufnahme');
gleich('Zeilenfarbe Verlegung', await zeile('0b'), 'st-verlegung');
gleich('Aufnahme und Verlegung zählen mit', await page.textContent('#statBelegt'), '3 / 13');

const stil = await page.locator('tr[data-bed="0a"] td.col-status select').evaluate(e => {
  const c = getComputedStyle(e);
  return { farbe: c.color, groesse: c.fontSize, fett: c.fontWeight };
});
gleich('Aufnahmepfeil grün', stil.farbe, 'rgb(47, 125, 50)');
gleich('Pfeil groß und fett', stil.groesse + '/' + stil.fett, '22px/700');

const abStil = await page.locator('tr[data-bed="0b"] td.col-status select')
  .evaluate(e => getComputedStyle(e).color);
gleich('Verlegungspfeil dunkelrot', abStil, 'rgb(142, 28, 28)');

/* Im Ausdruck schwarz */
await page.emulateMedia({ media: 'print' });
const druck = await page.locator('tr[data-bed="0a"] td.col-status select')
  .evaluate(e => getComputedStyle(e).color);
gleich('im Druck schwarz', druck, 'rgb(0, 0, 0)');
await page.emulateMedia({ media: 'screen' });

/* Auswahlliste enthält beide Pfeile */
const optionen = await page.$$eval('#tbody tr:first-child td.col-status option', os => os.map(o => o.value).join(','));
enthaelt('Pfeil nach rechts in der Liste', optionen, PFEIL_AUF);
enthaelt('Pfeil nach links in der Liste', optionen, PFEIL_AB);

/* Migration ist dauerhaft */
await page.reload();
await page.waitForTimeout(300);
pruefe('Migration bleibt nach dem Neuladen', (await wert('0a')) === PFEIL_AUF);

keineFehler(page);
await browser.close();
bilanz();
