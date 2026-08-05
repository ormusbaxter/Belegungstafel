/* Erzeugt den Eintrag für ein Einstellungspasswort.
 *
 * Die Passwörter stehen nicht im Klartext in der Anwendung, sondern als
 * PBKDF2-Ableitung mit eigenem Salt. Dieses Werkzeug rechnet mit denselben
 * Werten wie der Browser (js/einstellungen.js) und gibt die Zeile aus, die
 * dort einzutragen ist.
 *
 *     node werkzeuge/passwort.mjs einfach "neues Passwort"
 *     node werkzeuge/passwort.mjs voll    "anderes Passwort"
 *
 * Das Werkzeug gehört nicht zur ausgelieferten Anwendung; es ist in
 * .gitattributes vom Archiv ausgenommen.
 */
import { pbkdf2Sync, randomBytes } from 'node:crypto';

/* Muss mit PBKDF2_RUNDEN in js/einstellungen.js übereinstimmen. */
const RUNDEN = 600000;

const [stufe, passwort] = process.argv.slice(2);

if (!['einfach', 'voll'].includes(stufe) || !passwort) {
  console.error('Aufruf: node werkzeuge/passwort.mjs <einfach|voll> "<Passwort>"');
  process.exit(1);
}
if (passwort.length < 8) {
  console.error('Zu kurz: Das Passwort sollte mindestens acht Zeichen haben.');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = pbkdf2Sync(passwort.normalize('NFC'), salt, RUNDEN, 32, 'sha256');

console.log('In js/einstellungen.js in SETTINGS_ZUGANG eintragen:\n');
console.log(`  { stufe: '${stufe}',`);
console.log(`    salt: '${salt.toString('hex')}',`);
console.log(`    hash: '${hash.toString('hex')}' },`);
console.log('\nDas Passwort selbst wird nirgends gespeichert – notiert es euch.');
