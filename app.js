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
    key: 'status', label: 'Anwesenheitsstatus', head: 'Anwesenheits\u00ADstatus', type: 'status', width: 105,
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
    /* Datenquelle Spalte M */
    key: 'limitierung', label: 'Therapielimitierung', head: 'Therapie\u00ADlimitierung', type: 'select', width: 82,
    options: ['DNR', 'DNI', 'DND', 'DNR/DNI', 'DNR/DND', 'DNR/I/D']
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
  { key: 'sonstiges', label: 'Sonstiges', type: 'longtext', width: 135, placeholder: 'Bemerkungen …' }
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

/* Feste Rufnummernliste unter der Tafel */
const PHONES = [
  ['4682', 'Dienst Anästhesie'],
  ['4032', 'Dienst Innere'],
  ['4286', 'Büro ITS'],
  ['4004', 'ND Springer:in'],
  ['4079', 'TD Springer:in'],
  ['4753', 'Bettentransport'],
  ['4101', 'Hol- und Bringed.']
];

const NOTE_FIELDS = [
  ['#noteAufnahmen', 'aufnahmen'],
  ['#noteInfos', 'infos']
];

const STORAGE_KEY = 'belegungstafel.intensiv.v1';
const THEME_KEY = 'belegungstafel.theme';
const LEGEND_KEY = 'belegungstafel.legende';

/* ------------------------------------------------------------------ *
 * Zustand
 * ------------------------------------------------------------------ */
const COL_BY_KEY = Object.fromEntries(COLUMNS.map(c => [c.key, c]));

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
      target[col.key] = Array.isArray(val) ? val.map(String) : [];
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
  const cell = document.querySelector(`td[data-bed="${bedId}"][data-key="bed"] .bedtime`);
  if (cell) cell.textContent = timeStr(new Date());
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
    const th = el('th', 'col-' + col.key, col.head || col.label);
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

function buildBody() {
  const frag = document.createDocumentFragment();
  for (const bed of BEDS) frag.appendChild(buildRow(bed));
  $('#tbody').replaceChildren(frag);
}

function buildRow(bed) {
  const data = state.beds[bed.id];
  const tr = el('tr');
  tr.dataset.bed = bed.id;

  for (const col of COLUMNS) {
    const td = el('td', 'col-' + col.key);
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
      box.appendChild(el('span', 'bedtime', data._updated ? timeStr(new Date(data._updated)) : ''));
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
      sel.value = data[col.key];
      sel.addEventListener('change', () => {
        data[col.key] = sel.value;
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
      btn.appendChild(chip);
    }
  } else if (col.type === 'date') {
    if (!values) return;
    const due = el('span', 'datebadge', shortDate(values));
    due.title = col.dateLabel + ': ' + fullDate(values);
    if (values <= isoToday()) due.classList.add('due');
    btn.appendChild(due);
  } else {
    for (const val of values) btn.appendChild(el('span', 'chip', val));
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
  for (const [number, name] of PHONES) {
    const li = el('li');
    li.appendChild(el('span', 'phonenr', number));
    li.appendChild(el('span', 'phonename', name));
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
  download('belegungstafel-' + stamp() + '.json', JSON.stringify(state, null, 2), 'application/json');
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
  initTheme();
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
