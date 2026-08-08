/* Kurzanleitung: Menü der Abschnitte, keine Inhalte für die Administration */
import { browserStarten, neueSeite, testName, gleich, pruefe, keineFehler, bilanz }
  from './lib.mjs';

testName('Kurzanleitung');
const browser = await browserStarten();
const page = await neueSeite(browser, { viewport: { width: 1400, height: 950 } });

await page.click('#btnHelp');
await page.waitForTimeout(300);
pruefe('Hilfe öffnet', await page.isVisible('#helpDlg'));

/* ---- Das Menü entsteht aus den Überschriften ---- */
const punkte = await page.$$eval('.helplink', ls => ls.map(l => l.textContent));
const ueberschriften = await page.$$eval('#helpBody section h3', hs => hs.map(h => h.textContent));
gleich('je Abschnitt ein Menüpunkt', punkte.length, ueberschriften.length);
gleich('mit derselben Beschriftung', punkte.join(' | '), ueberschriften.join(' | '));
pruefe('mehr als ein Abschnitt', punkte.length > 8, punkte.length + ' Abschnitte');
gleich('der erste Punkt ist hervorgehoben',
  await page.textContent('.helplink.active'), punkte[0]);

/* ---- Ein Klick führt zum Abschnitt ---- */
await page.click('.helplink:text-is("Übergabezettel")');
await page.waitForTimeout(300);
gleich('angeklickter Punkt ist hervorgehoben',
  await page.textContent('.helplink.active'), 'Übergabezettel');
const oben = await page.evaluate(() => {
  const body = document.querySelector('#helpBody');
  const kopf = [...body.querySelectorAll('section h3')]
    .find(h => h.textContent === 'Übergabezettel');
  return {
    gescrollt: body.scrollTop > 0,
    /* Der Abschnitt steht am oberen Rand des Textbereichs. */
    abstand: Math.round(kopf.getBoundingClientRect().top - body.getBoundingClientRect().top)
  };
});
pruefe('der Text ist gescrollt', oben.gescrollt);
pruefe('der Abschnitt steht oben', Math.abs(oben.abstand) < 30, oben.abstand + ' px');

/* ---- Beim Blättern wandert die Markierung mit ---- */
await page.evaluate(() => { document.querySelector('#helpBody').scrollTop = 0; });
await page.waitForTimeout(250);
gleich('ganz oben wieder der erste Punkt',
  await page.textContent('.helplink.active'), punkte[0]);

/* ---- Nur Inhalte für die Anwender ---- */
const text = await page.textContent('#helpBody');
for (const [was, wort] of [
  ['zur Vorgabedatei', 'vorgaben.js'],
  ['zu den Passwortstufen', 'Passwort'],
  ['zur täglichen Sicherung', 'Sicherung'],
  ['zum Export', 'Export'],
  ['zur Kennung der Tafel', 'Kennung']
]) {
  pruefe('keine Anleitung ' + was, !text.includes(wort));
}
const titel = punkte.join(' | ');
pruefe('kein Abschnitt „Zugang zu den Einstellungen“', !titel.includes('Zugang zu den'));
pruefe('kein Abschnitt „Vorgabe der Station“', !titel.includes('Vorgabe der Station'));
pruefe('kein Abschnitt „Sicherung“', !titel.includes('Sicherung'));

/* Was die Schicht braucht, steht weiterhin drin. */
for (const abschnitt of ['Eingeben und ändern', 'Fehlende Angaben', 'Datenschutz',
                         'Übergabezettel', 'Statistik je Schicht']) {
  pruefe('Abschnitt „' + abschnitt + '“ vorhanden', titel.includes(abschnitt));
}

keineFehler(page);
await browser.close();
bilanz();
