/* Belegungstafel Intensivstation – Bettplätze, Spalten, Auswahllisten
 *
 * Reines HTML/CSS/JS ohne Abhängigkeiten. Daten liegen ausschließlich lokal
 * im Browser (localStorage) des jeweiligen Arbeitsplatzes. Die Anwendung ist
 * auf mehrere Dateien verteilt, die index.html in fester Reihenfolge lädt und
 * die sich einen gemeinsamen Namensraum teilen:
 *
 *   konfiguration.js  Bettplätze, Spalten, Auswahllisten, Hilfsfunktionen
 *   vorgaben.js       Vorgabe der Station (ersetzt die ausgelieferten Werte)
 *   daten.js          Einstellungen, Speicherung, Verlauf
 *   tabelle.js        Aufbau und Bedienung der Tabelle
 *   einstellungen.js  Einstellungsfenster
 *   schoner.js        Bildschirmschoner und Diaschau
 *   statistik.js      Auswertung je Schicht
 *   tafel.js          Sichtschutz, Ansicht, Sicherung, Start
 *
 * "use strict" gilt nur je Datei und steht deshalb in jeder von ihnen.
 */
'use strict';

/* Fassung der Anwendung. Bei jeder Änderung erhöhen: die erste Stelle bei
   grundlegenden Umbauten, die zweite bei neuen Funktionen, die dritte bei
   Korrekturen und kleinen Anpassungen. */
const VERSION = '2.8.1';

/* Pfeile der ersten Spalte: Aufnahme nach rechts, Verlegung nach links */
const ARROW_IN = '\u27A1\uFE0E';
const ARROW_OUT = '\u2B05\uFE0E';

/* Verstorbene Patienten: Im Feld Patientenname wird ein für sich stehendes
   Pluszeichen zum Kreuz; dahinter steht der Todeszeitpunkt, etwa
   „Mustermann, Max † 14:30“. Die Zelle wird dann dunkel hinterlegt. */
const KREUZ = '†';
const PLUS_ZU_KREUZ = /(^|\s)\+(?=\s|\d|$)/g;

function mitKreuz(text) {
  return String(text).replace(PLUS_ZU_KREUZ, '$1' + KREUZ);
}

function istVerstorben(name) {
  return String(name || '').includes(KREUZ);
}

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

/* Stationsweite Angaben unter der Tafel */
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
  /* Freitextspalte: Die Liste schlägt nur vor, eine Farbe je Spalte gibt es
     hier nicht – deshalb ohne Stilblock. */
  { key: 'name',         label: 'Patientenname',          kind: 'text', stil: false,
    hint: 'Vorschläge im Feld Patientenname. Sie ersetzen die freie Eingabe nicht. ' +
          '„gesperrt“ und „Reinigung“ gelten als nicht belegt, „NA“, „OP“ und „CV“ als ' +
          'vorübergehend abwesend – beide färben die Zeile und wirken nur mit genau dieser ' +
          'Schreibweise.' },
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

/* Kategorien, für die sich Farbe und Rahmen der Spalte einstellen lassen –
   nur Auswahllisten, keine Freitextfelder. */
const hatStil = cat => cat.kind === 'text' && cat.stil !== false;

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
  /* page: anzuzeigende Seite eines PDF, ratio: Seitenverhältnis, sofern bekannt */
  return { id: newSlideId(), kind: 'datei', file: '', title: '', text: '',
           on: true, seconds: null, page: 1, ratio: 0, ...props };
}

/* ------------------------------------------------------------------ *
 * Statistik
 * Erfasst je Schicht eine Momentaufnahme der Kennzahlen. Die Schichten
 * werden durch ihre Anfangszeiten beschrieben und schließen lückenlos
 * aneinander an; die letzte reicht über Mitternacht in die erste.
 * ------------------------------------------------------------------ */
const DEFAULT_STATISTIK = {
  on: true,
  button: true,
  intervall: 15,   /* Minuten zwischen zwei Momentaufnahmen */
  tage: 180,       /* Aufbewahrung */
  schichten: [
    { key: 'frueh', name: 'Frühdienst',  start: '06:00' },
    { key: 'spaet', name: 'Spätdienst',  start: '14:12' },
    { key: 'nacht', name: 'Nachtdienst', start: '20:30' }
  ]
};

/* Nachtspanne der automatischen Tag-/Nachtansicht */
const DEFAULT_NIGHT = { from: '19:00', to: '07:00' };
const CLOCK = /^([01]?\d|2[0-3]):[0-5]\d$/;
const clockMinutes = value => {
  const parts = String(value).split(':');
  return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
};

/* Größe der Darstellung in Prozent – muss vor dem ersten Lesen der
   Einstellungen bereitstehen. */
const ZOOM_MIN = 25;
const ZOOM_MAX = 300;
const clampZoom = value => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value) || 100));

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

/* Ein Feld für die CSV-Ausgabe.
 *
 * Tabellenkalkulationen lesen einen führenden =, +, - oder @ als Formel –
 * die Anführungszeichen der CSV schützen davor nicht, der Parser entfernt
 * sie zuvor. Aus einem Eintrag im Feld Patientenname könnte so beim Öffnen
 * der Datei ein Befehl werden. Ein vorangestelltes Hochkomma macht daraus
 * wieder Text; eine Rufnummer „+4949“ erscheint dadurch als '+4949 und wird
 * als Text übernommen, was hier gewollt ist.
 */
const FORMELSTART = /^[=+\-@\t\r]/;
const csvFeld = value => {
  const text = String(value === null || value === undefined ? '' : value);
  return '"' + (FORMELSTART.test(text) ? "'" + text : text).replace(/"/g, '""') + '"';
};

function setSaveState(msg, isError) {
  const node = $('#saveState');
  node.replaceChildren(document.createTextNode(msg));
  node.classList.toggle('error', Boolean(isError));
  if (!history.length) return;

  const undo = el('button', 'undo', 'Rückgängig');
  undo.type = 'button';
  undo.title = history[history.length - 1].label + ' zurücknehmen (Strg + Z)';
  undo.addEventListener('click', verlaufLetzten);
  node.appendChild(undo);

  const list = el('button', 'undo', 'Verlauf …');
  list.type = 'button';
  list.title = 'die letzten Änderungen ansehen und einzeln zurücknehmen';
  list.addEventListener('click', () => {
    renderVerlauf();
    $('#histDlg').showModal();
  });
  node.appendChild(list);
}
