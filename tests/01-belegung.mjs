/* Zählung der belegten Betten, Zeilenfarben, Bettplatz räumen */
import { browserStarten, neueSeite, oeffneEinstellungen,
         testName, gleich, pruefe, keineFehler, bilanz, uebernehmen } from './lib.mjs';

testName('Belegung und Zählung');
const browser = await browserStarten();
const page = await neueSeite(browser);

const belegt = () => page.textContent('#statBelegt');
const zeile = id => page.locator(`tr[data-bed="${id}"]`).evaluate(e => e.className.trim());

gleich('leere Tafel zählt nichts', await belegt(), '0 / 13');

/* Nur Fachdisziplin */
await page.selectOption('tr[data-bed="0a"] td.col-disziplin select', { index: 1 });
await page.waitForTimeout(120);
gleich('Fachdisziplin allein zählt', await belegt(), '1 / 13');
gleich('Zeile gilt als belegt', await zeile('0a'), 'st-belegt');

/* Nur Anwesenheitsstatus */
await page.selectOption('tr[data-bed="0b"] td.col-status select', { index: 2 });
await page.waitForTimeout(120);
gleich('Status allein zählt', await belegt(), '2 / 13');

/* gesperrt zählt nie */
await page.fill('tr[data-bed="1a"] td.col-name input', 'gesperrt');
await page.selectOption('tr[data-bed="1a"] td.col-disziplin select', { index: 1 });
await page.waitForTimeout(200);
gleich('gesperrt zählt nicht', await belegt(), '2 / 13');
pruefe('gesperrte Zeile grau', (await zeile('1a')).includes('st-gesperrt'), await zeile('1a'));

/* Bettplatz räumen */
await page.click('tr[data-bed="0a"] .clearbed');
await page.waitForTimeout(250);
gleich('nach dem Räumen', await belegt(), '1 / 13');

/* Bestand nach dem Neuladen */
await page.reload();
await page.waitForTimeout(400);
gleich('nach dem Neuladen', await belegt(), '1 / 13');
gleich('Name blieb erhalten', await page.inputValue('tr[data-bed="1a"] td.col-name input'), 'gesperrt');

/* ---- Kräftigere Linie zwischen den Zimmern ---- */
const trenner = await page.$$eval('#tbody tr',
  rs => rs.filter(r => r.classList.contains('trenner')).map(r => r.dataset.bed));
gleich('Linie unter jedem Zimmerende', trenner.join(','), '0b,1b,2,3,4b,5,6b,7');
const staerken = await page.evaluate(() => {
  const dicke = bett => getComputedStyle(
    document.querySelector(`tr[data-bed="${bett}"] td.col-bed`)).borderBottomWidth;
  return { mit: dicke('0b'), ohne: dicke('0a') };
});
pruefe('die Linie ist kräftiger als die gewöhnliche',
  parseFloat(staerken.mit) > parseFloat(staerken.ohne),
  staerken.mit + ' gegen ' + staerken.ohne);

/* Sie lässt sich je Bettplatz abwählen – und das überlebt das Neuladen */
await oeffneEinstellungen(page, 'Bettplätze');
await page.uncheck('#settingsPane .entry-bed:nth-child(2) .bedtrenner input');
await page.check('#settingsPane .entry-bed:nth-child(1) .bedtrenner input');
await uebernehmen(page);
await page.waitForTimeout(300);
const gesetzt = () => page.$$eval('#tbody tr.trenner', rs => rs.map(r => r.dataset.bed).join(','));
gleich('abgewählt verschwindet, angewählt kommt hinzu',
  await gesetzt(), '0a,1b,2,3,4b,5,6b,7');
gleich('die Angabe steht in den Einstellungen',
  await page.evaluate(() => settings.beds.slice(0, 2).map(b => b.trenner).join(',')),
  'true,false');
gleich('und im gespeicherten Stand',
  await page.evaluate(() => JSON.parse(localStorage.getItem('belegungstafel.einstellungen'))
    .beds.slice(0, 2).map(b => b.trenner).join(',')), 'true,false');
await page.reload();
await page.waitForTimeout(400);
gleich('nach dem Neuladen unverändert', await gesetzt(), '0a,1b,2,3,4b,5,6b,7');

/* Ein gespeicherter Stand von vor 2.21.0 kennt die Angabe nicht. Dann gilt
   die Vorgabe – sonst verlöre jede eingerichtete Tafel ihre Linien. */
await page.evaluate(() => {
  localStorage.setItem('belegungstafel.einstellungen', JSON.stringify({
    version: 3,
    beds: [{ id: '0a', label: '0 a' }, { id: '0b', label: '0 b' },
           { id: '1a', label: '1 a' }, { id: '1b', label: '1 b' }, { id: '2', label: '2' }]
  }));
});
await page.reload();
await page.waitForTimeout(400);
gleich('alter Stand bekommt die Vorgabe', await gesetzt(), '0b,1b,2');

/* Wer sie bewusst abwählt, behält das: dann steht überall false. */
await page.evaluate(() => {
  localStorage.setItem('belegungstafel.einstellungen', JSON.stringify({
    version: 3,
    beds: [{ id: '0a', label: '0 a', trenner: false },
           { id: '0b', label: '0 b', trenner: false }, { id: '2', label: '2', trenner: false }]
  }));
});
await page.reload();
await page.waitForTimeout(400);
gleich('bewusst abgewählt bleibt abgewählt', await gesetzt(), '');

/* Ausgangslage für die folgenden Prüfungen wiederherstellen */
await page.evaluate(() => localStorage.removeItem('belegungstafel.einstellungen'));
await page.reload();
await page.waitForTimeout(400);

/* ---- Farbige Zeilen lassen sich abschalten ---- */
await page.evaluate(() => {
  Object.assign(state.beds['5'], { name: 'Bunt, Berta', status: 'NVK' });
  buildBody();
});
await page.waitForTimeout(250);
const farbe = () => page.evaluate(() =>
  getComputedStyle(document.querySelector('tr[data-bed="5"]')).backgroundColor);
const balken = () => page.evaluate(() => getComputedStyle(
  document.querySelector('tr[data-bed="5"] td.col-status'), '::after').backgroundColor);
const bunt = await farbe();
const balkenBunt = await balken();

await oeffneEinstellungen(page, 'Allgemein');
await page.uncheck('#settingsPane .setrow:has-text("Zeilen nach Status einfärben") input');
await uebernehmen(page);
await page.waitForTimeout(300);
pruefe('ohne Zeilenfarben ist die Zeile neutral', (await farbe()) !== bunt,
  bunt + ' → ' + (await farbe()));
gleich('der Farbbalken bleibt aber stehen', await balken(), balkenBunt);

/* wieder einschalten für die folgenden Prüfungen */
await oeffneEinstellungen(page, 'Allgemein');
await page.check('#settingsPane .setrow:has-text("Zeilen nach Status einfärben") input');
await uebernehmen(page);
await page.waitForTimeout(300);
gleich('eingeschaltet wieder farbig', await farbe(), bunt);

/* ---- Das Kennzeichen ISO steht unter der Bettbezeichnung ---- */
await page.evaluate(() => {
  Object.assign(state.beds['4a'], { name: 'Iso, Ida', status: '●',
    isolation: [{ v: 'MRSA', s: 'bestaetigt' }] });
  Object.assign(state.beds['4b'], { name: 'Ohne, Otto', status: '●', disziplin: 'INT' });
  buildBody();
});
await page.waitForTimeout(300);

const isolage = await page.evaluate(() => {
  const label = document.querySelector('tr[data-bed="4a"] .bedlabel');
  const zelle = document.querySelector('tr[data-bed="4a"] td.col-bed');
  const marke = getComputedStyle(label, '::after');
  /* Die Bezeichnung steht im Textknoten, das Kennzeichen im ::after. Ein
     Spaltenkasten setzt beide untereinander. */
  const bereich = document.createRange();
  bereich.selectNodeContents(label);
  const text = bereich.getBoundingClientRect();
  const ganz = label.getBoundingClientRect();
  return {
    richtung: getComputedStyle(label).flexDirection,
    /* Das Kennzeichen liegt unterhalb des Textes, nicht rechts daneben. */
    unterhalb: Math.round(ganz.bottom - text.bottom) > 6,
    breiter: Math.round(ganz.width - text.width),
    inhalt: marke.content,
    passtInDieZelle: ganz.bottom <= zelle.getBoundingClientRect().bottom + 1
  };
});
gleich('die Bettzelle setzt untereinander', isolage.richtung, 'column');
pruefe('das Kennzeichen steht unter der Bezeichnung', isolage.unterhalb);
pruefe('und nicht daneben', isolage.breiter <= 4, isolage.breiter + ' px breiter als der Text');
pruefe('es bleibt in der Zelle', isolage.passtInDieZelle);

const breiteMitIso = await page.evaluate(() =>
  Math.round(document.querySelector('tr[data-bed="4a"] td.col-bed').getBoundingClientRect().width));
pruefe('die Spalte bleibt schmal', breiteMitIso < 70, breiteMitIso + ' px');

/* ---- Alle Zellinhalte stehen auf einer Höhe ---- */
await page.evaluate(() => {
  Object.assign(state.beds['3'], {
    name: 'Einzel, Eva', status: '●', disziplin: 'KARD',
    beatmung: ['NIV'], kreislauf: ['ECMO'], dialyse: 'CiCa',
    isolation: [{ v: 'VRE', s: 'bestaetigt' }], limitierung: ['DNR'],
    /* macht die Zeile hoch – erst dann fällt eine Abweichung auf */
    sonstiges: 'Eine lange Bemerkung, die über mehrere Zeilen läuft und die Zeile '
      + 'deutlich höher macht, damit sich die Ausrichtung zeigt.'
  });
  buildBody();
});
await page.waitForTimeout(300);

const hoehen = await page.evaluate(() => {
  const zeile = document.querySelector('tr[data-bed="3"]');
  const bezug = zeile.getBoundingClientRect();
  const mitte = kasten => Math.round((kasten.top + kasten.bottom) / 2 - bezug.top);
  /* Beim Text zählt, wo er wirklich steht – nicht, wo sein Kästchen sitzt.
     Ein gedehntes Kästchen ist mittig, sein Text aber oben. */
  const textMitte = sel => {
    const bereich = document.createRange();
    bereich.selectNodeContents(zeile.querySelector(sel));
    return mitte(bereich.getBoundingClientRect());
  };
  return {
    select: mitte(zeile.querySelector('td.col-dialyse select').getBoundingClientRect()),
    beatmung: textMitte('td.col-beatmung .chip'),
    kreislauf: textMitte('td.col-kreislauf .chip'),
    isolation: textMitte('td.col-isolation .chip'),
    limitierung: textMitte('td.col-limitierung .chip')
  };
});
for (const spalte of ['beatmung', 'kreislauf', 'isolation', 'limitierung']) {
  pruefe('einzelne Marke steht wie die Auswahlfelder: ' + spalte,
    Math.abs(hoehen[spalte] - hoehen.select) <= 1,
    hoehen[spalte] + ' px gegen ' + hoehen.select + ' px');
}

/* ---- Ziehbild: die ganze Zeile hängt am Zeiger, nicht nur die Bettzelle ---- */
await page.evaluate(() => {
  Object.assign(state.beds['2'], {
    name: 'Mustermann, Maximilian', status: '●', disziplin: 'KARD',
    beatmung: ['INV'], telefon: '4149', pflege: 'M. Berger'
  });
  buildBody();
});
await page.waitForTimeout(250);

const bild = await page.evaluate(() => {
  const tr = document.querySelector('tr[data-bed="2"]');
  const ghost = zeileAlsZiehbild(tr);
  const masse = ghost.getBoundingClientRect();
  const zeile = tr.getBoundingClientRect();
  const wert = sel => (ghost.querySelector(sel) || {}).value;
  const ergebnis = {
    zellen: ghost.querySelectorAll('td').length,
    zellenOriginal: tr.children.length,
    name: wert('td.col-name input'),
    pflege: wert('td.col-pflege input'),
    marken: [...ghost.querySelectorAll('.chip')].map(c => c.textContent).join(','),
    kreuze: ghost.querySelectorAll('.clearbed').length,
    breite: Math.round(masse.width) === Math.round(zeile.width),
    hoehe: Math.round(masse.height) === Math.round(zeile.height)
  };
  ghost.remove();
  return ergebnis;
});
gleich('Abbild trägt alle Zellen der Zeile', bild.zellen, bild.zellenOriginal);
gleich('mit dem eingetippten Namen', bild.name, 'Mustermann, Maximilian');
gleich('und der Pflegekraft', bild.pflege, 'M. Berger');
gleich('Marken der Mehrfachauswahl', bild.marken, 'INV');
gleich('ohne die Schaltfläche zum Räumen', bild.kreuze, 0);
pruefe('so breit wie die Zeile', bild.breite);
pruefe('und so hoch', bild.hoehe);

/* Beim Ziehen wird das Abbild vorgegeben und danach wieder entfernt. */
const zug = await page.evaluate(() => {
  const tr = document.querySelector('tr[data-bed="2"]');
  const dt = new DataTransfer();
  let uebergeben = null;
  dt.setDragImage = (node, x, y) => { uebergeben = { cls: node.className, x, y }; };
  tr.querySelector('.bedcell').dispatchEvent(new DragEvent('dragstart', {
    bubbles: true, dataTransfer: dt, clientX: 300, clientY: 200
  }));
  return { uebergeben, offen: document.querySelectorAll('.dragghost').length,
           gezogen: tr.classList.contains('dragging') };
});
gleich('das Abbild wird dem Zug vorgegeben', zug.uebergeben && zug.uebergeben.cls, 'dragghost');
pruefe('am Griff angefasst statt an der Ecke', zug.uebergeben.x > 0 && zug.uebergeben.y >= 0,
  zug.uebergeben.x + '/' + zug.uebergeben.y);
gleich('die Zeile ist als gezogen gekennzeichnet', zug.gezogen, true);
await page.waitForTimeout(100);
gleich('das Abbild bleibt nicht im Dokument zurück',
  await page.$$eval('.dragghost', gs => gs.length), 0);

keineFehler(page);
await browser.close();
bilanz();
