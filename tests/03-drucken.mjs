/* Druckansicht: A4 quer, schwarzweiß, verkürzte Spaltenauswahl */
import { browserStarten, neueSeite, testName, gleich, pruefe, enthaelt, keineFehler, bilanz } from './lib.mjs';

testName('Druckansicht');
const browser = await browserStarten();
const page = await neueSeite(browser);

await page.fill('tr[data-bed="0a"] td.col-name input', 'Musterfrau, Erika');
await page.fill('#noteAufnahmen', 'Herr Beispiel, ACH, gegen 14 Uhr');
await page.selectOption('#meldestatus', 'gelb');
await page.waitForTimeout(250);

await page.emulateMedia({ media: 'print' });

const sichtbareSpalten = await page.$$eval('#thead th', ths => ths
  .filter(th => getComputedStyle(th).display !== 'none')
  .map(th => th.textContent.replace(/­/g, '').trim() || '(leer)'));
gleich('gedruckte Spalten', sichtbareSpalten.join(' | '),
  '(leer) | Bettplatz | Patientenname | Fachdisziplin | Isolation | Intervention | ' +
  'Therapielimitierung | Telefon | Pflegekraft | Notizen');

const versteckt = sel => page.locator(sel).evaluate(e => getComputedStyle(e).display === 'none');
pruefe('Fußzeile im Druck', !(await versteckt('.printfoot')));
const fuss = await page.evaluate(() => { druckfussSetzen(); return document.querySelector('#printFoot').textContent; });
enthaelt('Fußzeile nennt die Entsorgung', fuss, 'Entsorgung in Datenmüll!');
enthaelt('Fußzeile nennt den Druckzeitpunkt', fuss, 'gedruckt am');
pruefe('Bedienleiste nicht im Druck', await versteckt('.tools'));
pruefe('Zahnrad nicht im Druck', await versteckt('.gear'));
pruefe('Hilfe nicht im Druck', await versteckt('.help'));
pruefe('Statistik-Schaltfläche nicht im Druck', await versteckt('.statsbtn'));
pruefe('Telefonliste nicht im Druck', await versteckt('.note-phones'));
pruefe('geplante Aufnahmen im Druck', !(await versteckt('.note-aufnahmen')));

/* Die Angaben zur Schicht stehen unter der Tabelle – am Bildschirm wie auf
   dem Blatt; die schwebenden Schaltflächen dürfen kein Feld verdecken. */
const reihenfolge = async () => await page.$$eval('body > *',
  es => es.filter(e => ['HEADER', 'MAIN', 'SECTION'].includes(e.tagName) &&
                       getComputedStyle(e).display !== 'none')
          .map(e => e.className.split(' ')[0]).join(' → '));
gleich('Schichtangaben unter der Tabelle im Druck', await reihenfolge(),
  'topbar → tablewrap → stationbar → notes');

await page.emulateMedia({ media: 'screen' });
gleich('Schichtangaben unter der Tabelle am Schirm', await reihenfolge(),
  'topbar → tablewrap → stationbar → notes');
const verdeckt = await page.evaluate(() => {
  const kasten = s => document.querySelector(s).getBoundingClientRect();
  const knoepfe = ['#btnStats', '#btnHelp', '#btnSettings'].map(s => {
    document.querySelector(s).hidden = false;
    return kasten(s);
  });
  return [...document.querySelectorAll('.stationfield input')].some(feld => {
    const f = feld.getBoundingClientRect();
    return knoepfe.some(k => f.left < k.right && k.left < f.right && f.top < k.bottom && k.top < f.bottom);
  });
});
pruefe('keine Schaltfläche über einem Feld der Schichtangaben', !verdeckt);
await page.emulateMedia({ media: 'print' });

const farben = await page.$$eval('#tbody td', tds => tds
  .map(td => getComputedStyle(td).backgroundColor)
  .filter(c => c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent'));
gleich('keine Farbflächen im Druck', farben.length, 0);

const schoner = await page.locator('#saver').evaluate(e => getComputedStyle(e).display);
gleich('Bildschirmschoner nicht im Druck', schoner, 'none');

const zoomImDruck = await page.locator('.tablewrap').evaluate(e => getComputedStyle(e).zoom);
gleich('Bildschirmzoom gilt nicht im Druck', String(zoomImDruck), '1');

await page.emulateMedia({ media: 'screen' });
pruefe('Fußzeile nicht am Bildschirm', await versteckt('.printfoot'));
const alleSpalten = await page.$$eval('#thead th', ths => ths.length);
gleich('am Bildschirm alle Spalten', alleSpalten, 21);
pruefe('Notizspalte nur im Druck', await versteckt('#thead th.col-notizen'));

/* ---- Eine Seite, unter allen Umständen ----
   Der Ausdruck geht in den Visitenwagen; ein zweites Blatt fällt dort
   heraus oder wird nicht mitgenommen. Geprüft wird deshalb am erzeugten
   PDF, nicht an gerechneten Millimetern. */
async function seiten() {
  const { readFile, unlink } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const pfad = join(tmpdir(), 'visite-' + Date.now() + '.pdf');
  await page.pdf({ path: pfad, format: 'A4', landscape: true });
  const inhalt = (await readFile(pfad)).toString('latin1');
  await unlink(pfad);
  return (inhalt.match(/\/Type\s*\/Page[^s]/g) || []).length;
}

/* Eine volle Station mit langen Namen, vier Isolationen und drei
   Limitierungen – der Fall, an dem der Ausdruck vorher zweiseitig wurde. */
async function fuellen(anzahl, lang) {
  await page.evaluate(([n, viel]) => {
    if (n) {
      settings.beds = [];
      for (let i = 1; i <= n; i++) settings.beds.push({ id: 'b' + i, label: 'Bett ' + i });
      BEDS = settings.beds;
      state.beds = {};
      BEDS.forEach(bed => { state.beds[bed.id] = emptyBed(); });
      buildHead();
    }
    BEDS.forEach(bed => Object.assign(state.beds[bed.id], {
      name: viel ? 'Schmidt-Hohenlohe-Waldenburg, Maximiliane' : 'Mustermann, Max',
      status: '●', disziplin: 'KARD', intervention: 'CT',
      isolation: viel
        ? [{ v: 'MRSA', s: 'bestaetigt' }, { v: 'VRE', s: 'verdacht' },
           { v: '3MRGN', s: 'bestaetigt' }, { v: 'C. diff.', s: 'verdacht' }]
        : [{ v: 'MRSA', s: 'bestaetigt' }],
      limitierung: ['DNR', 'DNI', 'DND'], telefon: '4149', pflege: 'M. Berger'
    }));
    state.station.aufnahmen = 'Herr Beispiel, ACH, gegen 14 Uhr';
    buildBody();
    druckfussSetzen();
    return visiteEinpassen();
  }, [anzahl, lang]);
}

await page.emulateMedia({ media: 'print' });
gleich('leere Tafel auf einer Seite', await seiten(), 1);

await fuellen(0, false);
gleich('volle Station auf einer Seite', await seiten(), 1);

await fuellen(0, true);
gleich('auch mit langen Namen und vier Isolationen', await seiten(), 1);
const klein = await page.evaluate(() => visiteEinpassen());
pruefe('dabei lesbare Schrift', klein >= 5.5, klein + ' px');
gleich('der lange Name wird nicht abgeschnitten',
  await page.evaluate(() => {
    const feld = document.querySelector('#tbody tr td.col-name input');
    return feld.scrollWidth <= feld.clientWidth + 1;
  }), true);

await fuellen(26, true);
gleich('auch 26 Bettplätze auf einer Seite', await seiten(), 1);

await page.emulateMedia({ media: 'screen' });

keineFehler(page);
await browser.close();
bilanz();
