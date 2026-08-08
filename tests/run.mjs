/* Startet die Tests und fasst das Ergebnis zusammen.
 *
 *   node tests/run.mjs             die regulären Tests, mehrere nebeneinander
 *   node tests/run.mjs 04 07       nur Tests, deren Name die Angabe enthält
 *   node tests/run.mjs --alle      zusätzlich die optionalen Tests
 *   node tests/run.mjs --reihe     nacheinander statt nebeneinander
 *   node tests/run.mjs -j 8        Zahl der gleichzeitig laufenden Tests
 *
 * Jede Testdatei läuft in einem eigenen Prozess mit eigenem Browser und
 * eigenem Speicher; sie können deshalb nebeneinander laufen. Zwei Ausnahmen
 * sind unten benannt.
 */
import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { cpus } from 'node:os';
import { TEST_DIR } from './lib.mjs';

/* Optional: läuft nur auf Verlangen mit.
 *
 * Der Bildschirmschoner prüft Zeitverhalten und ist deshalb der bei weitem
 * langsamste Test. Er gehört vor eine Auslieferung, nicht in jeden Durchlauf
 * während der Arbeit. */
const OPTIONAL = {
  '05-schoner.mjs': 'prüft Zeitverhalten und dauert entsprechend'
};

/* Exklusiv: läuft allein, nicht neben anderen.
 *
 * Der Test der Stationsvorgabe schreibt js/vorgaben.js – eine Datei, die
 * jede andere Testseite mitlädt. Liefe er nebenher, sähen die übrigen Tests
 * zwischendurch eine fremde oder absichtlich fehlerhafte Vorgabe. */
const EXKLUSIV = {
  '12-vorgaben.mjs': 'schreibt js/vorgaben.js'
};

const args = process.argv.slice(2);
const alle = args.includes('--alle');
const reihe = args.includes('--reihe');
const jIndex = args.indexOf('-j');
/* Ohne -j steht an keiner Stelle eine Zahl dazu; jIndex + 1 wäre sonst 0 und
   würde das erste Argument verschlucken. */
const jWert = jIndex >= 0 ? jIndex + 1 : -1;
const filter = args.filter((a, i) => !a.startsWith('-') && i !== jWert);

const parallel = reihe ? 1
  : jIndex >= 0 ? Math.max(1, parseInt(args[jIndex + 1], 10) || 1)
  /* Ein Kern bleibt frei: Jeder Test fährt einen eigenen Browser, und bei
     voller Auslastung geraten zeitabhängige Prüfungen ins Rutschen. */
  : Math.min(4, Math.max(1, cpus().length - 1));

const vorhanden = (await readdir(TEST_DIR))
  .filter(name => /^\d\d-.*\.mjs$/.test(name))
  .sort();

/* Ein ausdrücklich genannter Test läuft immer – wer ihn nennt, will ihn. */
const gewaehlt = vorhanden.filter(name => filter.length
  ? filter.some(f => name.includes(f))
  : alle || !OPTIONAL[name]);

/* Nur melden, was wegen seiner Optionalität ausblieb – nicht, was eine
   gezielte Auswahl ohnehin ausgeschlossen hat. */
const uebersprungen = filter.length ? []
  : vorhanden.filter(name => !gewaehlt.includes(name) && OPTIONAL[name]);

if (!gewaehlt.length) {
  console.log('Keine Tests gefunden.');
  process.exit(1);
}

const gemeinsam = gewaehlt.filter(name => !EXKLUSIV[name]);
const allein = gewaehlt.filter(name => EXKLUSIV[name]);

const start = Date.now();
const ergebnisse = new Map();

function starte(datei) {
  return new Promise(resolve => {
    const teile = [];
    const kind = spawn(process.execPath, [join(TEST_DIR, datei)]);
    kind.stdout.on('data', d => teile.push(d));
    kind.stderr.on('data', d => teile.push(d));
    kind.on('close', code => resolve({ code, text: Buffer.concat(teile).toString() }));
    kind.on('error', () => resolve({ code: 1, text: 'Test ließ sich nicht starten.\n' }));
  });
}

/* Die Ausgabe der Kinder wird gesammelt und als Block gezeigt, sobald ein
   Test fertig ist – nebeneinander laufende Tests würden sich sonst
   zeilenweise ins Wort fallen. */
async function laufen(liste, gleichzeitig) {
  let naechster = 0;
  const arbeiter = async () => {
    while (naechster < liste.length) {
      const datei = liste[naechster++];
      const { code, text } = await starte(datei);
      ergebnisse.set(datei, code === 0);
      console.log('\n──── ' + datei + ' ' + '─'.repeat(Math.max(0, 50 - datei.length)));
      process.stdout.write(text);
    }
  };
  await Promise.all(Array.from({ length: Math.min(gleichzeitig, liste.length) }, arbeiter));
}

if (gemeinsam.length) {
  const wie = parallel > 1 ? parallel + ' gleichzeitig' : 'nacheinander';
  console.log(gemeinsam.length + ' Testdateien, ' + wie);
  await laufen(gemeinsam, parallel);
}
/* Die exklusiven zum Schluss: Bricht einer davon mitten in seiner Arbeit ab,
   hat er die übrigen Tests nicht mehr gestört. */
if (allein.length) {
  console.log('\n' + allein.length + ' Testdatei allein (' +
    allein.map(n => EXKLUSIV[n]).join(', ') + ')');
  await laufen(allein, 1);
}

const schlecht = [...ergebnisse].filter(([, ok]) => !ok);
console.log('\n════ Zusammenfassung ' + '═'.repeat(37));
for (const datei of gewaehlt) {
  console.log((ergebnisse.get(datei) ? '  bestanden      ' : '  FEHLGESCHLAGEN ') + datei);
}
for (const datei of uebersprungen) {
  console.log('  übersprungen   ' + datei + '  – ' + OPTIONAL[datei] + ', mit --alle');
}
console.log('  ' + (gewaehlt.length - schlecht.length) + ' von ' + gewaehlt.length +
  ' Testdateien bestanden, ' + Math.round((Date.now() - start) / 1000) + ' s');
process.exit(schlecht.length ? 1 : 0);
