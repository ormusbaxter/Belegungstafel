/* Zweiter Ausdruck: Blatt für die Physiotherapie */
import { browserStarten, neueSeite, testName, gleich, pruefe, keineFehler, bilanz } from './lib.mjs';

testName('Blatt für die Physiotherapie');
const browser = await browserStarten();
/* Satzbreite eines A4-Blattes quer abzüglich der Ränder – 283 mm sind bei
   96 dpi 1070 px. Nur so wird gemessen, was auch auf dem Papier steht;
   ein breiteres Fenster gäbe den Spalten Platz, den der Drucker nicht hat. */
const page = await neueSeite(browser, { viewport: { width: 1070, height: 900 } });

/* Acht belegte Betten, einer gesperrt, einer angekündigt, Rest frei */
await page.evaluate(() => {
  const namen = ['Musterfrau, Erika', 'Bergmann, Karl-Heinz', 'Özdemir, Aylin', 'Schmidt, Peter',
                 'Wagner-Lindqvist, Annemarie', 'Klein, Jörg', 'Nowak, Ewa', 'Fischer, Ulrich'];
  ['0a', '0b', '1a', '1b', '2', '3', '4a', '4b'].forEach((id, i) => {
    const d = state.beds[id];
    d.name = namen[i];
    d.status = '●';
    d.disziplin = 'KARD';
    d.pflege = 'S. Gertzen';
    d.telefon = '42' + (10 + i);
    d.physio = i % 2 ? 'Mobi+AT' : 'passiv';
  });
  state.beds['0a'].isolation = [{ v: 'MRSA', s: 'positiv' }, { v: 'VRE', s: 'verdacht' }];
  state.beds['5'].name = 'gesperrt';
  state.beds['5'].status = '●';
  state.beds['6a'].status = '➡︎';
  state.beds['6a'].disziplin = 'ACH';
  buildBody();
  renderStats();
  /* page.pdf() löst afterprint aus; für die Prüfung die Ansicht festhalten */
  window.addEventListener('beforeprint', () => document.body.classList.add('physio-druck'));
});
await page.waitForTimeout(300);

/* Der Knopf schaltet die Ansicht ein (window.print wird abgefangen) */
await page.evaluate(() => { window.print = () => { window.__gedruckt = true; }; });
await page.click('#btnPrintPhysio');
await page.waitForTimeout(200);
pruefe('Knopf löst den Druck aus', await page.evaluate(() => window.__gedruckt === true));
pruefe('Physio-Ansicht ist aktiv', await page.evaluate(() => document.body.classList.contains('physio-druck')));

await page.emulateMedia({ media: 'print' });
await page.waitForTimeout(150);

const spalten = await page.$$eval('#thead th', ths => ths
  .filter(th => getComputedStyle(th).display !== 'none')
  .map(th => th.textContent.replace(/­/g, '').trim() || '(leer)'));
gleich('nur die sieben gewünschten Spalten', spalten.join(' | '),
  'Bettplatz | Patientenname | Fachdisziplin | Isolation | Telefon | Pflegekraft | Physiotherapie');

/* Die Verordnung der Physiotherapie ist der Zweck des Blattes */
gleich('Physiotherapie steht auf dem Blatt',
  await page.locator('tr[data-bed="0a"] td.col-physio select').inputValue(), 'passiv');
pruefe('Spalte Physiotherapie sichtbar',
  await page.locator('#thead th.col-physio').evaluate(e => getComputedStyle(e).display !== 'none'));

const zeilen = await page.$$eval('#tbody tr', trs => trs
  .filter(tr => getComputedStyle(tr).display !== 'none')
  .map(tr => tr.querySelector('.bedlabel').textContent));
gleich('nur belegte Bettplätze', zeilen.join(','), '0 a,0 b,1 a,1 b,2,3,4 a,4 b,6 a');
pruefe('gesperrter Platz fehlt', !zeilen.includes('5'));
pruefe('freie Plätze fehlen', !zeilen.includes('7'));

const versteckt = sel => page.locator(sel).evaluate(e => getComputedStyle(e).display === 'none');
pruefe('keine Stationszeile', await versteckt('.stationbar'));
pruefe('keine Notizfelder', await versteckt('.notes'));
pruefe('keine Kennzahlen', await versteckt('.stats'));
pruefe('keine Notizspalte', await versteckt('#thead th.col-notizen'));
pruefe('keine schwebenden Schaltflächen', await versteckt('.statsbtn') && await versteckt('.help')
  && await versteckt('.gear'));
gleich('Blatt ist gekennzeichnet', await page.textContent('.printtag'), 'Physiotherapie');
pruefe('Fußzeile auch auf dem Physio-Blatt', !(await versteckt('.printfoot')));

/* Schriftgrößen: groß genug für ausgeprägte Kurzsichtigkeit */
const pt = sel => page.locator(sel).evaluate(e => parseFloat(getComputedStyle(e).fontSize) * 0.75);
const name = await pt('tr[data-bed="0a"] td.col-name input');
const bett = await pt('tr[data-bed="0a"] .bedlabel');
pruefe('Name mindestens 16 pt', name >= 16, name.toFixed(1) + ' pt');
pruefe('Bettplatz mindestens 18 pt', bett >= 18, bett.toFixed(1) + ' pt');

/* Sehr langer Name wird kleiner, passt aber vollständig in die Spalte */
const lang = await page.evaluate(() => {
  const input = document.querySelector('tr[data-bed="2"] td.col-name input');
  return { schrift: parseFloat(getComputedStyle(input).fontSize) * 0.75,
           passt: input.scrollWidth <= input.clientWidth + 1 };
});
pruefe('langer Name vollständig sichtbar', lang.passt, lang.schrift.toFixed(1) + ' pt');
pruefe('nur der lange Name wird kleiner', lang.schrift < name, lang.schrift.toFixed(1) + ' < ' + name.toFixed(1));

/* Kein Wert darf an der Spaltenbreite scheitern – „Rücksprache“ und ein
   ausgeschriebenes Kürzel der Pflegekraft sind die längsten Einträge. */
const abgeschnitten = await page.evaluate(() => {
  const lang = { pflege: 'S. Gertzen', physio: 'Rücksprache' };
  for (const bed of BEDS) Object.assign(state.beds[bed.id], state.beds[bed.id].name ? lang : {});
  buildBody();
  setPhysioRowHeight();
  /* Ein Auswahlfeld meldet keinen Überlauf – es schneidet den Text still ab.
     Gemessen wird deshalb der Text selbst gegen die Breite des Feldes. */
  return [...document.querySelectorAll('#tbody tr')]
    .filter(tr => getComputedStyle(tr).display !== 'none')
    .flatMap(tr => [...tr.querySelectorAll('td input, td select')])
    .filter(feld => {
      if (getComputedStyle(feld.closest('td')).display === 'none' || !feld.value) return false;
      const stil = getComputedStyle(feld);
      const breite = widestText([feld.value],
        stil.fontWeight + ' ' + stil.fontSize + ' ' + stil.fontFamily);
      return breite > feld.clientWidth + 1;
    })
    .map(feld => feld.closest('td').className + ': ' + feld.value);
});
gleich('kein Inhalt läuft aus einer Zelle', abgeschnitten.join(' | '), '');

/* Bettplatz und Name überlagern sich nicht (stehende Spalten sind gelöst) */
const geometrie = await page.evaluate(() => {
  const bett = document.querySelector('tr[data-bed="0a"] td.col-bed').getBoundingClientRect();
  const name = document.querySelector('tr[data-bed="0a"] td.col-name').getBoundingClientRect();
  return { bettRechts: Math.round(bett.right), nameLinks: Math.round(name.left),
           position: getComputedStyle(document.querySelector('tr[data-bed="0a"] td.col-bed')).position };
});
gleich('Spalten stoßen sauber aneinander', geometrie.bettRechts, geometrie.nameLinks);
gleich('keine stehende Spalte im Druck', geometrie.position, 'static');

/* Passt auf ein Blatt – bei wenigen wie bei allen Betten */
for (const anzahl of [1, 8, 13]) {
  /* Aufbauen und gleich messen: page.pdf() des vorigen Durchgangs löst
     afterprint aus und nimmt die Physio-Ansicht zurück – zwischen zwei
     Aufrufen könnte das dazwischenfahren. Bei wenigen Zeilen wird alles sehr
     groß gesetzt; die Werte müssen trotzdem in ihre Spalten passen. */
  const zuLang = await page.evaluate(n => {
    BEDS.forEach((bed, i) => {
      const d = state.beds[bed.id];
      d.name = i < n ? 'Bergmann, Karl-Heinz' : '';
      d.status = i < n ? '●' : '';
      d.disziplin = i < n ? 'KARD' : '';
      d.pflege = i < n ? 'S. Gertzen' : '';
      d.telefon = i < n ? '4210' : '';
      d.physio = i < n ? 'Rücksprache' : '';
    });
    buildBody();
    setPhysioRowHeight();
    document.body.classList.add('physio-druck');
    return [...document.querySelectorAll('#tbody td input, #tbody td select')]
      .filter(feld => feld.value && getComputedStyle(feld.closest('td')).display !== 'none')
      .map(feld => {
        const stil = getComputedStyle(feld);
        return { spalte: feld.closest('td').classList[0], wert: feld.value,
                 text: widestText([feld.value],
                   stil.fontWeight + ' ' + stil.fontSize + ' ' + stil.fontFamily),
                 platz: feld.clientWidth };
      })
      .filter(m => m.text > m.platz + 1)
      .map(m => m.spalte + ' „' + m.wert + '“ ' + Math.round(m.text) + '/' + m.platz);
  }, anzahl);
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(150);
  gleich('bei ' + anzahl + ' Betten läuft kein Wert aus seiner Spalte',
    [...new Set(zuLang)].join(' | '), '');
  const pdf = await page.pdf({ format: 'A4', landscape: true,
    margin: { top: '7mm', bottom: '7mm', left: '7mm', right: '7mm' } });
  const treffer = Buffer.from(pdf).toString('latin1')
    .match(/\/Type\s*\/Pages[\s\S]{0,200}?\/Count\s+(\d+)/);
  gleich('bei ' + anzahl + ' Betten eine Seite', treffer && treffer[1], '1');
}

await page.emulateMedia({ media: 'screen' });
await page.evaluate(() => document.body.classList.remove('physio-druck'));
await page.waitForTimeout(150);
pruefe('am Bildschirm wieder alle Spalten',
  (await page.$$eval('#thead th', ths => ths.filter(t => getComputedStyle(t).display !== 'none').length)) === 20);

keineFehler(page);
await browser.close();
bilanz();
