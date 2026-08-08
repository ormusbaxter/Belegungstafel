/* Vorgabe der Station: js/vorgaben.js erzeugen und wirksam werden lassen */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { browserStarten, neueSeite, oeffneEinstellungen, APP_DIR,
         testName, gleich, pruefe, enthaelt, keineFehler, bilanz, TIMEOUT, uebernehmen } from './lib.mjs';

testName('Vorgabe der Station');
const DATEI = join(APP_DIR, 'js', 'vorgaben.js');
const original = await readFile(DATEI, 'utf8');
const browser = await browserStarten();

try {
  /* ---- ohne eigene Vorgabe gelten die ausgelieferten Werte ---- */
  let page = await neueSeite(browser);
  gleich('ausgelieferte Bettenzahl', await page.evaluate(() => BEDS.length), 13);
  gleich('keine Vorgabe hinterlegt', await page.evaluate(() => vorgabeStand()), '');

  /* ---- Datei erzeugen ---- */
  await oeffneEinstellungen(page, 'Bettplätze');
  await page.fill('#settingsPane .entry:first-child input', 'Schockraum');
  await page.click('#settingsTabs .tab:text-is("Fachdisziplinen")');
  await page.waitForTimeout(150);
  await page.click('#settingsPane .addentry');
  await page.fill('#settingsPane .entry:last-child input', 'PALLIATIV');
  await page.click('#settingsTabs .tab:text-is("Allgemein")');
  await page.waitForTimeout(150);
  const regler = await page.$('.zoomslider');
  await regler.fill('150');
  await regler.dispatchEvent('input');
  await uebernehmen(page);
  await page.waitForTimeout(300);

  /* Patientenname eintragen – er darf nicht in der Vorgabedatei landen */
  await page.fill('tr:first-child td.col-name input', 'Geheim, Patient');
  await page.waitForTimeout(400);

  await oeffneEinstellungen(page, 'Daten');
  pruefe('Abschnitt vorhanden', (await page.textContent('#settingsPane')).includes('Vorgabe der Station'));
  const download = page.waitForEvent('download', { timeout: TIMEOUT });
  await page.click('#settingsPane button:text-is("Aktuelle Einstellungen als Vorgabe sichern")');
  const datei = await download;
  gleich('Dateiname', datei.suggestedFilename(), 'vorgaben.js');

  const inhalt = await readFile(await datei.path(), 'utf8');
  enthaelt('gültige Zuweisung', inhalt, 'const VORGABEN = {');
  enthaelt('geänderter Bettplatz enthalten', inhalt, 'Schockraum');
  enthaelt('geänderte Liste enthalten', inhalt, 'PALLIATIV');
  enthaelt('Zoom enthalten', inhalt, '"zoom": 150');
  pruefe('keine Patientendaten in der Datei', !inhalt.includes('Geheim'));
  pruefe('kein Belegungsteil', !/"beds"\s*:\s*\{/.test(inhalt));
  await page.click('#settingsClose');
  keineFehler(page);
  await page.context().close();

  /* ---- Datei einsetzen: frischer Arbeitsplatz startet damit ---- */
  await writeFile(DATEI, inhalt);
  page = await neueSeite(browser);
  gleich('Bettplatz aus der Vorgabe', await page.textContent('#tbody tr:first-child .bedlabel'), 'Schockraum');
  gleich('Zoom aus der Vorgabe',
    await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--zoom').trim()), '1.5');
  pruefe('Liste aus der Vorgabe',
    (await page.$$eval('#tbody tr:first-child td.col-disziplin option', os => os.map(o => o.value))).includes('PALLIATIV'));
  pruefe('Stand der Vorgabe wird gemeldet', (await page.evaluate(() => vorgabeStand())).length > 10);

  /* Zurücksetzen führt auf die Vorgabe, nicht auf die ausgelieferten Werte */
  await oeffneEinstellungen(page, 'Fachdisziplinen');
  await page.click('#settingsPane .addentry');
  await page.fill('#settingsPane .entry:last-child input', 'NUR-TEST');
  await page.click('#settingsReset');
  await page.waitForTimeout(200);
  const nachReset = await page.$$eval('#settingsPane .entry input', is => is.map(i => i.value));
  pruefe('eigener Eintrag entfernt', !nachReset.includes('NUR-TEST'));
  pruefe('Vorgabe bleibt erhalten', nachReset.includes('PALLIATIV'), nachReset.join(','));
  await page.click('#settingsClose');

  /* Örtlich gespeicherte Einstellungen haben Vorrang vor der Vorgabe */
  await oeffneEinstellungen(page, 'Allgemein');
  const regler2 = await page.$('.zoomslider');
  await regler2.fill('80');
  await regler2.dispatchEvent('input');
  await uebernehmen(page);
  await page.reload();
  await page.waitForTimeout(400);
  gleich('örtliche Einstellung gewinnt',
    await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--zoom').trim()), '0.8');
  keineFehler(page);
  await page.context().close();

  /* ---- fehlerhafte Vorgabedatei legt die Tafel nicht lahm ---- */
  await writeFile(DATEI, 'const VORGABEN = { beds: "unsinn", zoom: "viel" };\n');
  const kaputt = await neueSeite(browser);
  gleich('Tafel startet trotzdem', await kaputt.evaluate(() => document.querySelectorAll('#tbody tr').length), 13);
  gleich('unsinnige Werte werden übergangen',
    await kaputt.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--zoom').trim()), '1');
  keineFehler(kaputt);
  await kaputt.context().close();
} finally {
  await writeFile(DATEI, original);
  await browser.close();
}

bilanz();
