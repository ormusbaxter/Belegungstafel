/* Einstellungen: Passwort, Listen, Bettplätze, Diaordner (mit und ohne Server) */
import { browserStarten, neueSeite, oeffneEinstellungen, serverStarten,
         testName, gleich, pruefe, enthaelt, keineFehler, bilanz, TIMEOUT, uebernehmen, verneineRueckfrage } from './lib.mjs';

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
await page.click('#settingsClose');
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

/* ---- Übernehmen und Schließen ---- */
pruefe('ohne Änderung kein Übernehmen-Knopf', await page.isHidden('#settingsSave'));
pruefe('Schließen steht immer bereit', await page.isVisible('#settingsClose'));

await page.click('#settingsTabs .tab:text-is("Allgemein")');
await page.waitForTimeout(150);
await page.uncheck('#settingsPane .setrow:has-text("Zeilen nach Status einfärben") input');
await page.waitForTimeout(150);
pruefe('nach einer Änderung erscheint er', await page.isVisible('#settingsSave'));

await page.click('#settingsSave');
await page.waitForTimeout(300);
pruefe('Übernehmen schließt das Fenster nicht', await page.isVisible('#settingsDlg'));
gleich('die Änderung ist übernommen',
  await page.evaluate(() => settings.zeilenfarben), false);
pruefe('und der Knopf verschwindet wieder', await page.isHidden('#settingsSave'));

/* Ohne Änderung schließt es ohne Rückfrage. */
let gefragt = false;
const merker = () => { gefragt = true; };
page.on('dialog', merker);
await page.click('#settingsClose');
await page.waitForTimeout(250);
pruefe('ohne Änderung keine Rückfrage', !gefragt);
pruefe('und das Fenster ist zu', await page.isHidden('#settingsDlg'));
page.off('dialog', merker);

/* Mit Änderung wird gefragt – verneint heißt verwerfen. */
await oeffneEinstellungen(page, 'Allgemein');
await page.check('#settingsPane .setrow:has-text("Zeilen nach Status einfärben") input');
await page.waitForTimeout(150);
verneineRueckfrage(page);
await page.click('#settingsClose');
await page.waitForTimeout(300);
pruefe('verneint schließt und verwirft', await page.isHidden('#settingsDlg'));
gleich('die Einstellung blieb unverändert',
  await page.evaluate(() => settings.zeilenfarben), false);

/* Bestätigt heißt übernehmen. */
await oeffneEinstellungen(page, 'Allgemein');
await page.check('#settingsPane .setrow:has-text("Zeilen nach Status einfärben") input');
await page.waitForTimeout(150);
await page.click('#settingsClose');
await page.waitForTimeout(300);
pruefe('bestätigt schließt ebenfalls', await page.isHidden('#settingsDlg'));
gleich('und übernimmt die Änderung',
  await page.evaluate(() => settings.zeilenfarben), true);
keineFehler(page);

/* Für die folgenden Prüfungen wieder aufschließen. */
await oeffneEinstellungen(page);

/* ---- Auswahlliste ändern ---- */
await page.click('#settingsTabs .tab:text-is("Fachdisziplinen")');
await page.waitForTimeout(150);
await page.click('#settingsPane .addentry');
await page.fill('#settingsPane .entry:last-child input', 'Testfach');
await uebernehmen(page);
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
await uebernehmen(page);
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
await page.click('#settingsClose');
await page.waitForTimeout(150);

/* ---- Bettplatz umbenennen, Einträge bleiben ---- */
await page.fill('tr[data-bed="0a"] td.col-name input', 'Bleibt erhalten');
await page.waitForTimeout(400);
await oeffneEinstellungen(page, 'Bettplätze');
await page.fill('#settingsPane .entry:first-child input', '0 neu');
await uebernehmen(page);
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
await page.click('#settingsClose');
keineFehler(page);

/* ---- Berechtigungen: was die einfache Stufe ändern darf ---- */
await oeffneEinstellungen(page, 'Berechtigungen');
const rechteZeilen = await page.$$eval('.rechteliste .setrow span:first-of-type',
  ss => ss.map(s => s.textContent));
pruefe('ein Kästchen je Reiter', rechteZeilen.length > 10, rechteZeilen.length + ' Reiter');
pruefe('„Berechtigungen“ steht nicht zur Wahl', !rechteZeilen.includes('Berechtigungen'));
gleich('ab Werk zwei Reiter frei',
  await page.evaluate(() => settings.rechte.einfach.join(',')), 'allgemein,schoner');

/* Statistik dazugeben */
await page.click('.rechteliste .setrow:has(span:text-is("Statistik")) input');
await uebernehmen(page);
await page.waitForTimeout(300);
gleich('neue Berechtigung gespeichert',
  await page.evaluate(() => settings.rechte.einfach.join(',')), 'allgemein,schoner,statistik');

/* Die einfache Stufe sieht den Reiter jetzt */
await oeffneEinstellungen(page, null, 'Vinzenz1');
gleich('einfache Stufe sieht drei Reiter',
  (await page.$$eval('#settingsTabs .tab', ts => ts.map(t => t.textContent))).join(' | '),
  'Allgemein | Bildschirmschoner | Statistik');
await page.click('#settingsClose');
await page.waitForTimeout(200);

/* Zurücknehmen, und die letzte Berechtigung lässt sich nicht entfernen */
await oeffneEinstellungen(page, 'Berechtigungen');
await page.click('.rechteliste .setrow:has(span:text-is("Statistik")) input');
await page.click('.rechteliste .setrow:has(span:text-is("Bildschirmschoner")) input');
await page.waitForTimeout(120);
await page.click('.rechteliste .setrow:has(span:text-is("Allgemein")) input');
await page.waitForTimeout(150);
gleich('die letzte Berechtigung bleibt bestehen',
  await page.evaluate(() => draft.rechte.einfach.join(',')), 'allgemein');
await uebernehmen(page);
await page.waitForTimeout(300);

/* ---- Berechtigungen für einzelne Unterpunkte ---- */
await oeffneEinstellungen(page, 'Berechtigungen');
const teile = await page.$$eval('.rechteliste .rechteteil span:first-of-type',
  ss => ss.map(s => s.textContent));
gleich('Unterpunkte von Allgemein, Statistik und Daten', teile.length, 16);
pruefe('darunter die Norton-Skala', teile.includes('Norton-Skala'));
gleich('ab Werk ist nichts gesperrt',
  await page.evaluate(() => settings.rechte.gesperrt.length), 0);
/* :text-is ist eine Playwright-Auswahl, kein CSS – deshalb über den Locator
   und nicht über querySelector im Browser. */
pruefe('Unterpunkte eines gesperrten Reiters sind ausgegraut',
  await page.isDisabled('.rechteliste .rechteteil:has(span:text-is("Schichten")) input'));

/* Zwei Punkte aus Allgemein wegnehmen */
for (const t of ['Norton-Skala', 'Rechte Maustaste']) {
  await page.click(`.rechteliste .rechteteil:has(span:text-is("${t}")) input`);
  await page.waitForTimeout(100);
}
await uebernehmen(page);
await page.waitForTimeout(300);
gleich('beide Sperren gespeichert',
  await page.evaluate(() => settings.rechte.gesperrt.join(',')),
  'allgemein.norton,allgemein.kontextmenue');

/* Die einfache Stufe sieht sie nicht mehr – und die Nummern rücken auf */
await oeffneEinstellungen(page, null, 'Vinzenz1');
const bloecke = await page.$$eval('#settingsPane h3', hs => hs.map(h => h.textContent));
gleich('einfache Stufe: sieben statt neun Punkte', bloecke.length, 7);
gleich('lückenlos durchnummeriert', bloecke.join(' | '),
  '1. Sichtschutz | 2. Farbige Zeilen | 3. Bildschirmschoner | ' +
  '4. Tag- und Nachtansicht | 5. Größe der Darstellung | 6. Übergabezettel | 7. Termine');
await page.click('#settingsClose');
await page.waitForTimeout(200);

/* Die volle Stufe sieht weiterhin alles */
await oeffneEinstellungen(page, 'Allgemein');
gleich('volle Stufe unverändert neun Punkte',
  await page.$$eval('#settingsPane h3', hs => hs.length), 9);
await page.click('#settingsClose');
await page.waitForTimeout(200);

/* Sperren wieder aufheben, damit die folgenden Prüfungen den vollen Reiter sehen */
await oeffneEinstellungen(page, 'Berechtigungen');
for (const t of ['Norton-Skala', 'Rechte Maustaste']) {
  await page.click(`.rechteliste .rechteteil:has(span:text-is("${t}")) input`);
  await page.waitForTimeout(100);
}
await uebernehmen(page);
await page.waitForTimeout(300);
keineFehler(page);

/* ---- Rechte Maustaste ---- */
const menue = () => page.evaluate(() => {
  const treffer = ziel => {
    const ereignis = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    document.querySelector(ziel).dispatchEvent(ereignis);
    return !ereignis.defaultPrevented;
  };
  return { tabelle: treffer('#tbody tr:first-child td.col-bed'), feld: treffer('#noteInfos') };
});
let stand = await menue();
pruefe('über der Tafel unterdrückt', !stand.tabelle);
pruefe('im Textfeld erlaubt', stand.feld);

await oeffneEinstellungen(page, 'Allgemein');
await page.click('#settingsPane .setrow:has-text("Kontextmenü der rechten Maustaste") input');
await uebernehmen(page);
await page.waitForTimeout(300);
stand = await menue();
pruefe('eingeschaltet auch über der Tafel erlaubt', stand.tabelle);
keineFehler(page);

/* ---- Meldestatus: Stufen und Farben aus den Einstellungen ---- */
const stufen = () => page.$$eval('#meldestatus option', os => os.map(o => o.textContent));
gleich('ausgelieferte Stufen', (await stufen()).join(' | '), 'grün | gelb | rot');
gleich('eine frische Tafel trägt die erste Stufe',
  await page.evaluate(() => state.station.meldestatus), 'grün');
gleich('und zwar in den Daten, nicht nur in der Anzeige',
  await page.evaluate(() => JSON.parse(
    localStorage.getItem('belegungstafel.intensiv.v1')).station.meldestatus), 'grün');

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
await uebernehmen(page);
await page.waitForTimeout(400);

gleich('neue Stufe steht zur Wahl', (await stufen()).join(' | '), 'grün | gelb | rot | Abmeldung');
await page.selectOption('#meldestatus', 'Abmeldung');
await page.waitForTimeout(300);
const hell = await kachel();
gleich('helle Stufe bekommt dunkle Schrift', hell.schrift, 'rgb(18, 24, 31)');
pruefe('und ist als gefärbt gekennzeichnet', hell.faerbig);

/* Ohne Farbe bleibt die Kachel neutral. */
await oeffneEinstellungen(page, 'Meldestatus');
await page.click('#settingsPane .entry-melde:last-child .swatch.none');
await page.waitForTimeout(150);
await uebernehmen(page);
await page.waitForTimeout(400);
pruefe('Stufe ohne Farbe färbt nicht', !(await kachel()).faerbig);

/* Ein gesetzter Wert überlebt das Entfernen aus der Liste. */
await oeffneEinstellungen(page, 'Meldestatus');
await page.click('#settingsPane .entry-melde:last-child .entrybtn.remove');
await page.waitForTimeout(150);
await uebernehmen(page);
await page.waitForTimeout(400);
gleich('entfernte, aber gesetzte Stufe bleibt wählbar',
  await page.inputValue('#meldestatus'), 'Abmeldung');
enthaelt('und steht weiter in der Liste', (await stufen()).join(' | '), 'Abmeldung');
gleich('sie ist aber aus den Einstellungen fort',
  await page.evaluate(() => MELDE.map(m => m.value).join(',')), 'grün,gelb,rot');

/* Die letzte Stufe lässt sich nicht entfernen – ohne leere Stufe stünde sonst
   eine Auswahl ohne Einträge im Kopf. */
await oeffneEinstellungen(page, 'Meldestatus');
for (let i = 0; i < 3; i++) {
  await page.click('#settingsPane .entry-melde:last-child .entrybtn.remove');
  await page.waitForTimeout(120);
}
gleich('die letzte Stufe bleibt stehen',
  await page.$$eval('#settingsPane .entry-melde', es => es.length), 1);
await page.click('#settingsClose');
await page.waitForTimeout(200);
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
await uebernehmen(page);
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
await uebernehmen(page);
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
await online.click('#settingsClose');
keineFehler(online);
await server.stop();

await browser.close();
bilanz();
