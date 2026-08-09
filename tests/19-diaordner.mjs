/* Ordner für die Diaschau: Dateien werden mit ihrem Inhalt übernommen
 *
 * Der Kern der Prüfung: Der Ordner liegt AUSSERHALB des Anwendungsordners.
 * Bis Fassung 2.24 wären daraus nur Namen geworden, und die Schau wäre leer
 * geblieben. Jetzt muss sie die Bilder zeigen.
 */
import { browserStarten, neueSeite, oeffneEinstellungen, uebernehmen,
         testName, gleich, pruefe, enthaelt, keineFehler, bilanz, TEST_DIR } from './lib.mjs';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

testName('Ordner für die Diaschau');

/* ---- Ein Ordner irgendwo im System, wie ihn die Station hätte ---- */
const ordner = await mkdtemp(join(tmpdir(), 'aushaenge-'));
const rot = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAFklEQVR42mP8z8BQz0AEYBxVSF+FAP5FBAXqYqOfAAAAAElFTkSuQmCC',
  'base64');
/* Eine winzige, gültige PDF mit bekannter MediaBox (A4 quer) */
const pdf = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
  '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
  '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 842 595]>>endobj\n' +
  'trailer<</Root 1 0 R>>\n%%EOF\n', 'latin1');

await writeFile(join(ordner, 'aushang.png'), rot);
await writeFile(join(ordner, 'dienstplan.pdf'), pdf);
await writeFile(join(ordner, 'notiz.txt'), 'gehoert nicht dazu');
await writeFile(join(ordner, 'LIESMICH.md'), 'auch nicht');

const browser = await browserStarten();
const page = await neueSeite(browser);

/* ---- Ordner wählen ---- */
await oeffneEinstellungen(page, 'Bildschirmschoner');
const [wahl] = await Promise.all([
  page.waitForEvent('filechooser'),
  page.click('#settingsPane .slidebar button:text-is("Ordner wählen …")')
]);
await wahl.setFiles(ordner);
await page.waitForTimeout(1200);

const status = await page.textContent('.slidestatus');
enthaelt('die Übernahme wird gemeldet', status, 'neu übernommen');
enthaelt('und nennt den Ordner', status, ordner.split('/').pop());

const eintraege = await page.evaluate(() => draft.screensaver.items
  .map(i => i.file + '/' + i.quelle));
gleich('nur PDF, PNG und JPEG werden übernommen', eintraege.join(', '),
  'aushang.png/gespeichert, dienstplan.pdf/gespeichert');

gleich('das Seitenformat der PDF wurde gleich mitgelesen',
  await page.evaluate(() => {
    const pdf = draft.screensaver.items.find(i => i.file === 'dienstplan.pdf');
    return Math.round(pdf.ratio * 100) / 100;
  }), 1.42);

pruefe('der Name ist nicht mehr änderbar',
  await page.evaluate(() => document.querySelectorAll('.slidefile-fest').length === 2));

const platz = await page.textContent('.slideplatz .panehint');
enthaelt('der belegte Platz wird ausgewiesen', platz, 'in Tafel gespeichert');
enthaelt('mit der Grenze des Browsers', platz, ' von ');

await uebernehmen(page);
await page.waitForTimeout(400);

/* ---- Die Dateien liegen in der Tafel, nicht nur ihre Namen ---- */
const gespeichert = await page.evaluate(async () => {
  const saetze = await diaAlle();
  return saetze.map(s => s.name + ' ' + (s.blob instanceof Blob ? s.blob.size + 'B' : 'kein Blob'))
    .sort().join(' | ');
});
enthaelt('Inhalt der PNG gespeichert', gespeichert, 'aushang.png');
enthaelt('Inhalt der PDF gespeichert', gespeichert, 'dienstplan.pdf');
pruefe('als Blob mit Inhalt', !/kein Blob|\b0B\b/.test(gespeichert), gespeichert);

/* ---- Und die Schau zeigt sie ---- */
await page.evaluate(() => { settings.screensaver.shuffle = false; startSaver(); });
await page.waitForTimeout(600);
const erstes = await page.evaluate(() => {
  const knoten = document.querySelector('#saverStage .slide');
  return { tag: knoten.tagName, src: knoten.getAttribute('src') || '' };
});
gleich('das erste Dia ist ein Bild', erstes.tag, 'IMG');
pruefe('aus dem Speicher der Tafel, nicht aus einem Pfad',
  erstes.src.startsWith('blob:'), erstes.src.slice(0, 40));
pruefe('das Bild wurde wirklich geladen',
  await page.evaluate(() => {
    const img = document.querySelector('#saverStage img');
    return img && img.complete && img.naturalWidth > 0;
  }));

await page.evaluate(() => { showSlide(1); });
await page.waitForTimeout(400);
const zweites = await page.evaluate(() => {
  /* Eine PDF-Seite steckt in einem Kasten, der die Bildlaufleiste des
     Betrachters beschneidet – der Rahmen liegt darin. */
  const knoten = document.querySelector('#saverStage .slide');
  const rahmen = knoten.querySelector('iframe');
  return { pdf: knoten.classList.contains('slide-pdf'),
           rahmen: Boolean(rahmen),
           src: rahmen ? rahmen.getAttribute('src') : '' };
});
pruefe('das zweite Dia ist die PDF', zweites.pdf && zweites.rahmen);
pruefe('ebenfalls aus dem Speicher', zweites.src.startsWith('blob:'), zweites.src.slice(0, 40));
await page.evaluate(() => { stopSaver(); $('#saver').hidden = true; });

/* ---- Neuladen: die Dateien sind noch da ---- */
await page.reload();
await page.waitForTimeout(700);
gleich('die Einträge überleben das Neuladen',
  await page.evaluate(() => settings.screensaver.items.map(i => i.file).join(',')),
  'aushang.png,dienstplan.pdf');
pruefe('und die Adressen werden neu gebildet',
  await page.evaluate(() => settings.screensaver.items
    .every(i => slideQuelle(i).startsWith('blob:'))));

/* ---- Denselben Ordner erneut wählen: auffrischen statt verdoppeln ---- */
await writeFile(join(ordner, 'neu.jpg'), rot);
await oeffneEinstellungen(page, 'Bildschirmschoner');
const [wahl2] = await Promise.all([
  page.waitForEvent('filechooser'),
  page.click('#settingsPane .slidebar button:text-is("Ordner wählen …")')
]);
await wahl2.setFiles(ordner);
await page.waitForTimeout(1200);
const status2 = await page.textContent('.slidestatus');
enthaelt('die vorhandenen werden aufgefrischt', status2, '2 aufgefrischt');
enthaelt('die neue kommt dazu', status2, '1 neu übernommen');
gleich('keine Verdopplung',
  await page.evaluate(() => draft.screensaver.items.length), 3);
await uebernehmen(page);
await page.waitForTimeout(400);

/* ---- Entfernen gibt den Platz wieder frei ---- */
await oeffneEinstellungen(page, 'Bildschirmschoner');
await page.click('#settingsPane .slideplatz button');
await page.waitForTimeout(600);
gleich('die Einträge sind fort',
  await page.evaluate(() => draft.screensaver.items.length), 0);
await uebernehmen(page);
await page.waitForTimeout(600);
gleich('und der Speicher ist leer',
  await page.evaluate(() => diaSchluessel().then(k => k.length)), 0);

keineFehler(page);
await browser.close();
await rm(ordner, { recursive: true, force: true });
bilanz();
