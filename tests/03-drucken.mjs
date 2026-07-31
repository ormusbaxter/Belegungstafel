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
pruefe('Hilfe nicht im Druck', await versteckt('.help'));
pruefe('Statistik-Schaltfläche nicht im Druck', await versteckt('.statsbtn'));
pruefe('Telefonliste nicht im Druck', await versteckt('.note-phones'));
pruefe('geplante Aufnahmen im Druck', !(await versteckt('.note-aufnahmen')));

/* Die Angaben zur Schicht stehen unter der Tabelle – am Bildschirm wie auf
   dem Blatt; die schwebenden Schaltflächen dürfen kein Feld verdecken. */
const reihenfolge = async () => await page.$$eval('body > *',
  es => es.filter(e => ['HEADER', 'MAIN', 'SECTION'].includes(e.tagName) &&
                       getComputedStyle(e).display !== 'none')
          .map(e => e.className.split(' ')[0]).join(' → '));
gleich('Schichtangaben unter der Tabelle im Druck', await reihenfolge(),
  'topbar → tablewrap → stationbar → notes');

await page.emulateMedia({ media: 'screen' });
gleich('Schichtangaben unter der Tabelle am Schirm', await reihenfolge(),
  'topbar → tablewrap → stationbar → notes');
const verdeckt = await page.evaluate(() => {
  const kasten = s => document.querySelector(s).getBoundingClientRect();
  const knoepfe = ['#btnStats', '#btnHelp', '#btnSettings'].map(s => {
    document.querySelector(s).hidden = false;
    return kasten(s);
  });
  return [...document.querySelectorAll('.stationfield input')].some(feld => {
    const f = feld.getBoundingClientRect();
    return knoepfe.some(k => f.left < k.right && k.left < f.right && f.top < k.bottom && k.top < f.bottom);
  });
});
pruefe('keine Schaltfläche über einem Feld der Schichtangaben', !verdeckt);
await page.emulateMedia({ media: 'print' });

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
