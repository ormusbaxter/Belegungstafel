/* Einstellungen: Passwort, Listen, Bettplätze, Diaordner (mit und ohne Server) */
import { browserStarten, neueSeite, oeffneEinstellungen, serverStarten,
         testName, gleich, pruefe, enthaelt, keineFehler, bilanz, TIMEOUT } from './lib.mjs';

testName('Einstellungen');
const browser = await browserStarten();
const page = await neueSeite(browser);

/* ---- Passwortschutz, zwei Stufen ---- */
await page.click('#btnSettings');
await page.fill('#pwInput', 'falsch');
await page.click('#pwForm button[type=submit]');
/* Die Prüfung ist asynchron: Sie leitet den Schlüssel erst ab. */
await page.waitForSelector('#pwError:not([hidden])', { timeout: TIMEOUT });
pruefe('falsches Passwort öffnet nicht', !(await page.isVisible('#settingsDlg')));
pruefe('Fehlermeldung erscheint', await page.isVisible('#pwError'));
gleich('mit der erwarteten Meldung', await page.textContent('#pwError'), 'Passwort nicht richtig.');

/* Die Passwörter stehen nicht im Klartext im Quelltext */
const klartext = await page.evaluate(() =>
  typeof SETTINGS_ZUGANG === 'object' &&
  JSON.stringify(SETTINGS_ZUGANG).includes('Vinzenz1'));
pruefe('kein Passwort im Klartext hinterlegt', klartext === false);
gleich('stattdessen zwei Ableitungen',
  await page.evaluate(() => SETTINGS_ZUGANG.map(e => e.stufe).join(',')), 'einfach,voll');

/* Einfache Stufe: nur Allgemein und Bildschirmschoner */
await page.fill('#pwInput', 'Vinzenz1');
await page.click('#pwForm button[type=submit]');
await page.waitForSelector('#settingsDlg[open]', { timeout: TIMEOUT });
pruefe('erstes Passwort öffnet', await page.isVisible('#settingsDlg'));
const wenige = await page.$$eval('#settingsTabs .tab', ts => ts.map(t => t.textContent));
gleich('nur zwei Reiter', wenige.join(' | '), 'Allgemein | Bildschirmschoner');
/* Der Bildschirmschoner bleibt änderbar */
await page.click('#settingsTabs .tab:text-is("Bildschirmschoner")');
await page.waitForTimeout(150);
pruefe('Bildschirmschoner bedienbar', await page.isVisible('#settingsPane .slidebar'));
await page.click('#settingsCancel');
await page.waitForTimeout(150);

/* Volle Stufe: alle Reiter */
await page.click('#btnSettings');
await page.fill('#pwInput', 'Twist114');
await page.click('#pwForm button[type=submit]');
await page.waitForSelector('#settingsDlg[open]', { timeout: TIMEOUT });
pruefe('zweites Passwort öffnet', await page.isVisible('#settingsDlg'));

const reiter = await page.$$eval('#settingsTabs .tab', ts => ts.map(t => t.textContent));
pruefe('Daten nur mit vollem Zugang', reiter.includes('Daten'));
pruefe('Bettplätze nur mit vollem Zugang', reiter.includes('Bettplätze'));
gleich('Reiter in der erwarteten Reihenfolge', reiter.slice(0, 7).join(' | '),
  'Allgemein | Bildschirmschoner | Statistik | Spaltenköpfe | Bettplätze | ' +
  'Anwesenheitsstatus | Patientenname');

/* ---- Auswahlliste ändern ---- */
await page.click('#settingsTabs .tab:text-is("Fachdisziplinen")');
await page.waitForTimeout(150);
await page.click('#settingsPane .addentry');
await page.fill('#settingsPane .entry:last-child input', 'Testfach');
await page.click('#settingsSave');
await page.waitForTimeout(300);
const optionen = await page.$$eval('#tbody tr:first-child td.col-disziplin option', os => os.map(o => o.value));
pruefe('neuer Eintrag steht in der Tabelle', optionen.includes('Testfach'));

/* ---- Vorbelegungen des Patientennamens ---- */
await oeffneEinstellungen(page, 'Patientenname');
pruefe('kein Stilblock beim Freitextfeld', !(await page.isVisible('#settingsPane .styleblock')));
const vorher = await page.$$eval('#settingsPane .entry input', is => is.map(i => i.value));
gleich('ausgelieferte Liste', vorher.join(', '), 'Notbett, gesperrt, Reinigung, NA, OP, CV');
await page.click('#settingsPane .addentry');
await page.fill('#settingsPane .entry:last-child input', 'Ausweichbett');
await page.click('#settingsSave');
await page.waitForTimeout(300);
await page.click('tr[data-bed="0a"] td.col-name .combobtn');
await page.waitForTimeout(150);
const vorschlaege = await page.$$eval('.combolist .combovalue', ss => ss.map(s => s.textContent));
pruefe('neuer Vorschlag in der Klappliste', vorschlaege.includes('Ausweichbett'), vorschlaege.join(', '));
await page.keyboard.press('Escape');

/* Zurücksetzen führt auf die Vorgabe */
await oeffneEinstellungen(page, 'Patientenname');
await page.click('#settingsReset');
await page.waitForTimeout(150);
const zurueck = await page.$$eval('#settingsPane .entry input', is => is.map(i => i.value));
gleich('Kategorie zurücksetzbar', zurueck.join(', '), 'Notbett, gesperrt, Reinigung, NA, OP, CV');
await page.click('#settingsCancel');
await page.waitForTimeout(150);

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

/* ---- Meldestatus: Stufen und Farben aus den Einstellungen ---- */
const stufen = () => page.$$eval('#meldestatus option', os => os.map(o => o.textContent));
gleich('ausgelieferte Stufen', (await stufen()).join(' | '), '– | grün | gelb | rot');

const kachel = () => page.evaluate(() => {
  const k = document.querySelector('#meldeCard');
  const s = getComputedStyle(k);
  return { hintergrund: s.backgroundColor, schrift: s.color, faerbig: k.classList.contains('faerbig') };
});
await page.selectOption('#meldestatus', 'rot');
await page.waitForTimeout(300);
const rot = await kachel();
gleich('gewählte Stufe färbt die Kachel', rot.hintergrund, 'rgb(198, 40, 40)');
gleich('mit weißer Schrift darauf', rot.schrift, 'rgb(255, 255, 255)');

/* Eine eigene Stufe mit heller Farbe – die Schrift muss dunkel werden. */
await oeffneEinstellungen(page, 'Meldestatus');
await page.click('#settingsPane .addentry');
await page.fill('#settingsPane .entry-melde:last-child input', 'Abmeldung');
/* Hellgelb ist das neunte Feld der Auswahl (das erste ist „Standard“). */
await page.click('#settingsPane .entry-melde:last-child .swatch >> nth=8');
await page.waitForTimeout(150);
await page.click('#settingsSave');
await page.waitForTimeout(400);

gleich('neue Stufe steht zur Wahl', (await stufen()).join(' | '), '– | grün | gelb | rot | Abmeldung');
await page.selectOption('#meldestatus', 'Abmeldung');
await page.waitForTimeout(300);
const hell = await kachel();
gleich('helle Stufe bekommt dunkle Schrift', hell.schrift, 'rgb(18, 24, 31)');
pruefe('und ist als gefärbt gekennzeichnet', hell.faerbig);

/* Ohne Farbe bleibt die Kachel neutral. */
await oeffneEinstellungen(page, 'Meldestatus');
await page.click('#settingsPane .entry-melde:last-child .swatch.none');
await page.waitForTimeout(150);
await page.click('#settingsSave');
await page.waitForTimeout(400);
pruefe('Stufe ohne Farbe färbt nicht', !(await kachel()).faerbig);

/* Ein gesetzter Wert überlebt das Entfernen aus der Liste. */
await oeffneEinstellungen(page, 'Meldestatus');
await page.click('#settingsPane .entry-melde:last-child .entrybtn.remove');
await page.waitForTimeout(150);
await page.click('#settingsSave');
await page.waitForTimeout(400);
gleich('entfernte, aber gesetzte Stufe bleibt wählbar',
  await page.inputValue('#meldestatus'), 'Abmeldung');
enthaelt('und steht weiter in der Liste', (await stufen()).join(' | '), 'Abmeldung');
gleich('sie ist aber aus den Einstellungen fort',
  await page.evaluate(() => MELDE.map(m => m.value).join(',')), 'grün,gelb,rot');
keineFehler(page);

/* ---- Bezeichnung der Tafel: Krankenhaus und Station ---- */
await oeffneEinstellungen(page, 'Daten');
gleich('beide Felder unter Daten',
  await page.$$eval('#settingsPane .setrow span',
    ss => ss.map(s => s.textContent).filter(t => /Krankenhaus|Station/.test(t)).join(' | ')),
  'Krankenhaus | Station');
await page.fill('#settingsPane .setrow:has(span:text-is("Krankenhaus")) input',
  'Klinikum Musterstadt');
await page.fill('#settingsPane .setrow:has(span:text-is("Station")) input', 'Intensiv 2');
await page.click('#settingsSave');
await page.waitForTimeout(300);

gleich('Krankenhaus steht neben dem Logo',
  await page.textContent('.brandhaus'), 'Klinikum Musterstadt');
gleich('Station daneben', await page.textContent('.brandstation'), 'Intensiv 2');
gleich('und im Fenstertitel', await page.title(), 'Klinikum Musterstadt Intensiv 2');
enthaelt('Fußzeile der Ausdrucke nennt beides',
  await page.evaluate(() => { druckfussSetzen(); return $('#printFoot').textContent; }),
  'Klinikum Musterstadt Intensiv 2');

await page.reload();
await page.waitForTimeout(400);
gleich('bleibt nach dem Neuladen stehen',
  await page.textContent('.brandhaus'), 'Klinikum Musterstadt');

/* Ein leeres Feld soll keine Lücke hinterlassen. */
await oeffneEinstellungen(page, 'Daten');
await page.fill('#settingsPane .setrow:has(span:text-is("Station")) input', '');
await page.click('#settingsSave');
await page.waitForTimeout(300);
pruefe('leere Station wird ausgeblendet', await page.isHidden('.brandstation'));
gleich('der Titel führt dann nur das Haus', await page.title(), 'Klinikum Musterstadt');
keineFehler(page);

/* ---- Ordner einlesen über einen Webserver ---- */
const server = await serverStarten();
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
