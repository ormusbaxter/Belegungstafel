/* Anstehende Termine: rechter Teil der Diaschau und ihre Pflege */
import { browserStarten, neueSeite, oeffneEinstellungen, uebernehmen,
         testName, gleich, pruefe, keineFehler, bilanz } from './lib.mjs';

testName('Anstehende Termine');
const browser = await browserStarten();
const page = await neueSeite(browser, { viewport: { width: 1400, height: 900 } });

/* Datum relativ zu heute, damit die Prüfung nicht altert. */
const tag = versatz => page.evaluate(n => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
         '-' + String(d.getDate()).padStart(2, '0');
}, versatz);

/* ---- Ohne Termine bleibt der rechte Teil fort ---- */
await page.evaluate(() => { startSaver(); });
await page.waitForTimeout(300);
pruefe('ohne Termine kein rechter Teil', await page.isHidden('#saverTermine'));
pruefe('die Schau läuft trotzdem', await page.isVisible('#saverStage'));
/* Die Schau bleibt für den nächsten Abschnitt offen – nur sichtbar lassen
   sich Breiten messen. */

/* ---- Mit Terminen: Reihenfolge, Ablauf, Hervorhebung ---- */
const heute = await tag(0);
await page.evaluate(([h, morgen, gestern, spaeter]) => {
  settings.screensaver.termine = [
    { id: 't4', datum: spaeter, zeit: '', text: 'Hygienebegehung' },
    { id: 't2', datum: h, zeit: '14:00', text: 'Teambesprechung' },
    { id: 't5', datum: gestern, zeit: '', text: 'Abgelaufen' },
    { id: 't3', datum: morgen, zeit: '09:30', text: 'Reanimationstraining' }
  ];
  termineAufbauen();
}, [heute, await tag(1), await tag(-3), await tag(9)]);
await page.waitForTimeout(200);

pruefe('mit Terminen erscheint der rechte Teil', await page.isVisible('#saverTermine'));
const texte = await page.$$eval('.savertermintext', ts => ts.map(t => t.textContent));
gleich('abgelaufene Termine fehlen', texte.includes('Abgelaufen'), false);
gleich('die früheste zuerst', texte.join(' | '),
  'Teambesprechung | Reanimationstraining | Hygienebegehung');
gleich('heute wird als „Heute" ausgewiesen',
  await page.textContent('.savertermin:first-of-type .saverterminzeit'), 'Heute · 14:00');
pruefe('und hervorgehoben',
  await page.evaluate(() =>
    document.querySelector('.savertermin').classList.contains('heute')));
gleich('spätere Termine mit Wochentag',
  await page.$$eval('.savertermin .saverterminzeit', zs => /^[A-Z][a-z] \d\d\.\d\d\./.test(zs[1].textContent)),
  true);

/* Die Schau bleibt schmaler, wenn rechts etwas steht. */
const breiten = await page.evaluate(() => ({
  stage: Math.round(document.querySelector('#saverStage').getBoundingClientRect().width),
  termine: Math.round(document.querySelector('#saverTermine').getBoundingClientRect().width),
  fenster: window.innerWidth
}));
pruefe('beide Teile teilen sich die Breite',
  Math.abs(breiten.stage + breiten.termine - breiten.fenster) <= 2,
  breiten.stage + ' + ' + breiten.termine + ' von ' + breiten.fenster);
pruefe('die Schau behält den größeren Teil', breiten.stage > breiten.termine);

await page.evaluate(() => { $('#saver').hidden = true; });

/* ---- Pflege in den Einstellungen ---- */
await page.evaluate(() => { settings.screensaver.termine = []; saveSettings(); });
await oeffneEinstellungen(page, 'Bildschirmschoner');
await page.click('#settingsPane .addentry:text-is("+ Termin hinzufügen")');
await page.waitForTimeout(150);
await page.fill('.entry-termin:last-child .termintext', 'Gerätewartung');
await page.fill('.entry-termin:last-child input[type=time]', '07:15');
await uebernehmen(page);
await page.waitForTimeout(300);

const gespeichert = await page.evaluate(() => settings.screensaver.termine);
gleich('ein Termin gespeichert', gespeichert.length, 1);
gleich('mit Bezeichnung', gespeichert[0].text, 'Gerätewartung');
gleich('mit Uhrzeit', gespeichert[0].zeit, '07:15');
gleich('mit dem heutigen Datum als Vorgabe', gespeichert[0].datum, heute);

/* Ein Termin ohne Bezeichnung ist unbrauchbar und wird verworfen. */
await oeffneEinstellungen(page, 'Bildschirmschoner');
await page.click('#settingsPane .addentry:text-is("+ Termin hinzufügen")');
await page.waitForTimeout(150);
await uebernehmen(page);
await page.waitForTimeout(300);
gleich('Termin ohne Bezeichnung wird verworfen',
  await page.evaluate(() => settings.screensaver.termine.length), 1);

/* ---- Bestand nach dem Neuladen ---- */
await page.reload();
await page.waitForTimeout(400);
gleich('bleibt nach dem Neuladen',
  await page.evaluate(() => settings.screensaver.termine.map(t => t.text).join(',')),
  'Gerätewartung');

keineFehler(page);
await browser.close();
bilanz();
