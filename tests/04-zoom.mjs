/* Größe der Darstellung: Regler, Vorschau, Bestand, Grenzwerte */
import { browserStarten, neueSeite, oeffneEinstellungen, setzeEinstellungen,
         testName, gleich, pruefe, keineFehler, bilanz } from './lib.mjs';

testName('Zoom der Tafel');
const browser = await browserStarten();
const page = await neueSeite(browser, { viewport: { width: 1600, height: 900 } });

const mass = () => page.evaluate(() => ({
  zoom: getComputedStyle(document.documentElement).getPropertyValue('--zoom').trim(),
  breite: Math.round(document.querySelector('#board').getBoundingClientRect().width),
  zeile: Math.round(document.querySelector('#tbody tr').getBoundingClientRect().height),
  statusRechts: Math.round(document.querySelector('#thead th.col-status').getBoundingClientRect().right),
  bettLinks: Math.round(document.querySelector('#thead th.col-bed').getBoundingClientRect().left),
  dialog: getComputedStyle(document.querySelector('#settingsDlg')).fontSize
}));

const start = await mass();
gleich('Ausgangswert 100 %', start.zoom, '1');

await oeffneEinstellungen(page, 'Allgemein');
const regler = await page.$('.zoomslider');
gleich('Reglerbereich', await regler.evaluate(e => e.min + '-' + e.max), '25-300');

await regler.fill('200');
await regler.dispatchEvent('input');
await page.waitForTimeout(200);
const vorschau = await mass();
gleich('Vorschau setzt den Zoom', vorschau.zoom, '2');
pruefe('Tabelle etwa doppelt so breit', Math.abs(vorschau.breite - start.breite * 2) < start.breite * 0.1,
  start.breite + ' -> ' + vorschau.breite);
gleich('Dialog bleibt unverändert', vorschau.dialog, start.dialog);
gleich('Anzeige neben dem Regler', await page.textContent('.zoomvalue'), '200 %');

await page.click('#settingsCancel');
await page.waitForTimeout(200);
gleich('Abbrechen stellt zurück', (await mass()).zoom, '1');

await oeffneEinstellungen(page, 'Allgemein');
const regler2 = await page.$('.zoomslider');
await regler2.fill('160');
await regler2.dispatchEvent('input');
await page.click('#settingsSave');
await page.waitForTimeout(300);
gleich('Übernehmen speichert', (await mass()).zoom, '1.6');

await page.reload();
await page.waitForTimeout(400);
const nachher = await mass();
gleich('Bestand nach dem Neuladen', nachher.zoom, '1.6');
gleich('stehende Spalte sitzt richtig', nachher.bettLinks, nachher.statusRechts);

/* Kleinster und größter Wert */
await setzeEinstellungen(page, { zoom: 25 });
gleich('kleinster Wert', (await mass()).zoom, '0.25');
await setzeEinstellungen(page, { zoom: 300 });
const gross = await mass();
gleich('größter Wert', gross.zoom, '3');
const tabelle = await page.locator('.tablewrap').evaluate(e => Math.round(e.getBoundingClientRect().height));
pruefe('Tabelle bleibt sichtbar', tabelle > 200, tabelle + ' px');
pruefe('Kopfbereich läuft nicht mehr mit',
  await page.evaluate(() => document.body.classList.contains('flatheader')));

/* Werte außerhalb der Grenzen werden eingefangen */
await setzeEinstellungen(page, { zoom: 5000 });
gleich('zu großer Wert wird begrenzt', (await mass()).zoom, '3');

keineFehler(page);
await browser.close();
bilanz();
