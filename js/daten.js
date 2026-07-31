/* Belegungstafel Intensivstation – Einstellungen, Datenhaltung, Verlauf
 *
 * Teil der Anwendung; die Dateien werden in der in index.html angegebenen
 * Reihenfolge geladen und teilen sich einen gemeinsamen Namensraum.
 */
'use strict';

/* Kennung dieser Tafel aus dem Attribut data-instanz in index.html. Beim
   Betrieb von der Festplatte greifen alle Kopien auf denselben Browser-
   Speicher zu; die Kennung trennt sie voneinander. Ohne Angabe bleiben die
   bisherigen Schlüssel unverändert. */
const INSTANZ = (document.documentElement.dataset.instanz || '').trim();
const KEY_SUFFIX = INSTANZ ? '.' + INSTANZ.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';

const SETTINGS_KEY = 'belegungstafel.einstellungen' + KEY_SUFFIX;

/* Die im Quelltext hinterlegten Werte – ohne Vorgabedatei und ohne den
   örtlichen Speicher. */
function grundEinstellungen() {
  return {
    version: 3,
    beds: copy(DEFAULT_BEDS),
    headers: {},
    options: copy(DEFAULT_OPTIONS),
    /* Ein Stil je Spalte, nicht je Eintrag */
    styles: Object.fromEntries(OPTION_CATEGORIES.filter(c => c.kind === 'text').map(c => [c.key, {}])),
    privacy: { on: true, seconds: 120 },
    screensaver: copy(DEFAULT_SAVER),
    zoom: 100,
    autoTheme: false,
    night: { ...DEFAULT_NIGHT },
    backup: { on: false, ziel: 'ordner', behalten: 30 }
  };
}

/* Wirksame Vorgabe der Station: die eingebauten Werte, überlagert von
   js/vorgaben.js. Sie gilt beim ersten Start und beim Zurücksetzen einer
   Kategorie. Fehlt die Datei, bleibt es bei den eingebauten Werten. */
const VORGABE = (() => {
  const werte = grundEinstellungen();
  const eigen = typeof VORGABEN === 'undefined' ? null : VORGABEN;
  if (eigen && typeof eigen === 'object') {
    try {
      mergeSettings(werte, eigen);
    } catch (err) {
      console.warn('js/vorgaben.js ist fehlerhaft und wird übergangen.', err);
    }
  }
  return werte;
})();

/* Wann wurde die Vorgabedatei erzeugt? Leer, wenn keine hinterlegt ist. */
function vorgabeStand() {
  const eigen = typeof VORGABEN === 'undefined' ? null : VORGABEN;
  return eigen && typeof eigen === 'object' && typeof eigen.erzeugt === 'string' ? eigen.erzeugt : '';
}

let settings = loadSettings();
BEDS = settings.beds;

function loadSettings() {
  const fresh = copy(VORGABE);
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
  } catch (err) {
    console.warn('Einstellungen unlesbar, verwende die Voreinstellung.', err);
  }
  mergeSettings(fresh, stored);
  return fresh;
}

function mergeSettings(target, source) {
  if (!source || typeof source !== 'object') return;
  for (const cat of OPTION_CATEGORIES) {
    /* Vor Fassung 2 war die Therapielimitierung eine Einfachauswahl mit
       zusammengesetzten Werten, vor Fassung 3 trug die erste Spalte
       Textkürzel statt Pfeilen – dort gilt wieder die Voreinstellung. */
    if (cat.key === 'limitierung' && !(source.version >= 2)) continue;
    if (cat.key === 'status' && !(source.version >= 3)) continue;
    const list = source.options && source.options[cat.key];
    if (!Array.isArray(list)) continue;
    target.options[cat.key] = cat.kind === 'phone'
      ? list.filter(e => e && (e.value || e.label))
            .map(e => ({ value: String(e.value || ''), label: String(e.label || '') }))
      : list.filter(e => typeof e === 'string' && e.trim()).map(String);
  }
  for (const cat of OPTION_CATEGORIES) {
    if (cat.kind !== 'text') continue;
    const style = source.styles && source.styles[cat.key];
    if (!style || typeof style !== 'object') continue;
    const clean = {};
    if (HEX.test(style.fg || '')) clean.fg = style.fg;
    if (HEX.test(style.bg || '')) clean.bg = style.bg;
    if (BORDER_STYLES.some(([id]) => id && id === style.border)) clean.border = style.border;
    target.styles[cat.key] = clean;
  }
  if (Array.isArray(source.beds)) {
    const beds = source.beds
      .filter(bed => bed && String(bed.label || '').trim())
      .map(bed => ({ id: String(bed.id || newBedId()), label: String(bed.label).trim() }));
    if (beds.length) target.beds = beds;
  }
  if (source.headers && typeof source.headers === 'object') {
    for (const col of COLUMNS) {
      const text = source.headers[col.key];
      if (typeof text === 'string') target.headers[col.key] = text;
    }
  }
  if (source.privacy && typeof source.privacy === 'object') {
    target.privacy.on = source.privacy.on !== false;
    const seconds = parseInt(source.privacy.seconds, 10);
    if (Number.isFinite(seconds)) target.privacy.seconds = Math.min(3600, Math.max(5, seconds));
  }
  const zoom = parseInt(source.zoom, 10);
  if (Number.isFinite(zoom)) target.zoom = clampZoom(zoom);
  target.autoTheme = source.autoTheme === true;
  if (source.night && typeof source.night === 'object') {
    if (CLOCK.test(source.night.from || '')) target.night.from = source.night.from;
    if (CLOCK.test(source.night.to || '')) target.night.to = source.night.to;
  }
  if (source.backup && typeof source.backup === 'object') {
    target.backup.on = source.backup.on === true;
    target.backup.ziel = source.backup.ziel === 'download' ? 'download' : 'ordner';
    const behalten = parseInt(source.backup.behalten, 10);
    if (Number.isFinite(behalten)) target.backup.behalten = Math.min(365, Math.max(1, behalten));
  }
  mergeSaver(target.screensaver, source.screensaver);
}

/* Einstellungen des Bildschirmschoners übernehmen und dabei prüfen. */
function mergeSaver(target, source) {
  if (!source || typeof source !== 'object') return;
  target.on = source.on === true;
  const start = parseInt(source.seconds, 10);
  if (Number.isFinite(start)) target.seconds = Math.min(3600, Math.max(SAVER_MIN, start));
  const each = parseInt(source.defaultSeconds, 10);
  if (Number.isFinite(each)) target.defaultSeconds = Math.min(600, Math.max(SAVER_ITEM_MIN, each));
  target.shuffle = source.shuffle === true;
  if (!Array.isArray(source.items)) return;
  target.items = source.items
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const seconds = parseInt(item.seconds, 10);
      return slideItem({
        id: String(item.id || newSlideId()),
        kind: item.kind === 'text' ? 'text' : 'datei',
        file: slideName(item.file),
        title: String(item.title || ''),
        text: String(item.text || ''),
        on: item.on !== false,
        seconds: Number.isFinite(seconds) && seconds > 0
          ? Math.min(600, Math.max(SAVER_ITEM_MIN, seconds))
          : null,
        page: Math.min(999, Math.max(1, parseInt(item.page, 10) || 1)),
        ratio: Number.isFinite(item.ratio) && item.ratio > 0 ? item.ratio : 0
      });
    })
    .filter(item => item.kind === 'text' || item.file);
}

/* Reiner Dateiname innerhalb des Ordners slides, ohne Pfadangaben. */
function slideName(value) {
  const name = String(value || '').trim().replace(/^.*[\\/]/, '');
  return SLIDE_TYPES.test(name) ? name : '';
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    setSaveState('Einstellungen konnten nicht gespeichert werden: ' + err.message, true);
  }
}

/* Überträgt die Einstellungen auf Spalten, Rufnummern und Sichtschutz. */
function newBedId() {
  return 'bett' + Math.random().toString(36).slice(2, 8);
}

/* Legt fehlende Bettplätze an und entfernt entfallene. */
function syncBeds() {
  for (const bed of BEDS) if (!state.beds[bed.id]) state.beds[bed.id] = emptyBed();
  for (const id of Object.keys(state.beds)) {
    if (!BEDS.some(bed => bed.id === id)) delete state.beds[id];
  }
}

function applySettings() {
  BEDS = settings.beds;
  for (const col of COLUMNS) {
    const custom = settings.headers[col.key];
    col.label = custom !== undefined && custom.trim() ? custom : DEFAULT_HEADS[col.key].label;
    col.head = custom !== undefined ? custom : DEFAULT_HEADS[col.key].head;
  }
  for (const cat of OPTION_CATEGORIES) {
    if (cat.key === 'phones') PHONES = settings.options.phones;
    else COL_BY_KEY[cat.key].options = settings.options[cat.key];
  }
  privacyDelay = settings.privacy.on ? settings.privacy.seconds : 0;
  saverDelay = settings.screensaver.on ? settings.screensaver.seconds : 0;
  applyZoom(settings.zoom);
  applyTheme();
}

/* Vergrößerung der Tafel. Der Wert steuert die CSS-Eigenschaft zoom von
   Kopfbereich, Tabelle und Textfeldern; Dialoge, Hilfe und Bildschirmschoner
   bleiben unverändert, ebenso der Ausdruck. */
let zoomFactor = 1;

function applyZoom(percent) {
  zoomFactor = clampZoom(percent) / 100;
  document.documentElement.style.setProperty('--zoom', String(zoomFactor));
  updateStickyHeader();
}

/* Bei starker Vergrößerung würde der mitlaufende Kopfbereich fast den ganzen
   Schirm verdecken; ab zwei Fünfteln der Höhe scrollt er deshalb mit weg. */
function updateStickyHeader() {
  const bar = document.querySelector('.topbar');
  if (!bar) return;
  const hoch = bar.offsetHeight * zoomFactor > window.innerHeight * 0.4;
  document.body.classList.toggle('flatheader', hoch);
}

const NOTE_FIELDS = [
  ['#noteAufnahmen', 'aufnahmen'],
  ['#noteInfos', 'infos']
];

const STORAGE_KEY = 'belegungstafel.intensiv.v1' + KEY_SUFFIX;
const THEME_KEY = 'belegungstafel.theme' + KEY_SUFFIX;
const BACKUP_KEY = 'belegungstafel.sicherung' + KEY_SUFFIX;

/* Sichtschutz: patientenbezogene Spalten zwischen Bettplatz und
   Therapielimitierung (jeweils ausschließlich bzw. einschließlich). */
const PRIVATE_KEYS = COLUMNS
  .slice(COLUMNS.findIndex(col => col.type === 'bed') + 1,
         COLUMNS.findIndex(col => col.key === 'limitierung') + 1)
  .map(col => col.key);

/* ------------------------------------------------------------------ *
 * Zustand
 * ------------------------------------------------------------------ */

function emptyBed() {
  const row = {};
  for (const col of COLUMNS) {
    if (col.type === 'bed') continue;
    if (col.type === 'multi' || col.type === 'checks' || col.type === 'germs') row[col.key] = [];
    else if (col.type === 'bool') row[col.key] = false;
    else row[col.key] = '';
  }
  row._updated = null;
  return row;
}

let state = load();

function emptyStation() {
  return Object.fromEntries(STATION_KEYS.map(key => [key, '']));
}

function mergeStation(target, source) {
  if (!source || typeof source !== 'object') return;
  for (const key of STATION_KEYS) {
    if (typeof source[key] === 'string') target[key] = source[key];
  }
}

function load() {
  const fresh = { version: 1, beds: {}, station: emptyStation(), saved: null };
  for (const bed of BEDS) fresh.beds[bed.id] = emptyBed();
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch (err) {
    console.warn('Gespeicherte Daten unlesbar, starte leer.', err);
  }
  if (stored && stored.beds) {
    for (const bed of BEDS) merge(fresh.beds[bed.id], stored.beds[bed.id]);
    mergeStation(fresh.station, stored.station);
    fresh.saved = stored.saved || null;
  }
  return fresh;
}

/* Übernimmt nur bekannte Felder in der erwarteten Form – schützt vor
   veralteten oder manipulierten Importdateien. */
function merge(target, source) {
  if (!source || typeof source !== 'object') return;
  for (const col of COLUMNS) {
    if (col.type === 'bed') continue;
    let val = source[col.key];
    if (col.type === 'date' && typeof val !== 'string' && col.legacy) val = source[col.legacy];
    if (val === undefined || val === null) continue;
    if (col.type === 'germs') {
      target[col.key] = Array.isArray(val) ? val.map(entry => toGerm(entry, source)).filter(Boolean) : [];
    } else if (col.type === 'multi' || col.type === 'checks') {
      if (typeof val === 'string' && col.fromLegacy) target[col.key] = col.fromLegacy(val);
      else target[col.key] = Array.isArray(val) ? val.map(String) : [];
    } else if (col.type === 'bool') {
      target[col.key] = Boolean(val);
    } else if (col.type === 'status') {
      target[col.key] = STATUS_LEGACY[String(val)] || String(val);
    } else {
      target[col.key] = String(val);
    }
  }
  if (typeof source._updated === 'string') target._updated = source._updated;
}

let saveTimer = null;
let unsaved = false;

/* Sammelt schnelle Eingaben und schreibt sie gebündelt weg. */
function save() {
  unsaved = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(writeNow, 250);
}

function writeNow() {
  clearTimeout(saveTimer);
  if (!unsaved) return;
  unsaved = false;
  state.saved = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setSaveState('Gespeichert um ' + timeStr(new Date()));
  } catch (err) {
    unsaved = true;
    setSaveState('Speichern fehlgeschlagen: ' + err.message, true);
  }
}

/* Beschreibung einer Feldänderung für den Verlauf. Der Schlüssel fasst
   mehrere Tastendrücke im selben Feld zu einem Schritt zusammen. */
function feldWas(bed, col) {
  return { label: 'Bett ' + bed.label + ' · ' + col.label, key: bed.id + '|' + col.key };
}

function touch(bedId, was) {
  state.beds[bedId]._updated = new Date().toISOString();
  if (was) verlaufMerken(was.label, was.key);
  save();
}

/* ------------------------------------------------------------------ *
 * Verlauf (Papierkorb)
 * Vor jeder nennenswerten Änderung wird der vorherige Stand abgelegt, so
 * dass sich die letzten Schritte einzeln zurücknehmen lassen. Der Verlauf
 * liegt nur im Arbeitsspeicher und endet mit dem Schließen der Seite.
 * ------------------------------------------------------------------ */
const HISTORY_MAX = 20;
const HISTORY_COALESCE = 90000;   /* gleiche Zelle innerhalb 90 s = ein Schritt */
let history = [];
let vorstand = null;              /* Stand vor der laufenden Änderung */
let standFrisch = false;

function standMerken() {
  vorstand = { beds: copy(state.beds), station: copy(state.station) };
  standFrisch = false;
}

/* Legt den bisherigen Stand im Verlauf ab. Darf vor oder nach der Änderung
   aufgerufen werden – der neue Bezugsstand wird danach automatisch gesetzt. */
function verlaufMerken(label, key) {
  if (!vorstand) standMerken();
  const last = history[history.length - 1];
  if (key && last && last.key === key &&
      Date.now() - new Date(last.zeit).getTime() < HISTORY_COALESCE) {
    planeStand();
    return;
  }
  history.push({ zeit: new Date().toISOString(), label, key, ...vorstand });
  if (history.length > HISTORY_MAX) history.shift();
  planeStand();
}

/* Nach dem Ende der laufenden Aktion gilt der neue Stand als Bezug. */
function planeStand() {
  if (standFrisch) return;
  standFrisch = true;
  queueMicrotask(standMerken);
}

function verlaufZurueck(index) {
  const entry = history[index];
  if (!entry) return;
  const jetzt = { zeit: new Date().toISOString(), label: 'Stand vor dem Zurücknehmen',
                  beds: copy(state.beds), station: copy(state.station) };
  state.beds = copy(entry.beds);
  state.station = copy(entry.station);
  history.splice(index, 1);
  history.push(jetzt);
  standMerken();

  syncBeds();
  buildBody();
  renderStation();
  renderStats();
  save();
  setSaveState('Zurückgenommen: ' + entry.label);
}

function verlaufLetzten() {
  if (history.length) verlaufZurueck(history.length - 1);
}

function renderVerlauf() {
  const box = $('#histList');
  box.replaceChildren();
  if (!history.length) {
    box.appendChild(el('p', 'panehint', 'Seit dem Öffnen der Tafel wurde nichts geändert.'));
    return;
  }
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    const row = el('div', 'histrow');
    row.appendChild(el('span', 'histtime', timeStr(new Date(entry.zeit))));
    row.appendChild(el('span', 'histlabel', entry.label));
    const btn = el('button', '', 'Zurücknehmen');
    btn.type = 'button';
    btn.addEventListener('click', () => {
      verlaufZurueck(i);
      renderVerlauf();
    });
    row.appendChild(btn);
    box.appendChild(row);
  }
}

function initVerlauf() {
  $('#histClose').addEventListener('click', () => $('#histDlg').close());
  document.addEventListener('keydown', event => {
    if (!(event.ctrlKey || event.metaKey) || event.key !== 'z' || event.shiftKey) return;
    /* In Textfeldern gehört Strg + Z dem Feld selbst. */
    const tag = event.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (!history.length) return;
    event.preventDefault();
    verlaufLetzten();
  });
}
