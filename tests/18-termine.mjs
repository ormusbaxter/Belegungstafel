/* Anstehende Termine: eigenes Fenster, Wiederholungen, rechter Teil der Schau */
import { browserStarten, neueSeite, oeffneEinstellungen, uebernehmen, setzeEinstellungen,
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

/* ---- Die Rechenregel der Wiederholung ---- *
   Sie trägt das ganze Verhalten, deshalb zuerst und ohne Umweg über die
   Oberfläche. Feste Daten, damit Monatsenden und Schaltjahr vorkommen. */
const regeln = await page.evaluate(() => {
  const t = (datum, wdh, bis) => ({ datum, wdh: wdh || '', bis: bis || '', text: 'x' });
  return {
    einmaligVorbei:  naechsterTermin(t('2026-08-08'), '2026-08-09'),
    einmaligHeute:   naechsterTermin(t('2026-08-09'), '2026-08-09'),
    woche:           naechsterTermin(t('2026-08-04', 'woche'), '2026-08-09'),
    zwei:            naechsterTermin(t('2026-08-04', 'zwei'), '2026-08-09'),
    monat:           naechsterTermin(t('2026-01-15', 'monat'), '2026-03-20'),
    monatsletzter:   naechsterTermin(t('2026-01-31', 'monat'), '2026-02-01'),
    monatDanach:     naechsterTermin(t('2026-01-31', 'monat'), '2026-03-01'),
    jahr:            naechsterTermin(t('2024-06-01', 'jahr'), '2026-03-01'),
    schaltjahr:      naechsterTermin(t('2024-02-29', 'jahr'), '2026-01-01'),
    reiheOffen:      naechsterTermin(t('2026-08-04', 'woche', '2026-08-31'), '2026-08-09'),
    reiheBeendet:    naechsterTermin(t('2026-08-04', 'woche', '2026-08-10'), '2026-08-11'),
    startInZukunft:  naechsterTermin(t('2026-12-24', 'woche'), '2026-08-09')
  };
});
gleich('einmalig und vorbei entfällt', regeln.einmaligVorbei, '');
gleich('einmalig am selben Tag steht', regeln.einmaligHeute, '2026-08-09');
gleich('wöchentlich rückt auf den nächsten Wochentag', regeln.woche, '2026-08-11');
gleich('alle 2 Wochen überspringt eine', regeln.zwei, '2026-08-18');
gleich('monatlich nimmt den nächsten Monat', regeln.monat, '2026-04-15');
gleich('der 31. rutscht im Februar auf den 28.', regeln.monatsletzter, '2026-02-28');
gleich('und steht danach wieder auf dem 31.', regeln.monatDanach, '2026-03-31');
gleich('jährlich trifft das laufende Jahr', regeln.jahr, '2026-06-01');
gleich('der 29.02. rutscht im Normaljahr auf den 28.', regeln.schaltjahr, '2026-02-28');
gleich('eine Reihe innerhalb ihres Endes läuft', regeln.reiheOffen, '2026-08-11');
gleich('hinter dem Ende entfällt sie', regeln.reiheBeendet, '');
gleich('ein Start in der Zukunft bleibt stehen', regeln.startInZukunft, '2026-12-24');

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
  settings.termine.liste = [
    { id: 't4', datum: spaeter, zeit: '', text: 'Hygienebegehung', wdh: '', bis: '' },
    { id: 't2', datum: h, zeit: '14:00', text: 'Teambesprechung', wdh: '', bis: '' },
    { id: 't5', datum: gestern, zeit: '', text: 'Abgelaufen', wdh: '', bis: '' },
    { id: 't6', datum: gestern, zeit: '08:00', text: 'Frühbesprechung', wdh: 'woche', bis: '' },
    { id: 't3', datum: morgen, zeit: '09:30', text: 'Reanimationstraining', wdh: '', bis: '' }
  ];
  termineAufbauen();
}, [heute, await tag(1), await tag(-3), await tag(9)]);
await page.waitForTimeout(200);

pruefe('mit Terminen erscheint der rechte Teil', await page.isVisible('#saverTermine'));
const texte = await page.$$eval('.savertermintext', ts => ts.map(t => t.firstChild.textContent));
gleich('abgelaufene Termine fehlen', texte.includes('Abgelaufen'), false);
/* Die Reihe begann vor drei Tagen, ihr nächster Termin liegt also in vieren –
   hinter dem morgigen Einzeltermin. Sie steht nach ihm, nicht nach ihrem
   längst vergangenen Beginn. */
gleich('sortiert nach dem nächsten Termin, nicht nach dem Beginn der Reihe', texte.join(' | '),
  'Teambesprechung | Reanimationstraining | Frühbesprechung | Hygienebegehung');
gleich('die Reihe steht auf ihrem nächsten Termin',
  await page.evaluate(() => anstehendeTermine(settings.termine.liste)
    .find(t => t.text === 'Frühbesprechung').datum),
  await tag(4));
gleich('heute wird als „Heute" ausgewiesen',
  await page.textContent('.savertermin:first-of-type .saverterminzeit'), 'Heute · 14:00');
pruefe('und hervorgehoben',
  await page.evaluate(() =>
    document.querySelector('.savertermin').classList.contains('heute')));
gleich('eine Reihe trägt ihren Rhythmus hinter der Bezeichnung',
  await page.textContent('.saverterminwdh'), 'wöchentlich');
gleich('einmalige Termine tragen keinen Zusatz',
  await page.$$eval('.saverterminwdh', ws => ws.length), 1);
gleich('spätere Termine mit Wochentag',
  await page.$$eval('.savertermin .saverterminzeit',
    zs => /^[A-Z][a-z] \d\d\.\d\d\./.test(zs[3].textContent)),
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

/* ---- Pflege im eigenen Fenster, ohne Zugangsstufe ---- */
await page.evaluate(() => { settings.termine.liste = []; saveSettings(); });
pruefe('die Schaltfläche steht in der Werkzeugleiste', await page.isVisible('#btnTermine'));

await page.click('#btnTermine');
await page.waitForSelector('#terminDlg[open]');
pruefe('das Fenster öffnet ohne Passwort', await page.isHidden('#pwDlg'));

await page.click('#terminAdd');
await page.waitForTimeout(150);
await page.fill('.entry-termin:last-of-type .termintext', 'Gerätewartung');
await page.fill('.entry-termin:last-of-type input.terminzeit', '07:15');
await page.waitForTimeout(150);

const gespeichert = await page.evaluate(() => settings.termine.liste);
gleich('ein Termin gespeichert', gespeichert.length, 1);
gleich('mit Bezeichnung', gespeichert[0].text, 'Gerätewartung');
gleich('mit Uhrzeit', gespeichert[0].zeit, '07:15');
gleich('mit dem heutigen Datum als Vorgabe', gespeichert[0].datum, heute);
gleich('ohne Wiederholung', gespeichert[0].wdh, '');

/* Das Ende einer Reihe steht erst offen, wenn es eine Reihe gibt. */
pruefe('das Ende bleibt bei „einmalig" gesperrt',
  await page.isDisabled('.entry-termin:last-of-type input.terminbis'));
await page.selectOption('.entry-termin:last-of-type select.terminwdh', 'monat');
await page.waitForTimeout(150);
pruefe('mit einer Reihe steht es offen',
  !(await page.isDisabled('.entry-termin:last-of-type input.terminbis')));
gleich('die Wiederholung ist gespeichert',
  await page.evaluate(() => settings.termine.liste[0].wdh), 'monat');
gleich('die Vorschau nennt den nächsten Termin',
  await page.textContent('.entry-termin:last-of-type .terminvorschau'), 'nächster Termin: heute');

/* Eine Zeile ohne Bezeichnung ist unbrauchbar und fällt beim Schließen weg. */
await page.click('#terminAdd');
await page.waitForTimeout(150);
await page.click('#terminClose');
await page.waitForTimeout(200);
gleich('Termin ohne Bezeichnung wird verworfen',
  await page.evaluate(() => settings.termine.liste.length), 1);

/* ---- Bestand nach dem Neuladen ---- */
await page.reload();
await page.waitForTimeout(400);
gleich('bleibt nach dem Neuladen',
  await page.evaluate(() => settings.termine.liste.map(t => t.text + '/' + t.wdh).join(',')),
  'Gerätewartung/monat');

/* ---- Die Schaltfläche lässt sich abschalten ---- */
await oeffneEinstellungen(page, 'Allgemein');
await page.uncheck('#settingsPane .setblock:has-text("Termine") input[type=checkbox]');
await uebernehmen(page);
await page.waitForTimeout(200);
pruefe('abgeschaltet verschwindet die Schaltfläche', await page.isHidden('#btnTermine'));
gleich('die Termine bleiben trotzdem erhalten',
  await page.evaluate(() => settings.termine.liste.length), 1);

/* ---- Umzug aus dem Bildschirmschoner (bis Fassung 2.23) ---- */
await setzeEinstellungen(page, {
  screensaver: { termine: [{ id: 'alt', datum: '2030-01-15', zeit: '10:00', text: 'Altbestand' }] }
});
gleich('ein alter Stand zieht mit um',
  await page.evaluate(() => settings.termine.liste.map(t => t.text).join(',')), 'Altbestand');
gleich('und bekommt die neuen Felder',
  await page.evaluate(() => {
    const t = settings.termine.liste[0];
    return t.wdh + '|' + t.bis + '|' + t.zeit;
  }), '||10:00');

keineFehler(page);
await browser.close();
bilanz();
