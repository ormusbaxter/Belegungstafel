/* Verlauf: Zurücknehmen von Feldänderungen, Räumen, Verschieben, Leeren */
import { browserStarten, neueSeite, testName, gleich, pruefe, enthaelt, keineFehler, bilanz } from './lib.mjs';

testName('Verlauf und Zurücknehmen');
const browser = await browserStarten();
const page = await neueSeite(browser);

const name = id => page.inputValue(`tr[data-bed="${id}"] td.col-name input`);
const eintraege = () => page.$$eval('.histrow .histlabel', ns => ns.map(n => n.textContent));

pruefe('anfangs keine Rückgängig-Schaltfläche', (await page.$$('.savestate button.undo')).length === 0);

/* Feldänderung */
await page.fill('tr[data-bed="0a"] td.col-name input', 'Musterfrau, Erika');
await page.waitForTimeout(600);
pruefe('Rückgängig erscheint', (await page.$$('.savestate button.undo')).length === 2);

await page.click('.savestate button.undo');
await page.waitForTimeout(300);
gleich('Feldänderung zurückgenommen', await name('0a'), '');

/* Der zurückgenommene Schritt lässt sich selbst zurücknehmen */
await page.click('.savestate button.undo');
await page.waitForTimeout(300);
gleich('Zurücknehmen ist umkehrbar', await name('0a'), 'Musterfrau, Erika');

/* Bettplatz räumen */
await page.click('tr[data-bed="0a"] .clearbed');
await page.waitForTimeout(300);
gleich('Bettplatz geräumt', await name('0a'), '');
await page.click('.savestate button.undo');
await page.waitForTimeout(300);
gleich('Räumen zurückgenommen', await name('0a'), 'Musterfrau, Erika');

/* Verschieben */
await page.evaluate(() => moveBed('0a', '2'));
await page.waitForTimeout(300);
gleich('Patient verschoben', await name('2'), 'Musterfrau, Erika');
gleich('Ausgangsbett leer', await name('0a'), '');
await page.click('.savestate button.undo');
await page.waitForTimeout(300);
gleich('Verschieben zurückgenommen', await name('0a'), 'Musterfrau, Erika');

/* Tafel leeren */
await page.fill('tr[data-bed="1a"] td.col-name input', 'Zweiter Patient');
await page.waitForTimeout(600);
await page.evaluate(() => clearAll());
await page.waitForTimeout(300);
gleich('Tafel geleert', (await name('0a')) + (await name('1a')), '');
await page.click('.savestate button.undo');
await page.waitForTimeout(300);
gleich('Leeren zurückgenommen', await name('0a'), 'Musterfrau, Erika');
gleich('auch der zweite Patient', await name('1a'), 'Zweiter Patient');

/* Verlaufsfenster */
await page.click('.savestate button.undo + button.undo');
await page.waitForTimeout(300);
pruefe('Verlauf öffnet sich', await page.isVisible('#histDlg'));
const liste = await eintraege();
pruefe('Verlauf enthält Einträge', liste.length >= 3, liste.length + ' Einträge');
enthaelt('benannter Schritt', liste.join(' | '), 'Bett');

/* Ein älterer Schritt lässt sich gezielt zurücknehmen */
const vorher = await name('1a');
await page.click('.histrow:last-child button');
await page.waitForTimeout(300);
pruefe('älterer Stand wiederhergestellt', (await name('1a')) !== vorher || (await name('0a')) === '');
await page.click('#histClose');

/* Strg + Z */
await page.fill('tr[data-bed="3"] td.col-name input', 'Tastaturtest');
await page.waitForTimeout(600);
await page.click('h1');
await page.keyboard.press('Control+z');
await page.waitForTimeout(300);
gleich('Strg + Z nimmt zurück', await name('3'), '');

/* Mehrere Tastendrücke im selben Feld gelten als ein Schritt */
const vorAnzahl = await page.evaluate(() => history.length);
await page.fill('tr[data-bed="4a"] td.col-name input', 'A');
await page.waitForTimeout(200);
await page.fill('tr[data-bed="4a"] td.col-name input', 'Ab');
await page.waitForTimeout(200);
await page.fill('tr[data-bed="4a"] td.col-name input', 'Abc');
await page.waitForTimeout(400);
gleich('Tippen im selben Feld = ein Schritt',
  await page.evaluate(() => history.length) - vorAnzahl, 1);

keineFehler(page);
await browser.close();
bilanz();
