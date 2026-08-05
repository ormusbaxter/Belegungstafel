/* Gemeinsame Hilfen für die Tests der Belegungstafel.
 *
 * Die Tests fahren die Tafel in einem echten Browser (Chromium über
 * Playwright) und prüfen das Ergebnis. Jede Testdatei läuft eigenständig
 * und endet mit dem Rückgabewert 0 (alles gut) oder 1 (mindestens eine
 * Prüfung fehlgeschlagen). tests/run.mjs startet alle nacheinander.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TEST_DIR = dirname(fileURLToPath(import.meta.url));
export const APP_DIR = resolve(TEST_DIR, '..');
export const APP_URL = 'file://' + join(APP_DIR, 'index.html');

/* Playwright kann im Projekt, global oder an einem eigenen Ort liegen. */
export async function ladePlaywright() {
  const kandidaten = [
    process.env.PLAYWRIGHT_PFAD,
    'playwright',
    '/opt/node22/lib/node_modules/playwright/index.mjs',
    '/usr/lib/node_modules/playwright/index.mjs',
    '/usr/local/lib/node_modules/playwright/index.mjs'
  ].filter(Boolean);
  for (const kandidat of kandidaten) {
    try {
      return await import(kandidat);
    } catch (err) {
      /* nächsten Ort versuchen */
    }
  }
  throw new Error('Playwright nicht gefunden. Entweder "npm install -D playwright" im ' +
    'Projektordner ausführen oder den Pfad in der Umgebungsvariable PLAYWRIGHT_PFAD angeben.');
}

/* ---------------- Prüfungen ---------------- */
let name = 'Test';
const ergebnisse = [];

export function testName(text) {
  name = text;
}

export function pruefe(was, bedingung, zusatz) {
  ergebnisse.push({ was, ok: Boolean(bedingung), zusatz: zusatz === undefined ? '' : String(zusatz) });
}

export function gleich(was, ist, soll) {
  const ok = JSON.stringify(ist) === JSON.stringify(soll);
  ergebnisse.push({ was, ok, zusatz: ok ? String(ist) : 'ist: ' + ist + ' / soll: ' + soll });
}

export function enthaelt(was, text, teil) {
  const ok = String(text).includes(teil);
  ergebnisse.push({ was, ok, zusatz: ok ? '' : 'nicht gefunden in: ' + String(text).slice(0, 120) });
}

export function bilanz() {
  const schlecht = ergebnisse.filter(e => !e.ok);
  for (const e of ergebnisse) {
    console.log((e.ok ? '  ok   ' : '  FEHL ') + e.was + (e.zusatz ? '  [' + e.zusatz + ']' : ''));
  }
  console.log((schlecht.length ? 'FEHLGESCHLAGEN ' : 'bestanden ') + name + ': ' +
    (ergebnisse.length - schlecht.length) + ' von ' + ergebnisse.length);
  process.exit(schlecht.length ? 1 : 0);
}

/* ---------------- Browser ---------------- */
export async function browserStarten(sichtbar) {
  const { chromium } = await ladePlaywright();
  return await chromium.launch({ headless: !sichtbar });
}

/* Neue Seite mit leerem Speicher. zeit: feste Uhrzeit (ISO), damit
   zeitabhängige Prüfungen reproduzierbar bleiben. */
export async function neueSeite(browser, opt = {}) {
  const context = await browser.newContext({ viewport: opt.viewport || { width: 1400, height: 900 } });
  const page = await context.newPage();
  page.fehler = [];
  page.on('pageerror', err => page.fehler.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') page.fehler.push(msg.text()); });
  if (opt.dialogeBestaetigen !== false) page.on('dialog', d => d.accept());
  if (opt.zeit) await page.clock.install({ time: new Date(opt.zeit) });
  await page.goto(opt.url || APP_URL);
  if (opt.speicher !== false) {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  }
  await page.waitForTimeout(opt.warten || 300);
  return page;
}

/* Einstellungen vorgeben, ohne den Dialog zu bedienen. */
export async function setzeEinstellungen(page, einstellungen, thema) {
  await page.evaluate(([e, t]) => {
    localStorage.setItem('belegungstafel.einstellungen', JSON.stringify(e));
    if (t) localStorage.setItem('belegungstafel.theme', t);
  }, [{ version: 3, ...einstellungen }, thema || '']);
  await page.reload();
  await page.waitForTimeout(300);
}

/* Einstellungsdialog öffnen und einen Reiter wählen. Ohne Angabe wird das
   Passwort der vollen Stufe verwendet, damit alle Reiter offenstehen;
   'Vinzenz1' öffnet die eingeschränkte Stufe. */
export async function oeffneEinstellungen(page, reiter, passwort) {
  await page.click('#btnSettings');
  await page.fill('#pwInput', passwort || 'Twist114');
  await page.click('#pwForm button[type=submit]');
  /* Die Passwortprüfung rechnet (PBKDF2) und braucht einen Augenblick. */
  await page.waitForSelector('#settingsDlg[open]', { timeout: 5000 });
  await page.waitForTimeout(150);
  if (reiter) {
    await page.click(`#settingsTabs .tab:text-is("${reiter}")`);
    await page.waitForTimeout(150);
  }
}

export function keineFehler(page) {
  pruefe('keine Skriptfehler', page.fehler.length === 0, page.fehler.join(' | '));
}

/* ---------------- Kleiner Webserver ---------------- */
/* Für die Prüfungen, die einen Server voraussetzen (Verzeichnisübersicht,
   Einlesen von slides.json). */
const TYPEN = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
                '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
                '.pdf': 'application/pdf', '.svg': 'image/svg+xml', '.txt': 'text/plain' };

export function serverStarten(port = 8321) {
  const server = createServer(async (req, res) => {
    const pfad = decodeURIComponent(req.url.split('?')[0]);
    const ziel = join(APP_DIR, pfad);
    try {
      if (pfad.endsWith('/')) {
        const { readdir } = await import('node:fs/promises');
        const eintraege = await readdir(ziel);
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end('<ul>' + eintraege.map(n => `<li><a href="${encodeURIComponent(n)}">${n}</a></li>`).join('') + '</ul>');
        return;
      }
      const daten = await readFile(ziel);
      res.writeHead(200, { 'content-type': TYPEN[extname(ziel).toLowerCase()] || 'application/octet-stream' });
      res.end(daten);
    } catch (err) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('nicht gefunden');
    }
  });
  return new Promise(resolve => {
    server.listen(port, '127.0.0.1', () => resolve({
      url: 'http://127.0.0.1:' + port + '/index.html',
      basis: 'http://127.0.0.1:' + port + '/',
      stop: () => new Promise(r => server.close(r))
    }));
  });
}
