/* Bildschirmschoner: Start von Hand und automatisch, Weiterschalten,
   Einpassen, zufällige Reihenfolge, Seitenangabe */
import { browserStarten, neueSeite, setzeEinstellungen, oeffneEinstellungen, vorspulen,
         testName, gleich, pruefe, enthaelt, keineFehler, bilanz } from './lib.mjs';

testName('Bildschirmschoner');
const browser = await browserStarten();
/* Mit gestellter Uhr: Der Schoner prüft Zeitverhalten – Wartezeiten werden
   vorgespult statt abgesessen (siehe vorspulen in lib.mjs). */
const page = await neueSeite(browser, { uhr: true });

const hinweise = ['A', 'B', 'C', 'D', 'E', 'F'].map(t =>
  ({ kind: 'text', title: t, text: 'Inhalt ' + t, on: true, seconds: 2 }));

/* ---- feste Reihenfolge ---- */
await setzeEinstellungen(page, { screensaver: { on: false, seconds: 300, defaultSeconds: 2,
  shuffle: false, items: hinweise } });

await page.click('#btnSaver');
await vorspulen(page, 300);
pruefe('Schau startet von Hand', await page.isVisible('#saver'));
gleich('erster Eintrag', await page.textContent('#saverStage h2'), 'A');
gleich('Zähler', await page.textContent('#saverCount'), '1 / 6');

await vorspulen(page, 2100);
gleich('schaltet weiter', await page.textContent('#saverStage h2'), 'B');

await page.keyboard.press('Escape');
await vorspulen(page, 200);
pruefe('Taste beendet die Schau', !(await page.isVisible('#saver')));
pruefe('Sichtschutz danach aus', !(await page.evaluate(() => document.body.classList.contains('privacy'))));

/* ---- zufällige Reihenfolge ---- */
await setzeEinstellungen(page, { screensaver: { on: false, seconds: 300, defaultSeconds: 2,
  shuffle: true, items: hinweise } });
const durchlauf = async schritte => {
  const gesehen = [];
  await page.click('#btnSaver');
  await vorspulen(page, 300);
  gesehen.push(await page.textContent('#saverStage h2'));
  for (let i = 0; i < schritte; i++) {
    await vorspulen(page, 2050);
    gesehen.push(await page.textContent('#saverStage h2'));
  }
  await page.keyboard.press('Escape');
  await vorspulen(page, 150);
  return gesehen;
};
const lauf = await durchlauf(11);
const runde1 = lauf.slice(0, 6);
const runde2 = lauf.slice(6, 12);
gleich('erste Runde zeigt alle Einträge', [...runde1].sort().join(''), 'ABCDEF');
gleich('zweite Runde zeigt alle Einträge', [...runde2].sort().join(''), 'ABCDEF');
pruefe('kein Wiederholen an der Nahtstelle', runde1[5] !== runde2[0], runde1[5] + ' -> ' + runde2[0]);

/* ---- ohne Inhalte ---- */
await setzeEinstellungen(page, { screensaver: { on: false, items: [] } });
await page.click('#btnSaver');
await vorspulen(page, 300);
enthaelt('Hinweis ohne Inhalte', await page.textContent('#saverStage'), 'noch keine Inhalte');
await page.keyboard.press('Escape');

/* ---- automatischer Start ---- */
await setzeEinstellungen(page, { screensaver: { on: true, seconds: 10, defaultSeconds: 30,
  items: [{ kind: 'text', title: 'Auto', text: 'x', on: true }] }, privacy: { on: true, seconds: 300 } });
await vorspulen(page, 11200);
pruefe('startet nach der eingestellten Zeit', await page.isVisible('#saver'));
await page.mouse.move(200, 200);
await page.mouse.move(700, 600);
await vorspulen(page, 250);
pruefe('Mausbewegung beendet die Schau', !(await page.isVisible('#saver')));

/* ---- kein Start bei offenem Dialog ---- */
await oeffneEinstellungen(page);
await vorspulen(page, 11500);
pruefe('kein Start bei offenem Fenster', !(await page.isVisible('#saver')));
await page.click('#settingsClose');

/* ---- langer Text wird eingepasst ---- */
await setzeEinstellungen(page, { screensaver: { on: false, defaultSeconds: 30, items: [
  { kind: 'text', title: 'Lang', text: 'Zeile mit Inhalt. '.repeat(160), on: true }] } });
await page.click('#btnSaver');
await vorspulen(page, 400);
const karte = await page.$eval('#saverStage', e => {
  const c = e.firstElementChild;
  return { scroll: c.scrollHeight, sicht: c.clientHeight, schrift: parseFloat(getComputedStyle(c).fontSize) };
});
pruefe('langer Text vollständig sichtbar', karte.scroll <= karte.sicht + 1,
  karte.scroll + ' / ' + karte.sicht);
pruefe('Schrift dafür verkleinert', karte.schrift < 30, karte.schrift + ' px');
await page.keyboard.press('Escape');

/* ---- Seitenangabe im Verweis ---- */
await setzeEinstellungen(page, { screensaver: { on: false, defaultSeconds: 30, items: [
  { kind: 'datei', file: 'test.pdf', page: 3, on: true }] } });
await page.click('#btnSaver');
await vorspulen(page, 400);
const quelle = await page.$eval('#saverStage .slide-pdf iframe', e => e.getAttribute('src'));
enthaelt('gewählte Seite im Verweis', quelle, '#page=3');
await page.keyboard.press('Escape');

keineFehler(page);
await browser.close();
bilanz();
