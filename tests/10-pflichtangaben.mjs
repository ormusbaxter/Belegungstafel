/* Fehlende Pflichtangaben und die Hervorhebung fälliger Screenings */
import { browserStarten, neueSeite, testName, gleich, pruefe, keineFehler, bilanz } from './lib.mjs';

testName('Pflichtangaben und fällige Screenings');
const browser = await browserStarten();
const page = await neueSeite(browser);

const luecken = id => page.$$eval(`tr[data-bed="${id}"] td.luecke`,
  tds => tds.map(td => [...td.classList].find(c => c.startsWith('col-')).slice(4)).join(','));

gleich('leerer Bettplatz ohne Markierung', await luecken('0a'), '');

/* Patient zugewiesen: alle vier Angaben fehlen */
await page.fill('tr[data-bed="0a"] td.col-name input', 'Musterfrau, Erika');
await page.selectOption('tr[data-bed="0a"] td.col-status select', { index: 2 });
await page.waitForTimeout(300);
gleich('alle vier Angaben angemahnt', await luecken('0a'), 'postform,devices,norton,abstriche');

const titel = await page.getAttribute('tr[data-bed="0a"] td.col-postform', 'title');
gleich('Hinweis an der Zelle', titel, 'Kostform fehlt');

/* Nach und nach ausfüllen */
await page.selectOption('tr[data-bed="0a"] td.col-postform select', { index: 1 });
await page.waitForTimeout(150);
gleich('Kostform erledigt', await luecken('0a'), 'devices,norton,abstriche');

await page.selectOption('tr[data-bed="0a"] td.col-devices select', { label: 'keins' });
await page.waitForTimeout(150);
gleich('„keins“ gilt als Angabe', await luecken('0a'), 'norton,abstriche');

const boxen = await page.$$('tr[data-bed="0a"] td.col-norton input[type=checkbox]');
await boxen[0].check();
await page.waitForTimeout(150);
gleich('ein Häkchen genügt nicht', await luecken('0a'), 'norton,abstriche');
await boxen[1].check();
await page.waitForTimeout(150);
gleich('beide Häkchen erledigen die Zelle', await luecken('0a'), 'abstriche');

await page.evaluate(() => {
  state.beds['0a'].abstriche = '2026-12-24';
  applyRowState(document.querySelector('tr[data-bed="0a"]'), state.beds['0a']);
});
await page.waitForTimeout(150);
gleich('vollständiger Bettplatz ohne Markierung', await luecken('0a'), '');
pruefe('Hinweis verschwindet',
  (await page.getAttribute('tr[data-bed="0a"] td.col-postform', 'title')) === null);

/* Angekündigte Aufnahme wird nicht angemahnt */
await page.selectOption('tr[data-bed="0b"] td.col-status select', { index: 1 });
await page.waitForTimeout(200);
gleich('angekündigte Aufnahme bleibt frei', await luecken('0b'), '');
await page.selectOption('tr[data-bed="0b"] td.col-status select', { index: 2 });
await page.waitForTimeout(200);
gleich('nach der Aufnahme wird angemahnt', await luecken('0b'), 'postform,devices,norton,abstriche');

/* Bettplatzbeschreibungen wie „gesperrt“ zählen nicht als Patient */
await page.fill('tr[data-bed="1a"] td.col-name input', 'gesperrt');
await page.selectOption('tr[data-bed="1a"] td.col-status select', { index: 2 });
await page.waitForTimeout(300);
gleich('gesperrter Platz ohne Markierung', await luecken('1a'), '');

/* Markierung bleibt nach dem Neuladen */
await page.reload();
await page.waitForTimeout(400);
gleich('Markierung nach dem Neuladen', await luecken('0b'), 'postform,devices,norton,abstriche');

/* Kopfbereich bei fälligem Screening */
const kopf = () => page.$eval('#screeningCard', e => ({
  rot: e.classList.contains('faellig'),
  farbe: getComputedStyle(e).backgroundColor,
  titel: e.title
}));
const ohne = await kopf();
pruefe('ohne fälliges Screening unauffällig', !ohne.rot, ohne.farbe);
gleich('Hinweis ohne Fälligkeit', ohne.titel, 'Kein Screening fällig');

await page.evaluate(() => {
  state.beds['0b'].abstriche = '2020-01-01';
  buildBody();
  renderStats();
});
await page.waitForTimeout(200);
const mit = await kopf();
pruefe('fälliges Screening rot hervorgehoben', mit.rot, mit.farbe);
gleich('roter Hintergrund', mit.farbe, 'rgb(179, 38, 30)');
pruefe('erklärender Hinweis', mit.titel.includes('fällig'), mit.titel);
gleich('Zahl im Kopf', await page.textContent('#statScreening'), '1');

/* Die Markierung erscheint nicht im Ausdruck */
await page.emulateMedia({ media: 'print' });
const imDruck = await page.$eval('tr[data-bed="0a"] td.col-postform', e => getComputedStyle(e).backgroundColor);
gleich('kein Farbton im Ausdruck', imDruck, 'rgba(0, 0, 0, 0)');
await page.emulateMedia({ media: 'screen' });

keineFehler(page);
await browser.close();
bilanz();
