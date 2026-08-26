/* Größe der Darstellung: Regler, Vorschau, Bestand, Grenzwerte */
import { browserStarten, neueSeite, oeffneEinstellungen, setzeEinstellungen,
         testName, gleich, pruefe, keineFehler, bilanz, uebernehmen, verneineRueckfrage } from './lib.mjs';

testName('Zoom der Tafel');
const browser = await browserStarten();
const page = await neueSeite(browser, { viewport: { width: 1600, height: 900 } });

const mass = () => page.evaluate(() => ({
  zoom: getComputedStyle(document.documentElement).getPropertyValue('--zoom').trim(),
  breite: Math.round(document.querySelector('#board').getBoundingClientRect().width),
  zeile: Math.round(document.querySelector('#tbody tr').getBoundingClientRect().height),
  statusRechts: Math.round(document.querySelector('#thead th.col-status').getBoundingClientRect().right),
  bettLinks: Math.round(document.querySelector('#thead th.col-bed').getBoundingClientRect().left),
  dialog: getComputedStyle(document.querySelector('#settingsDlg')).fontSize
}));

const start = await mass();
gleich('Ausgangswert 100 %', start.zoom, '1');

await oeffneEinstellungen(page, 'Allgemein');
const regler = await page.$('.zoomslider');
gleich('Reglerbereich', await regler.evaluate(e => e.min + '-' + e.max), '25-300');

await regler.fill('200');
await regler.dispatchEvent('input');
await page.waitForTimeout(200);
const vorschau = await mass();
gleich('Vorschau setzt den Zoom', vorschau.zoom, '2');
pruefe('Tabelle etwa doppelt so breit', Math.abs(vorschau.breite - start.breite * 2) < start.breite * 0.1,
  start.breite + ' -> ' + vorschau.breite);
gleich('Dialog bleibt unverändert', vorschau.dialog, start.dialog);
gleich('Anzeige neben dem Regler', await page.textContent('.zoomvalue'), '200 %');

/* Schließen fragt nach, weil der Regler den Entwurf verändert hat. Verneint
   heißt: verwerfen – die Vorschau verfällt. */
verneineRueckfrage(page);
await page.click('#settingsClose');
await page.waitForTimeout(250);
gleich('verworfen stellt den Zoom zurück', (await mass()).zoom, '1');

await oeffneEinstellungen(page, 'Allgemein');
const regler2 = await page.$('.zoomslider');
await regler2.fill('160');
await regler2.dispatchEvent('input');
await uebernehmen(page);
await page.waitForTimeout(300);
gleich('Übernehmen speichert', (await mass()).zoom, '1.6');

await page.reload();
await page.waitForTimeout(400);
const nachher = await mass();
gleich('Bestand nach dem Neuladen', nachher.zoom, '1.6');
gleich('stehende Spalte sitzt richtig', nachher.bettLinks, nachher.statusRechts);

/* Kleinster und größter Wert */
await setzeEinstellungen(page, { zoom: 25 });
gleich('kleinster Wert', (await mass()).zoom, '0.25');
await setzeEinstellungen(page, { zoom: 300 });
const gross = await mass();
gleich('größter Wert', gross.zoom, '3');
const tabelle = await page.locator('.tablewrap').evaluate(e => Math.round(e.getBoundingClientRect().height));
pruefe('Tabelle bleibt sichtbar', tabelle > 200, tabelle + ' px');
pruefe('Kopfbereich läuft nicht mehr mit',
  await page.evaluate(() => document.body.classList.contains('flatheader')));

/* Werte außerhalb der Grenzen werden eingefangen */
await setzeEinstellungen(page, { zoom: 5000 });
gleich('zu großer Wert wird begrenzt', (await mass()).zoom, '3');

/* ---- Klapplisten stehen in jedem Maßstab an ihrer Zelle ----
   Die Liste hängt am Seitenkörper, nicht in der Tabelle; sie muss den Zoom
   deshalb selbst nachvollziehen. Geprüft werden Lage und Maßstab. */
const klappliste = async (spalte) => {
  await page.click(`tr[data-bed="0a"] td.col-${spalte} .combobtn`);
  await page.waitForTimeout(200);
  const werte = await page.evaluate(sp => {
    const feld = document.querySelector(`tr[data-bed="0a"] td.col-${sp} input`)
      .getBoundingClientRect();
    const liste = document.querySelector('.combolist').getBoundingClientRect();
    return {
      dx: Math.round(liste.left - feld.left),
      dy: Math.round(liste.top - feld.bottom),
      breite: Math.round(liste.width),
      hoehe: Math.round(liste.height),
      imBild: liste.left >= 0 && liste.top >= 0 &&
              liste.right <= window.innerWidth + 1 && liste.bottom <= window.innerHeight + 1
    };
  }, spalte);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  return werte;
};

await setzeEinstellungen(page, { zoom: 100 });
const liste100 = await klappliste('telefon');
gleich('Klappliste bündig zur Zelle (100 %)', liste100.dx, 0);
pruefe('und dicht darunter (100 %)', liste100.dy >= 0 && liste100.dy <= 6, liste100.dy + ' px');

await setzeEinstellungen(page, { zoom: 70 });
const liste70 = await klappliste('telefon');
gleich('Klappliste bündig zur Zelle (70 %)', liste70.dx, 0);
pruefe('und dicht darunter (70 %)', liste70.dy >= 0 && liste70.dy <= 6, liste70.dy + ' px');
pruefe('dabei im Maßstab der Tafel',
  Math.abs(liste70.breite - liste100.breite * 0.7) < 4,
  liste100.breite + ' px → ' + liste70.breite + ' px');
pruefe('und vollständig im Bild', liste70.imBild);

await setzeEinstellungen(page, { zoom: 100 });
const namen100 = await klappliste('name');
await setzeEinstellungen(page, { zoom: 50 });
const namen50 = await klappliste('name');
gleich('auch die Namensliste sitzt an ihrer Zelle (50 %)', namen50.dx, 0);
pruefe('halbe Größe', Math.abs(namen50.hoehe - namen100.hoehe * 0.5) < 6,
  namen100.hoehe + ' px → ' + namen50.hoehe + ' px');

/* ---- Der Block unter der Tafel füllt die Resthöhe ---- */
await setzeEinstellungen(page, { zoom: 100 });

const fussmass = () => page.evaluate(() => {
  const h = sel => Math.round(document.querySelector(sel).getBoundingClientRect().height);
  const felder = [...document.querySelectorAll('.note textarea')]
    .map(t => Math.round(t.getBoundingClientRect().height));
  const notes = document.querySelector('.notes').getBoundingClientRect();
  const knopf = document.querySelector('.gear').getBoundingClientRect();
  const kasten = document.querySelector('.note-aufnahmen').getBoundingClientRect();
  return {
    notes: h('.notes'),
    felder,
    /* Was im Kasten neben dem Textfeld noch Platz braucht: Überschrift und
       Innenabstand. Bleibt es dabei, füllt das Feld den Rest. */
    rand: Math.round(kasten.height - felder[0]),
    resize: getComputedStyle(document.querySelector('#noteAufnahmen')).resize,
    /* Abstand vom unteren Bildrand – der Block soll ihn ausfüllen. */
    rest: Math.round(window.innerHeight - notes.bottom),
    seiteScrollt: document.documentElement.scrollHeight > window.innerHeight + 2,
    ueberdeckt: notes.right > knopf.left
  };
});

const voll = await fussmass();
gleich('beide Textfelder gleich hoch', voll.felder[0], voll.felder[1]);
pruefe('das Feld füllt seinen Kasten aus', voll.rand < 45, voll.rand + ' px für Überschrift und Rand');
gleich('nicht von Hand veränderbar', voll.resize, 'none');
pruefe('der Block reicht bis nach unten', voll.rest <= 40, voll.rest + ' px Rest');
pruefe('die Seite scrollt dabei nicht', !voll.seiteScrollt);
pruefe('die schwebenden Schaltflächen liegen nicht darüber', !voll.ueberdeckt);

/* Bei wenigen Bettplätzen bleibt mehr übrig – der Block nimmt es auf. */
await page.evaluate(() => {
  settings.beds = [{ id: 'b1', label: '1' }, { id: 'b2', label: '2' }];
  BEDS = settings.beds;
  state.beds = { b1: emptyBed(), b2: emptyBed() };
  buildHead(); buildBody();
});
await page.waitForTimeout(300);
const wenig = await fussmass();
pruefe('kurze Tafel: der Block wächst mit', wenig.felder[0] > voll.felder[0],
  voll.felder[0] + ' → ' + wenig.felder[0] + ' px');
gleich('dabei weiter gleich hoch', wenig.felder[0], wenig.felder[1]);
pruefe('und weiterhin ohne Seitenscrollen', !wenig.seiteScrollt);

keineFehler(page);
await browser.close();
bilanz();
