/* Druckansicht: A4 quer, schwarzweiß, verkürzte Spaltenauswahl */
import { browserStarten, neueSeite, testName, gleich, pruefe, keineFehler, bilanz } from './lib.mjs';

testName('Druckansicht');
const browser = await browserStarten();
const page = await neueSeite(browser);

await page.fill('tr[data-bed="0a"] td.col-name input', 'Musterfrau, Erika');
await page.fill('#noteAufnahmen', 'Herr Beispiel, ACH, gegen 14 Uhr');
await page.selectOption('#meldestatus', 'gelb');
await page.waitForTimeout(250);

await page.emulateMedia({ media: 'print' });

const sichtbareSpalten = await page.$$eval('#thead th', ths => ths
  .filter(th => getComputedStyle(th).display !== 'none')
  .map(th => th.textContent.replace(/­/g, '').trim() || '(leer)'));
gleich('gedruckte Spalten', sichtbareSpalten.join(' | '),
  '(leer) | Bettplatz | Patientenname | Fachdisziplin | Isolation | Intervention | ' +
  'Therapielimitierung | Telefon | Pflegekraft | Notizen');

const versteckt = sel => page.locator(sel).evaluate(e => getComputedStyle(e).display === 'none');
pruefe('Bedienleiste nicht im Druck', await versteckt('.tools'));
pruefe('Zahnrad nicht im Druck', await versteckt('.gear'));
pruefe('Telefonliste nicht im Druck', await versteckt('.note-phones'));
pruefe('geplante Aufnahmen im Druck', !(await versteckt('.note-aufnahmen')));

const farben = await page.$$eval('#tbody td', tds => tds
  .map(td => getComputedStyle(td).backgroundColor)
  .filter(c => c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent'));
gleich('keine Farbflächen im Druck', farben.length, 0);

const schoner = await page.locator('#saver').evaluate(e => getComputedStyle(e).display);
gleich('Bildschirmschoner nicht im Druck', schoner, 'none');

const zoomImDruck = await page.locator('.tablewrap').evaluate(e => getComputedStyle(e).zoom);
gleich('Bildschirmzoom gilt nicht im Druck', String(zoomImDruck), '1');

await page.emulateMedia({ media: 'screen' });
const alleSpalten = await page.$$eval('#thead th', ths => ths.length);
gleich('am Bildschirm alle Spalten', alleSpalten, 21);
pruefe('Notizspalte nur im Druck', await versteckt('#thead th.col-notizen'));

keineFehler(page);
await browser.close();
bilanz();
