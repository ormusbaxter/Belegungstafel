/* Kopfbereich: Meldestatus ohne Leerwert, Plausibilität der Bettenzahl */
import { browserStarten, neueSeite, testName, gleich, pruefe, keineFehler, bilanz } from './lib.mjs';

testName('Meldestatus und maximale Bettenzahl');
const browser = await browserStarten();
const page = await neueSeite(browser);

/* ---- Meldestatus: nur grün, gelb, rot ---- */
const auswahl = await page.$$eval('#meldestatus option', os => os.map(o => o.value));
gleich('drei Werte zur Wahl', auswahl.join(','), 'grün,gelb,rot');
gleich('kein Leerwert mehr', auswahl.includes(''), false);
gleich('die Tafel beginnt bei grün', await page.inputValue('#meldestatus'), 'grün');
gleich('Karte ist grün eingefärbt',
  await page.locator('#meldeCard').getAttribute('data-melde'), 'grün');

await page.selectOption('#meldestatus', 'rot');
await page.waitForTimeout(250);
gleich('Wechsel färbt die Karte',
  await page.locator('#meldeCard').getAttribute('data-melde'), 'rot');
gleich('Wechsel wird gespeichert',
  await page.evaluate(() => JSON.parse(localStorage.getItem('belegungstafel.intensiv.v1')).station.meldestatus),
  'rot');

/* Ein älterer Stand ohne Meldestatus wird beim Einlesen auf grün gebracht */
await page.evaluate(() => {
  const stand = JSON.parse(localStorage.getItem('belegungstafel.intensiv.v1'));
  stand.station.meldestatus = '';
  localStorage.setItem('belegungstafel.intensiv.v1', JSON.stringify(stand));
});
await page.reload();
await page.waitForTimeout(400);
gleich('leerer Stand wird zu grün', await page.inputValue('#meldestatus'), 'grün');

/* ---- Maximale Bettenzahl: 1 bis 12, das Notbett kommt als „+ 1“ hinzu ---- */
const feld = page.locator('#maxBetten');
gleich('Untergrenze im Feld hinterlegt', await feld.getAttribute('min'), '1');
gleich('Obergrenze im Feld hinterlegt', await feld.getAttribute('max'), '12');
gleich('fester Zusatz für das Notbett', (await page.textContent('.plusone')).trim(), '+ 1');

const unplausibel = () => page.locator('#maxCard').evaluate(e => e.classList.contains('unplausibel'));

await feld.fill('12');
await page.waitForTimeout(250);
pruefe('zwölf Plätze sind plausibel', !(await unplausibel()));
gleich('Zeiger nennt die Gesamtzahl',
  await page.locator('#maxCard').getAttribute('title'),
  'Maximal 12 Bettplätze zuzüglich Notbett, insgesamt 13');

/* Beim Tippen bleibt die Eingabe stehen und wird nur markiert */
await feld.fill('40');
await page.waitForTimeout(250);
pruefe('zu große Zahl wird markiert', await unplausibel());
gleich('während des Tippens nicht verändert', await feld.inputValue(), '40');
pruefe('Zeiger nennt die Spanne',
  (await page.locator('#maxCard').getAttribute('title')).includes('Nur 1 bis 12'));

/* Erst beim Verlassen des Feldes wird zurechtgerückt */
await feld.blur();
await page.waitForTimeout(300);
gleich('beim Verlassen auf die Obergrenze gesetzt', await feld.inputValue(), '12');
pruefe('Markierung verschwindet', !(await unplausibel()));
pruefe('Hinweis in der Statuszeile',
  (await page.textContent('#saveState')).includes('Maximale Bettenzahl auf 12 gesetzt'),
  await page.textContent('#saveState'));

await feld.fill('0');
await feld.blur();
await page.waitForTimeout(300);
gleich('Null wird auf die Untergrenze gesetzt', await feld.inputValue(), '1');

/* Leer bleibt erlaubt – dann fehlt lediglich die Auslastung */
await feld.fill('');
await feld.blur();
await page.waitForTimeout(300);
gleich('leeres Feld bleibt leer', await feld.inputValue(), '');
pruefe('leeres Feld gilt nicht als unplausibel', !(await unplausibel()));
gleich('ohne Angabe keine Bettenzahl in der Statistik',
  await page.evaluate(() => statistikKennzahlen().max), null);

/* Der zurechtgerückte Wert übersteht das Neuladen */
await feld.fill('9');
await feld.blur();
await page.waitForTimeout(300);
await page.reload();
await page.waitForTimeout(400);
gleich('Bettenzahl bleibt erhalten', await page.inputValue('#maxBetten'), '9');

keineFehler(page);
await browser.close();
bilanz();
