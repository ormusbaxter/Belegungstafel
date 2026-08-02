/* Norton-Fälligkeit, Klammerwerte, Plausibilität und Übergabezettel */
import { browserStarten, neueSeite, oeffneEinstellungen, setzeEinstellungen,
         testName, gleich, pruefe, enthaelt, keineFehler, bilanz } from './lib.mjs';

testName('Norton, Klammern und Übergabezettel');
const browser = await browserStarten();
const page = await neueSeite(browser, { viewport: { width: 1500, height: 980 } });

/* ---- Punkt 2: Stammblatt heißt jetzt Pflegestatus ---- */
const kaesten = await page.$$eval('tr[data-bed="0a"] td.col-norton label span',
  ss => ss.map(s => s.textContent));
gleich('Ankreuzfelder umbenannt', kaesten.join(' | '), 'Norton | Pflegestatus');
enthaelt('Spaltenkopf angepasst',
  (await page.textContent('#thead th.col-norton')).replace(/­/g, ''), 'Pflegestatus');

/* Alte Stände werden übernommen */
await page.evaluate(() => {
  const stand = JSON.parse(localStorage.getItem('belegungstafel.intensiv.v1') || '{"beds":{}}');
  stand.beds = stand.beds || {};
  stand.beds['0b'] = { name: 'Alt, Anna', status: '●', norton: ['Norton', 'Stammblatt'] };
  localStorage.setItem('belegungstafel.intensiv.v1', JSON.stringify(stand));
});
await page.reload();
await page.waitForTimeout(400);
const uebernommen = await page.$$eval('tr[data-bed="0b"] td.col-norton input',
  is => is.map(i => i.checked));
gleich('altes Häkchen „Stammblatt“ bleibt gesetzt', uebernommen.join(','), 'true,true');

/* ---- Punkt 1: Fälligkeitsdatum der Norton-Skala ---- */
await page.fill('tr[data-bed="0a"] td.col-name input', 'Musterfrau, Erika');
await page.selectOption('tr[data-bed="0a"] td.col-disziplin select', { index: 1 });
await page.click('tr[data-bed="0a"] td.col-norton input >> nth=0');
await page.waitForTimeout(250);

pruefe('Marke erscheint nach dem Häkchen',
  await page.isVisible('tr[data-bed="0a"] td.col-norton .duebadge'));
const inSieben = await page.evaluate(() => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.';
});
gleich('Vorgabe sieben Tage',
  await page.textContent('tr[data-bed="0a"] td.col-norton .duebadge'), inSieben);
gleich('Datum wird gespeichert',
  await page.evaluate(() => state.beds['0a'].nortonFaellig.length), 10);

/* Häkchen entfernen löscht den Termin */
await page.click('tr[data-bed="0a"] td.col-norton input >> nth=0');
await page.waitForTimeout(200);
gleich('ohne Häkchen kein Termin', await page.evaluate(() => state.beds['0a'].nortonFaellig), '');
pruefe('und keine Marke', !(await page.isVisible('tr[data-bed="0a"] td.col-norton .duebadge')));

/* Erreichter Termin wird rot */
await page.click('tr[data-bed="0a"] td.col-norton input >> nth=0');
await page.waitForTimeout(200);
await page.evaluate(() => {
  state.beds['0a'].nortonFaellig = '2020-01-01';
  buildBody();
});
await page.waitForTimeout(200);
pruefe('überschrittener Termin ist hervorgehoben',
  await page.evaluate(() => document.querySelector('tr[data-bed="0a"] td.col-norton .duebadge')
    .classList.contains('due')));

/* Abstand ist einstellbar */
await setzeEinstellungen(page, { norton: { tage: 21 } });
await page.click('tr[data-bed="1a"] td.col-norton input >> nth=0');
await page.waitForTimeout(250);
const in21 = await page.evaluate(() => {
  const d = new Date();
  d.setDate(d.getDate() + 21);
  return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.';
});
gleich('eingestellter Abstand gilt',
  await page.textContent('tr[data-bed="1a"] td.col-norton .duebadge'), in21);

/* ---- Punkt 3: Werte in Klammern gestrichelt ---- */
await page.evaluate(() => {
  state.beds['2'].name = 'Klammer, Karl';
  state.beds['2'].status = '●';
  state.beds['2'].beatmung = ['NIV', '(HFNC)'];
  state.beds['2'].dialyse = '(CiCa)';
  buildBody();
});
await page.waitForTimeout(250);
const rahmen = await page.$$eval('tr[data-bed="2"] td.col-beatmung .chip',
  cs => cs.map(c => c.textContent + ':' + (getComputedStyle(c).borderStyle || '')));
gleich('nur der Klammerwert ist gestrichelt', rahmen.join(' | '), 'NIV:none | (HFNC):dashed');
gleich('Dialyse in Klammern ebenfalls',
  await page.locator('tr[data-bed="2"] td.col-dialyse select').evaluate(e => getComputedStyle(e).borderStyle),
  'dashed');

/* ---- Punkt 4: Plausibilität ---- */
const widerspruch = key => page.locator(`tr[data-bed="2"] td.col-${key}`)
  .evaluate(td => td.classList.contains('widerspruch'));
pruefe('verschiedene Werte sind kein Widerspruch', !(await widerspruch('beatmung')));

await page.evaluate(() => {
  state.beds['2'].beatmung = ['INV', '(INV)'];
  buildBody();
});
await page.waitForTimeout(250);
pruefe('INV und (INV) zugleich wird markiert', await widerspruch('beatmung'));
enthaelt('mit Erklärung', await page.getAttribute('tr[data-bed="2"] td.col-beatmung', 'title'),
  'INV und (INV)');

await page.evaluate(() => {
  state.beds['2'].beatmung = ['INV'];
  state.beds['2'].kreislauf = ['ECMO', '(ECMO)'];
  buildBody();
});
await page.waitForTimeout(250);
pruefe('Beatmung wieder unauffällig', !(await widerspruch('beatmung')));
pruefe('gilt auch für andere Mehrfachauswahlen', await widerspruch('kreislauf'));

/* ---- Punkt 5: Übergabezettel ---- */
pruefe('Schaltfläche ist sichtbar', await page.isVisible('#btnHandover'));
await page.click('#btnHandover');
await page.waitForTimeout(300);
pruefe('Fenster öffnet', await page.isVisible('#handoverDlg'));

/* Zuständigkeiten stehen im Fenster an erster Stelle und sind kein Pflichtfeld */
gleich('Überschrift des ersten Blocks', await page.textContent('#handoverStation h3'), 'Zuständigkeit');
const rollenfelder = await page.$$eval('#handoverStation .handoverlabel', ls => ls.map(l => l.textContent));
gleich('drei Zuständigkeiten im Fenster', rollenfelder.join(' | '),
  'Schichtleitung | Blutzuständigkeit | Notfallequipment');
await page.fill('#handoverStation .handoverrole:first-child input', 'Nachtwey');
await page.fill('#handoverStation .handoverrole:first-child .handovertel', '4286');
await page.waitForTimeout(400);
gleich('Eingabe landet in den Stationsdaten',
  await page.evaluate(() => state.station.schichtleitung), 'Nachtwey');
gleich('und erscheint auch unter der Tafel',
  await page.inputValue('.stationfield.sf-schichtleitung .sf-name'), 'Nachtwey');
gleich('leere Felder bleiben leer',
  await page.evaluate(() => state.station.notfall), '');

const bloecke = await page.$$eval('.handoverbed .handoverbednr', ns => ns.map(n => n.textContent));
/* 1 a trägt nur ein Norton-Häkchen und gilt damit nicht als belegt. */
gleich('nur belegte Bettplätze', bloecke.join(','), '0 a,0 b,2');
const felder = await page.$$eval('.handoverbed:first-child .handoverlabel', ls => ls.map(l => l.textContent));
gleich('drei Angaben je Patient', felder.join(' | '), 'Diagnosen | Neurologie | Katecholamine');

await page.fill('.handoverbed:first-child textarea >> nth=0', 'Sepsis bei Pneumonie');
await page.click('.handoverbed:first-child .handoverpick input >> nth=0');   /* Neurologie: wach */
await page.click('.handoverbed:first-child .handoverpick >> nth=1 >> input >> nth=0'); /* Norepinephrin */
await page.waitForTimeout(400);
await page.click('#handoverClose');
await page.waitForTimeout(200);

gleich('Diagnose gespeichert', await page.evaluate(() => state.beds['0a'].diagnosen),
  'Sepsis bei Pneumonie');
gleich('Neurologie als Mehrfachauswahl', await page.evaluate(() => state.beds['0a'].neuro.join(',')), 'wach');
gleich('Katecholamin gespeichert',
  await page.evaluate(() => state.beds['0a'].katecholamine.join(',')), 'Norepinephrin');

/* Nichts davon steht auf der Tafel */
gleich('keine Spalte für die Diagnosen',
  await page.$$eval('#thead th', ths => ths.filter(t => /Diagnose|Neurolog|Katechol/.test(t.textContent)).length), 0);

/* Nach dem Neuladen weiter vorhanden */
await page.reload();
await page.waitForTimeout(400);
gleich('Diagnose überlebt das Neuladen',
  await page.evaluate(() => state.beds['0a'].diagnosen), 'Sepsis bei Pneumonie');
await page.click('#btnHandover');
await page.waitForTimeout(300);
gleich('und steht wieder im Fenster',
  await page.inputValue('.handoverbed:first-child textarea >> nth=0'), 'Sepsis bei Pneumonie');
await page.click('#handoverClose');

/* Das Blatt: nur belegte Plätze, Tafel ausgeblendet */
await page.evaluate(() => {
  state.station.aufnahmen = 'Herr Beispiel, ACH, gegen 14 Uhr';
  state.station.schichtleitung = 'Schmidt';
  state.station.schichtleitungTel = '4286';
  state.beds['2'].beatmung = ['INV'];
  uebergabeBlattAufbauen();
});
await page.evaluate(() => document.body.classList.add('uebergabe-druck'));
await page.emulateMedia({ media: 'print' });
await page.waitForTimeout(200);
const sichtbar = sel => page.locator(sel).evaluate(e => getComputedStyle(e).display !== 'none');
pruefe('Blatt im Ausdruck sichtbar', await sichtbar('.handoversheet'));
pruefe('Tafel im Ausdruck ausgeblendet', !(await sichtbar('.tablewrap')));
pruefe('Fußzeile bleibt', await sichtbar('.printfoot'));
const spalten = await page.$$eval('.handoversheet th',
  ths => ths.map(t => t.textContent.replace(/­/g, '')));
gleich('Spalten des Blattes', spalten.join(' | '),
  'Bett | Patient | Beatmung | Kreislauf | Nierenersatz | Isolation | Limitierung | ' +
  'Diagnosen | Neurologie | Katecholamine | übernimmt | Notizen');
gleich('eine Zeile je belegtem Bettplatz',
  await page.$$eval('.handoversheet tbody tr', rs => rs.length), 3);
enthaelt('Diagnose steht auf dem Blatt', await page.textContent('.handoversheet'), 'Sepsis bei Pneumonie');

/* Angaben aus der Tafel werden übernommen */
gleich('Beatmung aus der Tafel',
  await page.textContent('.handoversheet tbody tr:nth-child(3) .sheet-beatmung'), 'INV');
/* Der Klammerwert aus dem Test weiter oben steht unverändert auf dem Blatt. */
gleich('Nierenersatz aus der Tafel',
  await page.textContent('.handoversheet tbody tr:nth-child(3) .sheet-dialyse'), '(CiCa)');
gleich('Feld für die Übernahme bleibt leer',
  await page.textContent('.handoversheet tbody tr:nth-child(1) .sheet-uebernahme'), '');
gleich('Notizspalte bleibt leer',
  await page.textContent('.handoversheet tbody tr:nth-child(1) .sheet-notizen'), '');

/* Die kurzen Spalten sind schmaler als die Diagnosen – die allgemeinen
   Druckregeln der Tafel dürfen die Breiten nicht überschreiben. */
const breiten = await page.evaluate(() => {
  const mm = sel => document.querySelector('.handoversheet thead ' + sel)
    .getBoundingClientRect().width;
  return { bett: mm('.sheet-bed'), beatmung: mm('.sheet-beatmung'), dialyse: mm('.sheet-dialyse'),
           limit: mm('.sheet-limitierung'), diagnosen: mm('.sheet-diagnosen'),
           notizen: mm('.sheet-notizen') };
});
pruefe('Bettplatz schmal', breiten.bett < breiten.diagnosen / 3, Math.round(breiten.bett));
pruefe('Beatmung schmal', breiten.beatmung < breiten.diagnosen / 3, Math.round(breiten.beatmung));
pruefe('Nierenersatz schmal', breiten.dialyse < breiten.diagnosen / 3, Math.round(breiten.dialyse));
pruefe('Limitierung schmal', breiten.limit < breiten.diagnosen / 3, Math.round(breiten.limit));
pruefe('Notizen breit genug zum Schreiben', breiten.notizen > breiten.beatmung * 1.5,
  Math.round(breiten.notizen));

/* Fußteil: Aufnahmen, Zuständigkeiten, Telefone */
enthaelt('geplante Aufnahmen auf dem Blatt',
  await page.textContent('.sheetbox-aufnahmen'), 'Herr Beispiel');
pruefe('Platz zum Ergänzen',
  await page.$$eval('.sheetbox-aufnahmen .sheetnoteline', ls => ls.length) >= 4);
const rollen = await page.$$eval('.sheetbox-schicht .sheetrolelabel', ls => ls.map(l => l.textContent));
gleich('drei Zuständigkeiten', rollen.join(' | '),
  'Schichtleitung | Blutzuständigkeit | Notfallequipment');
enthaelt('mit den Angaben der Schicht', await page.textContent('.sheetbox-schicht'), 'Schmidt');
const nummern = await page.$$eval('.sheetphonenr', ns => ns.map(n => n.textContent));
gleich('alle acht Diensttelefone', nummern.join(', '),
  '4149, 4117, 4719, 4880, 4881, 4882, 4883, 4212');
gleich('je Telefon eine Schreiblinie',
  await page.$$eval('.sheetphoneline', ls => ls.length), 8);
await page.emulateMedia({ media: 'screen' });
await page.evaluate(() => document.body.classList.remove('uebergabe-druck'));

/* Auswahllisten sind in den Einstellungen pflegbar */
await oeffneEinstellungen(page, 'Katecholamine');
const werte = await page.$$eval('#settingsPane .entry input', is => is.map(i => i.value));
gleich('ausgelieferte Katecholamine', werte.join(', '),
  'Norepinephrin, Epinephrin, Dobutamin, Vasopressin');
pruefe('kein Stilblock für die Übergabeliste',
  !(await page.isVisible('#settingsPane .styleblock')));
await page.click('#settingsPane .addentry');
await page.fill('#settingsPane .entry:last-child input', 'Milrinon');
await page.click('#settingsSave');
await page.waitForTimeout(400);
await page.click('#btnHandover');
await page.waitForTimeout(300);
enthaelt('neuer Eintrag steht im Übergabezettel',
  await page.textContent('.handoverbed:first-child'), 'Milrinon');
await page.click('#handoverClose');
await page.waitForTimeout(200);

/* Schaltfläche lässt sich zentral abschalten */
await oeffneEinstellungen(page, 'Allgemein');
await page.click('#settingsPane .setrow:has-text("Schaltfläche anzeigen") input[type=checkbox]');
await page.click('#settingsSave');
await page.waitForTimeout(400);
pruefe('abschaltbar', !(await page.isVisible('#btnHandover')));
gleich('Einstellung bleibt gespeichert',
  await page.evaluate(() => settings.uebergabe.button), false);

keineFehler(page);
await browser.close();
bilanz();
