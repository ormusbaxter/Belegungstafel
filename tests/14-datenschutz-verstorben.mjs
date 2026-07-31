/* Umfang des Sichtschutzes und Kennzeichnung verstorbener Patienten */
import { browserStarten, neueSeite, testName, gleich, pruefe, keineFehler, bilanz } from './lib.mjs';

testName('Sichtschutz und Kennzeichnung Verstorbener');
const browser = await browserStarten();
const page = await neueSeite(browser, { viewport: { width: 1500, height: 950 } });

/* ---- Umfang des Sichtschutzes ---- */
const offen = await page.evaluate(() => COLUMNS.map(c => c.key).filter(k => !PRIVATE_KEYS.includes(k)));
gleich('offen bleiben nur Platz und Schicht', offen.join(','), 'status,bed,telefon,pflege');
const geschuetzt = await page.evaluate(() => PRIVATE_KEYS);
for (const key of ['name', 'disziplin', 'isolation', 'limitierung', 'postform', 'privat',
                   'physio', 'devices', 'norton', 'abstriche', 'sonstiges']) {
  pruefe('geschützt: ' + key, geschuetzt.includes(key));
}

/* Sichtschutz einschalten und die Wirkung in der Tabelle prüfen */
await page.evaluate(() => {
  state.beds['0a'].name = 'Musterfrau, Erika';
  state.beds['0a'].status = '●';
  state.beds['0a'].postform = 'VK';
  state.beds['0a'].sonstiges = 'Angehörige informiert';
  state.beds['0a'].pflege = 'S. Gertzen';
  buildBody(); renderStats(); save();
});
await page.click('#btnLock');
await page.waitForTimeout(300);

const verwischt = key => page.locator(`tr[data-bed="0a"] td.col-${key}`)
  .evaluate(td => getComputedStyle(td.firstElementChild).filter !== 'none');
for (const key of ['name', 'postform', 'privat', 'physio', 'devices', 'norton', 'abstriche', 'sonstiges']) {
  pruefe('unkenntlich: ' + key, await verwischt(key));
}
pruefe('Telefon bleibt lesbar', !(await verwischt('telefon')));
pruefe('Pflegekraft bleibt lesbar', !(await verwischt('pflege')));
pruefe('Anwesenheitsstatus bleibt lesbar', !(await verwischt('status')));
pruefe('Hinweis erscheint', await page.isVisible('#privacyHint'));

/* Aufheben durch Eingabe */
await page.keyboard.press('Escape');
await page.mouse.move(700, 700);
await page.mouse.move(200, 200);
await page.waitForTimeout(250);
pruefe('Eingabe hebt den Sichtschutz auf', !(await verwischt('name')));

/* ---- Verstorbene ---- */
const feld = 'tr[data-bed="0b"] td.col-name input';
await page.click(feld);
await page.type(feld, 'Mustermann, Max + 14:30', { delay: 10 });
await page.waitForTimeout(400);

gleich('Plus wird zum Kreuz', await page.inputValue(feld), 'Mustermann, Max † 14:30');
gleich('auch im Speicher', await page.evaluate(() => state.beds['0b'].name), 'Mustermann, Max † 14:30');
pruefe('Zeile ist gekennzeichnet',
  await page.locator('tr[data-bed="0b"]').evaluate(e => e.classList.contains('verstorben')));

const stil = await page.locator('tr[data-bed="0b"] td.col-name').evaluate(td => {
  const zelle = getComputedStyle(td);
  const eingabe = getComputedStyle(td.querySelector('input'));
  return { hintergrund: zelle.backgroundColor, schrift: eingabe.color, fett: eingabe.fontWeight };
});
gleich('Zelle dunkelgrau', stil.hintergrund, 'rgb(74, 80, 88)');
gleich('Schrift hell', stil.schrift, 'rgb(244, 246, 248)');
gleich('und hervorgehoben', stil.fett, '700');

/* Ein Plus mitten im Text bleibt unangetastet */
await page.fill('tr[data-bed="1a"] td.col-name input', 'Meier+Sohn');
await page.waitForTimeout(250);
gleich('Plus ohne Abstand bleibt', await page.inputValue('tr[data-bed="1a"] td.col-name input'), 'Meier+Sohn');
pruefe('und kennzeichnet nichts',
  !(await page.locator('tr[data-bed="1a"]').evaluate(e => e.classList.contains('verstorben'))));

/* Der Bettplatz zählt weiterhin als belegt: 0 a und der verstorbene 0 b,
   nicht aber 1 a (nur ein Name ohne Status und ohne Fachdisziplin) */
await page.evaluate(() => { state.beds['0b'].status = '●'; buildBody(); renderStats(); });
await page.waitForTimeout(200);
pruefe('Verstorbene zählen weiter zur Belegung',
  await page.evaluate(() => isOccupied(state.beds['0b'])));
gleich('Zählung im Kopf', await page.textContent('#statBelegt'), '2 / 13');

/* Bestand nach dem Neuladen */
await page.reload();
await page.waitForTimeout(400);
gleich('Kreuz bleibt nach dem Neuladen', await page.inputValue('tr[data-bed="0b"] td.col-name input'),
  'Mustermann, Max † 14:30');
pruefe('Kennzeichnung bleibt',
  await page.locator('tr[data-bed="0b"]').evaluate(e => e.classList.contains('verstorben')));

/* Älterer Stand mit Pluszeichen wird beim Einlesen umgesetzt */
await page.evaluate(() => {
  unsaved = false;   /* offenes Speichern verwerfen, sonst überschreibt es gleich wieder */
  const stand = JSON.parse(localStorage.getItem('belegungstafel.intensiv.v1'));
  stand.beds['2'] = { name: 'Alt, Anna + 03:15', status: '●' };
  localStorage.setItem('belegungstafel.intensiv.v1', JSON.stringify(stand));
});
await page.reload();
await page.waitForTimeout(400);
gleich('älterer Stand wird umgesetzt', await page.inputValue('tr[data-bed="2"] td.col-name input'),
  'Alt, Anna † 03:15');
pruefe('und ebenfalls gekennzeichnet',
  await page.locator('tr[data-bed="2"]').evaluate(e => e.classList.contains('verstorben')));

keineFehler(page);
await browser.close();
bilanz();
