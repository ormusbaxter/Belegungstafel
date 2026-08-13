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
    namen: { ...DEFAULT_NAMEN },
    beds: copy(DEFAULT_BEDS),
    headers: {},
    options: copy(DEFAULT_OPTIONS),
    /* Ein Stil je Spalte, nicht je Eintrag */
    styles: Object.fromEntries(OPTION_CATEGORIES.filter(hatStil).map(c => [c.key, {}])),
    privacy: { on: true, seconds: 120 },
    kontextmenue: DEFAULT_KONTEXTMENUE,
    zeilenfarben: DEFAULT_ZEILENFARBEN,
    isoZeile: DEFAULT_ISO_ZEILE,
    rechte: { einfach: [...DEFAULT_RECHTE.einfach], gesperrt: [] },
    screensaver: copy(DEFAULT_SAVER),
    zoom: 100,
    autoTheme: false,
    night: { ...DEFAULT_NIGHT },
    norton: { ...DEFAULT_NORTON },
    uebergabe: { ...DEFAULT_UEBERGABE },
    termine: copy(DEFAULT_TERMINE),
    /* Die Sicherungen enthalten Klarnamen. Sie sollen den Ausfall eines
       Arbeitsplatzes überbrücken, nicht ein Archiv bilden – deshalb eine
       Woche statt eines Monats. */
    backup: { on: false, ziel: 'ordner', behalten: 7 },
    statistik: copy(DEFAULT_STATISTIK)
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
    if (cat.kind === 'phone') {
      target.options[cat.key] = list.filter(e => e && (e.value || e.label))
        .map(e => ({ value: String(e.value || ''), label: String(e.label || '') }));
    } else if (cat.kind === 'melde') {
      /* Farbe nur übernehmen, wenn sie ein gültiger Wert ist – sonst bliebe
         eine unbrauchbare Angabe in der Kachel stehen. */
      target.options[cat.key] = list
        .filter(e => e && String(e.value || '').trim())
        .map(e => ({ value: String(e.value).trim(),
                     color: HEX.test(e.color || '') ? e.color : '' }));
    } else {
      target.options[cat.key] = list.filter(e => typeof e === 'string' && e.trim()).map(String);
    }
  }
  for (const cat of OPTION_CATEGORIES) {
    if (!hatStil(cat)) continue;
    const style = source.styles && source.styles[cat.key];
    if (!style || typeof style !== 'object') continue;
    const clean = {};
    if (HEX.test(style.fg || '')) clean.fg = style.fg;
    if (HEX.test(style.bg || '')) clean.bg = style.bg;
    if (BORDER_STYLES.some(([id]) => id && id === style.border)) clean.border = style.border;
    target.styles[cat.key] = clean;
  }
  if (Array.isArray(source.beds)) {
    /* Stände vor 2.21.0 kennen die Trennlinie nicht. Trägt kein einziger
       Bettplatz die Angabe, ist es ein solcher Stand – dann gilt die Vorgabe
       je Bettplatz, statt alle Linien stillschweigend abzuschalten. Wer sie
       bewusst abwählt, hat sie danach als `false` gespeichert und wird von
       dieser Übernahme nicht mehr erfasst. */
    const alterStand = source.beds.every(bed => !bed || bed.trenner === undefined);
    const vorgabe = id => (DEFAULT_BEDS.find(bed => bed.id === id) || {}).trenner === true;
    const beds = source.beds
      .filter(bed => bed && String(bed.label || '').trim())
      .map(bed => {
        const id = String(bed.id || newBedId());
        return { id, label: String(bed.label).trim(),
                 trenner: alterStand ? vorgabe(id) : bed.trenner === true };
      });
    if (beds.length) target.beds = beds;
  }
  if (source.namen && typeof source.namen === 'object') {
    for (const key of ['haus', 'station']) {
      if (typeof source.namen[key] !== 'string') continue;
      target.namen[key] = source.namen[key].trim().slice(0, NAME_MAX);
    }
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
  if (typeof source.kontextmenue === 'boolean') target.kontextmenue = source.kontextmenue;
  if (typeof source.zeilenfarben === 'boolean') target.zeilenfarben = source.zeilenfarben;
  if (typeof source.isoZeile === 'boolean') target.isoZeile = source.isoZeile;
  if (source.rechte && Array.isArray(source.rechte.einfach)) {
    /* Nur bekannte Reiter übernehmen, und niemals einen gesperrten. Eine
       leere Liste würde der einfachen Stufe ein Fenster ohne Inhalt zeigen –
       dann gilt wieder die Vorgabe. */
    const erlaubt = alleReiter().map(t => t.key).filter(k => !RECHTE_TABU.includes(k));
    const liste = source.rechte.einfach.filter(k => erlaubt.includes(k));
    target.rechte.einfach = liste.length ? liste : [...DEFAULT_RECHTE.einfach];
  }
  if (source.rechte && Array.isArray(source.rechte.gesperrt)) {
    const bekannt = alleTeile();
    target.rechte.gesperrt = source.rechte.gesperrt.filter(k => bekannt.includes(k));
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
  if (source.norton && typeof source.norton === 'object') {
    const tage = parseInt(source.norton.tage, 10);
    if (Number.isFinite(tage)) target.norton.tage = Math.min(365, Math.max(1, tage));
  }
  if (source.uebergabe && typeof source.uebergabe === 'object') {
    target.uebergabe.button = source.uebergabe.button !== false;
  }
  mergeSaver(target.screensaver, source.screensaver);
  mergeTermine(target.termine, source);
  mergeStatistik(target.statistik, source.statistik);
}

/* Termine übernehmen und dabei prüfen.
 *
 * Bis Fassung 2.23 hingen sie unter screensaver.termine; ein Stand von dort
 * wird weitergeführt, damit beim Umzug in das eigene Fenster nichts verloren
 * geht. Ein Datum ist Pflicht – ohne Datum steht der Termin nirgends. */
function mergeTermine(target, source) {
  if (!source || typeof source !== 'object') return;
  const eigen = source.termine && typeof source.termine === 'object' ? source.termine : null;
  if (eigen) target.button = eigen.button !== false;

  const liste = eigen && Array.isArray(eigen.liste) ? eigen.liste
    : source.screensaver && Array.isArray(source.screensaver.termine) ? source.screensaver.termine
    : null;
  if (!liste) return;

  target.liste = liste
    .filter(t => t && typeof t === 'object' && ISO_DATUM.test(t.datum || ''))
    .map(t => terminItem({
      id: String(t.id || newTerminId()),
      datum: t.datum,
      zeit: CLOCK.test(t.zeit || '') ? t.zeit : '',
      text: String(t.text || '').trim().slice(0, TERMIN_MAX),
      wdh: WDH_KEYS.includes(t.wdh) ? t.wdh : '',
      bis: ISO_DATUM.test(t.bis || '') ? t.bis : ''
    }))
    .filter(t => t.text);
}

/* Umbenannte Auswahlwerte älterer Stände übernehmen (z. B. Stammblatt →
   Pflegestatus), damit vorhandene Häkchen erhalten bleiben. */
function umbenannt(col, wert) {
  const text = String(wert);
  return col.legacyValues && col.legacyValues[text] ? col.legacyValues[text] : text;
}

/* Einstellungen der Statistik übernehmen und dabei prüfen. */
function mergeStatistik(target, source) {
  if (!source || typeof source !== 'object') return;
  target.on = source.on !== false;
  target.button = source.button !== false;
  const takt = parseInt(source.intervall, 10);
  if (Number.isFinite(takt)) target.intervall = Math.min(120, Math.max(1, takt));
  const tage = parseInt(source.tage, 10);
  if (Number.isFinite(tage)) target.tage = Math.min(3650, Math.max(7, tage));
  if (!Array.isArray(source.schichten)) return;
  const schichten = source.schichten
    .filter(s => s && CLOCK.test(s.start || ''))
    .map((s, i) => ({
      key: String(s.key || 'schicht' + i),
      name: String(s.name || 'Schicht ' + (i + 1)).trim() || 'Schicht ' + (i + 1),
      start: s.start
    }));
  if (schichten.length >= 2) target.schichten = sortiereSchichten(schichten);
}

/* Schichten liegen immer in der Reihenfolge ihrer Anfangszeiten. */
function sortiereSchichten(liste) {
  return liste.slice().sort((a, b) => clockMinutes(a.start) - clockMinutes(b.start));
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
      const quelle = SLIDE_QUELLEN.includes(item.quelle) ? item.quelle : 'ordner';
      return slideItem({
        id: String(item.id || newSlideId()),
        kind: item.kind === 'text' ? 'text' : 'datei',
        quelle,
        file: slideName(item.file),
        title: String(item.title || ''),
        text: String(item.text || ''),
        on: item.on !== false,
        seconds: Number.isFinite(seconds) && seconds > 0
          ? Math.min(600, Math.max(SAVER_ITEM_MIN, seconds))
          : null,
        page: Math.min(999, Math.max(1, parseInt(item.page, 10) || 1)),
        ratio: Number.isFinite(item.ratio) && item.ratio > 0 ? item.ratio : 0,
        seiten: Math.min(9999, Math.max(0, parseInt(item.seiten, 10) || 0))
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
  applyNamen();
  document.body.classList.toggle('ohne-zeilenfarben', !settings.zeilenfarben);
  document.body.classList.toggle('iso-zeile', settings.isoZeile);
  for (const col of COLUMNS) {
    const custom = settings.headers[col.key];
    col.label = custom !== undefined && custom.trim() ? custom : DEFAULT_HEADS[col.key].label;
    col.head = custom !== undefined ? custom : DEFAULT_HEADS[col.key].head;
  }
  for (const cat of OPTION_CATEGORIES) {
    /* Zwei Listen gehören zu keiner Spalte. */
    if (cat.key === 'phones') PHONES = settings.options.phones;
    else if (cat.key === 'melde') MELDE = settings.options.melde;
    else FIELD_BY_KEY[cat.key].options = settings.options[cat.key];
  }
  /* Eine Tafel ohne Meldestatus – frisch aufgesetzt oder aus einer Datei ohne
     dieses Feld – bekommt die erste Stufe, und zwar in den Daten und nicht nur
     in der Anzeige. Sonst zeigte die Kachel eine Stufe, während Ausdruck und
     Export das Feld leer ließen.
     Ein bereits gesetzter Wert wird nicht angetastet, auch wenn er nicht mehr
     in der Liste steht: Wer meldet, hat sich dabei etwas gedacht. */
  if (state && state.station && !state.station.meldestatus) {
    state.station.meldestatus = meldestatusVorgabe();
  }
  privacyDelay = settings.privacy.on ? settings.privacy.seconds : 0;
  saverDelay = settings.screensaver.on ? settings.screensaver.seconds : 0;
  applyZoom(settings.zoom);
  applyTheme();
}

/* Krankenhaus und Station in den Seitenkopf und in den Fenstertitel. Ein leer
   gelassenes Feld verschwindet, statt eine Lücke zu hinterlassen. */
function applyNamen() {
  const setze = (sel, text) => {
    const node = $(sel);
    if (!node) return;
    node.textContent = text;
    node.hidden = !text;
  };
  setze('.brandhaus', String(settings.namen.haus || '').trim());
  setze('.brandstation', String(settings.namen.station || '').trim());
  document.title = tafelTitel() || 'Belegungstafel';
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

/* Sichtschutz: alle patientenbezogenen Spalten. Offen bleiben allein die
   Angaben, die den Bettplatz oder die Schicht beschreiben – Anwesenheits-
   status, Bettplatz, Telefon und Pflegekraft. Eine später ergänzte Spalte
   ist damit von sich aus geschützt. */
const PRIVATE_OFFEN = ['status', 'bed', 'telefon', 'pflege'];
const PRIVATE_KEYS = COLUMNS.map(col => col.key).filter(key => !PRIVATE_OFFEN.includes(key));

/* ------------------------------------------------------------------ *
 * Zustand
 * ------------------------------------------------------------------ */

function emptyBed() {
  const row = {};
  for (const col of [...COLUMNS, ...EXTRA_FIELDS]) {
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
      else target[col.key] = Array.isArray(val) ? val.map(eintrag => umbenannt(col, eintrag)) : [];
    } else if (col.type === 'bool') {
      target[col.key] = Boolean(val);
    } else if (col.type === 'status') {
      target[col.key] = STATUS_LEGACY[String(val)] || String(val);
    } else if (col.key === 'name') {
      /* Auch in älteren Ständen wird das Pluszeichen zum Kreuz. */
      target[col.key] = mitKreuz(val);
    } else {
      target[col.key] = String(val);
    }
  }
  /* Angaben ohne eigene Spalte: Norton-Fälligkeit und Übergabezettel. */
  for (const feld of EXTRA_FIELDS) {
    const val = source[feld.key];
    if (val === undefined || val === null) continue;
    if (feld.type === 'multi') target[feld.key] = Array.isArray(val) ? val.map(String) : [];
    else target[feld.key] = String(val);
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
