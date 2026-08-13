/* Tag- und Nachtansicht: drei Zustände, einstellbare Zeitspanne */
import { browserStarten, neueSeite, setzeEinstellungen, oeffneEinstellungen,
         testName, gleich, pruefe, enthaelt, keineFehler, bilanz, uebernehmen } from './lib.mjs';

testName('Tag- und Nachtansicht');
const browser = await browserStarten();

const stand = p => p.evaluate(() => ({
  thema: document.documentElement.dataset.theme,
  label: document.querySelector('#themeLabel').textContent
}));

/* ---- ohne die Option: zwei Zustände ---- */
const tag = await neueSeite(browser, { zeit: '2026-03-05T14:00:00' });
gleich('Start hell', (await stand(tag)).thema, 'light');
await tag.click('#btnTheme');
await tag.waitForTimeout(120);
gleich('erster Klick dunkel', (await stand(tag)).thema, 'dark');
await tag.click('#btnTheme');
await tag.waitForTimeout(120);
gleich('zweiter Klick wieder hell', (await stand(tag)).thema, 'light');
gleich('keine Beschriftung', (await stand(tag)).label, '');

/* ---- Option einschalten ---- */
await oeffneEinstellungen(tag, 'Allgemein');
const kaesten = await tag.$$('#settingsPane .setrow input[type=checkbox]');
gleich('acht Kästchen unter Allgemein', kaesten.length, 8);
gleich('Zeitfelder zunächst gesperrt',
  await tag.$$eval('.timefield', is => is.map(i => i.disabled).join(',')), 'true,true');
/* Über die Beschriftung statt über die Reihenfolge: Ein neuer Punkt unter
   Allgemein verschiebt sonst den Index. */
await tag.check('#settingsPane .setrow:has-text("Automatische Tag-/Nachtansicht") input');
gleich('Zeitfelder danach frei',
  await tag.$$eval('.timefield', is => is.map(i => i.disabled).join(',')), 'false,false');
const felder = await tag.$$('.timefield');
await felder[0].fill('17:00');
await felder[1].fill('06:30');
await uebernehmen(tag);
await tag.waitForTimeout(250);

const auto = await stand(tag);
gleich('Zustand Auto beschriftet', auto.label, 'Auto');
gleich('14 Uhr bleibt hell', auto.thema, 'light');
enthaelt('Hinweistext nennt die Zeiten', await tag.getAttribute('#btnTheme', 'title'), '17:00 bis 06:30');
gleich('Zeiten gespeichert',
  await tag.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('belegungstafel.einstellungen')).night)),
  '{"from":"17:00","to":"06:30"}');

/* drei Zustände */
await tag.click('#btnTheme');
await tag.waitForTimeout(120);
gleich('Auto → dunkel', (await stand(tag)).thema, 'dark');
await tag.click('#btnTheme');
await tag.waitForTimeout(120);
gleich('dunkel → hell', (await stand(tag)).thema, 'light');
await tag.click('#btnTheme');
await tag.waitForTimeout(120);
gleich('hell → Auto', (await stand(tag)).label, 'Auto');
keineFehler(tag);

/* ---- Grenzen der eingestellten Spanne ---- */
for (const [zeit, soll] of [['2026-03-05T16:59:00', 'light'], ['2026-03-05T17:01:00', 'dark'],
                            ['2026-03-06T06:29:00', 'dark'], ['2026-03-06T06:31:00', 'light']]) {
  const p = await neueSeite(browser, { zeit });
  await setzeEinstellungen(p, { autoTheme: true, night: { from: '17:00', to: '06:30' } }, 'auto');
  gleich('um ' + zeit.slice(11, 16) + ' ' + soll, (await stand(p)).thema, soll);
  await p.context().close();
}

/* ---- Wechsel im laufenden Betrieb ---- */
const nacht = await neueSeite(browser, { zeit: '2026-03-06T06:29:30' });
await setzeEinstellungen(nacht, { autoTheme: true, night: { from: '17:00', to: '06:30' } }, 'auto');
gleich('vor der Grenze dunkel', (await stand(nacht)).thema, 'dark');
await nacht.clock.fastForward('00:40');
await nacht.waitForTimeout(300);
gleich('nach der Grenze hell, ohne Neuladen', (await stand(nacht)).thema, 'light');

/* ---- Option abschalten, während Auto lief ---- */
await oeffneEinstellungen(nacht, 'Allgemein');
await nacht.uncheck('#settingsPane .setrow:has-text("Automatische Tag-/Nachtansicht") input');
await uebernehmen(nacht);
await nacht.waitForTimeout(250);
const danach = await stand(nacht);
gleich('sichtbare Ansicht bleibt', danach.thema, 'light');
gleich('Beschriftung verschwindet', danach.label, '');
keineFehler(nacht);

await browser.close();
bilanz();
