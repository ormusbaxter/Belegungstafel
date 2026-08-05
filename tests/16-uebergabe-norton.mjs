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
  state.station.maxBetten = '12';
  state.beds['0a'].sonstiges = 'Angehörige informiert';
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
/* Die Kopfzeile trägt Symbole; der Klartext steht im title. */
const spalten = await page.$$eval('.handoversheet th', ths => ths.map(t => t.title));
gleich('Spalten des Blattes', spalten.join(' | '),
  'Bettplatz | Patient | Diagnosen | Beatmung | Kreislauf | Nierenersatz | Isolation | ' +
  'Therapielimitierung | Neurologie | Katecholamine | ' +
  'übernehmende Pflegekraft | Sonstiges und Notizen');
const zeichen = await page.$$eval('.handoversheet th', ths => ths.map(t => t.textContent));
gleich('je Spalte genau ein Symbol', zeichen.length, 12);
pruefe('keine Wortbeschriftung mehr', !zeichen.some(t => /[A-Za-zÄÖÜäöü]/.test(t)),
  zeichen.join(' '));
/* Fehlt eine Glyphe, rendert der Browser ein Ersatzkästchen von der Breite des
   nicht vergebenen Zeichens U+10FFFD. Das sichert den Prüfbrowser ab – auf dem
   Stationsrechner bleibt der Blick auf den Testdruck (INSTALLATION.md). */
const fehlend = await page.evaluate(() => {
  const probe = document.createElement('span');
  const kopf = document.querySelector('.handoversheet th');
  probe.style.cssText = 'position:fixed;left:-9999px;font:' + getComputedStyle(kopf).font;
  document.body.appendChild(probe);
  const breite = t => { probe.textContent = t; return probe.getBoundingClientRect().width; };
  const tofu = breite('\u{10FFFD}');
  const treffer = [...document.querySelectorAll('.handoversheet th')]
    .filter(th => Math.abs(breite(th.textContent) - tofu) < 0.5)
    .map(th => th.title);
  probe.remove();
  return treffer;
});
gleich('alle Symbole haben eine Glyphe', fehlend.join(', '), '');
/* Das Blatt führt alle Bettplätze, auch die freien – die Übergabe geht die
   Tafel Zeile für Zeile durch. */
gleich('eine Zeile je Bettplatz', await page.$$eval('.handoversheet tbody tr', rs => rs.length), 13);
gleich('freie Plätze sind gekennzeichnet',
  await page.$$eval('.handoversheet tbody tr.frei', rs => rs.length), 10);
enthaelt('Kopfzeile nennt die Belegung', await page.textContent('.handoversheet .sheetmeta'),
  '3 von 13 Bettplätzen belegt');
enthaelt('Diagnose steht auf dem Blatt', await page.textContent('.handoversheet'), 'Sepsis bei Pneumonie');

/* Angaben aus der Tafel werden übernommen */
/* Bett 2 ist der fünfte Platz der Tafel. */
gleich('Beatmung aus der Tafel',
  await page.textContent('.handoversheet tbody tr:nth-child(5) .sheet-beatmung'), 'INV');
/* Der Klammerwert aus dem Test weiter oben steht unverändert auf dem Blatt. */
gleich('Nierenersatz aus der Tafel',
  await page.textContent('.handoversheet tbody tr:nth-child(5) .sheet-dialyse'), '(CiCa)');
gleich('Feld für die Übernahme bleibt leer',
  await page.textContent('.handoversheet tbody tr:nth-child(1) .sheet-uebernahme'), '');
gleich('Notizspalte übernimmt Sonstiges',
  await page.textContent('.handoversheet tbody tr:nth-child(1) .sheet-notizen'),
  'Angehörige informiert');

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
/* Nierenersatz ist bewusst breiter: CVVHD muss ohne Umbruch hineinpassen. */
const cvvhd = await page.evaluate(() => {
  state.beds['0a'].dialyse = 'CVVHD';
  uebergabeBlattAufbauen();
  uebergabeEinpassen();
  document.querySelector('#handoverSheet').classList.add('messen');
  const zelle = document.querySelector('.handoversheet tbody tr .sheet-dialyse');
  const platzt = zelle.scrollWidth > zelle.clientWidth + 1;
  document.querySelector('#handoverSheet').classList.remove('messen');
  return { text: zelle.textContent, platzt };
});
gleich('CVVHD steht in der Zelle', cvvhd.text, 'CVVHD');
pruefe('CVVHD passt ohne Umbruch', !cvvhd.platzt);
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
gleich('Bettenzahl im selben Kasten',
  await page.textContent('.sheetbeds .sheetbedsvalue'), '12');
enthaelt('mit dem Zusatz für das Notbett', await page.textContent('.sheetbeds'), '+ 1');
enthaelt('und den belegten Plätzen', await page.textContent('.sheetbeds'), 'belegt 3');
const nummern = await page.$$eval('.sheetphonenr', ns => ns.map(n => n.textContent));
gleich('alle acht Diensttelefone', nummern.join(', '),
  '4149, 4117, 4719, 4880, 4881, 4882, 4883, 4212');
gleich('je Telefon eine Schreiblinie',
  await page.$$eval('.sheetphoneline', ls => ls.length), 8);

/* Einpassung: Das Blatt verkleinert die Schrift so weit, dass alle
   Bettplätze auf eine Seite passen – aber nicht unter die Lesbarkeitsgrenze. */
const einpassen = (langeNamen, langeDiagnosen) => page.evaluate(([lang, diag]) => {
  BEDS.forEach(bed => Object.assign(state.beds[bed.id], {
    name: lang ? 'Schmidt-Hohenlohe, Maximiliane' : 'Mustermann, Max',
    status: '●', disziplin: 'ACH', beatmung: ['INV'], dialyse: 'CVVHD',
    isolation: [{ v: 'MRSA', s: 'bestaetigt' }], limitierung: ['DNR', 'DNI'],
    diagnosen: diag
      ? 'Sepsis bei ambulant erworbener Pneumonie, COPD GOLD III, Niereninsuffizienz'
      : 'Sepsis bei Pneumonie',
    neuro: ['sediert', 'RASS -4'], katecholamine: ['Norepinephrin'] }));
  buildBody();
  uebergabeBlattAufbauen();
  const schrift = uebergabeEinpassen();
  const blatt = document.querySelector('#handoverSheet');
  blatt.classList.add('messen');
  const hoehe = blatt.getBoundingClientRect().height / 96 * 25.4;
  const ueberlauf = [...blatt.querySelectorAll('td')]
    .filter(td => td.scrollHeight > td.clientHeight + 1).length;
  blatt.classList.remove('messen');
  return { schrift, hoehe, ueberlauf };
}, [langeNamen, langeDiagnosen]);

const voll = await einpassen(false, false);
pruefe('volle Station passt auf eine Seite', voll.hoehe <= 188,
  voll.hoehe.toFixed(0) + ' mm von 188 mm');
pruefe('dabei lesbare Schrift', voll.schrift >= 2.4, voll.schrift + ' mm');
gleich('kein Inhalt läuft aus einer Zelle', voll.ueberlauf, 0);

/* Im Ausnahmefall – dreizehn sehr lange Namen und Diagnosen zugleich – wird
   die Schrift nicht ins Unlesbare getrieben; dann läuft das Blatt lieber
   über. Geprüft wird, dass die Grenze hält und nichts abgeschnitten wird. */
const extrem = await einpassen(true, true);
pruefe('Untergrenze der Schrift wird eingehalten', extrem.schrift >= 2.1, extrem.schrift + ' mm');
gleich('auch dort kein abgeschnittener Inhalt', extrem.ueberlauf, 0);
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
