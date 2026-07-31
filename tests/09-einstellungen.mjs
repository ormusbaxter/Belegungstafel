/* Einstellungen: Passwort, Listen, Bettplätze, Diaordner (mit und ohne Server) */
import { browserStarten, neueSeite, oeffneEinstellungen, serverStarten,
         testName, gleich, pruefe, enthaelt, keineFehler, bilanz } from './lib.mjs';

testName('Einstellungen');
const browser = await browserStarten();
const page = await neueSeite(browser);

/* ---- Passwortschutz ---- */
await page.click('#btnSettings');
await page.fill('#pwInput', 'falsch');
await page.click('#pwForm button[type=submit]');
await page.waitForTimeout(150);
pruefe('falsches Passwort öffnet nicht', !(await page.isVisible('#settingsDlg')));
pruefe('Fehlermeldung erscheint', await page.isVisible('#pwError'));
await page.fill('#pwInput', 'Vinzenz1');
await page.click('#pwForm button[type=submit]');
await page.waitForTimeout(200);
pruefe('richtiges Passwort öffnet', await page.isVisible('#settingsDlg'));

const reiter = await page.$$eval('#settingsTabs .tab', ts => ts.map(t => t.textContent));
gleich('Reiter in der erwarteten Reihenfolge', reiter.slice(0, 5).join(' | '),
  'Allgemein | Bildschirmschoner | Spaltenköpfe | Bettplätze | Anwesenheitsstatus');

/* ---- Auswahlliste ändern ---- */
await page.click('#settingsTabs .tab:text-is("Fachdisziplinen")');
await page.waitForTimeout(150);
await page.click('#settingsPane .addentry');
await page.fill('#settingsPane .entry:last-child input', 'Testfach');
await page.click('#settingsSave');
await page.waitForTimeout(300);
const optionen = await page.$$eval('#tbody tr:first-child td.col-disziplin option', os => os.map(o => o.value));
pruefe('neuer Eintrag steht in der Tabelle', optionen.includes('Testfach'));

/* ---- Bettplatz umbenennen, Einträge bleiben ---- */
await page.fill('tr[data-bed="0a"] td.col-name input', 'Bleibt erhalten');
await page.waitForTimeout(400);
await oeffneEinstellungen(page, 'Bettplätze');
await page.fill('#settingsPane .entry:first-child input', '0 neu');
await page.click('#settingsSave');
await page.waitForTimeout(300);
gleich('Bettplatz umbenannt', await page.textContent('#tbody tr:first-child .bedlabel'), '0 neu');
gleich('Eintrag blieb erhalten', await page.inputValue('#tbody tr:first-child td.col-name input'),
  'Bleibt erhalten');

/* ---- Diaordner von Hand: Seitenangabe erscheint nur bei PDF ---- */
await oeffneEinstellungen(page, 'Bildschirmschoner');
await page.click('#settingsPane .slidebar button:text-is("+ Datei von Hand")');
await page.fill('.entry-slide:last-child .slidefile', 'aushang.pdf');
await page.waitForTimeout(150);
await page.click('#settingsPane .slidebar button:text-is("+ Eigener Hinweis")');
await page.waitForTimeout(150);
const seitenfelder = await page.$$eval('.entry-slide', rs => rs.map(r => Boolean(r.querySelector('.slidepage'))));
gleich('Seitenfeld nur beim Dateieintrag', seitenfelder.join(','), 'true,false');
await page.click('#settingsCancel');
keineFehler(page);

/* ---- Ordner einlesen über einen Webserver ---- */
const server = await serverStarten(8321);
const online = await neueSeite(browser, { url: server.url });
await oeffneEinstellungen(online, 'Bildschirmschoner');
await online.click('#settingsPane .slidebar button:text-is("Ordner einlesen")');
await online.waitForTimeout(900);
const status = await online.textContent('.slidestatus');
pruefe('Dateien über den Server gefunden', /\d+ Datei/.test(status), status.slice(0, 90));
const gefunden = await online.$$eval('.entry-slide .slidefile', is => is.map(i => i.value));
pruefe('nur zugelassene Dateitypen', gefunden.every(n => /\.(pdf|png|jpe?g)$/i.test(n)), gefunden.join(', '));
pruefe('LIESMICH wird nicht übernommen', !gefunden.some(n => /liesmich/i.test(n)));
await online.click('#settingsCancel');
keineFehler(online);
await server.stop();

await browser.close();
bilanz();
