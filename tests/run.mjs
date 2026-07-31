/* Startet alle Tests nacheinander und fasst das Ergebnis zusammen.
 *
 *   node tests/run.mjs            alle Tests
 *   node tests/run.mjs 04 07      nur Tests, deren Name die Angabe enthält
 */
import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { TEST_DIR } from './lib.mjs';

const filter = process.argv.slice(2);
const dateien = (await readdir(TEST_DIR))
  .filter(name => /^\d\d-.*\.mjs$/.test(name))
  .filter(name => !filter.length || filter.some(f => name.includes(f)))
  .sort();

if (!dateien.length) {
  console.log('Keine Tests gefunden.');
  process.exit(1);
}

const start = Date.now();
const ergebnisse = [];

for (const datei of dateien) {
  console.log('\n──── ' + datei + ' ' + '─'.repeat(Math.max(0, 50 - datei.length)));
  const code = await new Promise(resolve => {
    const kind = spawn(process.execPath, [join(TEST_DIR, datei)], { stdio: 'inherit' });
    kind.on('close', resolve);
    kind.on('error', () => resolve(1));
  });
  ergebnisse.push({ datei, ok: code === 0 });
}

const schlecht = ergebnisse.filter(e => !e.ok);
console.log('\n════ Zusammenfassung ' + '═'.repeat(37));
for (const e of ergebnisse) console.log((e.ok ? '  bestanden      ' : '  FEHLGESCHLAGEN ') + e.datei);
console.log('  ' + (ergebnisse.length - schlecht.length) + ' von ' + ergebnisse.length +
  ' Testdateien bestanden, ' + Math.round((Date.now() - start) / 1000) + ' s');
process.exit(schlecht.length ? 1 : 0);
