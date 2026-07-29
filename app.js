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
 * Feldtypen: status | bed | text | tel | select | multi | checks | bool | longtext
 * Sämtliche Auswahllisten sind hier zentral hinterlegt und können ohne
 * weitere Codeänderung an die Gepflogenheiten der Station angepasst werden.
 * ------------------------------------------------------------------ */
const COLUMNS = [
  {
    /* Datenquelle Spalte A (Belegung) und J (Bettplatz / Aufenthaltsort) */
    key: 'status', label: 'Anwesenheitsstatus', head: 'Anwesenheits\u00ADstatus', type: 'status', width: 105,
    groups: [
      { label: 'Belegung', options: ['A >>>', '\u25cf', 'NVK', 'NVK 1', 'NVK 2', 'NVK 3', '<<< V'] },
      { label: 'Bettplatz / Aufenthaltsort', options: ['Notbett', 'gesperrt', 'Reinigung', 'NA', 'OP', 'CV'] }
    ]
  },
  { key: 'bed', label: 'Bettplatz', type: 'bed', width: 78 },
  { key: 'name', label: 'Patientenname', head: 'Patienten\u00ADname', type: 'text', width: 155, placeholder: 'Name, Vorname' },
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
    /* Datenquelle Spalte O */
    key: 'isolation', label: 'Isolation', type: 'select', width: 110,
    options: ['3MRGN', '4MRGN', 'C. diff.', 'CoViD', 'div. MRE', 'Herpes Zoster', 'Influenza A',
              'Influenza A+B', 'Influenza B', 'Kittelpflege', 'Kontakt CoViD', 'Kontakt Influenza',
              'MRSA', 'Noro', 'Rota', 'RSV', 'sonstiges', 'TBC', 'Umkehriso', 'unkl. Durchfälle',
              'V. a. CoViD', 'V.a. C. diff.', 'V.a. Noro', 'V.a. Rota', 'VRE']
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
    key: 'telefon', label: 'Telefon', type: 'datalist', width: 62, placeholder: 'Nummer',
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
    /* Datenquelle Spalte G (Kostform) */
    key: 'postform', label: 'Postform', type: 'select', width: 92,
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
  { key: 'norton', label: 'Norton / Stammblatt', type: 'checks', width: 92,
    options: ['Norton', 'Stammblatt'] },
  {
    /* Keine Vorgabe in der Datenquelle – Liste bei Bedarf hier anpassen. */
    key: 'abstriche', label: 'Abstriche', type: 'multi', width: 112,
    options: ['MRSA-Screening', 'Nasen-/Rachenabstrich', 'Rektalabstrich', 'Wundabstrich',
              'Trachealsekret', 'Leistenabstrich', 'Blutkulturen', 'Urinkultur',
              'ausstehend', 'negativ', 'positiv']
  },
  { key: 'sonstiges', label: 'Sonstiges', type: 'longtext', width: 130, placeholder: 'Bemerkungen …' }
];

/* Flache Werteliste einer Spalte – berücksichtigt Gruppen und Datalist-Einträge. */
function optionList(col) {
  if (col.groups) return col.groups.flatMap(g => g.options);
  if (!col.options) return [];
  return col.options.map(o => (typeof o === 'string' ? o : o.value));
}

/* Status → Farbklasse und Belegungslogik */
const STATUS_CLASS = {
  'A >>>': 'st-aufnahme',
  '\u25cf': 'st-belegt',
  'NVK': 'st-nvk',
  'NVK 1': 'st-nvk',
  'NVK 2': 'st-nvk',
  'NVK 3': 'st-nvk',
  '<<< V': 'st-verlegung',
  'Notbett': 'st-belegt',
  'gesperrt': 'st-gesperrt',
  'Reinigung': 'st-gesperrt',
  'NA': 'st-abwesend',
  'OP': 'st-abwesend',
  'CV': 'st-abwesend'
};
const OCCUPIED = new Set(['\u25cf', 'NVK', 'NVK 1', 'NVK 2', 'NVK 3', '<<< V',
                          'Notbett', 'NA', 'OP', 'CV']);
const BLOCKED = new Set(['gesperrt', 'Reinigung']);
const INVASIV = new Set(['INV']);

const LEGEND = [
  ['st-frei', 'Bett frei (kein Status gesetzt)'],
  ['st-aufnahme', 'A >>> – Aufnahme angekündigt'],
  ['st-belegt', '\u25cf / Notbett – belegt'],
  ['st-nvk', 'NVK, NVK 1–3'],
  ['st-abwesend', 'NA / OP / CV – Patient außerhalb der Station'],
  ['st-verlegung', '<<< V – Verlegung'],
  ['st-gesperrt', 'gesperrt / Reinigung'],
  ['lg-iso', 'Isolation eingetragen – ISO-Kennzeichnung am Bettplatz'],
  ['lg-limit', 'Therapielimitierung hinterlegt']
];

const STORAGE_KEY = 'belegungstafel.intensiv.v1';
const THEME_KEY = 'belegungstafel.theme';

/* ------------------------------------------------------------------ *
 * Zustand
 * ------------------------------------------------------------------ */
const COL_BY_KEY = Object.fromEntries(COLUMNS.map(c => [c.key, c]));

function emptyBed() {
  const row = {};
  for (const col of COLUMNS) {
    if (col.type === 'bed') continue;
    if (col.type === 'multi' || col.type === 'checks') row[col.key] = [];
    else if (col.type === 'bool') row[col.key] = false;
    else row[col.key] = '';
  }
  row._updated = null;
  return row;
}

let state = load();

function load() {
  const fresh = { version: 1, beds: {}, saved: null };
  for (const bed of BEDS) fresh.beds[bed.id] = emptyBed();
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch (err) {
    console.warn('Gespeicherte Daten unlesbar, starte leer.', err);
  }
  if (stored && stored.beds) {
    for (const bed of BEDS) merge(fresh.beds[bed.id], stored.beds[bed.id]);
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
    const val = source[col.key];
    if (val === undefined || val === null) continue;
    if (col.type === 'multi' || col.type === 'checks') {
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
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    state.saved = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setSaveState('Gespeichert um ' + timeStr(new Date()));
    } catch (err) {
      setSaveState('Speichern fehlgeschlagen: ' + err.message, true);
    }
  }, 250);
}

function touch(bedId) {
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
  node.textContent = msg;
  node.classList.toggle('error', Boolean(isError));
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
      box.appendChild(el('span', 'bedlabel', bed.label));
      box.appendChild(el('span', 'bedtime', data._updated ? timeStr(new Date(data._updated)) : ''));
      const btn = el('button', 'clearbed', '×');
      btn.type = 'button';
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
      input.type = col.type === 'text' ? 'text' : 'tel';
      if (col.type === 'datalist') input.setAttribute('list', 'dl-' + col.key);
      input.placeholder = col.placeholder || '';
      input.value = data[col.key];
      input.setAttribute('aria-label', col.label + ' – Bett ' + bed.label);
      input.addEventListener('input', () => { data[col.key] = input.value; touch(bed.id); });
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

    case 'multi': {
      const btn = el('button', 'multicell');
      btn.type = 'button';
      btn.setAttribute('aria-label', col.label + ' – Bett ' + bed.label + ' bearbeiten');
      renderChips(btn, data[col.key]);
      btn.addEventListener('click', () => openMulti(bed, col));
      return btn;
    }
  }
  return el('span');
}

function renderChips(btn, values) {
  btn.replaceChildren();
  if (!values.length) {
    btn.appendChild(el('span', 'chipempty', ''));
    return;
  }
  for (const val of values) btn.appendChild(el('span', 'chip', val));
}

/* Zeilenfarbe, Isolations- und Limitierungskennzeichnung */
function applyRowState(tr, data) {
  for (const cls of [...tr.classList]) if (cls.startsWith('st-')) tr.classList.remove(cls);
  tr.classList.add(STATUS_CLASS[data.status] || 'st-frei');
  tr.classList.toggle('has-iso', isSet(data.isolation));
  tr.classList.toggle('has-limit', isSet(data.limitierung));
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
 * Mehrfachauswahl-Dialog
 * ------------------------------------------------------------------ */
let multiCtx = null;

function openMulti(bed, col) {
  const data = state.beds[bed.id];
  multiCtx = { bed, col, selected: new Set(data[col.key]) };
  $('#multiTitle').textContent = col.label;
  $('#multiSub').textContent = 'Bettplatz ' + bed.label + (data.name ? ' · ' + data.name : '');
  $('#multiCustom').value = '';
  renderMultiOpts();
  $('#multiDlg').showModal();
}

function renderMultiOpts() {
  const { col, selected } = multiCtx;
  const known = new Set(col.options);
  const extra = [...selected].filter(v => !known.has(v));
  const box = $('#multiOpts');
  box.replaceChildren();

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
  multiCtx.selected.add(val);
  input.value = '';
  renderMultiOpts();
  input.focus();
}

function commitMulti() {
  const { bed, col, selected } = multiCtx;
  const known = col.options.filter(o => selected.has(o));
  const extra = [...selected].filter(v => !col.options.includes(v));
  state.beds[bed.id][col.key] = [...known, ...extra];
  const btn = document.querySelector(`td[data-bed="${bed.id}"][data-key="${col.key}"] .multicell`);
  renderChips(btn, state.beds[bed.id][col.key]);
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
  const items = [
    ['Belegt', beds.filter(b => OCCUPIED.has(b.status)).length + ' / ' + BEDS.length],
    ['Frei', beds.filter(b => b.status === '').length],
    ['Gesperrt', beds.filter(b => BLOCKED.has(b.status)).length],
    ['NVK', beds.filter(b => b.status.startsWith('NVK')).length],
    ['INV', beds.filter(b => INVASIV.has(b.beatmung)).length],
    ['Kreislauf', beds.filter(b => isSet(b.kreislauf)).length],
    ['Dialyse', beds.filter(b => isSet(b.dialyse)).length],
    ['Isolation', beds.filter(b => isSet(b.isolation)).length]
  ];
  const box = $('#stats');
  box.replaceChildren();
  for (const [label, value] of items) {
    const card = el('div', 'stat');
    card.appendChild(el('span', 'statval', String(value)));
    card.appendChild(el('span', 'statlabel', label));
    box.appendChild(card);
  }
}

function rowText(data) {
  return COLUMNS
    .filter(c => c.type !== 'bed')
    .map(c => Array.isArray(data[c.key]) ? data[c.key].join(' ') : String(data[c.key]))
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
  const head = COLUMNS.map(c => esc(c.label)).join(';');
  const lines = BEDS.map(bed => {
    const data = state.beds[bed.id];
    return COLUMNS.map(col => {
      if (col.type === 'bed') return esc(bed.label);
      const val = data[col.key];
      if (Array.isArray(val)) return esc(val.join('; '));
      if (typeof val === 'boolean') return esc(val ? 'ja' : 'nein');
      return esc(val);
    }).join(';');
  });
  /* BOM, damit Excel die Umlaute korrekt anzeigt */
  download('belegungstafel-' + stamp() + '.csv', '﻿' + [head, ...lines].join('\r\n'), 'text/csv');
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
    buildBody();
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
  renderStats();
  renderLegend();
  applyFilter();
  tickClock();
  setInterval(tickClock, 1000);

  if (state.saved) setSaveState('Zuletzt gespeichert um ' + timeStr(new Date(state.saved)));

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
  $('#multiClear').addEventListener('click', () => { multiCtx.selected.clear(); renderMultiOpts(); });
  $('#multiAdd').addEventListener('click', addCustom);
  $('#multiCustom').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); addCustom(); }
  });

  /* Änderungen in einem zweiten Tab übernehmen */
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY) return;
    state = load();
    buildBody();
    renderStats();
    applyFilter();
    setSaveState('Aktualisiert (Änderung in anderem Fenster)');
  });
}

document.addEventListener('DOMContentLoaded', init);
