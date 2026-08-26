/* Spaltenbreiten von Hand: Strg + Ziehen am Spaltenrand
 *
 * Geprüft werden die drei Wege, auf denen eine gezogene Breite entsteht,
 * bestehen bleibt und wieder verschwindet: der Griff nur bei gedrückter
 * Strg-Taste, der Bestand über einen Neustart hinweg und das Zurücksetzen
 * (Doppelklick am Griff, Schaltfläche in den Einstellungen).
 */
import { browserStarten, neueSeite, oeffneEinstellungen, uebernehmen,
         testName, gleich, pruefe, keineFehler, bilanz } from './lib.mjs';

testName('Spaltenbreite');
const browser = await browserStarten();
const page = await neueSeite(browser, { viewport: { width: 1600, height: 900 } });

const breite = key => page.locator('#thead th.col-' + key)
  .evaluate(e => Math.round(e.getBoundingClientRect().width));
const gespeichert = () => page.evaluate(() =>
  JSON.parse(localStorage.getItem('belegungstafel.einstellungen') || '{}').breiten || {});
const griffSichtbar = key => page.locator('#thead th.col-' + key + ' .spaltengriff')
  .evaluate(e => getComputedStyle(e).pointerEvents !== 'none' && Number(getComputedStyle(e).opacity) > 0);

/* ---- Ohne Strg bleibt der Kopf, was er war ---- */
pruefe('Griff an jeder Spalte angelegt',
  (await page.$$eval('#thead th .spaltengriff', g => g.length)) ===
  (await page.$$eval('#thead th', t => t.length)) - 1, 'ohne die Notizspalte des Drucks');
pruefe('Griff ohne Strg unantastbar', !(await griffSichtbar('disziplin')));
gleich('kein Zustand ohne Strg', await gespeichert(), {});

/* ---- Mit Strg wird der Rand greifbar ---- */
await page.keyboard.down('Control');
await page.mouse.move(800, 400);
await page.waitForTimeout(80);
pruefe('Strg zeigt die Griffe', await griffSichtbar('disziplin'));
pruefe('Kennzeichen am Körper der Seite',
  await page.evaluate(() => document.body.classList.contains('spaltenbreite')));

/* ---- Ziehen verbreitert die Spalte ---- */
const vorher = await breite('disziplin');
const ziehen = async (key, versatz) => {
  const griff = await page.locator('#thead th.col-' + key + ' .spaltengriff').boundingBox();
  await page.mouse.move(griff.x + griff.width / 2, griff.y + griff.height / 2);
  await page.mouse.down();
  await page.mouse.move(griff.x + griff.width / 2 + versatz, griff.y + griff.height / 2, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(120);
};
await ziehen('disziplin', 90);
const nachher = await breite('disziplin');
pruefe('Spalte folgt dem Zug', Math.abs(nachher - (vorher + 90)) <= 3, vorher + ' -> ' + nachher);
gleich('Breite gespeichert', Math.abs((await gespeichert()).disziplin - nachher) <= 1, true);
await page.keyboard.up('Control');
await page.waitForTimeout(80);
pruefe('losgelassene Taste nimmt die Griffe zurück', !(await griffSichtbar('disziplin')));

/* ---- Bestand über den Neustart ---- */
await page.reload();
await page.waitForTimeout(300);
gleich('Breite überlebt den Neustart', await breite('disziplin'), nachher);

/* ---- Selbst gemessene Spalten: die gezogene Breite gewinnt ---- */
await page.keyboard.down('Control');
await ziehen('name', 60);
const nameBreit = await breite('name');
await page.keyboard.up('Control');
await page.fill('#tbody tr:first-child td.col-name input', 'Mustermann, Maximiliane');
await page.waitForTimeout(250);
gleich('Eingabe verstellt die gezogene Spalte nicht', await breite('name'), nameBreit);

/* ---- Grenzen ---- */
await page.keyboard.down('Control');
await ziehen('disziplin', -900);
gleich('Untergrenze 30 px', (await gespeichert()).disziplin, 30);
await ziehen('disziplin', 900);
gleich('Obergrenze 600 px', (await gespeichert()).disziplin, 600);

/* ---- Doppelklick setzt zurück ---- */
const griff = await page.locator('#thead th.col-disziplin .spaltengriff').boundingBox();
await page.mouse.dblclick(griff.x + griff.width / 2, griff.y + griff.height / 2);
await page.waitForTimeout(150);
gleich('Doppelklick nimmt die Breite zurück', (await gespeichert()).disziplin, undefined);
gleich('wieder die eingebaute Breite', await breite('disziplin'), vorher);
await page.keyboard.up('Control');

/* ---- Einstellungen: Bestand anzeigen und alle zurücksetzen ---- */
await oeffneEinstellungen(page, 'Spaltenköpfe');
const stand = await page.textContent('#settingsPane > .panehint:last-of-type');
pruefe('Einstellungen nennen die gezogene Spalte', /Patientenname/.test(stand), stand);
await page.click('#settingsPane button:text-is("Alle zurücksetzen")');
await page.waitForTimeout(100);
await uebernehmen(page);
gleich('Zurücksetzen räumt alle Breiten', await gespeichert(), {});
pruefe('Patientenname misst sich wieder selbst', (await breite('name')) !== nameBreit);

keineFehler(page);
await browser.close();
bilanz();
