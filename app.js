/* Belegungstafel Intensivstation
 * Reines HTML/CSS/JS ohne Abhängigkeiten. Daten liegen ausschließlich lokal
 * im Browser (localStorage) des jeweiligen Arbeitsplatzes.
 */
'use strict';

/* Fassung der Anwendung. Bei jeder Änderung erhöhen: die erste Stelle bei
   grundlegenden Umbauten, die zweite bei neuen Funktionen, die dritte bei
   Korrekturen und kleinen Anpassungen. */
const VERSION = '1.6.0';

/* Pfeile der ersten Spalte: Aufnahme nach rechts, Verlegung nach links */
const ARROW_IN = '\u27A1\uFE0E';
const ARROW_OUT = '\u2B05\uFE0E';

/* Frühere Textkürzel werden beim Einlesen auf die Pfeile umgestellt. */
const STATUS_LEGACY = { 'A >>>': ARROW_IN, 'A >>': ARROW_IN, '<<< V': ARROW_OUT, '<< V': ARROW_OUT };
const COPYRIGHT = '\u00A9 2026 Oliver Becker';

/* ------------------------------------------------------------------ *
 * Bettplätze
 * ------------------------------------------------------------------ */
const DEFAULT_BEDS = [
  { id: '0a', label: '0 a' },
  { id: '0b', label: '0 b' },
  { id: '1a', label: '1 a' },
  { id: '1b', label: '1 b' },
  { id: '2',  label: '2'   },
  { id: '3',  label: '3'   },
  { id: '4a', label: '4 a' },
  { id: '4b', label: '4 b' },
  { id: '5',  label: '5'   },
  { id: '6a', label: '6 a' },
  { id: '6b', label: '6 b' },
  { id: '7',  label: '7'   },
  { id: '8',  label: '8'   }
];

/* Wird beim Laden aus den Einstellungen übernommen. */
let BEDS = DEFAULT_BEDS.map(bed => ({ ...bed }));

/* ------------------------------------------------------------------ *
 * Spalten
 * Feldtypen: status | bed | text | tel | datalist | select | multi | germs |
 *            checks | bool | longtext
 * Sämtliche Auswahllisten sind hier zentral hinterlegt und können ohne
 * weitere Codeänderung an die Gepflogenheiten der Station angepasst werden.
 * ------------------------------------------------------------------ */
const COLUMNS = [
  {
    /* Datenquelle Spalte A */
    /* Ohne Kopftext, damit die Spalte nur so breit sein muss wie ihre Werte. */
    key: 'status', label: 'Anwesenheitsstatus', head: '', type: 'status', width: 58,
    /* \u27A1\uFE0E Aufnahme, \u2B05\uFE0E Verlegung – die Textvariante (U+FE0E)
       verhindert, dass der Browser bunte Emoji zeichnet. */
    options: [ARROW_IN, '\u25cf', 'NVK', 'NVK 1', 'NVK 2', 'NVK 3', ARROW_OUT]
  },
  { key: 'bed', label: 'Bettplatz', type: 'bed', width: 68 },
  {
    /* Freitext; die Auswahlliste (Datenquelle Spalte J) ist optional und
       beschreibt den Bettplatz, wenn kein Patientenname eingetragen ist. */
    key: 'name', label: 'Patientenname', head: 'Patienten\u00ADname', type: 'datalist',
    width: 148, placeholder: 'Name, Vorname',
    options: ['Notbett', 'gesperrt', 'Reinigung', 'NA', 'OP', 'CV']
  },
  {
    /* Datenquelle Spalte B */
    key: 'disziplin', label: 'Fachdisziplin', head: 'Fach\u00ADdisziplin', type: 'select', width: 62,
    options: ['ACH', 'DIAB', 'GAST', 'GCH', 'INF', 'INT', 'KARD', 'ONKO', 'RAD', 'TCH', 'UCH', 'X']
  },
  {
    /* Datenquelle Spalte C – mehrere Formen kombinierbar. */
    key: 'beatmung', label: 'Beatmungsform', head: 'Beatmungs\u00ADform',
    type: 'multi', width: 88,
    options: ['INV', 'NIV', 'HFNC', 'NIV/HF', '(INV)', '(NIV)', '(HFNC)', '(NIV/HF)', 'MIRUS'],
    fromLegacy: value => (value ? [value] : [])
  },
  {
    /* Datenquelle Spalte D – mehrere Verfahren kombinierbar. */
    key: 'kreislauf', label: 'Kreislaufunterstützung', head: 'Kreislauf\u00ADunter\u00ADstützung',
    type: 'multi', width: 95,
    options: ['ECMO', 'ECOS', 'ECPELLA', 'ILA', 'IMPELLA', 'pass. SM', 'PiCCO'],
    fromLegacy: value => (value ? [value] : [])
  },
  {
    /* Datenquelle Spalte E */
    key: 'dialyse', label: 'Dialyse', type: 'select', width: 62,
    options: ['CiCa', '(CiCa)']
  },
  {
    /* Datenquelle Spalte O. Jeder Eintrag wird einzeln als bestätigt oder als
       Verdacht geführt, Kombinationen sind dadurch möglich (z. B. MRSA
       bestätigt und Verdacht auf VRE). Die vier „V. a. …“-Werte der
       Datenquelle entfallen, sie werden über das Kennzeichen abgebildet. */
    key: 'isolation', label: 'Isolation', type: 'germs', width: 130,
    options: ['3MRGN', '4MRGN', 'C. diff.', 'CoViD', 'div. MRE', 'Herpes Zoster', 'Influenza A',
              'Influenza A+B', 'Influenza B', 'Kittelpflege', 'Kontakt CoViD', 'Kontakt Influenza',
              'MRSA', 'Noro', 'Rota', 'RSV', 'sonstiges', 'TBC', 'Umkehriso', 'unkl. Durchfälle',
              'VRE']
  },
  {
    /* Datenquelle Spalte F */
    key: 'ttm', label: 'TTM', type: 'select', width: 48,
    options: ['\u2744', '\u263c']
  },
  {
    /* Datenquelle Spalte I */
    key: 'intervention', label: 'Intervention', head: 'Inter\u00ADvention', type: 'select', width: 78,
    options: ['Angio', 'Broncho', 'CT', 'Endo', 'ggf. OP', 'HKL', 'MRT', 'OP', 'PTR', 'RÖ',
              'TEE', 'VAC', 'ext. Dial.']
  },
  {
    /* Datenquelle Spalte M. Mehrere Einträge kombinierbar; die früheren
       zusammengesetzten Werte (DNR/DNI, DNR/DND, DNR/I/D) entfallen und
       werden beim Einlesen in die einzelnen Einträge aufgeteilt. */
    key: 'limitierung', label: 'Therapielimitierung', head: 'Therapie\u00ADlimitierung',
    type: 'multi', width: 95,
    options: ['DNR', 'DNI', 'DND'],
    fromLegacy: value => {
      const map = { DNR: 'DNR', DNI: 'DNI', DND: 'DND', I: 'DNI', D: 'DND', R: 'DNR' };
      const parts = value.split('/').map(part => map[part.trim().toUpperCase()]);
      return [...new Set(parts.filter(Boolean))];
    }
  },
  {
    /* Datenquelle Spalte H – Vorschlagsliste, freie Eingabe bleibt möglich.
       Die Beschriftung nennt die zugehörige Intervention aus Spalte I. */
    key: 'telefon', label: 'Telefon', type: 'datalist', inputType: 'tel', width: 62, placeholder: 'Nummer',
    options: [
      { value: '4149', label: 'Angio' },
      { value: '4117', label: 'Broncho' },
      { value: '4719', label: 'CT' },
      { value: '4880', label: 'Endo' },
      { value: '4881', label: 'Endo' },
      { value: '4882', label: 'ggf. OP' },
      { value: '4883', label: 'HKL' },
      { value: '4212', label: 'MRT' }
    ]
  },
  { key: 'pflege', label: 'Pflegekraft', head: 'Pflege\u00ADkraft', type: 'text', width: 72, placeholder: 'Kürzel' },
  {
    /* Datenquelle Spalte G. Der Schlüssel bleibt 'postform', damit vorhandene
       Stände weiter eingelesen werden. */
    key: 'postform', label: 'Kostform', type: 'select', width: 92,
    options: ['VK', '%', 'nüchtern', 'Tee/H2O', 'flüssig', 'Joghurt', 'passiert', 'proteinreich',
              'diabet. Kost', 'laktosefrei', 'vegetarisch', 'vegan', 'leichte Kost', 'Wunschkost',
              'VK o.S.', 'pass o. S.', 'prot. o. S.', 'diab. o. S.', 'lakt. o. S.', 'leicht o. S.',
              'Schluck 1', 'Schluck 2', 'Weiche Kost', 'glutenfrei', 'Pankreas', 'Schonkost']
  },
  /* Datenquelle Spalte P */
  { key: 'privat', label: 'privat', type: 'bool', width: 48 },
  {
    /* Datenquelle Spalte Q */
    key: 'physio', label: 'Physiotherapie', head: 'Physio\u00ADtherapie', type: 'select', width: 82,
    options: ['Mobi', 'AT', 'Mobi+AT', 'passiv', 'Rücksprache', 'keine KG']
  },
  {
    /* Datenquelle Spalte N */
    key: 'devices', label: 'Devices', type: 'select', width: 78,
    options: ['ZVK', 'BDK', 'ZVK/BDK', 'keins']
  },
  { key: 'norton', label: 'Norton / Stammblatt', type: 'checks', width: 86,
    options: ['Norton', 'Stammblatt'] },
  {
    /* Nur das Datum des nächsten Screenings. Ältere Stände hielten das Datum
       im Feld abstricheDatum, es wird beim Einlesen übernommen. */
    key: 'abstriche', label: 'Abstriche', type: 'date', width: 100,
    dateLabel: 'Nächstes Screening', legacy: 'abstricheDatum'
  },
  /* Ohne feste Breite: Diese Spalte nimmt den verbleibenden Platz auf, alle
     anderen behalten dadurch genau die angegebene Breite. */
  { key: 'sonstiges', label: 'Sonstiges', type: 'longtext', placeholder: 'Bemerkungen …' }
];

/* Ein Isolationseintrag ist { v: Bezeichnung, s: 'bestaetigt' | 'verdacht' }.
   Ältere Stände (reine Zeichenketten, ggf. mit dem früheren Kennzeichen für die
   gesamte Zelle) werden beim Einlesen übernommen. */
function toGerm(entry, source) {
  if (entry && typeof entry === 'object' && entry.v) {
    return { v: String(entry.v), s: entry.s === 'verdacht' ? 'verdacht' : 'bestaetigt' };
  }
  if (typeof entry !== 'string' || !entry.trim()) return null;
  const match = entry.match(/^V\.\s?a\.\s*(.+)$/i);
  if (match) return { v: match[1], s: 'verdacht' };
  return { v: entry, s: source && source.isolationVerdacht ? 'verdacht' : 'bestaetigt' };
}

function germLabel(entry) {
  return (entry.s === 'verdacht' ? 'V. a. ' : '') + entry.v;
}

/* Hinterlegter Stil einer Spalte, sonst null */
function styleFor(colKey) {
  const style = settings.styles && settings.styles[colKey];
  return style && (style.fg || style.bg || style.border) ? style : null;
}

/* Überträgt den Stil der Spalte auf ein Auswahlfeld oder eine Marke. */
function paint(node, colKey, hasValue) {
  const style = hasValue === false ? null : styleFor(colKey);
  node.style.color = '';
  node.style.background = '';
  node.style.border = '';
  node.classList.toggle('styled', Boolean(style));
  if (!style) return;
  if (style.fg) node.style.color = style.fg;
  if (style.bg) node.style.background = style.bg;
  if (style.border) node.style.border = '1px ' + style.border + ' ' + (style.fg || 'currentColor');
}

/* Flache Werteliste einer Spalte – berücksichtigt Gruppen und Datalist-Einträge. */
function optionList(col) {
  if (col.groups) return col.groups.flatMap(g => g.options);
  if (!col.options) return [];
  return col.options.map(o => (typeof o === 'string' ? o : o.value));
}

/* Status (Spalte A) → Farbklasse und Belegungslogik */
const STATUS_CLASS = {
  [ARROW_IN]: 'st-aufnahme',
  '\u25cf': 'st-belegt',
  'NVK': 'st-nvk',
  'NVK 1': 'st-nvk',
  'NVK 2': 'st-nvk',
  'NVK 3': 'st-nvk',
  [ARROW_OUT]: 'st-verlegung'
};
/* Belegt ist ein Bettplatz, sobald ein Anwesenheitsstatus oder eine
   Fachdisziplin eingetragen ist – so wirken auch selbst vergebene oder
   umbenannte Werte ohne weitere Anpassung. Ein als gesperrt oder in
   Reinigung gekennzeichneter Platz zählt dagegen nie. */
const BLOCKING_NAMES = new Set(['gesperrt', 'Reinigung']);
const isOccupied = data => !BLOCKING_NAMES.has(data.name) &&
  (data.status !== '' || data.disziplin !== '');

/* Einträge aus Spalte J im Feld Patientenname beschreiben den Bettplatz
   und färben die Zeile entsprechend ein. */
const NAME_CLASS = {
  'Notbett': 'st-belegt',
  'gesperrt': 'st-gesperrt',
  'Reinigung': 'st-gesperrt',
  'NA': 'st-abwesend',
  'OP': 'st-abwesend',
  'CV': 'st-abwesend'
};

/* Zeilenfarben, wie sie in der Hilfe erklärt werden */
const ROW_COLORS = [
  ['st-frei', 'freier Bettplatz – kein Status gesetzt'],
  ['st-aufnahme', ARROW_IN + '  Aufnahme angekündigt'],
  ['st-belegt', '\u25cf oder eigener Status – belegt'],
  ['st-nvk', 'NVK, NVK 1–3'],
  ['st-verlegung', ARROW_OUT + '  Verlegung'],
  ['st-abwesend', 'NA, OP oder CV im Feld Patientenname'],
  ['st-gesperrt', 'gesperrt oder Reinigung im Feld Patientenname']
];

/* Stationsweite Angaben über der Tafel */
const STATION_FIELDS = [
  { key: 'schichtleitung', label: 'Schichtleitung', placeholder: 'Name / Kürzel' },
  { key: 'blut', label: 'Blutzuständigkeit', placeholder: 'Name / Kürzel' },
  { key: 'notfall', label: 'Notfallequipment', placeholder: 'Name / Kürzel' }
];
const STATION_KEYS = ['maxBetten', 'meldestatus', 'aufnahmen', 'infos',
                      ...STATION_FIELDS.flatMap(f => [f.key, f.key + 'Tel'])];

const COL_BY_KEY = Object.fromEntries(COLUMNS.map(c => [c.key, c]));

/* Rufnummernliste unter der Tafel (über die Einstellungen änderbar) */
let PHONES = [
  { value: '4682', label: 'Dienst Anästhesie' },
  { value: '4032', label: 'Dienst Innere' },
  { value: '4286', label: 'Büro ITS' },
  { value: '4004', label: 'ND Springer:in' },
  { value: '4079', label: 'TD Springer:in' },
  { value: '4753', label: 'Bettentransport' },
  { value: '4101', label: 'Hol- und Bringed.' }
];

/* In den Einstellungen bearbeitbare Listen */
const OPTION_CATEGORIES = [
  { key: 'status',       label: 'Anwesenheitsstatus',     kind: 'text' },
  { key: 'disziplin',    label: 'Fachdisziplinen',        kind: 'text' },
  { key: 'beatmung',     label: 'Beatmungsformen',        kind: 'text' },
  { key: 'kreislauf',    label: 'Kreislaufunterstützung', kind: 'text' },
  { key: 'dialyse',      label: 'Dialyse',                kind: 'text' },
  { key: 'isolation',    label: 'Isolation',              kind: 'text' },
  { key: 'intervention', label: 'Interventionen',         kind: 'text' },
  { key: 'limitierung',  label: 'Therapielimitierung',    kind: 'text' },
  { key: 'postform',     label: 'Kostformen',             kind: 'text' },
  { key: 'physio',       label: 'Physiotherapie',         kind: 'text' },
  { key: 'telefon',      label: 'Telefon (Spalte)',       kind: 'phone',
    hint: 'Vorschläge im Feld Telefon der Tabelle' },
  { key: 'phones',       label: 'Telefonliste',           kind: 'phone',
    hint: 'Rufnummern im Infofeld unter der Tafel' }
];

const copy = value => JSON.parse(JSON.stringify(value));

/* Ausgelieferte Spaltenköpfe – Grundlage für das Zurücksetzen */
const DEFAULT_HEADS = Object.fromEntries(COLUMNS.map(col =>
  [col.key, { label: col.label, head: 'head' in col ? col.head : col.label }]));

const DEFAULT_OPTIONS = Object.fromEntries(OPTION_CATEGORIES.map(cat =>
  [cat.key, copy(cat.key === 'phones' ? PHONES : COL_BY_KEY[cat.key].options)]));

/* Rahmenstile, die je Auswahlwert eingestellt werden können */
const BORDER_STYLES = [
  ['', 'ohne Rahmen'],
  ['solid', 'durchgezogen'],
  ['dashed', 'gestrichelt'],
  ['dotted', 'gepunktet'],
  ['double', 'doppelt']
];
const HEX = /^#[0-9a-f]{6}$/i;

/* Feste Farbauswahl – vier neutrale Töne und sechs Farben je hell und kräftig */
const PALETTE = [
  '#ffffff', '#d9dee5', '#6b7683', '#12181f',
  '#f8d7d5', '#c62828', '#fff3c4', '#d99a00',
  '#d9f0da', '#2f7d32', '#d2f0ee', '#00796b',
  '#d6e6f7', '#1e5f9e', '#e9d8f2', '#6a1b9a'
];

/* ------------------------------------------------------------------ *
 * Bildschirmschoner
 * Die Dateien der Diaschau liegen im Unterordner „slides“ neben index.html.
 * Ein Browser kann keinen Ordner auslesen; die Dateinamen kommen deshalb aus
 * der Liste slides/slides.json oder – falls der Webserver eine Verzeichnis-
 * übersicht ausliefert – aus dieser Übersicht. Von Hand eingetragene Namen
 * funktionieren immer, auch wenn die Seite direkt von der Festplatte kommt.
 * ------------------------------------------------------------------ */
const SLIDE_DIR = 'slides/';
const SLIDE_TYPES = /\.(pdf|png|jpe?g)$/i;
const SAVER_MIN = 10;          /* kürzeste Wartezeit bis zum Start, Sekunden */
const SAVER_ITEM_MIN = 2;      /* kürzeste Anzeigedauer je Eintrag, Sekunden */

const DEFAULT_SAVER = {
  on: false,
  seconds: 300,
  defaultSeconds: 10,
  shuffle: false,
  items: []
};

function newSlideId() {
  return 'dia' + Math.random().toString(36).slice(2, 8);
}

function slideItem(props) {
  return { id: newSlideId(), kind: 'datei', file: '', title: '', text: '',
           on: true, seconds: null, ...props };
}

/* Größe der Darstellung in Prozent – muss vor dem ersten Lesen der
   Einstellungen bereitstehen. */
const ZOOM_MIN = 25;
const ZOOM_MAX = 300;
const clampZoom = value => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value) || 100));

const SETTINGS_KEY = 'belegungstafel.einstellungen';

let settings = loadSettings();
BEDS = settings.beds;

function loadSettings() {
  const fresh = {
    version: 3,
    beds: copy(DEFAULT_BEDS),
    headers: {},
    options: copy(DEFAULT_OPTIONS),
    /* Ein Stil je Spalte, nicht je Eintrag */
    styles: Object.fromEntries(OPTION_CATEGORIES.filter(c => c.kind === 'text').map(c => [c.key, {}])),
    privacy: { on: true, seconds: 120 },
    screensaver: copy(DEFAULT_SAVER),
    zoom: 100,
    autoTheme: false
  };
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
          : null
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

const STORAGE_KEY = 'belegungstafel.intensiv.v1';
const THEME_KEY = 'belegungstafel.theme';

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

function touch(bedId) {
  pendingUndo = null;
  state.beds[bedId]._updated = new Date().toISOString();
  save();
}

/* ------------------------------------------------------------------ *
 * Hilfsfunktionen
 * ------------------------------------------------------------------ */
const $ = sel => document.querySelector(sel);
const pad = n => String(n).padStart(2, '0');
const timeStr = d => pad(d.getHours()) + ':' + pad(d.getMinutes());
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};
const isSet = v => Array.isArray(v) ? v.length > 0
  : typeof v === 'boolean' ? v
  : Boolean(v) && !['keins', 'keine KG'].includes(v);

function setSaveState(msg, isError) {
  const node = $('#saveState');
  node.replaceChildren(document.createTextNode(msg));
  node.classList.toggle('error', Boolean(isError));
  if (pendingUndo) {
    const btn = el('button', 'undo', 'Rückgängig');
    btn.type = 'button';
    btn.addEventListener('click', () => pendingUndo && pendingUndo());
    node.appendChild(btn);
  }
}

/* ------------------------------------------------------------------ *
 * Tabellenaufbau
 * ------------------------------------------------------------------ */
function buildHead() {
  const tr = el('tr');
  for (const col of COLUMNS) {
    const th = el('th', 'col-' + col.key, 'head' in col ? col.head : col.label);
    if (PRIVATE_KEYS.includes(col.key)) th.classList.add('privatecol');
    th.title = col.label;
    th.style.width = col.width + 'px';
    th.style.minWidth = col.width + 'px';
    th.scope = 'col';
    tr.appendChild(th);
  }
  const note = el('th', 'col-notizen printcol', 'Notizen');
  note.scope = 'col';
  tr.appendChild(note);
  $('#thead').replaceChildren(tr);
}

/* Klappliste für Freitextfelder mit hinterlegten Vorschlägen.
   Sie liegt am Seitenende, damit sie nicht vom Tabellenrahmen beschnitten wird. */
let comboOpen = null;

function openCombo(input, col) {
  closeCombo();
  const list = el('div', 'combolist');
  const items = [];

  for (const opt of col.options) {
    const value = typeof opt === 'string' ? opt : opt.value;
    const item = el('button', 'comboitem');
    item.type = 'button';
    item.appendChild(el('span', 'combovalue', value));
    if (typeof opt === 'object' && opt.label) item.appendChild(el('span', 'combolabel', opt.label));
    if (value === input.value) item.classList.add('current');
    item.addEventListener('mousedown', event => {
      event.preventDefault();
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      closeCombo();
      input.focus();
    });
    items.push(item);
    list.appendChild(item);
  }
  if (!items.length) list.appendChild(el('p', 'comboempty', 'Keine Einträge hinterlegt'));

  list.addEventListener('keydown', event => {
    const pos = items.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = items[pos + (event.key === 'ArrowDown' ? 1 : -1)];
      (next || items[event.key === 'ArrowDown' ? 0 : items.length - 1]).focus();
    } else if (event.key === 'Escape') {
      closeCombo();
      input.focus();
    }
  });

  document.body.appendChild(list);
  /* Gemessen wird sichtbar auf dem Schirm, gesetzt wird im eigenen Maßstab
     der Liste – deshalb die Umrechnung über den Zoom. */
  const rect = input.getBoundingClientRect();
  const own = list.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom;
  const left = Math.min(rect.left, window.innerWidth - own.width - 8);
  const top = below < own.height && rect.top > own.height
    ? rect.top - own.height - 2
    : rect.bottom + 2;
  list.style.left = Math.round(left / zoomFactor) + 'px';
  list.style.top = Math.round(top / zoomFactor) + 'px';
  list.style.minWidth = Math.round(rect.width / zoomFactor) + 'px';
  comboOpen = { list, input };
}

function closeCombo() {
  if (!comboOpen) return;
  comboOpen.list.remove();
  comboOpen = null;
}

function initCombo() {
  document.addEventListener('mousedown', event => {
    if (!comboOpen) return;
    /* Die Schaltfläche der Zelle schaltet selbst um. */
    if (comboOpen.list.contains(event.target) || event.target.closest('.combocell')) return;
    closeCombo();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeCombo();
  });
  window.addEventListener('resize', closeCombo);
  document.addEventListener('scroll', closeCombo, true);
}

/* Freitextspalten, deren Breite sich nach den Einträgen richtet */
const AUTO_TEXT = [
  { key: 'name',    min: 96, max: 300, extra: 50 },
  { key: 'telefon', min: 78, max: 170, extra: 50 },
  { key: 'pflege',  min: 62, max: 170, extra: 22 }
];

/* Breite der beiden ersten Spalten aus ihrem Inhalt bestimmen: Sie sollen nur
   so breit sein wie der längste Statuswert bzw. die längste Bettbezeichnung. */
const measureCanvas = document.createElement('canvas').getContext('2d');

function widestText(texts, font) {
  measureCanvas.font = font;
  return texts.reduce((max, text) => Math.max(max, measureCanvas.measureText(text).width), 0);
}

function setColumnWidth(th, width) {
  if (!th) return;
  th.style.width = width + 'px';
  th.style.minWidth = width + 'px';
}

function autoSizeColumns() {
  const select = document.querySelector('#tbody td.col-status select');
  const label = document.querySelector('#tbody .bedlabel');
  if (!select || !label) return;

  const statusValues = [...optionList(COL_BY_KEY.status), ' '];
  const status = widestText(statusValues, getComputedStyle(select).font);
  setColumnWidth(document.querySelector('#thead th.col-status'),
    Math.max(46, Math.ceil(status) + 30));

  /* Platz für das Kennzeichen ISO nur, wenn eine Isolation eingetragen ist. */
  const iso = BEDS.some(bed => state.beds[bed.id] && state.beds[bed.id].isolation.length) ? 32 : 0;
  const beds = widestText(BEDS.map(bed => bed.label), getComputedStyle(label).font);
  setColumnWidth(document.querySelector('#thead th.col-bed'),
    Math.max(52, Math.ceil(beds) + 34 + iso));

  for (const field of AUTO_TEXT) autoSizeText(field);
}

/* Zeilenhöhe für den Ausdruck: Die Tabelle soll das Blatt füllen, unabhängig
   davon, wie viele Bettplätze eingerichtet sind. */
function setPrintRowHeight() {
  const platz = 150;
  const hoehe = Math.min(14, Math.max(6.5, platz / Math.max(1, BEDS.length)));
  document.documentElement.style.setProperty('--print-row', hoehe.toFixed(1) + 'mm');
}

/* Die Breitenanpassung wird aufgeschoben, solange die Maustaste gedrückt ist.
   Sonst verschiebt sich die Tabelle beim Klick aus einem Textfeld in eine
   andere Zelle noch zwischen Drücken und Loslassen. */
let sizePending = false;
let pointerDown = false;

function requestAutoSize() {
  if (pointerDown) {
    sizePending = true;
    return;
  }
  autoSizeColumns();
  measureSticky();
}

function initAutoSize() {
  document.addEventListener('mousedown', () => { pointerDown = true; }, true);
  document.addEventListener('mouseup', () => {
    pointerDown = false;
    if (!sizePending) return;
    sizePending = false;
    requestAutoSize();
  }, true);
}

/* Breite eines Freitextfeldes aus den Einträgen der Zeilen.
   Der Zuschlag deckt Zellenabstand und Feldrand ab, bei Feldern mit
   Klappliste zusätzlich deren Schaltfläche und den Ausgleich links. */
function autoSizeText({ key, min, max, extra }) {
  const field = document.querySelector('#tbody td.col-' + key + ' input');
  if (!field) return;
  const values = BEDS.map(bed => (state.beds[bed.id] || {})[key] || '');
  const width = widestText(values, getComputedStyle(field).font);
  setColumnWidth(document.querySelector('#thead th.col-' + key),
    Math.min(max, Math.max(min, Math.ceil(width) + extra)));
}

/* Der Versatz der fixierten Bettplatz-Spalte richtet sich nach der
   tatsächlichen Breite der Statusspalte. */
function measureSticky() {
  const th = document.querySelector('#thead th.col-status');
  if (!th) return;
  /* offsetWidth statt getBoundingClientRect: der Wert bleibt vom Zoom der
     Tabelle unberührt und passt damit zur Angabe in left. */
  document.documentElement.style.setProperty('--sticky-left', th.offsetWidth + 'px');
}

function buildBody() {
  const frag = document.createDocumentFragment();
  for (const bed of BEDS) frag.appendChild(buildRow(bed));
  $('#tbody').replaceChildren(frag);
  autoSizeColumns();
  measureSticky();
}

function buildRow(bed) {
  const data = state.beds[bed.id];
  const tr = el('tr');
  tr.dataset.bed = bed.id;

  for (const col of COLUMNS) {
    const td = el('td', 'col-' + col.key);
    if (PRIVATE_KEYS.includes(col.key)) td.classList.add('privatecol');
    td.dataset.bed = bed.id;
    td.dataset.key = col.key;
    td.appendChild(buildField(bed, col, data));
    tr.appendChild(td);
  }
  tr.appendChild(el('td', 'col-notizen printcol'));
  applyRowState(tr, data);
  return tr;
}

function buildField(bed, col, data) {
  switch (col.type) {

    case 'bed': {
      const box = el('div', 'bedcell');
      box.draggable = true;
      box.title = 'Ziehen, um den Patienten auf einen anderen Bettplatz zu verschieben';
      box.addEventListener('dragstart', event => {
        dragSource = bed.id;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', bed.id);
        box.closest('tr').classList.add('dragging');
      });
      box.addEventListener('dragend', () => {
        dragSource = null;
        document.querySelectorAll('.dragging, .dragover')
          .forEach(node => node.classList.remove('dragging', 'dragover'));
      });
      box.appendChild(el('span', 'bedlabel', bed.label));
      const btn = el('button', 'clearbed', '×');
      btn.type = 'button';
      btn.draggable = false;
      btn.title = 'Bettplatz ' + bed.label + ' räumen (alle Einträge löschen)';
      btn.addEventListener('click', () => clearBed(bed));
      box.appendChild(btn);
      return box;
    }

    case 'status':
    case 'select': {
      const sel = el('select');
      sel.setAttribute('aria-label', col.label + ' – Bett ' + bed.label);
      sel.appendChild(new Option('', ''));
      if (col.groups) {
        for (const group of col.groups) {
          const optgroup = el('optgroup');
          optgroup.label = group.label;
          for (const opt of group.options) optgroup.appendChild(new Option(opt, opt));
          sel.appendChild(optgroup);
        }
      } else {
        for (const opt of col.options) sel.appendChild(new Option(opt, opt));
      }
      if (data[col.key] && !optionList(col).includes(data[col.key])) {
        sel.appendChild(new Option(data[col.key], data[col.key]));
      }
      sel.value = data[col.key];
      paint(sel, col.key, Boolean(sel.value));
      sel.addEventListener('change', () => {
        data[col.key] = sel.value;
        paint(sel, col.key, Boolean(sel.value));
        applyRowState(sel.closest('tr'), data);
        touch(bed.id);
        renderStats();
      });
      return sel;
    }

    case 'text':
    case 'tel':
    case 'datalist': {
      const input = el('input');
      input.type = col.inputType || 'text';
      input.placeholder = col.placeholder || '';
      input.value = data[col.key];
      input.setAttribute('aria-label', col.label + ' – Bett ' + bed.label);
      input.addEventListener('input', () => {
        data[col.key] = input.value;
        if (col.key === 'name') {
          applyRowState(input.closest('tr'), data);
          renderStats();
        }
        touch(bed.id);
      });
      /* Die Namensspalte richtet sich nach dem längsten Eintrag; die Breite
         wird erst beim Verlassen des Feldes angepasst, damit es beim Tippen
         nicht springt. */
      if (AUTO_TEXT.some(field => field.key === col.key)) {
        input.addEventListener('change', requestAutoSize);
        input.addEventListener('blur', requestAutoSize);
      }
      if (col.type !== 'datalist') return input;

      /* Eigene Klappliste: Sie zeigt immer alle hinterlegten Einträge, auch
         wenn im Feld bereits Text steht. */
      const box = el('div', 'combocell');
      const open = el('button', 'combobtn', '▾');
      open.type = 'button';
      open.tabIndex = -1;
      open.title = col.label + ' – Liste öffnen';
      open.setAttribute('aria-label', 'Liste öffnen');
      open.addEventListener('mousedown', event => {
        event.preventDefault();
        if (comboOpen && comboOpen.input === input) closeCombo();
        else openCombo(input, col);
      });
      input.addEventListener('keydown', event => {
        if (event.altKey && event.key === 'ArrowDown') {
          event.preventDefault();
          openCombo(input, col);
        }
      });
      box.appendChild(input);
      box.appendChild(open);
      return box;
    }

    case 'longtext': {
      const ta = el('textarea');
      ta.rows = 1;
      ta.placeholder = col.placeholder || '';
      ta.value = data[col.key];
      ta.setAttribute('aria-label', col.label + ' – Bett ' + bed.label);
      ta.addEventListener('input', () => { data[col.key] = ta.value; touch(bed.id); });
      return ta;
    }

    case 'bool': {
      const label = el('label', 'boolcell');
      const box = el('input');
      box.type = 'checkbox';
      box.checked = data[col.key];
      box.setAttribute('aria-label', col.label + ' – Bett ' + bed.label);
      box.addEventListener('change', () => { data[col.key] = box.checked; touch(bed.id); });
      label.appendChild(box);
      label.appendChild(el('span', null, 'ja'));
      return label;
    }

    case 'checks': {
      const box = el('div', 'checkscell');
      for (const opt of col.options) {
        const label = el('label');
        const cb = el('input');
        cb.type = 'checkbox';
        cb.checked = data[col.key].includes(opt);
        cb.setAttribute('aria-label', col.label + ' ' + opt + ' – Bett ' + bed.label);
        cb.addEventListener('change', () => {
          const list = new Set(data[col.key]);
          cb.checked ? list.add(opt) : list.delete(opt);
          data[col.key] = col.options.filter(o => list.has(o));
          touch(bed.id);
        });
        label.appendChild(cb);
        label.appendChild(el('span', null, opt));
        box.appendChild(label);
      }
      return box;
    }

    case 'multi':
    case 'germs':
    case 'date': {
      const btn = el('button', 'multicell');
      btn.type = 'button';
      btn.setAttribute('aria-label', col.label + ' – Bett ' + bed.label + ' bearbeiten');
      renderChips(btn, col, data);
      btn.addEventListener('click', () => openMulti(bed, col));
      return btn;
    }
  }
  return el('span');
}

function renderChips(btn, col, data) {
  const values = data[col.key];
  btn.replaceChildren();
  if (col.type === 'germs') {
    for (const entry of values) {
      const chip = el('span', 'chip' + (entry.s === 'verdacht' ? ' chip-verdacht' : ''), germLabel(entry));
      chip.title = entry.v + (entry.s === 'verdacht' ? ' – Verdacht' : ' – bestätigt');
      paint(chip, col.key);
      /* Ein Verdacht bleibt am gestrichelten Rahmen erkennbar. */
      if (entry.s === 'verdacht') {
        const style = styleFor(col.key);
        if (style) chip.style.border = '1px dashed ' + (style.fg || 'currentColor');
      }
      btn.appendChild(chip);
    }
  } else if (col.type === 'date') {
    if (!values) return;
    const due = el('span', 'datebadge', shortDate(values));
    due.title = col.dateLabel + ': ' + fullDate(values);
    if (values <= isoToday()) due.classList.add('due');
    btn.appendChild(due);
  } else {
    for (const val of values) {
      const chip = el('span', 'chip', val);
      paint(chip, col.key);
      btn.appendChild(chip);
    }
  }
}

/* Datumshilfen – Speicherung als ISO-Wert (JJJJ-MM-TT) des Datumsfeldes */
function isoToday() {
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
function shortDate(iso) {
  const [y, m, d] = iso.split('-');
  return d + '.' + m + '.';
}
function fullDate(iso) {
  const [y, m, d] = iso.split('-');
  return d + '.' + m + '.' + y;
}
/* Nächster bzw. übernächster Montag, immer in der Zukunft */
function nextMonday(weeks) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  const ahead = (8 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + ahead + (weeks - 1) * 7);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function addDays(iso, days) {
  const base = iso ? new Date(iso + 'T12:00:00') : new Date();
  base.setDate(base.getDate() + days);
  return base.getFullYear() + '-' + pad(base.getMonth() + 1) + '-' + pad(base.getDate());
}

/* Zeilenfarbe, Isolations- und Limitierungskennzeichnung */
function applyRowState(tr, data) {
  for (const cls of [...tr.classList]) if (cls.startsWith('st-')) tr.classList.remove(cls);
  tr.classList.add(NAME_CLASS[data.name] || STATUS_CLASS[data.status] ||
    (isOccupied(data) ? 'st-belegt' : 'st-frei'));
  tr.classList.toggle('name-state', data.name in NAME_CLASS);
  tr.classList.toggle('has-iso', isSet(data.isolation));
  tr.classList.toggle('has-limit', isSet(data.limitierung));
  tr.classList.toggle('has-verdacht',
    data.isolation.length > 0 && data.isolation.every(entry => entry.s === 'verdacht'));
}

function clearBed(bed) {
  const data = state.beds[bed.id];
  const hasContent = COLUMNS.some(c => c.type !== 'bed' && isSet(data[c.key]));
  if (hasContent && !confirm('Bettplatz ' + bed.label + ' vollständig leeren?')) return;
  state.beds[bed.id] = emptyBed();
  const tr = document.querySelector(`tr[data-bed="${bed.id}"]`);
  tr.replaceWith(buildRow(bed));
  save();
  renderStats();
}

/* ------------------------------------------------------------------ *
 * Einstellungen
 * ------------------------------------------------------------------ */
let draft = null;
let activeTab = 'allgemein';

/* Zugang zu den Einstellungen. Der Schutz verhindert versehentliches
   Verstellen auf dem Stationsrechner; er ersetzt keine Zugriffskontrolle,
   da das Passwort im Quelltext der Seite steht. */
const SETTINGS_PASSWORD = 'Vinzenz1';

function askPassword() {
  const dlg = $('#pwDlg');
  $('#pwInput').value = '';
  $('#pwError').hidden = true;
  dlg.showModal();
  $('#pwInput').focus();
}

function openSettings() {
  draft = copy(settings);
  activeTab = 'allgemein';
  renderTabs();
  renderPane();
  $('#settingsDlg').showModal();
}

function renderTabs() {
  const box = $('#settingsTabs');
  box.replaceChildren();
  const tabs = [
    { key: 'allgemein', label: 'Allgemein' },
    { key: 'schoner', label: 'Bildschirmschoner' },
    { key: 'header', label: 'Spaltenköpfe' },
    { key: 'betten', label: 'Bettplätze' },
    ...OPTION_CATEGORIES,
    { key: 'daten', label: 'Daten' }
  ];
  for (const tab of tabs) {
    const btn = el('button', 'tab' + (tab.key === activeTab ? ' active' : ''), tab.label);
    btn.type = 'button';
    btn.addEventListener('click', () => { activeTab = tab.key; renderTabs(); renderPane(); });
    box.appendChild(btn);
  }
  $('#settingsReset').hidden = activeTab === 'allgemein' || activeTab === 'daten';
}

function renderPane() {
  const pane = $('#settingsPane');
  pane.replaceChildren();
  if (activeTab === 'allgemein') return renderGeneralPane(pane);
  if (activeTab === 'schoner') return renderSaverPane(pane);
  if (activeTab === 'daten') return renderDataPane(pane);
  if (activeTab === 'header') return renderHeaderPane(pane);
  if (activeTab === 'betten') return renderBedPane(pane);

  const cat = OPTION_CATEGORIES.find(c => c.key === activeTab);
  pane.appendChild(el('h3', null, cat.label));
  if (cat.hint) pane.appendChild(el('p', 'panehint', cat.hint));

  if (cat.kind === 'text') renderStyleBlock(pane, cat);

  const list = el('div', 'entrylist');
  pane.appendChild(list);
  renderEntries(list, cat);

  const add = el('button', 'addentry', '+ Eintrag hinzufügen');
  add.type = 'button';
  add.addEventListener('click', () => {
    draft.options[cat.key].push(cat.kind === 'phone' ? { value: '', label: '' } : '');
    renderEntries(list, cat);
    const inputs = list.querySelectorAll('input');
    if (inputs.length) inputs[inputs.length - (cat.kind === 'phone' ? 2 : 1)].focus();
  });
  pane.appendChild(add);
}

function renderEntries(list, cat) {
  const entries = draft.options[cat.key];
  list.replaceChildren();

  entries.forEach((entry, index) => {
    const row = el('div', 'entry' + (cat.kind === 'phone' ? ' entry-phone' : ''));

    if (cat.kind === 'phone') {
      row.appendChild(entryInput(entry.value, 'Nummer', 'nr', value => { entry.value = value; }));
      row.appendChild(entryInput(entry.label, 'Bezeichnung', '', value => { entry.label = value; }));
    } else {
      row.appendChild(entryInput(entry, 'Bezeichnung', '', value => { entries[index] = value; }));
    }

    row.appendChild(moveButton('↑', 'nach oben', () => {
      if (index === 0) return;
      [entries[index - 1], entries[index]] = [entries[index], entries[index - 1]];
      renderEntries(list, cat);
    }));
    row.appendChild(moveButton('↓', 'nach unten', () => {
      if (index === entries.length - 1) return;
      [entries[index + 1], entries[index]] = [entries[index], entries[index + 1]];
      renderEntries(list, cat);
    }));
    const remove = moveButton('×', 'entfernen', () => {
      entries.splice(index, 1);
      renderEntries(list, cat);
    });
    remove.classList.add('remove');
    row.appendChild(remove);
    list.appendChild(row);
  });

  if (!entries.length) list.appendChild(el('p', 'panehint', 'Noch keine Einträge.'));
}

/* Darstellung einer ganzen Spalte: Textfarbe, Hintergrundfarbe, Rahmen */
function renderStyleBlock(pane, cat) {
  const block = el('div', 'styleblock');
  const style = draft.styles[cat.key] || (draft.styles[cat.key] = {});

  const redraw = () => {
    const next = el('div', 'styleblock');
    block.replaceWith(next);
    fillStyleBlock(next, cat, redraw);
  };
  fillStyleBlock(block, cat, redraw);
  pane.appendChild(block);
  return block;
}

function fillStyleBlock(block, cat, redraw) {
  const style = draft.styles[cat.key];
  const set = (key, value) => {
    if (value) style[key] = value;
    else delete style[key];
    redraw();
  };

  const head = el('div', 'stylehead');
  head.appendChild(el('span', 'styletitle', 'Darstellung in der Tabelle'));
  const sample = el('span', 'sample', 'Beispiel');
  if (style.fg) sample.style.color = style.fg;
  if (style.bg) sample.style.background = style.bg;
  if (style.border) sample.style.border = '1px ' + style.border + ' ' + (style.fg || 'currentColor');
  head.appendChild(sample);
  block.appendChild(head);

  block.appendChild(paletteRow('Textfarbe', style.fg, value => set('fg', value)));
  block.appendChild(paletteRow('Hintergrund', style.bg, value => set('bg', value)));

  const row = el('div', 'palrow');
  row.appendChild(el('span', 'palname', 'Rahmen'));
  const border = el('select', 'borderpick');
  for (const [value, name] of BORDER_STYLES) border.appendChild(new Option(name, value));
  border.value = style.border || '';
  border.addEventListener('change', () => set('border', border.value));
  row.appendChild(border);
  block.appendChild(row);
}

function paletteRow(label, current, onPick) {
  const row = el('div', 'palrow');
  row.appendChild(el('span', 'palname', label));
  const grid = el('div', 'swatches');

  const none = el('button', 'swatch none' + (current ? '' : ' active'));
  none.type = 'button';
  none.title = 'Standard';
  none.addEventListener('click', () => onPick(''));
  grid.appendChild(none);

  for (const color of PALETTE) {
    const item = el('button', 'swatch' + (current === color ? ' active' : ''));
    item.type = 'button';
    item.title = color;
    item.style.background = color;
    item.addEventListener('click', () => onPick(color));
    grid.appendChild(item);
  }
  row.appendChild(grid);
  return row;
}

function entryInput(value, placeholder, cls, onInput) {
  const input = el('input', cls);
  input.type = 'text';
  input.value = value;
  input.placeholder = placeholder;
  input.addEventListener('input', () => onInput(input.value));
  return input;
}

function moveButton(text, title, onClick) {
  const btn = el('button', 'entrybtn', text);
  btn.type = 'button';
  btn.title = title;
  btn.addEventListener('click', onClick);
  return btn;
}

function checkRow(label, checked, onChange) {
  const row = el('label', 'setrow');
  const box = el('input');
  box.type = 'checkbox';
  box.checked = checked;
  box.addEventListener('change', () => onChange(box.checked));
  row.appendChild(box);
  row.appendChild(el('span', null, label));
  return row;
}

function numberRow(label, value, limits, onInput) {
  const row = el('label', 'setrow');
  row.appendChild(el('span', null, label));
  const field = el('input');
  field.type = 'number';
  field.min = String(limits.min);
  field.max = String(limits.max);
  field.step = String(limits.step || 1);
  field.value = String(value);
  field.addEventListener('input', () => onInput(parseInt(field.value, 10) || 0));
  row.appendChild(field);
  row.appendChild(el('span', 'unit', limits.unit || 'Sekunden'));
  row.field = field;
  return row;
}

function renderGeneralPane(pane) {
  pane.appendChild(el('h3', null, '1. Sichtschutz'));
  pane.appendChild(el('p', 'panehint',
    'Blendet die patientenbezogenen Angaben aus, wenn eine Zeit lang keine Eingabe erfolgt.'));

  const time = numberRow('Zeit ohne Eingabe', draft.privacy.seconds, { min: 5, max: 3600, step: 5 },
    value => { draft.privacy.seconds = value; });
  time.field.disabled = !draft.privacy.on;

  pane.appendChild(checkRow('Sichtschutz aktiv', draft.privacy.on, on => {
    draft.privacy.on = on;
    time.field.disabled = !on;
  }));
  pane.appendChild(time);

  pane.appendChild(el('h3', null, '2. Bildschirmschoner'));
  pane.appendChild(el('p', 'panehint',
    'Startet nach der eingestellten Zeit ohne Eingabe eine Diaschau aus den Inhalten unter ' +
    '„Bildschirmschoner“. Unabhängig davon lässt sich die Schau jederzeit über die ' +
    'Schaltfläche im Seitenkopf starten; jede Eingabe beendet sie wieder.'));

  const saverTime = numberRow('Zeit ohne Eingabe', draft.screensaver.seconds,
    { min: SAVER_MIN, max: 3600, step: 10 }, value => { draft.screensaver.seconds = value; });
  saverTime.field.disabled = !draft.screensaver.on;

  pane.appendChild(checkRow('Bildschirmschoner aktiv', draft.screensaver.on, on => {
    draft.screensaver.on = on;
    saverTime.field.disabled = !on;
  }));
  pane.appendChild(saverTime);

  pane.appendChild(el('h3', null, '3. Tag- und Nachtansicht'));
  pane.appendChild(el('p', 'panehint',
    'Mit dieser Option schaltet die Schaltfläche ◐ im Seitenkopf durch drei Zustände: ' +
    '„Auto“, dunkel und hell. Im Zustand Auto – erkennbar an der Beschriftung neben dem ' +
    'Symbol – stellt sich die Tafel nach der Uhrzeit ein: von ' + NIGHT_FROM + ' bis ' +
    NIGHT_TO + ' Uhr dunkel, tagsüber hell. Ohne diese Option schaltet die Schaltfläche ' +
    'wie bisher nur zwischen hell und dunkel um.'));
  pane.appendChild(checkRow('Automatische Tag-/Nachtansicht', draft.autoTheme, on => {
    draft.autoTheme = on;
  }));

  pane.appendChild(el('h3', null, '4. Größe der Darstellung'));
  pane.appendChild(el('p', 'panehint',
    'Vergrößert oder verkleinert die ganze Tafel – Kopfbereich, Tabelle und die Textfelder ' +
    'darunter – passend zu Monitor und Auflösung. Die Änderung ist sofort im Hintergrund zu ' +
    'sehen und gilt erst mit „Übernehmen“ dauerhaft. Dialoge, Hilfe, Bildschirmschoner und ' +
    'der Ausdruck bleiben unverändert.'));

  const row = el('div', 'setrow zoomrow');
  row.appendChild(el('span', null, 'Zoom'));
  const slider = el('input', 'zoomslider');
  slider.type = 'range';
  slider.min = String(ZOOM_MIN);
  slider.max = String(ZOOM_MAX);
  slider.step = '5';
  slider.value = String(draft.zoom);
  slider.setAttribute('aria-label', 'Größe der Darstellung in Prozent');
  const value = el('span', 'zoomvalue', draft.zoom + ' %');
  slider.addEventListener('input', () => {
    draft.zoom = clampZoom(parseInt(slider.value, 10));
    value.textContent = draft.zoom + ' %';
    applyZoom(draft.zoom);
  });
  row.appendChild(slider);
  row.appendChild(value);

  const back = el('button', 'entrybtn zoomreset', '100 %');
  back.type = 'button';
  back.title = 'auf 100 % zurücksetzen';
  back.addEventListener('click', () => {
    draft.zoom = 100;
    slider.value = '100';
    value.textContent = '100 %';
    applyZoom(100);
  });
  row.appendChild(back);
  pane.appendChild(row);
}

/* Beschriftung der Spaltenköpfe */
function renderHeaderPane(pane) {
  pane.appendChild(el('h3', null, 'Spaltenköpfe'));
  pane.appendChild(el('p', 'panehint',
    'Beschriftung der Tabellenköpfe. Ein leeres Feld lässt den Kopf frei; ' +
    'ein Bindestrich am Zeilenende ist nicht nötig, lange Wörter werden automatisch getrennt.'));

  const list = el('div', 'entrylist');
  for (const col of COLUMNS) {
    const row = el('div', 'entry entry-header');
    row.appendChild(el('span', 'headname', DEFAULT_HEADS[col.key].label));
    const value = draft.headers[col.key] !== undefined
      ? draft.headers[col.key]
      : DEFAULT_HEADS[col.key].head;
    row.appendChild(entryInput(value.replace(/\u00AD/g, ''), DEFAULT_HEADS[col.key].label, '',
      text => { draft.headers[col.key] = text; }));
    list.appendChild(row);
  }
  pane.appendChild(list);
}

/* Inhalte der Diaschau: Dateien aus dem Ordner „slides“ und eigene Hinweise */
function renderSaverPane(pane) {
  pane.appendChild(el('h3', null, 'Bildschirmschoner'));
  pane.appendChild(el('p', 'panehint',
    'Gezeigt werden alle angehakten Einträge nacheinander – in der Reihenfolge dieser Liste ' +
    'oder gemischt, siehe „Reihenfolge zufällig“. ' +
    'Dateien (PDF, PNG, JPEG) gehören in den Ordner „slides“ neben index.html. „Ordner ' +
    'einlesen“ sucht sie über die Datei slides/slides.json oder die Verzeichnisübersicht des ' +
    'Webservers; findet der Browser nichts, lässt sich der Dateiname von Hand eintragen.'));

  pane.appendChild(numberRow('Anzeigedauer je Eintrag', draft.screensaver.defaultSeconds,
    { min: SAVER_ITEM_MIN, max: 600, step: 1 }, value => { draft.screensaver.defaultSeconds = value; }));
  pane.appendChild(el('p', 'panehint',
    'Gilt für alle Einträge ohne eigene Angabe in der Spalte „Dauer“.'));

  pane.appendChild(checkRow('Reihenfolge zufällig', draft.screensaver.shuffle, on => {
    draft.screensaver.shuffle = on;
  }));
  pane.appendChild(el('p', 'panehint',
    'Mischt die Einträge bei jedem Start der Schau und nach jedem vollen Durchlauf neu. ' +
    'Ohne Haken laufen sie in der Reihenfolge dieser Liste.'));

  const status = el('p', 'panehint slidestatus');
  const list = el('div', 'entrylist');

  const bar = el('div', 'slidebar');
  const scan = el('button', 'addentry', 'Ordner einlesen');
  scan.type = 'button';
  scan.addEventListener('click', async () => {
    scan.disabled = true;
    status.textContent = 'Ordner „slides“ wird gelesen …';
    const found = await scanSlideFolder();
    scan.disabled = false;
    const added = mergeFoundSlides(draft.screensaver.items, found);
    markMissingSlides(draft.screensaver.items, found);
    renderSlideEntries(list, status);
    status.textContent = !found.length
      ? 'Im Ordner „slides“ wurde keine Datei gefunden. Entweder liegt dort nichts, oder der ' +
        'Browser darf das Verzeichnis nicht lesen – dann bitte slides/slides.json pflegen oder ' +
        'den Dateinamen von Hand eintragen.'
      : found.length + (found.length === 1 ? ' Datei gefunden' : ' Dateien gefunden') +
        (added ? ', ' + added + ' neu übernommen.' : ', nichts Neues.');
  });
  bar.appendChild(scan);

  const addFile = el('button', 'addentry', '+ Datei von Hand');
  addFile.type = 'button';
  addFile.addEventListener('click', () => {
    draft.screensaver.items.push(slideItem({ kind: 'datei', file: '' }));
    renderSlideEntries(list, status);
    focusLast(list, '.slidefile');
  });
  bar.appendChild(addFile);

  const addText = el('button', 'addentry', '+ Eigener Hinweis');
  addText.type = 'button';
  addText.addEventListener('click', () => {
    draft.screensaver.items.push(slideItem({ kind: 'text' }));
    renderSlideEntries(list, status);
    focusLast(list, '.slidetitle');
  });
  bar.appendChild(addText);

  pane.appendChild(bar);
  pane.appendChild(status);
  pane.appendChild(list);
  renderSlideEntries(list, status);
}

function focusLast(list, selector) {
  const fields = list.querySelectorAll(selector);
  if (fields.length) fields[fields.length - 1].focus();
}

/* Neu gefundene Dateien hinten anfügen; bekannte behalten ihre Einstellungen. */
function mergeFoundSlides(items, found) {
  let added = 0;
  for (const file of found) {
    if (items.some(item => item.kind === 'datei' && item.file.toLowerCase() === file.toLowerCase())) continue;
    items.push(slideItem({ kind: 'datei', file }));
    added++;
  }
  return added;
}

/* Nur kennzeichnen, wenn überhaupt etwas gefunden wurde – sonst wäre jeder
   Eintrag als fehlend markiert, obwohl bloß das Auslesen nicht möglich war. */
function markMissingSlides(items, found) {
  for (const item of items) {
    if (item.kind !== 'datei') continue;
    item.missing = found.length > 0 &&
      !found.some(file => file.toLowerCase() === item.file.toLowerCase());
  }
}

function renderSlideEntries(list, status) {
  const items = draft.screensaver.items;
  list.replaceChildren();

  items.forEach((item, index) => {
    const row = el('div', 'entry entry-slide' + (item.on ? '' : ' off'));

    const box = el('input', 'slideon');
    box.type = 'checkbox';
    box.checked = item.on;
    box.title = 'Eintrag zeigen';
    box.addEventListener('change', () => {
      item.on = box.checked;
      row.classList.toggle('off', !item.on);
    });
    row.appendChild(box);

    const main = el('div', 'slidemain');
    if (item.kind === 'text') {
      row.appendChild(el('span', 'slidekind', 'Hinweis'));
      main.appendChild(entryInput(item.title, 'Überschrift', 'slidetitle',
        value => { item.title = value; }));
      const text = el('textarea', 'slidetext');
      text.rows = 2;
      text.value = item.text;
      text.placeholder = 'Infotext';
      text.addEventListener('input', () => { item.text = text.value; });
      main.appendChild(text);
    } else {
      row.appendChild(el('span', 'slidekind', /\.pdf$/i.test(item.file) ? 'PDF' : 'Bild'));
      main.appendChild(entryInput(item.file, 'dateiname.pdf', 'slidefile', value => {
        item.file = slideName(value);
        item.missing = false;
      }));
      if (item.missing) main.appendChild(el('span', 'slidewarn', 'im Ordner nicht gefunden'));
    }
    row.appendChild(main);

    const secs = el('input', 'slidesec');
    secs.type = 'number';
    secs.min = String(SAVER_ITEM_MIN);
    secs.max = '600';
    secs.value = item.seconds > 0 ? String(item.seconds) : '';
    secs.placeholder = String(draft.screensaver.defaultSeconds);
    secs.title = 'Dauer in Sekunden, leer = Vorgabe';
    secs.addEventListener('input', () => {
      const value = parseInt(secs.value, 10);
      item.seconds = Number.isFinite(value) && value > 0 ? value : null;
    });
    row.appendChild(secs);
    row.appendChild(el('span', 'unit', 's'));

    row.appendChild(moveButton('↑', 'nach oben', () => {
      if (index === 0) return;
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
      renderSlideEntries(list, status);
    }));
    row.appendChild(moveButton('↓', 'nach unten', () => {
      if (index === items.length - 1) return;
      [items[index + 1], items[index]] = [items[index], items[index + 1]];
      renderSlideEntries(list, status);
    }));
    const remove = moveButton('×', 'entfernen', () => {
      items.splice(index, 1);
      renderSlideEntries(list, status);
    });
    remove.classList.add('remove');
    row.appendChild(remove);

    list.appendChild(row);
  });

  if (!items.length) {
    list.appendChild(el('p', 'panehint',
      'Noch keine Inhalte. Ohne Inhalte zeigt der Bildschirmschoner nur Uhrzeit und Datum.'));
  }
}

/* Bettplätze */
function renderBedPane(pane) {
  pane.appendChild(el('h3', null, 'Bettplätze'));
  pane.appendChild(el('p', 'panehint',
    'Bezeichnung, Reihenfolge und Anzahl der Bettplätze. Ein umbenannter Bettplatz behält ' +
    'seine Einträge; ein entfernter Bettplatz wird mit seinen Einträgen gelöscht.'));

  const list = el('div', 'entrylist');
  pane.appendChild(list);
  renderBedEntries(list);

  const add = el('button', 'addentry', '+ Bettplatz hinzufügen');
  add.type = 'button';
  add.addEventListener('click', () => {
    draft.beds.push({ id: newBedId(), label: '' });
    renderBedEntries(list);
    const inputs = list.querySelectorAll('input');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });
  pane.appendChild(add);
}

function renderBedEntries(list) {
  const beds = draft.beds;
  list.replaceChildren();

  beds.forEach((bed, index) => {
    const row = el('div', 'entry');
    row.appendChild(entryInput(bed.label, 'Bezeichnung', '', value => { bed.label = value; }));
    row.appendChild(moveButton('↑', 'nach oben', () => {
      if (index === 0) return;
      [beds[index - 1], beds[index]] = [beds[index], beds[index - 1]];
      renderBedEntries(list);
    }));
    row.appendChild(moveButton('↓', 'nach unten', () => {
      if (index === beds.length - 1) return;
      [beds[index + 1], beds[index]] = [beds[index], beds[index + 1]];
      renderBedEntries(list);
    }));
    const remove = moveButton('×', 'entfernen', () => {
      const data = state.beds[bed.id];
      const belegt = data && COLUMNS.some(c => c.type !== 'bed' && isSet(data[c.key]));
      if (belegt && !confirm('Bettplatz ' + bed.label + ' enthält Einträge. Wirklich entfernen?')) return;
      beds.splice(index, 1);
      renderBedEntries(list);
    });
    remove.classList.add('remove');
    row.appendChild(remove);
    list.appendChild(row);
  });
}

function renderDataPane(pane) {
  pane.appendChild(el('h3', null, 'Daten'));
  pane.appendChild(el('p', 'panehint',
    'Export und Import umfassen die Belegung, die Angaben zur Schicht und die Einstellungen. ' +
    'Die Schaltflächen schließen die Einstellungen; noch nicht übernommene Änderungen an den ' +
    'Listen gehen dabei verloren.'));

  const actions = el('div', 'dataactions');
  const add = (label, hint, onClick, danger) => {
    const row = el('div', 'dataaction');
    const btn = el('button', danger ? 'danger' : '', label);
    btn.type = 'button';
    btn.addEventListener('click', onClick);
    row.appendChild(btn);
    row.appendChild(el('span', 'panehint', hint));
    actions.appendChild(row);
  };

  add('Export …', 'als JSON zum Wiedereinlesen oder als CSV für Excel', () => {
    $('#settingsDlg').close();
    $('#exportDlg').showModal();
  });
  add('Import …', 'eine zuvor exportierte JSON-Datei einlesen', () => {
    $('#settingsDlg').close();
    $('#fileInput').click();
  });
  add('Tafel leeren', 'alle Bettplätze zurücksetzen; Angaben zur Schicht bleiben stehen', () => {
    $('#settingsDlg').close();
    clearAll();
  }, true);

  pane.appendChild(actions);
}

function commitSettings() {
  /* Leere Einträge fallen weg, damit keine leeren Auswahlwerte entstehen. */
  for (const cat of OPTION_CATEGORIES) {
    draft.options[cat.key] = cat.kind === 'phone'
      ? draft.options[cat.key].filter(e => e.value.trim() || e.label.trim())
          .map(e => ({ value: e.value.trim(), label: e.label.trim() }))
      : draft.options[cat.key].map(e => e.trim()).filter(Boolean);
  }
  draft.privacy.seconds = Math.min(3600, Math.max(5, draft.privacy.seconds || 120));
  draft.zoom = clampZoom(draft.zoom);

  /* Bildschirmschoner: Zeiten begrenzen, leere Einträge verwerfen */
  const saver = draft.screensaver;
  saver.seconds = Math.min(3600, Math.max(SAVER_MIN, saver.seconds || DEFAULT_SAVER.seconds));
  saver.defaultSeconds = Math.min(600, Math.max(SAVER_ITEM_MIN,
    saver.defaultSeconds || DEFAULT_SAVER.defaultSeconds));
  saver.items = saver.items
    .map(item => ({ ...item, title: item.title.trim(), text: item.text.trim(),
                    seconds: item.seconds > 0 ? Math.min(600, Math.max(SAVER_ITEM_MIN, item.seconds)) : null }))
    .filter(item => item.kind === 'text' ? (item.title || item.text) : item.file);

  draft.beds = draft.beds.filter(bed => bed.label.trim())
    .map(bed => ({ id: bed.id, label: bed.label.trim() }));
  if (!draft.beds.length) draft.beds = copy(DEFAULT_BEDS);

  /* Frisch eingeschaltet, beginnt die Tafel im Zustand „Auto“. */
  const autoNeu = draft.autoTheme && !settings.autoTheme;

  settings = draft;
  saveSettings();
  if (autoNeu) {
    themeMode = 'auto';
    localStorage.setItem(THEME_KEY, themeMode);
  }
  applySettings();
  syncBeds();
  buildHead();
  buildBody();
  renderPhones();
  renderStats();
  manualLock = false;
  setPrivacy(false);
  restartPrivacyTimer();
  restartSaverTimer();
  $('#settingsDlg').close();
  setSaveState('Einstellungen übernommen');
}

function resetCategory() {
  if (activeTab === 'allgemein' || activeTab === 'daten') return;
  if (activeTab === 'schoner') {
    if (!confirm('Alle Inhalte des Bildschirmschoners entfernen?')) return;
    draft.screensaver.items = [];
    draft.screensaver.defaultSeconds = DEFAULT_SAVER.defaultSeconds;
    draft.screensaver.shuffle = DEFAULT_SAVER.shuffle;
  }
  else if (activeTab === 'header') draft.headers = {};
  else if (activeTab === 'betten') draft.beds = copy(DEFAULT_BEDS);
  else {
    draft.options[activeTab] = copy(DEFAULT_OPTIONS[activeTab]);
    if (draft.styles[activeTab]) draft.styles[activeTab] = {};
  }
  renderPane();
}

function initSettings() {
  $('#btnSettings').addEventListener('click', askPassword);
  $('#pwCancel').addEventListener('click', () => $('#pwDlg').close());
  $('#pwForm').addEventListener('submit', event => {
    if ($('#pwInput').value !== SETTINGS_PASSWORD) {
      event.preventDefault();
      $('#pwError').hidden = false;
      $('#pwInput').select();
      return;
    }
    $('#pwInput').value = '';
    $('#pwDlg').close();
    openSettings();
  });
  $('#settingsSave').addEventListener('click', commitSettings);
  $('#settingsCancel').addEventListener('click', () => $('#settingsDlg').close());
  /* Wird der Dialog ohne „Übernehmen“ geschlossen, gilt wieder die
     gespeicherte Größe – die Vorschau des Schiebereglers verfällt. */
  $('#settingsDlg').addEventListener('close', () => applyZoom(settings.zoom));
  $('#settingsReset').addEventListener('click', resetCategory);
}

/* ------------------------------------------------------------------ *
 * Sichtschutz
 * Nach der eingestellten Zeit ohne Eingabe werden die patientenbezogenen
 * Angaben unkenntlich gemacht. Jede Bewegung oder Taste hebt das wieder auf;
 * ein von Hand eingeschalteter Sichtschutz bleibt bis zu einem Klick oder
 * Tastendruck bestehen.
 * ------------------------------------------------------------------ */
let privacyDelay = 120;
let privacyTimer = null;
let manualLock = false;

function setPrivacy(on) {
  document.body.classList.toggle('privacy', on);
}

function restartPrivacyTimer() {
  clearTimeout(privacyTimer);
  if (privacyDelay > 0) privacyTimer = setTimeout(() => setPrivacy(true), privacyDelay * 1000);
}

function wake(event) {
  /* Läuft der Bildschirmschoner, beendet ihn die erste echte Eingabe. */
  if (saverOn && !stopSaver(event)) return;
  if (manualLock && event && event.type === 'mousemove') return;
  manualLock = false;
  setPrivacy(false);
  restartPrivacyTimer();
  restartSaverTimer();
}

function lockNow() {
  manualLock = true;
  clearTimeout(privacyTimer);
  setPrivacy(true);
}

function initPrivacy() {
  $('#btnLock').addEventListener('click', lockNow);

  for (const type of ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'focusin']) {
    document.addEventListener(type, wake, { passive: true });
  }
  restartPrivacyTimer();
}

/* ------------------------------------------------------------------ *
 * Bildschirmschoner: Diaschau
 * Zeigt nacheinander die freigegebenen Dateien aus dem Ordner „slides“ und
 * die von Hand angelegten Einträge. Der Start erfolgt nach der eingestellten
 * Zeit ohne Eingabe oder von Hand über die Schaltfläche im Seitenkopf; jede
 * Eingabe beendet die Schau wieder.
 * ------------------------------------------------------------------ */
let saverDelay = 0;
let saverTimer = null;
let saverOn = false;
let saverGuard = 0;
let saverPos = null;
let slideTimer = null;
let slideClock = null;
let slideList = [];
let slideIndex = 0;

/* Alle freigegebenen Einträge mit Inhalt, in eingestellter Reihenfolge –
   auf Wunsch gemischt. */
function saverPlaylist() {
  const list = settings.screensaver.items.filter(item => item.on &&
    (item.kind === 'text' ? (item.title.trim() || item.text.trim()) : item.file));
  return settings.screensaver.shuffle ? shuffled(list) : list;
}

/* Mischen nach Fisher und Yates. Beim Neumischen einer laufenden Schau steht
   der zuletzt gezeigte Eintrag nicht gleich wieder am Anfang. */
function shuffled(list, notFirst) {
  const mixed = list.slice();
  for (let i = mixed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
  }
  if (notFirst && mixed.length > 1 && mixed[0] === notFirst) {
    [mixed[0], mixed[mixed.length - 1]] = [mixed[mixed.length - 1], mixed[0]];
  }
  return mixed;
}

function slideSeconds(item) {
  return item && item.seconds > 0 ? item.seconds : settings.screensaver.defaultSeconds;
}

function restartSaverTimer() {
  clearTimeout(saverTimer);
  if (saverOn || saverDelay <= 0) return;
  saverTimer = setTimeout(() => {
    /* Ein offenes Fenster (Einstellungen, Auswahl) bleibt unangetastet. */
    if (document.querySelector('dialog[open]')) restartSaverTimer();
    else startSaver();
  }, saverDelay * 1000);
}

/* Erste Eingabe nach dem Start beendet die Schau. Ein winziges Zucken der
   Maus zählt nicht, sonst ließe sich die Schau von Hand kaum starten. */
function saverWakes(event) {
  if (Date.now() < saverGuard) return false;
  if (event && event.type === 'mousemove') {
    if (!saverPos) {
      saverPos = { x: event.clientX, y: event.clientY };
      return false;
    }
    if (Math.abs(event.clientX - saverPos.x) + Math.abs(event.clientY - saverPos.y) < 30) return false;
  }
  return true;
}

function startSaver() {
  if (saverOn) return;
  slideList = saverPlaylist();
  saverOn = true;
  saverGuard = Date.now() + 800;
  saverPos = null;
  clearTimeout(saverTimer);
  clearTimeout(privacyTimer);
  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  setPrivacy(true);
  $('#saver').hidden = false;
  document.body.classList.add('saver-on');
  showSlide(0);
  tickSlideClock();
  slideClock = setInterval(tickSlideClock, 1000);
}

function stopSaver(event) {
  if (!saverWakes(event)) return false;
  saverOn = false;
  clearTimeout(slideTimer);
  clearInterval(slideClock);
  $('#saverStage').replaceChildren();
  $('#saver').hidden = true;
  document.body.classList.remove('saver-on');
  return true;
}

function showSlide(index) {
  clearTimeout(slideTimer);
  const count = slideList.length;

  /* Nach einem vollen Durchlauf wird neu gemischt, damit sich die Abfolge
     nicht wiederholt. */
  if (settings.screensaver.shuffle && count > 1 && index >= count) {
    slideList = shuffled(slideList, slideList[count - 1]);
    index = 0;
  }

  slideIndex = count ? ((index % count) + count) % count : 0;
  const item = count ? slideList[slideIndex] : null;

  const stage = $('#saverStage');
  stage.replaceChildren(item ? slideNode(item) : emptySlideNode());
  fitSlide();
  $('#saverCount').textContent = count > 1 ? slideIndex + 1 + ' / ' + count : '';

  /* Bei nur einem Eintrag gibt es nichts weiterzuschalten. */
  if (count > 1) slideTimer = setTimeout(() => showSlide(slideIndex + 1), slideSeconds(item) * 1000);
}

function slideNode(item) {
  if (item.kind === 'text') {
    const card = el('div', 'slide slide-text');
    if (item.title.trim()) card.appendChild(el('h2', null, item.title));
    if (item.text.trim()) card.appendChild(el('p', null, item.text));
    return card;
  }

  const src = SLIDE_DIR + encodeURIComponent(item.file);
  if (/\.pdf$/i.test(item.file)) {
    /* „view=Fit“ zeigt die ganze Seite statt sie auf die Breite zu ziehen;
       zusätzlich erhält der Rahmen das Seitenverhältnis der ersten Seite,
       damit die Seite die Fläche ohne Ränder und ohne Blättern ausfüllt. */
    const frame = el('iframe', 'slide slide-pdf');
    frame.src = src + '#page=1&view=Fit&toolbar=0&navpanes=0&scrollbar=0&statusbar=0';
    frame.title = item.file;
    applyPdfRatio(frame, src);
    return frame;
  }

  const img = el('img', 'slide slide-img');
  img.src = src;
  img.alt = item.file;
  img.addEventListener('error', () => img.replaceWith(missingSlideNode(item.file)));
  return img;
}

/* ---- Einpassen der Inhalte: nichts abschneiden, nichts scrollen ---- */

/* Seitenverhältnis der ersten PDF-Seite, je Datei nur einmal gelesen */
const pdfRatios = new Map();

async function applyPdfRatio(frame, src) {
  let ratio = pdfRatios.get(src);
  if (ratio === undefined) {
    ratio = await pdfAspect(src);
    pdfRatios.set(src, ratio);
  }
  if (!ratio) return;
  frame.dataset.ratio = String(ratio);
  /* Hängt der Rahmen noch nicht in der Bühne, passt showSlide() ihn gleich
     selbst ein; ein spät gelesenes Verhältnis wird hier nachgezogen. */
  if (frame.isConnected) fitSlide();
}

/* Liest /MediaBox und /Rotate aus der PDF-Datei. Steckt die Seitenangabe in
   einem komprimierten Objektstrom, bleibt es beim vollflächigen Rahmen. */
async function pdfAspect(src) {
  try {
    const res = await fetch(src, { cache: 'force-cache' });
    if (!res.ok) return 0;
    const text = new TextDecoder('latin1').decode(await res.arrayBuffer());
    const box = text.match(/\/MediaBox\s*\[\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/);
    if (!box) return 0;
    let width = Math.abs(parseFloat(box[3]) - parseFloat(box[1]));
    let height = Math.abs(parseFloat(box[4]) - parseFloat(box[2]));
    const turn = text.match(/\/Rotate\s+(-?\d+)/);
    if (turn && Math.abs(parseInt(turn[1], 10) / 90) % 2 === 1) [width, height] = [height, width];
    return width > 0 && height > 0 ? width / height : 0;
  } catch (err) {
    return 0;
  }
}

/* Passt das aktuelle Dia in die Fläche ein: PDF auf das Seitenverhältnis,
   Textkarten so weit verkleinert, bis der ganze Text sichtbar ist. */
function fitSlide() {
  const stage = $('#saverStage');
  const slide = stage.firstElementChild;
  if (!slide) return;

  const frame = slide.classList.contains('slide-pdf') && slide.dataset.ratio
    ? slide : null;
  if (frame) {
    const ratio = parseFloat(frame.dataset.ratio);
    const height = Math.min(stage.clientWidth / ratio, stage.clientHeight);
    frame.style.height = Math.floor(height) + 'px';
    frame.style.width = Math.floor(height * ratio) + 'px';
    return;
  }

  if (!slide.classList.contains('slide-text')) return;
  slide.style.fontSize = '';
  const start = parseFloat(getComputedStyle(slide).fontSize);
  let size = start;
  /* Die Karte ist auf die Bühnenhöhe begrenzt; ragt der Inhalt darüber
     hinaus, wird schrittweise verkleinert. */
  for (let step = 0; step < 40 && slide.scrollHeight > slide.clientHeight + 1 && size > 11; step++) {
    size *= 0.93;
    slide.style.fontSize = size + 'px';
  }
}

function missingSlideNode(file) {
  const card = el('div', 'slide slide-text slide-missing');
  card.appendChild(el('h2', null, 'Datei nicht gefunden'));
  card.appendChild(el('p', null, SLIDE_DIR + file));
  return card;
}

function emptySlideNode() {
  const card = el('div', 'slide slide-text');
  card.appendChild(el('h2', null, 'Belegungstafel Intensivstation'));
  card.appendChild(el('p', null,
    'Für die Diaschau sind noch keine Inhalte freigegeben. Dateien (PDF, PNG, JPEG) ' +
    'gehören in den Ordner „slides“ neben der Tafel; eigene Hinweise lassen sich in den ' +
    'Einstellungen unter „Bildschirmschoner“ anlegen.'));
  return card;
}

function tickSlideClock() {
  const d = new Date();
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  $('#saverClock').textContent = timeStr(d);
  $('#saverDate').textContent = days[d.getDay()] + ', ' + pad(d.getDate()) + '.' +
    pad(d.getMonth() + 1) + '.' + d.getFullYear();
}

function initSaver() {
  $('#btnSaver').addEventListener('click', startSaver);
  restartSaverTimer();
}

/* ------------------------------------------------------------------ *
 * Dateien im Ordner „slides“ suchen
 * Ein Browser kann kein Verzeichnis auflisten. Gelesen wird deshalb die
 * Liste slides/slides.json und – sofern der Webserver eine Verzeichnis-
 * übersicht ausliefert – zusätzlich diese Übersicht.
 * ------------------------------------------------------------------ */
async function scanSlideFolder() {
  const found = [];
  const add = value => {
    const name = slideName(value);
    if (name && !found.some(f => f.toLowerCase() === name.toLowerCase())) found.push(name);
  };

  try {
    const res = await fetch(SLIDE_DIR + 'slides.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : Array.isArray(data && data.slides) ? data.slides : [];
      for (const entry of list) add(typeof entry === 'string' ? entry : entry && entry.file);
    }
  } catch (err) {
    /* keine Liste vorhanden oder nicht lesbar – kein Fehler */
  }

  try {
    const res = await fetch(SLIDE_DIR, { cache: 'no-store' });
    if (res.ok) {
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      for (const link of doc.querySelectorAll('a[href]')) {
        try {
          add(decodeURIComponent(link.getAttribute('href')));
        } catch (err) {
          add(link.getAttribute('href'));
        }
      }
    }
  } catch (err) {
    /* keine Verzeichnisübersicht – kein Fehler */
  }

  return found;
}

/* ------------------------------------------------------------------ *
 * Navigation mit den Pfeiltasten
 * Hoch/Runter wechselt die Zeile, Links/Rechts die Spalte. In Textfeldern
 * wechseln Links/Rechts erst am Anfang bzw. Ende des Textes die Zelle.
 * Auswahlfelder werden mit der Tastatur über die Anfangsbuchstaben oder mit
 * Alt + Pfeil nach unten geändert, damit die Pfeiltasten zum Navigieren frei
 * bleiben. Die Eingabetaste springt eine Zeile nach unten.
 * ------------------------------------------------------------------ */
const NAV_COLS = COLUMNS.map((col, index) => (col.type === 'bed' ? -1 : index))
  .filter(index => index >= 0);

function visibleRows() {
  return [...$('#tbody').querySelectorAll('tr:not([hidden])')];
}

function focusable(td) {
  return td && td.querySelector('input:not([disabled]), select, textarea, button');
}

/* Darf die Zelle in dieser Richtung verlassen werden? */
function mayLeave(node, key) {
  const isText = node.tagName === 'TEXTAREA' ||
    (node.tagName === 'INPUT' && ['text', 'tel', 'search'].includes(node.type));
  if (!isText) return true;
  const at = node.selectionStart;
  const to = node.selectionEnd;
  if (at === null || at !== to) return at === to;
  if (key === 'ArrowLeft') return at === 0;
  if (key === 'ArrowRight') return at === node.value.length;
  if (key === 'ArrowUp') return node.tagName !== 'TEXTAREA' || at === 0;
  if (key === 'ArrowDown') return node.tagName !== 'TEXTAREA' || at === node.value.length;
  return true;
}

function moveFocus(td, key, shift) {
  const tr = td.parentElement;
  const rows = visibleRows();
  const rowIdx = rows.indexOf(tr);
  const colIdx = [...tr.children].indexOf(td);
  let target = null;

  if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'Enter') {
    const step = key === 'ArrowUp' || (key === 'Enter' && shift) ? -1 : 1;
    const next = rows[rowIdx + step];
    target = next && next.children[colIdx];
  } else {
    const step = key === 'ArrowLeft' ? -1 : 1;
    const pos = NAV_COLS.indexOf(colIdx);
    const nextCol = NAV_COLS[pos + step];
    target = nextCol === undefined ? null : tr.children[nextCol];
  }

  const node = focusable(target);
  if (!node) return false;
  node.focus();
  if (typeof node.select === 'function' && node.tagName === 'INPUT' &&
      ['text', 'tel'].includes(node.type)) {
    node.select();
  }
  return true;
}

function initKeyboardNav() {
  $('#tbody').addEventListener('keydown', event => {
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'];
    if (!keys.includes(event.key) || event.ctrlKey || event.metaKey || event.altKey) return;
    const td = event.target.closest('td');
    if (!td) return;
    if (event.key === 'Enter' &&
        (event.target.tagName === 'BUTTON' || event.target.type === 'checkbox')) return;
    if (event.key !== 'Enter' && !mayLeave(event.target, event.key)) return;
    if (moveFocus(td, event.key, event.shiftKey)) event.preventDefault();
  });
}

/* ------------------------------------------------------------------ *
 * Patienten zwischen Bettplätzen verschieben (Ziehen und Ablegen)
 * ------------------------------------------------------------------ */
let dragSource = null;
let pendingUndo = null;

function bedById(id) {
  return BEDS.find(b => b.id === id);
}

function redrawBed(id) {
  const tr = document.querySelector(`tr[data-bed="${id}"]`);
  tr.replaceWith(buildRow(bedById(id)));
}

/* Tauscht den Inhalt zweier Bettplätze; ein leeres Zielbett entspricht
   damit einem einfachen Verschieben. */
function moveBed(fromId, toId) {
  if (fromId === toId) return;
  const before = {
    fromId, toId,
    from: JSON.parse(JSON.stringify(state.beds[fromId])),
    to: JSON.parse(JSON.stringify(state.beds[toId]))
  };
  const moved = state.beds[fromId];
  state.beds[fromId] = state.beds[toId];
  state.beds[toId] = moved;
  const now = new Date().toISOString();
  state.beds[fromId]._updated = now;
  state.beds[toId]._updated = now;

  redrawBed(fromId);
  redrawBed(toId);
  renderStats();

  const label = before.from.name || 'Bettplatz ' + bedById(fromId).label;
  const target = bedById(toId).label;
  pendingUndo = () => {
    state.beds[before.fromId] = before.from;
    state.beds[before.toId] = before.to;
    redrawBed(before.fromId);
    redrawBed(before.toId);
    pendingUndo = null;
    renderStats();
    save();
    setSaveState('Verschieben rückgängig gemacht');
  };
  save();
  setSaveState(label + ' → Bett ' + target + ' verschoben');
}

function initDragDrop() {
  const tbody = $('#tbody');
  tbody.addEventListener('dragover', event => {
    if (!dragSource) return;
    const tr = event.target.closest('tr');
    if (!tr || tr.dataset.bed === dragSource) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    for (const node of tbody.querySelectorAll('.dragover')) node.classList.remove('dragover');
    tr.classList.add('dragover');
  });
  tbody.addEventListener('dragleave', event => {
    const tr = event.target.closest('tr');
    if (tr && !tr.contains(event.relatedTarget)) tr.classList.remove('dragover');
  });
  tbody.addEventListener('drop', event => {
    const tr = event.target.closest('tr');
    if (!dragSource || !tr) return;
    event.preventDefault();
    const from = dragSource;
    dragSource = null;
    for (const node of tbody.querySelectorAll('.dragover, .dragging')) {
      node.classList.remove('dragover', 'dragging');
    }
    moveBed(from, tr.dataset.bed);
  });
}

/* ------------------------------------------------------------------ *
 * Mehrfachauswahl-Dialog
 * ------------------------------------------------------------------ */
let multiCtx = null;

function openMulti(bed, col) {
  const data = state.beds[bed.id];
  const isDate = col.type === 'date';
  multiCtx = {
    bed, col,
    selected: col.type === 'multi' ? new Set(data[col.key]) : new Set(),
    germs: col.type === 'germs' ? new Map(data[col.key].map(e => [e.v, e.s])) : null
  };
  $('#multiTitle').textContent = col.label;
  $('#multiSub').textContent = 'Bettplatz ' + bed.label + (data.name ? ' · ' + data.name : '') +
    (col.type === 'germs' ? ' — Häkchen = bestätigt, zusätzlich „V. a.“ = Verdacht' : '');
  $('#multiCustom').value = '';

  $('#multiDateRow').hidden = !isDate;
  $('#multiOpts').hidden = isDate;
  $('#multiCustomRow').hidden = isDate;
  $('#multiClear').hidden = isDate;
  if (isDate) {
    $('#multiDateLabel').textContent = col.dateLabel;
    $('#multiDate').value = data[col.key];
  } else {
    renderMultiOpts();
  }
  $('#multiDlg').showModal();
}

function renderMultiOpts() {
  const { col, selected, germs } = multiCtx;
  const known = new Set(col.options);
  const chosen = germs ? [...germs.keys()] : [...selected];
  const extra = chosen.filter(v => !known.has(v));
  const box = $('#multiOpts');
  box.replaceChildren();

  if (germs) {
    box.classList.add('germs');
    for (const opt of [...col.options, ...extra]) {
      const row = el('label', 'opt germ');
      if (!known.has(opt)) row.classList.add('custom');
      const cb = el('input');
      cb.type = 'checkbox';
      cb.checked = germs.has(opt);
      cb.addEventListener('change', () => {
        cb.checked ? germs.set(opt, 'bestaetigt') : germs.delete(opt);
        renderMultiOpts();
      });
      row.appendChild(cb);
      row.appendChild(el('span', 'germname', opt));

      const va = el('label', 'va' + (germs.get(opt) === 'verdacht' ? ' on' : ''));
      va.title = 'Verdacht auf ' + opt;
      const vaBox = el('input');
      vaBox.type = 'checkbox';
      vaBox.checked = germs.get(opt) === 'verdacht';
      vaBox.addEventListener('click', event => event.stopPropagation());
      vaBox.addEventListener('change', () => {
        germs.set(opt, vaBox.checked ? 'verdacht' : 'bestaetigt');
        renderMultiOpts();
      });
      va.appendChild(vaBox);
      va.appendChild(el('span', null, 'V. a.'));
      row.appendChild(va);
      box.appendChild(row);
    }
    return;
  }

  box.classList.remove('germs');
  for (const opt of [...col.options, ...extra]) {
    const label = el('label', 'opt');
    const cb = el('input');
    cb.type = 'checkbox';
    cb.checked = selected.has(opt);
    cb.addEventListener('change', () => {
      cb.checked ? selected.add(opt) : selected.delete(opt);
    });
    label.appendChild(cb);
    label.appendChild(el('span', null, opt));
    if (!known.has(opt)) label.classList.add('custom');
    box.appendChild(label);
  }
}

function addCustom() {
  const input = $('#multiCustom');
  const val = input.value.trim();
  if (!val) return;
  if (multiCtx.germs) multiCtx.germs.set(val, 'bestaetigt');
  else multiCtx.selected.add(val);
  input.value = '';
  renderMultiOpts();
  input.focus();
}

function commitMulti() {
  const { bed, col, selected, germs } = multiCtx;
  const data = state.beds[bed.id];
  if (col.type === 'date') {
    data[col.key] = $('#multiDate').value;
  } else if (germs) {
    const names = [...col.options.filter(o => germs.has(o)),
                   ...[...germs.keys()].filter(v => !col.options.includes(v))];
    data[col.key] = names.map(v => ({ v, s: germs.get(v) }));
  } else {
    const known = col.options.filter(o => selected.has(o));
    const extra = [...selected].filter(v => !col.options.includes(v));
    data[col.key] = [...known, ...extra];
  }
  const btn = document.querySelector(`td[data-bed="${bed.id}"][data-key="${col.key}"] .multicell`);
  renderChips(btn, col, data);
  applyRowState(btn.closest('tr'), data);
  if (col.key === 'isolation') {
    autoSizeColumns();
    measureSticky();
  }
  touch(bed.id);
  renderStats();
  $('#multiDlg').close();
}

/* ------------------------------------------------------------------ *
 * Kennzahlen, Filter, Legende
 * ------------------------------------------------------------------ */
function renderStats() {
  const beds = BEDS.map(b => state.beds[b.id]);
  $('#statBelegt').textContent =
    beds.filter(isOccupied).length + ' / ' + BEDS.length;
  $('#statScreening').textContent =
    beds.filter(b => b.abstriche && b.abstriche <= isoToday()).length;
}

/* Maximale Bettenzahl: x regulär betreibbare Plätze zuzüglich Notbett */
function updateMaxTitle() {
  const value = parseInt(state.station.maxBetten, 10);
  $('#maxCard').title = Number.isFinite(value)
    ? 'Maximal ' + value + ' Bettplätze zuzüglich Notbett, insgesamt ' + (value + 1)
    : 'Maximale Bettenzahl zuzüglich Notbett';
}

/* Meldestatus und die Angaben zur Schicht */
function renderStation() {
  const max = $('#maxBetten');
  max.value = state.station.maxBetten;
  updateMaxTitle();

  const melde = $('#meldestatus');
  melde.value = state.station.meldestatus;
  $('#meldeCard').dataset.melde = state.station.meldestatus;

  const box = $('#stationbar');
  box.replaceChildren();
  for (const field of STATION_FIELDS) {
    const group = el('div', 'stationfield sf-' + field.key);
    group.appendChild(el('span', 'stationlabel', field.label));

    const name = el('input');
    name.type = 'text';
    name.className = 'sf-name';
    name.placeholder = field.placeholder;
    name.value = state.station[field.key];
    name.setAttribute('aria-label', field.label);
    name.addEventListener('input', () => { state.station[field.key] = name.value; save(); });

    const tel = el('input');
    tel.type = 'tel';
    tel.className = 'sf-tel';
    tel.placeholder = 'Telefon';
    tel.value = state.station[field.key + 'Tel'];
    tel.setAttribute('aria-label', field.label + ' – Telefon');
    tel.addEventListener('input', () => { state.station[field.key + 'Tel'] = tel.value; save(); });

    group.appendChild(name);
    group.appendChild(tel);
    box.appendChild(group);
  }

  for (const [selector, key] of NOTE_FIELDS) $(selector).value = state.station[key];
}

function renderPhones() {
  const list = $('#phoneList');
  list.replaceChildren();
  for (const entry of PHONES) {
    const li = el('li');
    li.appendChild(el('span', 'phonenr', entry.value));
    li.appendChild(el('span', 'phonename', entry.label));
    list.appendChild(li);
  }
}

/* ------------------------------------------------------------------ *
 * Hilfe
 * ------------------------------------------------------------------ */
function initHelp() {
  const list = $('#helpColors');
  for (const [cls, text] of ROW_COLORS) {
    const li = el('li');
    li.appendChild(el('span', 'swatch ' + cls));
    li.appendChild(el('span', null, text));
    list.appendChild(li);
  }
  $('#helpVersion').textContent = 'Version ' + VERSION + ' \u00B7 ' + COPYRIGHT;
  $('#btnHelp').addEventListener('click', () => $('#helpDlg').showModal());
  $('#helpClose').addEventListener('click', () => $('#helpDlg').close());
}

/* ------------------------------------------------------------------ *
 * Export / Import
 * ------------------------------------------------------------------ */
function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = el('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stamp() {
  const d = new Date();
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes());
}

function exportJson() {
  const data = { ...state, settings };
  download('belegungstafel-' + stamp() + '.json', JSON.stringify(data, null, 2), 'application/json');
}

function exportCsv() {
  const esc = v => '"' + String(v).replace(/"/g, '""') + '"';
  const info = [
    ['Belegungstafel Intensivstation', fullDate(isoToday()) + ' ' + timeStr(new Date())],
    ['Maximale Bettenzahl', state.station.maxBetten ? state.station.maxBetten + ' + 1 (Notbett)' : ''],
    ['Meldestatus', state.station.meldestatus],
    ...STATION_FIELDS.map(f => [f.label, state.station[f.key], state.station[f.key + 'Tel']]),
    ['Geplante Aufnahmen', state.station.aufnahmen.replace(/\r?\n/g, ' / ')],
    ['Allgemeine Informationen', state.station.infos.replace(/\r?\n/g, ' / ')]
  ].map(row => row.map(esc).join(';'));
  const head = COLUMNS.map(c => esc(c.label)).join(';');
  const lines = BEDS.map(bed => {
    const data = state.beds[bed.id];
    return COLUMNS.map(col => {
      if (col.type === 'bed') return esc(bed.label);
      let val = data[col.key];
      if (col.type === 'germs') val = val.map(germLabel).join('; ');
      else if (col.type === 'date') val = val ? fullDate(val) : '';
      else if (Array.isArray(val)) val = val.join('; ');
      else if (typeof val === 'boolean') val = val ? 'ja' : 'nein';
      return esc(val);
    }).join(';');
  });
  /* BOM, damit Excel die Umlaute korrekt anzeigt */
  download('belegungstafel-' + stamp() + '.csv',
    '﻿' + [...info, '', head, ...lines].join('\r\n'), 'text/csv');
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let parsed;
    try {
      parsed = JSON.parse(String(reader.result));
    } catch (err) {
      alert('Datei konnte nicht gelesen werden: ' + err.message);
      return;
    }
    if (!parsed || !parsed.beds) {
      alert('Die Datei enthält keine Belegungsdaten.');
      return;
    }
    if (!confirm('Import überschreibt die aktuelle Tafel. Fortfahren?')) return;
    for (const bed of BEDS) {
      state.beds[bed.id] = emptyBed();
      merge(state.beds[bed.id], parsed.beds[bed.id]);
    }
    state.station = emptyStation();
    mergeStation(state.station, parsed.station);
    if (parsed.settings) {
      mergeSettings(settings, parsed.settings);
      saveSettings();
      applySettings();
      syncBeds();
      buildHead();
      renderPhones();
      restartPrivacyTimer();
      restartSaverTimer();
    }
    buildBody();
    renderStation();
    renderStats();
    save();
    setSaveState('Daten importiert');
  };
  reader.readAsText(file);
}

function clearAll() {
  if (!confirm('Gesamte Tafel leeren? Alle Einträge aller 13 Bettplätze werden gelöscht.')) return;
  if (!confirm('Wirklich alle Daten löschen? Dieser Schritt kann nicht rückgängig gemacht werden.')) return;
  for (const bed of BEDS) state.beds[bed.id] = emptyBed();
  buildBody();
  renderStats();
  save();
}

/* ------------------------------------------------------------------ *
 * Oberfläche
 * ------------------------------------------------------------------ */
function tickClock() {
  const d = new Date();
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  $('#clock').textContent = days[d.getDay()] + ', ' + pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' +
    d.getFullYear() + ' · ' + timeStr(d) + ':' + pad(d.getSeconds()) + ' Uhr';
  /* Im Zustand „Auto“ wechselt die Darstellung zur eingestellten Stunde. */
  if (themeMode === 'auto') applyTheme();
}

/* Liegt eine Datei logo.png neben index.html, ersetzt sie den Platzhalter.
   Das Bild kann bereits geladen sein, bevor der Listener greift. */
function initLogo() {
  const img = $('#logoImg');
  const zeigen = () => $('#logo').classList.add('has-image');
  if (img.complete && img.naturalWidth > 0) zeigen();
  img.addEventListener('load', zeigen);
}

/* ------------------------------------------------------------------ *
 * Hell, dunkel, automatisch
 * Ohne den automatischen Tag/Nacht-Modus schaltet die Schaltfläche wie
 * bisher zwischen hell und dunkel. Ist er in den Einstellungen aktiviert,
 * kommt der Zustand „Auto“ hinzu: Er richtet sich nach der Uhrzeit und
 * steht als Beschriftung neben dem Symbol.
 * ------------------------------------------------------------------ */
const THEME_MODES = ['auto', 'dark', 'light'];
const NIGHT_FROM = 19;   /* ab 19 Uhr dunkel */
const NIGHT_TO = 7;      /* bis 7 Uhr dunkel */
let themeMode = 'light';

function nightNow() {
  const hour = new Date().getHours();
  return hour >= NIGHT_FROM || hour < NIGHT_TO;
}

function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  themeMode = THEME_MODES.includes(stored) ? stored : (settings.autoTheme ? 'auto' : 'light');
  applyTheme();
}

/* Übernimmt den Zustand in die Darstellung und beschriftet die Schaltfläche. */
function applyTheme() {
  if (!settings.autoTheme && themeMode === 'auto') {
    themeMode = nightNow() ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, themeMode);
  }
  const dark = themeMode === 'auto' ? nightNow() : themeMode === 'dark';
  const next = dark ? 'dark' : 'light';
  if (document.documentElement.dataset.theme !== next) document.documentElement.dataset.theme = next;

  const btn = $('#btnTheme');
  if (!btn) return;
  const label = $('#themeLabel');
  label.textContent = themeMode === 'auto' ? 'Auto' : '';
  btn.classList.toggle('is-auto', themeMode === 'auto');
  btn.title = themeMode === 'auto'
    ? 'Automatisch nach Uhrzeit (' + NIGHT_FROM + ' bis ' + NIGHT_TO + ' Uhr dunkel) – klicken für dunkel'
    : themeMode === 'dark'
      ? 'Dunkel – klicken für hell'
      : 'Hell – klicken für ' + (settings.autoTheme ? 'automatisch' : 'dunkel');
}

function cycleTheme() {
  const order = settings.autoTheme ? THEME_MODES : ['light', 'dark'];
  const at = order.indexOf(themeMode);
  themeMode = order[(at + 1) % order.length];
  localStorage.setItem(THEME_KEY, themeMode);
  applyTheme();
}

function init() {
  initLogo();
  initTheme();
  applySettings();
  buildHead();
  buildBody();
  renderStation();
  renderPhones();
  renderStats();
  initHelp();
  initDragDrop();
  initKeyboardNav();
  initAutoSize();
  setPrintRowHeight();
  initPrivacy();
  initSaver();
  initSettings();
  initCombo();
  tickClock();
  setInterval(tickClock, 1000);

  if (state.saved) setSaveState('Zuletzt gespeichert um ' + timeStr(new Date(state.saved)));

  for (const [selector, key] of NOTE_FIELDS) {
    const field = $(selector);
    field.addEventListener('input', () => { state.station[key] = field.value; save(); });
  }
  $('#maxBetten').addEventListener('input', event => {
    state.station.maxBetten = event.target.value;
    updateMaxTitle();
    save();
  });
  $('#meldestatus').addEventListener('change', event => {
    state.station.meldestatus = event.target.value;
    $('#meldeCard').dataset.melde = event.target.value;
    save();
  });
  $('#btnPrint').addEventListener('click', () => window.print());
  $('#btnTheme').addEventListener('click', cycleTheme);

  $('#expJson').addEventListener('click', () => { exportJson(); $('#exportDlg').close(); });
  $('#expCsv').addEventListener('click', () => { exportCsv(); $('#exportDlg').close(); });
  $('#expCancel').addEventListener('click', () => $('#exportDlg').close());

  $('#fileInput').addEventListener('change', event => {
    const file = event.target.files[0];
    if (file) importJson(file);
    event.target.value = '';
  });

  $('#multiOk').addEventListener('click', commitMulti);
  $('#multiCancel').addEventListener('click', () => $('#multiDlg').close());
  $('#multiClear').addEventListener('click', () => {
    multiCtx.selected.clear();
    if (multiCtx.germs) multiCtx.germs.clear();
    renderMultiOpts();
  });
  $('#multiAdd').addEventListener('click', addCustom);
  $('#multiDateMon').addEventListener('click', () => { $('#multiDate').value = nextMonday(1); });
  $('#multiDateMon2').addEventListener('click', () => { $('#multiDate').value = nextMonday(2); });
  $('#multiDateOff').addEventListener('click', () => { $('#multiDate').value = ''; });
  $('#multiCustom').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); addCustom(); }
  });

  /* Offene Eingaben sichern, bevor die Seite verlassen oder verdeckt wird */
  window.addEventListener('beforeprint', () => {
    wake();
    setPrintRowHeight();
  });
  window.addEventListener('resize', () => {
    measureSticky();
    updateStickyHeader();
    if (saverOn) fitSlide();
  });
  window.addEventListener('beforeunload', writeNow);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') writeNow();
  });

  /* Änderungen in einem zweiten Tab übernehmen */
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY) return;
    state = load();
    buildBody();
    renderStation();
    renderStats();
    setSaveState('Aktualisiert (Änderung in anderem Fenster)');
  });
}

document.addEventListener('DOMContentLoaded', init);
