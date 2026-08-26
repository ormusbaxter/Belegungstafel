/* Kopfbereich: Plausibilität der maximalen Bettenzahl
 *
 * Portiert aus dem liegengebliebenen Branch claude/druck-physio-updates;
 * die Prüfungen des Meldestatus sind entfallen, weil die Stufen inzwischen
 * aus den Einstellungen kommen (renderMeldestatus). */
import { browserStarten, neueSeite, testName, gleich, pruefe, keineFehler, bilanz } from './lib.mjs';

testName('Maximale Bettenzahl');
const browser = await browserStarten();
const page = await neueSeite(browser);

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

/* ---- Die Anzeige „belegte Betten“ misst an der Bettenzahl + Notbett ---- */
const belegt = () => page.textContent('#statBelegt');
const belegtTitel = () => page.locator('#belegtCard').getAttribute('title');

await feld.fill('8');
await feld.blur();
await page.waitForTimeout(300);
gleich('Nenner ist die Bettenzahl zuzüglich Notbett', await belegt(), '0 / 9');
pruefe('Zeiger nennt die Herkunft des Nenners',
  (await belegtTitel()).includes('betreibbaren Plätzen'), await belegtTitel());

/* Ein belegtes Bett zählt gegen denselben Nenner */
await page.selectOption('#tbody tr:first-child td.col-status select', '\u25cf');
await page.waitForTimeout(250);
gleich('Belegung zählt gegen die Bettenzahl', await belegt(), '1 / 9');

/* Während des Tippens steht eine unplausible Zahl im Feld; der Nenner fällt
   dann auf die eingerichteten Bettplätze zurück, statt Unsinn zu zeigen. */
await feld.fill('40');
await page.waitForTimeout(250);
gleich('unplausible Zahl zählt nicht als Nenner', await belegt(), '1 / 13');
await feld.blur();
await page.waitForTimeout(300);
gleich('zurechtgerückt gilt wieder die Bettenzahl', await belegt(), '1 / 13');

await feld.fill('');
await feld.blur();
await page.waitForTimeout(300);
gleich('ohne Angabe gelten die eingerichteten Bettplätze', await belegt(), '1 / 13');
pruefe('Zeiger nennt die Bettplätze der Tafel',
  (await belegtTitel()).includes('Bettplätzen der Tafel'), await belegtTitel());

await feld.fill('6');
await feld.blur();
await page.waitForTimeout(300);
await page.reload();
await page.waitForTimeout(400);
gleich('Nenner übersteht das Neuladen', await belegt(), '1 / 7');

keineFehler(page);
await browser.close();
bilanz();
