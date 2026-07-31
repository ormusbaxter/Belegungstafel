/* Zählung der belegten Betten, Zeilenfarben, Bettplatz räumen */
import { browserStarten, neueSeite, testName, gleich, pruefe, keineFehler, bilanz } from './lib.mjs';

testName('Belegung und Zählung');
const browser = await browserStarten();
const page = await neueSeite(browser);

const belegt = () => page.textContent('#statBelegt');
const zeile = id => page.locator(`tr[data-bed="${id}"]`).evaluate(e => e.className.trim());

gleich('leere Tafel zählt nichts', await belegt(), '0 / 13');

/* Nur Fachdisziplin */
await page.selectOption('tr[data-bed="0a"] td.col-disziplin select', { index: 1 });
await page.waitForTimeout(120);
gleich('Fachdisziplin allein zählt', await belegt(), '1 / 13');
gleich('Zeile gilt als belegt', await zeile('0a'), 'st-belegt');

/* Nur Anwesenheitsstatus */
await page.selectOption('tr[data-bed="0b"] td.col-status select', { index: 2 });
await page.waitForTimeout(120);
gleich('Status allein zählt', await belegt(), '2 / 13');

/* gesperrt zählt nie */
await page.fill('tr[data-bed="1a"] td.col-name input', 'gesperrt');
await page.selectOption('tr[data-bed="1a"] td.col-disziplin select', { index: 1 });
await page.waitForTimeout(200);
gleich('gesperrt zählt nicht', await belegt(), '2 / 13');
pruefe('gesperrte Zeile grau', (await zeile('1a')).includes('st-gesperrt'), await zeile('1a'));

/* Bettplatz räumen */
await page.click('tr[data-bed="0a"] .clearbed');
await page.waitForTimeout(250);
gleich('nach dem Räumen', await belegt(), '1 / 13');

/* Bestand nach dem Neuladen */
await page.reload();
await page.waitForTimeout(400);
gleich('nach dem Neuladen', await belegt(), '1 / 13');
gleich('Name blieb erhalten', await page.inputValue('tr[data-bed="1a"] td.col-name input'), 'gesperrt');

keineFehler(page);
await browser.close();
bilanz();
