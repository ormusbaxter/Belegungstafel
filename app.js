/* Belegungstafel Intensivstation
 * Reines HTML/CSS/JS ohne Abhängigkeiten. Daten liegen ausschließlich lokal
 * im Browser (localStorage) des jeweiligen Arbeitsplatzes.
 */
'use strict';

/* ------------------------------------------------------------------ *
 * Bettplätze
 * ------------------------------------------------------------------ */
const BEDS = [
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
    key: 'status', label: 'Anwesenheitsstatus', head: '', type: 'status', width: 62,
    options: ['A >>>', '\u25cf', 'NVK', 'NVK 1', 'NVK 2', 'NVK 3', '<<< V']
  },
  { key: 'bed', label: 'Bettplatz', type: 'bed', width: 78 },
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
    /* Datenquelle Spalte C */
    key: 'beatmung', label: 'Beatmungsform', head: 'Beatmungs\u00ADform', type: 'select', width: 78,
    options: ['INV', 'NIV', 'HFNC', 'NIV/HF', '(INV)', '(NIV)', '(HFNC)', '(NIV/HF)', 'MIRUS']
  },
  {
    /* Datenquelle Spalte D */
    key: 'kreislauf', label: 'Kreislaufunterstützung', head: 'Kreislauf\u00ADunter\u00ADstützung', type: 'select', width: 85,
    options: ['ECMO', 'ECOS', 'ECPELLA', 'ILA', 'IMPELLA', 'pass. SM', 'PiCCO']
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
  { key: 'sonstiges', label: 'Sonstiges', type: 'longtext', width: 122, placeholder: 'Bemerkungen …' }
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

/* Hinterlegter Stil eines Auswahlwertes, sonst null */
function styleFor(colKey, value) {
  const styles = settings.styles && settings.styles[colKey];
  const style = styles && styles[value];
  return style && (style.fg || style.bg || style.border) ? style : null;
}

/* Überträgt den Stil auf ein Auswahlfeld oder eine Marke. */
function paint(node, colKey, value) {
  const style = styleFor(colKey, value);
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
  'A >>>': 'st-aufnahme',
  '\u25cf': 'st-belegt',
  'NVK': 'st-nvk',
  'NVK 1': 'st-nvk',
  'NVK 2': 'st-nvk',
  'NVK 3': 'st-nvk',
  '<<< V': 'st-verlegung'
};
const OCCUPIED = new Set(['\u25cf', 'NVK', 'NVK 1', 'NVK 2', 'NVK 3', '<<< V']);

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
const BLOCKED = new Set(['gesperrt', 'Reinigung']);
const INVASIV = new Set(['INV']);

const LEGEND = [
  ['st-frei', 'Bett frei (kein Status gesetzt)'],
  ['st-aufnahme', 'A >>> – Aufnahme angekündigt'],
  ['st-belegt', '\u25cf / Notbett – belegt'],
  ['st-nvk', 'NVK, NVK 1–3'],
  ['st-verlegung', '<<< V – Verlegung'],
  ['st-abwesend', 'NA / OP / CV im Feld Patientenname'],
  ['st-gesperrt', 'gesperrt / Reinigung im Feld Patientenname'],
  ['lg-iso', 'bestätigter Keim – Kennzeichen ISO am Bettplatz'],
  ['lg-verdacht', 'nur Verdachtsfälle – Kennzeichen ISO? am Bettplatz'],
  ['lg-limit', 'Therapielimitierung hinterlegt']
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

const SETTINGS_KEY = 'belegungstafel.einstellungen';

let settings = loadSettings();

function loadSettings() {
  const fresh = {
    version: 2,
    options: copy(DEFAULT_OPTIONS),
    styles: Object.fromEntries(OPTION_CATEGORIES.filter(c => c.kind === 'text').map(c => [c.key, {}])),
    privacy: { on: true, seconds: 120 }
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
       zusammengesetzten Werten – dort gilt wieder die Voreinstellung. */
    if (cat.key === 'limitierung' && !(source.version >= 2)) continue;
    const list = source.options && source.options[cat.key];
    if (!Array.isArray(list)) continue;
    target.options[cat.key] = cat.kind === 'phone'
      ? list.filter(e => e && (e.value || e.label))
            .map(e => ({ value: String(e.value || ''), label: String(e.label || '') }))
      : list.filter(e => typeof e === 'string' && e.trim()).map(String);
  }
  for (const cat of OPTION_CATEGORIES) {
    if (cat.kind !== 'text') continue;
    const styles = source.styles && source.styles[cat.key];
    if (!styles || typeof styles !== 'object') continue;
    for (const [value, style] of Object.entries(styles)) {
      const clean = {};
      if (HEX.test(style.fg || '')) clean.fg = style.fg;
      if (HEX.test(style.bg || '')) clean.bg = style.bg;
      if (BORDER_STYLES.some(([id]) => id && id === style.border)) clean.border = style.border;
      if (Object.keys(clean).length) target.styles[cat.key][String(value)] = clean;
    }
  }
  if (source.privacy && typeof source.privacy === 'object') {
    target.privacy.on = source.privacy.on !== false;
    const seconds = parseInt(source.privacy.seconds, 10);
    if (Number.isFinite(seconds)) target.privacy.seconds = Math.min(3600, Math.max(5, seconds));
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    setSaveState('Einstellungen konnten nicht gespeichert werden: ' + err.message, true);
  }
}

/* Überträgt die Einstellungen auf Spalten, Rufnummern und Sichtschutz. */
function applySettings() {
  for (const cat of OPTION_CATEGORIES) {
    if (cat.key === 'phones') PHONES = settings.options.phones;
    else COL_BY_KEY[cat.key].options = settings.options[cat.key];
  }
  privacyDelay = settings.privacy.on ? settings.privacy.seconds : 0;
}

const NOTE_FIELDS = [
  ['#noteAufnahmen', 'aufnahmen'],
  ['#noteInfos', 'infos']
];

const STORAGE_KEY = 'belegungstafel.intensiv.v1';
const THEME_KEY = 'belegungstafel.theme';
const LEGEND_KEY = 'belegungstafel.legende';

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
  $('#thead').replaceChildren(tr);
}

/* Vorschlagslisten für Freitextfelder (z. B. Telefonnummern) */
function buildDatalists() {
  for (const old of document.querySelectorAll('body > datalist')) old.remove();
  for (const col of COLUMNS) {
    if (col.type !== 'datalist') continue;
    const dl = el('datalist');
    dl.id = 'dl-' + col.key;
    for (const opt of col.options) {
      const option = el('option');
      option.value = typeof opt === 'string' ? opt : opt.value;
      if (typeof opt === 'object' && opt.label) option.label = opt.label;
      dl.appendChild(option);
    }
    document.body.appendChild(dl);
  }
}

/* Der Versatz der fixierten Bettplatz-Spalte richtet sich nach der
   tatsächlichen Breite der Statusspalte. */
function measureSticky() {
  const th = document.querySelector('#thead th.col-status');
  if (!th) return;
  const width = Math.round(th.getBoundingClientRect().width);
  document.documentElement.style.setProperty('--sticky-left', width + 'px');
}

function buildBody() {
  const frag = document.createDocumentFragment();
  for (const bed of BEDS) frag.appendChild(buildRow(bed));
  $('#tbody').replaceChildren(frag);
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
      paint(sel, col.key, sel.value);
      sel.addEventListener('change', () => {
        data[col.key] = sel.value;
        paint(sel, col.key, sel.value);
        applyRowState(sel.closest('tr'), data);
        touch(bed.id);
        renderStats();
        applyFilter();
      });
      return sel;
    }

    case 'text':
    case 'tel':
    case 'datalist': {
      const input = el('input');
      input.type = col.inputType || 'text';
      if (col.type === 'datalist') input.setAttribute('list', 'dl-' + col.key);
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
      input.addEventListener('change', applyFilter);
      return input;
    }

    case 'longtext': {
      const ta = el('textarea');
      ta.rows = 1;
      ta.placeholder = col.placeholder || '';
      ta.value = data[col.key];
      ta.setAttribute('aria-label', col.label + ' – Bett ' + bed.label);
      ta.addEventListener('input', () => { data[col.key] = ta.value; touch(bed.id); });
      ta.addEventListener('change', applyFilter);
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
      if (entry.s !== 'verdacht') paint(chip, col.key, entry.v);
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
      paint(chip, col.key, val);
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
  tr.classList.add(NAME_CLASS[data.name] || STATUS_CLASS[data.status] || 'st-frei');
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
  applyFilter();
}

/* ------------------------------------------------------------------ *
 * Einstellungen
 * ------------------------------------------------------------------ */
let draft = null;
let activeTab = 'allgemein';

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
  const tabs = [{ key: 'allgemein', label: 'Allgemein' }, ...OPTION_CATEGORIES];
  for (const tab of tabs) {
    const btn = el('button', 'tab' + (tab.key === activeTab ? ' active' : ''), tab.label);
    btn.type = 'button';
    btn.addEventListener('click', () => { activeTab = tab.key; renderTabs(); renderPane(); });
    box.appendChild(btn);
  }
  $('#settingsReset').hidden = activeTab === 'allgemein';
}

function renderPane() {
  const pane = $('#settingsPane');
  pane.replaceChildren();
  if (activeTab === 'allgemein') return renderGeneralPane(pane);

  const cat = OPTION_CATEGORIES.find(c => c.key === activeTab);
  pane.appendChild(el('h3', null, cat.label));
  if (cat.hint) pane.appendChild(el('p', 'panehint', cat.hint));

  if (cat.kind === 'text') {
    pane.appendChild(el('p', 'panehint',
      'Je Eintrag lassen sich Textfarbe, Hintergrundfarbe und Rahmenstil festlegen; ' +
      '⟲ entfernt den Stil wieder.'));
  }

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
    const row = el('div', 'entry' + (cat.kind === 'phone' ? ' entry-phone' : ' entry-styled'));

    if (cat.kind === 'phone') {
      row.appendChild(entryInput(entry.value, 'Nummer', 'nr', value => { entry.value = value; }));
      row.appendChild(entryInput(entry.label, 'Bezeichnung', '', value => { entry.label = value; }));
    } else {
      const styles = draft.styles[cat.key];
      const field = entryInput(entry, 'Bezeichnung', '', value => {
        const before = entries[index];
        entries[index] = value;
        /* Ein umbenannter Eintrag behält seinen Stil. */
        if (styles[before]) {
          styles[value] = styles[before];
          if (value !== before) delete styles[before];
        }
        paintPreview(field, styles[value]);
      });
      paintPreview(field, styles[entry]);
      row.appendChild(field);

      const style = () => (styles[entries[index]] ||= {});
      const update = () => {
        const current = styles[entries[index]];
        if (current && !current.fg && !current.bg && !current.border) delete styles[entries[index]];
        paintPreview(field, styles[entries[index]]);
      };

      row.appendChild(colorPicker(styles[entry] && styles[entry].fg, '#12181f', 'Textfarbe',
        value => { style().fg = value; update(); }));
      row.appendChild(colorPicker(styles[entry] && styles[entry].bg, '#ffffff', 'Hintergrundfarbe',
        value => { style().bg = value; update(); }));

      const border = el('select', 'borderpick');
      border.title = 'Rahmenstil';
      for (const [value, name] of BORDER_STYLES) border.appendChild(new Option(name, value));
      border.value = (styles[entry] && styles[entry].border) || '';
      border.addEventListener('change', () => {
        if (border.value) style().border = border.value;
        else if (styles[entries[index]]) delete styles[entries[index]].border;
        update();
      });
      row.appendChild(border);

      const clear = moveButton('⟲', 'Stil entfernen', () => {
        delete styles[entries[index]];
        renderEntries(list, cat);
      });
      clear.classList.add('clearstyle');
      row.appendChild(clear);
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

/* Zeigt den gewählten Stil direkt im Eingabefeld des Editors. */
function paintPreview(field, style) {
  field.style.color = style && style.fg ? style.fg : '';
  field.style.background = style && style.bg ? style.bg : '';
  field.style.borderStyle = style && style.border ? style.border : '';
  field.style.borderColor = style && style.border ? (style.fg || 'currentColor') : '';
}

function colorPicker(value, fallback, title, onInput) {
  const input = el('input', 'colorpick');
  input.type = 'color';
  input.value = value || fallback;
  input.title = title;
  input.addEventListener('input', () => onInput(input.value));
  return input;
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

function renderGeneralPane(pane) {
  pane.appendChild(el('h3', null, 'Sichtschutz'));
  pane.appendChild(el('p', 'panehint',
    'Blendet die patientenbezogenen Angaben aus, wenn eine Zeit lang keine Eingabe erfolgt.'));

  const row = el('label', 'setrow');
  const box = el('input');
  box.type = 'checkbox';
  box.checked = draft.privacy.on;
  row.appendChild(box);
  row.appendChild(el('span', null, 'Sichtschutz aktiv'));
  pane.appendChild(row);

  const timeRow = el('label', 'setrow');
  timeRow.appendChild(el('span', null, 'Zeit ohne Eingabe'));
  const seconds = el('input');
  seconds.type = 'number';
  seconds.min = '5';
  seconds.max = '3600';
  seconds.step = '5';
  seconds.value = String(draft.privacy.seconds);
  seconds.disabled = !draft.privacy.on;
  seconds.addEventListener('input', () => {
    draft.privacy.seconds = parseInt(seconds.value, 10) || 0;
  });
  timeRow.appendChild(seconds);
  timeRow.appendChild(el('span', 'unit', 'Sekunden'));
  pane.appendChild(timeRow);

  box.addEventListener('change', () => {
    draft.privacy.on = box.checked;
    seconds.disabled = !box.checked;
  });
}

function commitSettings() {
  /* Leere Einträge fallen weg, damit keine leeren Auswahlwerte entstehen. */
  for (const cat of OPTION_CATEGORIES) {
    draft.options[cat.key] = cat.kind === 'phone'
      ? draft.options[cat.key].filter(e => e.value.trim() || e.label.trim())
          .map(e => ({ value: e.value.trim(), label: e.label.trim() }))
      : draft.options[cat.key].map(e => e.trim()).filter(Boolean);
    /* Stile ohne zugehörigen Eintrag verwerfen. */
    if (cat.kind === 'text') {
      const known = new Set(draft.options[cat.key]);
      for (const value of Object.keys(draft.styles[cat.key] || {})) {
        if (!known.has(value)) delete draft.styles[cat.key][value];
      }
    }
  }
  draft.privacy.seconds = Math.min(3600, Math.max(5, draft.privacy.seconds || 120));

  settings = draft;
  saveSettings();
  applySettings();
  buildDatalists();
  buildBody();
  renderPhones();
  renderStats();
  applyFilter();
  manualLock = false;
  setPrivacy(false);
  restartPrivacyTimer();
  $('#settingsDlg').close();
  setSaveState('Einstellungen übernommen');
}

function resetCategory() {
  if (activeTab === 'allgemein') return;
  draft.options[activeTab] = copy(DEFAULT_OPTIONS[activeTab]);
  if (draft.styles[activeTab]) draft.styles[activeTab] = {};
  renderPane();
}

function initSettings() {
  $('#btnSettings').addEventListener('click', openSettings);
  $('#settingsSave').addEventListener('click', commitSettings);
  $('#settingsCancel').addEventListener('click', () => $('#settingsDlg').close());
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
  if (manualLock && event && event.type === 'mousemove') return;
  manualLock = false;
  setPrivacy(false);
  restartPrivacyTimer();
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
  applyFilter();

  const label = before.from.name || 'Bettplatz ' + bedById(fromId).label;
  const target = bedById(toId).label;
  pendingUndo = () => {
    state.beds[before.fromId] = before.from;
    state.beds[before.toId] = before.to;
    redrawBed(before.fromId);
    redrawBed(before.toId);
    pendingUndo = null;
    renderStats();
    applyFilter();
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
  touch(bed.id);
  renderStats();
  applyFilter();
  $('#multiDlg').close();
}

/* ------------------------------------------------------------------ *
 * Kennzahlen, Filter, Legende
 * ------------------------------------------------------------------ */
function renderStats() {
  const beds = BEDS.map(b => state.beds[b.id]);
  $('#statBelegt').textContent =
    beds.filter(b => OCCUPIED.has(b.status)).length + ' / ' + BEDS.length;
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
    const group = el('div', 'stationfield');
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

/* --- 5) Legende ein- und ausklappen --------------------------------------- */
function initLegend() {
  const box = $('#legendBox');
  box.open = localStorage.getItem(LEGEND_KEY) === 'auf';
  box.addEventListener('toggle', () => {
    localStorage.setItem(LEGEND_KEY, box.open ? 'auf' : 'zu');
  });
  /* Für den Ausdruck wird die Legende vorübergehend geöffnet. */
  window.addEventListener('beforeprint', () => {
    box.dataset.vorher = String(box.open);
    box.open = true;
    wake();
  });
  window.addEventListener('afterprint', () => {
    if (box.dataset.vorher !== undefined) box.open = box.dataset.vorher === 'true';
  });
}

function rowText(data) {
  return COLUMNS
    .filter(c => c.type !== 'bed')
    .map(c => {
      if (c.type === 'germs') return data[c.key].map(germLabel).join(' ');
      if (c.type === 'date') return data[c.key] ? fullDate(data[c.key]) : '';
      return Array.isArray(data[c.key]) ? data[c.key].join(' ') : String(data[c.key]);
    })
    .join(' ')
    .toLowerCase();
}

function applyFilter() {
  const term = $('#search').value.trim().toLowerCase();
  const onlyOcc = $('#onlyOccupied').checked;
  let visible = 0;
  for (const bed of BEDS) {
    const data = state.beds[bed.id];
    const tr = document.querySelector(`tr[data-bed="${bed.id}"]`);
    const matches = !term || rowText(data).includes(term) || bed.label.toLowerCase().includes(term);
    const occOk = !onlyOcc || OCCUPIED.has(data.status);
    const show = matches && occOk;
    tr.hidden = !show;
    if (show) visible++;
  }
  $('#tablewrap').classList.toggle('empty', visible === 0);
}

function renderLegend() {
  const ul = $('#legend');
  ul.replaceChildren();
  for (const [cls, text] of LEGEND) {
    const li = el('li');
    li.appendChild(el('span', 'swatch ' + cls));
    li.appendChild(el('span', null, text));
    ul.appendChild(li);
  }
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
      buildDatalists();
      renderPhones();
      restartPrivacyTimer();
    }
    buildBody();
    renderStation();
    renderStats();
    applyFilter();
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
  applyFilter();
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
}

/* Liegt eine Datei logo.png neben index.html, ersetzt sie den Platzhalter. */
function initLogo() {
  const img = $('#logoImg');
  img.addEventListener('load', () => $('#logo').classList.add('has-image'));
}

function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored) document.documentElement.dataset.theme = stored;
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
}

function init() {
  initLogo();
  initTheme();
  applySettings();
  buildHead();
  buildDatalists();
  buildBody();
  renderStation();
  renderPhones();
  renderStats();
  renderLegend();
  initLegend();
  applyFilter();
  initDragDrop();
  initKeyboardNav();
  initPrivacy();
  initSettings();
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
  $('#search').addEventListener('input', applyFilter);
  $('#onlyOccupied').addEventListener('change', applyFilter);
  $('#btnPrint').addEventListener('click', () => window.print());
  $('#btnTheme').addEventListener('click', toggleTheme);
  $('#btnClearAll').addEventListener('click', clearAll);

  $('#btnExport').addEventListener('click', () => $('#exportDlg').showModal());
  $('#expJson').addEventListener('click', () => { exportJson(); $('#exportDlg').close(); });
  $('#expCsv').addEventListener('click', () => { exportCsv(); $('#exportDlg').close(); });
  $('#expCancel').addEventListener('click', () => $('#exportDlg').close());

  $('#btnImport').addEventListener('click', () => $('#fileInput').click());
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
  window.addEventListener('resize', measureSticky);
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
    applyFilter();
    setSaveState('Aktualisiert (Änderung in anderem Fenster)');
  });
}

document.addEventListener('DOMContentLoaded', init);
