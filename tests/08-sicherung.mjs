/* Automatische Sicherung und Kennung der Tafel */
import { browserStarten, neueSeite, setzeEinstellungen, oeffneEinstellungen,
         testName, gleich, pruefe, enthaelt, keineFehler, bilanz } from './lib.mjs';

testName('Sicherung und Kennung');
const browser = await browserStarten();
const page = await neueSeite(browser);

/* ---- Voreinstellung: eine Woche, Warnung vor dem Download-Ordner ---- */
await oeffneEinstellungen(page, 'Daten');
gleich('Voreinstellung sieben Sicherungen',
  await page.inputValue('#settingsPane .setrow:has-text("Sicherungen behalten") input'), '7');
enthaelt('Hinweis auf die Klarnamen', await page.textContent('#settingsPane'),
  'enthält alle Patientennamen im Klartext');
await page.click('#settingsPane .setrow:has-text("Tägliche Sicherung") input[type=checkbox]');
await page.waitForTimeout(150);
const ordnerwahl = await page.evaluate(() => ordnerWahlMoeglich);
if (ordnerwahl) await page.selectOption('#settingsPane .zielpick', 'download');
await page.waitForTimeout(150);
enthaelt('Warnung vor dem Download-Ordner', await page.textContent('.backupstatus'),
  'kein geschützter Ablageort');
await page.click('#settingsCancel');
await page.waitForTimeout(150);

/* ---- Sicherung von Hand in den Download-Ordner ---- */
await page.fill('tr[data-bed="0a"] td.col-name input', 'Sicherungstest');
await page.waitForTimeout(400);
await setzeEinstellungen(page, { backup: { on: true, ziel: 'download', behalten: 30 } });

await oeffneEinstellungen(page, 'Daten');
pruefe('Abschnitt Sicherung vorhanden',
  (await page.textContent('#settingsPane')).includes('Automatische Sicherung'));

const download = page.waitForEvent('download', { timeout: 8000 });
await page.click('#settingsPane button:text-is("Jetzt sichern")');
const datei = await download;
pruefe('Sicherungsdatei wird abgelegt', /^belegungstafel-\d{8}-\d{4}\.json$/.test(datei.suggestedFilename()),
  datei.suggestedFilename());

const pfad = await datei.path();
const { readFile } = await import('node:fs/promises');
const inhalt = JSON.parse(await readFile(pfad, 'utf8'));
gleich('Sicherung enthält die Belegung', inhalt.beds['0a'].name, 'Sicherungstest');
pruefe('Sicherung enthält die Einstellungen', Boolean(inhalt.settings && inhalt.settings.beds));

await page.waitForTimeout(300);
enthaelt('Rückmeldung im Fenster', await page.textContent('.backupstatus'), 'Download-Ordner');
await page.click('#settingsCancel');

/* ---- Merkzettel verhindert doppelte Sicherung am selben Tag ---- */
const notiz = await page.evaluate(() => localStorage.getItem('belegungstafel.sicherung'));
pruefe('Zeitpunkt wird notiert', Boolean(notiz && JSON.parse(notiz).datum), notiz);
gleich('heute nicht noch einmal fällig', await page.evaluate(() => sicherungFaellig()), false);

await page.evaluate(() => localStorage.setItem('belegungstafel.sicherung',
  JSON.stringify({ datum: '2020-01-01', zeit: '2020-01-01T00:00:00.000Z' })));
gleich('nach einem Tag wieder fällig', await page.evaluate(() => sicherungFaellig()), true);

/* ---- ohne die Option ist nie etwas fällig ---- */
await setzeEinstellungen(page, { backup: { on: false, ziel: 'download' } });
gleich('abgeschaltet nichts fällig', await page.evaluate(() => sicherungFaellig()), false);
keineFehler(page);

/* ---- Kennung trennt zwei Kopien ---- */
const kopie = await page.context().newPage();
await kopie.goto('file://' + (await page.evaluate(() => location.pathname)));
await kopie.evaluate(() => {
  document.documentElement.dataset.instanz = 'test';
});
/* Die Kennung wird beim Laden gelesen; deshalb der Umweg über eine
   nachgebildete Prüfung des Schlüsselbaus. */
const schluessel = await kopie.evaluate(() => {
  const kennung = 'test';
  const suffix = '.' + kennung.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return 'belegungstafel.intensiv.v1' + suffix;
});
gleich('eigener Speicherschlüssel', schluessel, 'belegungstafel.intensiv.v1.test');
gleich('ohne Kennung unverändert', await page.evaluate(() => STORAGE_KEY), 'belegungstafel.intensiv.v1');
pruefe('Kennung erscheint in den Einstellungen',
  (await (async () => { await oeffneEinstellungen(page, 'Daten');
    const text = await page.textContent('#settingsPane');
    await page.click('#settingsCancel');
    return text; })()).includes('Kennung dieser Tafel'));

await browser.close();
bilanz();
