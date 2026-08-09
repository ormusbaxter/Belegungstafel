/* Zweiseitige Hochkant-PDF nebeneinander
 *
 * Der Betrachter des Browsers kennt keine Doppelseitenansicht; die Schau
 * setzt deshalb zwei Rahmen derselben Datei nebeneinander. Ob das geschieht,
 * hängt an der Datei (zwei Seiten, hochkant) und an der Bühne (breit genug).
 */
import { browserStarten, neueSeite, oeffneEinstellungen, uebernehmen,
         testName, gleich, pruefe, enthaelt, keineFehler, bilanz } from './lib.mjs';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

testName('Doppelseitige PDF');

/* Winzige, gültige PDF mit vorgegebener Seitenzahl und Seitengröße */
const pdf = (seiten, breite, hoehe) => {
  const kids = Array.from({ length: seiten }, (_, i) => (i + 3) + ' 0 R').join(' ');
  const objekte = Array.from({ length: seiten }, (_, i) =>
    (i + 3) + ' 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 ' + breite + ' ' + hoehe + ']>>endobj\n'
  ).join('');
  return Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[' + kids + ']/Count ' + seiten + '>>endobj\n' +
    objekte + 'trailer<</Root 1 0 R>>\n%%EOF\n', 'latin1');
};

const ordner = await mkdtemp(join(tmpdir(), 'dias-'));
await writeFile(join(ordner, 'merkblatt.pdf'), pdf(2, 595, 842));   /* A4 hoch, 2 Seiten */
await writeFile(join(ordner, 'einzeln.pdf'), pdf(1, 595, 842));     /* A4 hoch, 1 Seite  */
await writeFile(join(ordner, 'quer.pdf'), pdf(2, 842, 595));        /* A4 quer, 2 Seiten */
await writeFile(join(ordner, 'lang.pdf'), pdf(6, 595, 842));        /* A4 hoch, 6 Seiten */

const browser = await browserStarten();
const page = await neueSeite(browser, { viewport: { width: 1600, height: 900 } });

/* ---- Die Datei wird beim Übernehmen ausgelesen ---- */
await oeffneEinstellungen(page, 'Bildschirmschoner');
const [wahl] = await Promise.all([
  page.waitForEvent('filechooser'),
  page.click('#settingsPane .slidebar button:text-is("Ordner wählen …")')
]);
await wahl.setFiles(ordner);
await page.waitForTimeout(1200);

const gelesen = await page.evaluate(() => Object.fromEntries(
  draft.screensaver.items.map(i => [i.file, i.seiten + '/' + Math.round(i.ratio * 100) / 100])));
gleich('zwei Seiten hochkant erkannt', gelesen['merkblatt.pdf'], '2/0.71');
gleich('eine Seite hochkant erkannt', gelesen['einzeln.pdf'], '1/0.71');
gleich('zwei Seiten quer erkannt', gelesen['quer.pdf'], '2/1.42');
gleich('sechs Seiten erkannt', gelesen['lang.pdf'], '6/0.71');

const hinweise = await page.$$eval('.entry-slide .slidehinweis', ss => ss.map(s => s.textContent));
pruefe('die Liste kündigt die Doppelseite an',
  hinweise.some(h => h.includes('2 Seiten, nebeneinander gezeigt')), hinweise.join(' | '));
pruefe('und nennt sonst nur die Seitenzahl',
  hinweise.some(h => h.endsWith('6 Seiten')), hinweise.join(' | '));

await uebernehmen(page);
await page.waitForTimeout(400);

/* ---- In der Schau ---- */
const zeige = datei => page.evaluate(name => {
  const item = settings.screensaver.items.find(i => i.file === name);
  slideList = [item];
  showSlide(0);
  const knoten = document.querySelector('#saverStage .slide');
  /* Einzelne Seite: ein Rahmen im Kasten. Doppelseite: zwei Kästen. */
  const rahmen = [...knoten.querySelectorAll('iframe')];
  return {
    doppel: knoten.classList.contains('slide-doppel'),
    rahmen: rahmen.length,
    seiten: rahmen.map(f => (f.src.match(/#page=(\d+)/) || [])[1]).join('+'),
    breite: Math.round(knoten.getBoundingClientRect().width),
    hoehe: Math.round(knoten.getBoundingClientRect().height)
  };
}, datei);

await page.evaluate(() => { startSaver(); });
await page.waitForTimeout(400);

const doppel = await zeige('merkblatt.pdf');
pruefe('zweiseitig hochkant: beide Seiten nebeneinander', doppel.doppel);
gleich('zwei Rahmen', doppel.rahmen, 2);
gleich('Seite 1 und 2', doppel.seiten, '1+2');
pruefe('der Kasten hat das doppelte Seitenverhältnis',
  Math.abs(doppel.breite / doppel.hoehe - 2 * 0.7066) < 0.03,
  doppel.breite + ' × ' + doppel.hoehe);
pruefe('und passt in die Bühne',
  await page.evaluate(() => {
    const stage = document.querySelector('#saverStage').getBoundingClientRect();
    const slide = document.querySelector('#saverStage .slide').getBoundingClientRect();
    return slide.width <= stage.width + 1 && slide.height <= stage.height + 1;
  }));

gleich('eine Seite bleibt einzeln', (await zeige('einzeln.pdf')).doppel, false);
gleich('zwei Querseiten bleiben einzeln', (await zeige('quer.pdf')).doppel, false);
gleich('sechs Seiten bleiben einzeln', (await zeige('lang.pdf')).doppel, false);

/* Eine bewusst gewählte Seite geht vor: Wer „S. 2" einträgt, will diese eine. */
await page.evaluate(() => {
  settings.screensaver.items.find(i => i.file === 'merkblatt.pdf').page = 2;
});
const geplant = await zeige('merkblatt.pdf');
gleich('mit gewählter Seite keine Doppelseite', geplant.doppel, false);
gleich('gezeigt wird die gewählte Seite', geplant.seiten, '2');
await page.evaluate(() => {
  settings.screensaver.items.find(i => i.file === 'merkblatt.pdf').page = 1;
});

/* ---- Eine schmale Bühne kippt die Entscheidung ---- */
await page.setViewportSize({ width: 700, height: 900 });
await page.waitForTimeout(300);
gleich('auf schmaler Bühne bleibt es bei einer Seite',
  (await zeige('merkblatt.pdf')).doppel, false);
await page.setViewportSize({ width: 1600, height: 900 });
await page.waitForTimeout(300);
gleich('breit wieder nebeneinander', (await zeige('merkblatt.pdf')).doppel, true);
await page.evaluate(() => { stopSaver(); $('#saver').hidden = true; });

/* ---- Nachtragen für Stände vor dieser Fassung ---- */
await page.evaluate(() => {
  for (const item of settings.screensaver.items) item.seiten = 0;
  saveSettings();
});
await page.reload();
await page.waitForTimeout(900);
gleich('fehlende Seitenzahlen werden aus den gespeicherten Dateien nachgelesen',
  await page.evaluate(() => settings.screensaver.items
    .filter(i => /\.pdf$/i.test(i.file)).every(i => i.seiten > 0)), true);
gleich('und dabei gespeichert',
  await page.evaluate(() => {
    const stand = JSON.parse(localStorage.getItem('belegungstafel.einstellungen'));
    return stand.screensaver.items.find(i => i.file === 'merkblatt.pdf').seiten;
  }), 2);

keineFehler(page);
await browser.close();
await rm(ordner, { recursive: true, force: true });
bilanz();
