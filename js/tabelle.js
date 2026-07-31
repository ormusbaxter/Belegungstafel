/* Belegungstafel Intensivstation – Aufbau und Bedienung der Tabelle
 *
 * Teil der Anwendung; die Dateien werden in der in index.html angegebenen
 * Reihenfolge geladen und teilen sich einen gemeinsamen Namensraum.
 */
'use strict';

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

/* Das Blatt für die Physiotherapie führt nur belegte Bettplätze. Je weniger
   Zeilen, desto größer dürfen Zeilenhöhe und Schrift ausfallen; alle Maße des
   Blattes leiten sich von diesem einen Wert ab. */
function setPhysioRowHeight() {
  const belegte = BEDS.filter(bed => isOccupied(state.beds[bed.id]));
  const zeilen = belegte.length;
  /* A4 quer bietet 196 mm Höhe; davon gehen Kopfzeile und Tabellenkopf ab.
     Der Rest verteilt sich auf die Zeilen, begrenzt nach oben und unten. */
  const platz = 150;
  const hoehe = Math.min(30, Math.max(9, platz / Math.max(2, zeilen + 1)));
  document.documentElement.style.setProperty('--physio-row', hoehe.toFixed(1) + 'mm');

  /* Die Namensspalte nimmt 28 % der 283 mm Satzbreite ein. Namen sind
     unterschiedlich lang; jede Zeile bekommt deshalb ihr eigenes Maß – ein
     abgeschnittener Name wäre für die Runde wertlos, und kurze Namen sollen
     trotzdem so groß wie möglich stehen. */
  const spalte = 283 * 0.28 - 5;
  const schrift = '700 10px "Segoe UI", Roboto, system-ui, sans-serif';
  const gross = hoehe * 0.44;
  document.documentElement.style.setProperty('--physio-name', gross.toFixed(2) + 'mm');
  for (const bed of BEDS) {
    const tr = document.querySelector(`tr[data-bed="${bed.id}"]`);
    if (!tr) continue;
    const breit = widestText([state.beds[bed.id].name], schrift) / 10;
    const passend = breit > 0 ? Math.min(gross, spalte / breit) : gross;
    tr.style.setProperty('--physio-name', Math.max(3, passend).toFixed(2) + 'mm');
  }
  return zeilen;
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
        touch(bed.id, feldWas(bed, col));
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
        if (col.key === 'name') {
          /* Ein für sich stehendes Plus wird sofort zum Kreuz. Beide Zeichen
             sind gleich lang, die Schreibmarke bleibt deshalb stehen. */
          const ersetzt = mitKreuz(input.value);
          if (ersetzt !== input.value) {
            const stelle = input.selectionStart;
            input.value = ersetzt;
            input.setSelectionRange(stelle, stelle);
          }
        }
        data[col.key] = input.value;
        if (col.key === 'name') {
          applyRowState(input.closest('tr'), data);
          renderStats();
        }
        touch(bed.id, feldWas(bed, col));
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
      ta.addEventListener('input', () => {
        data[col.key] = ta.value;
        touch(bed.id, feldWas(bed, col));
      });
      return ta;
    }

    case 'bool': {
      const label = el('label', 'boolcell');
      const box = el('input');
      box.type = 'checkbox';
      box.checked = data[col.key];
      box.setAttribute('aria-label', col.label + ' – Bett ' + bed.label);
      box.addEventListener('change', () => {
        data[col.key] = box.checked;
        touch(bed.id, feldWas(bed, col));
      });
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
          applyRowState(cb.closest('tr'), data);
          touch(bed.id, feldWas(bed, col));
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
  tr.classList.toggle('verstorben', istVerstorben(data.name));
  markiereLuecken(tr, data);
}

/* ------------------------------------------------------------------ *
 * Fehlende Pflichtangaben
 * Liegt ein Patient auf dem Bettplatz, sollten Kostform, Devices,
 * Norton / Stammblatt und das nächste Screening ausgefüllt sein. Fehlt
 * eine Angabe, wird die Zelle dezent rot unterlegt. Eine angekündigte
 * Aufnahme bleibt außen vor – dort ist noch nichts zu erfassen.
 * ------------------------------------------------------------------ */
const PFLICHT_KEYS = ['postform', 'devices', 'norton', 'abstriche'];

function pflichtGilt(data) {
  return isOccupied(data) && data.status !== ARROW_IN;
}

/* „keins“ bei den Devices ist eine bewusste Angabe und gilt als ausgefüllt;
   bei den Ankreuzfeldern zählt die Angabe erst als vollständig, wenn beide
   Häkchen gesetzt sind. */
function pflichtOffen(data, key) {
  const wert = data[key];
  const col = COL_BY_KEY[key];
  if (col.type === 'checks') return col.options.some(opt => !wert.includes(opt));
  return !String(wert === undefined || wert === null ? '' : wert).trim();
}

function markiereLuecken(tr, data) {
  const pruefen = pflichtGilt(data);
  for (const key of PFLICHT_KEYS) {
    const td = tr.querySelector('td.col-' + key);
    if (!td) continue;
    const offen = pruefen && pflichtOffen(data, key);
    td.classList.toggle('luecke', offen);
    if (offen) td.title = COL_BY_KEY[key].label + ' fehlt';
    else td.removeAttribute('title');
  }
}

function clearBed(bed) {
  const data = state.beds[bed.id];
  const hasContent = COLUMNS.some(c => c.type !== 'bed' && isSet(data[c.key]));
  if (hasContent && !confirm('Bettplatz ' + bed.label + ' vollständig leeren?')) return;
  const name = data.name ? data.name + ' – ' : '';
  state.beds[bed.id] = emptyBed();
  const tr = document.querySelector(`tr[data-bed="${bed.id}"]`);
  tr.replaceWith(buildRow(bed));
  verlaufMerken(name + 'Bettplatz ' + bed.label + ' geräumt');
  save();
  renderStats();
  setSaveState('Bettplatz ' + bed.label + ' geräumt');
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
  const before = { from: JSON.parse(JSON.stringify(state.beds[fromId])) };
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
  verlaufMerken(label + ' → Bett ' + target + ' verschoben');
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
  touch(bed.id, feldWas(bed, col));
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

  /* Fällige Screenings werden im Kopf rot hervorgehoben. */
  const faellig = beds.filter(b => b.abstriche && b.abstriche <= isoToday()).length;
  $('#statScreening').textContent = faellig;
  const karte = $('#screeningCard');
  karte.classList.toggle('faellig', faellig > 0);
  karte.title = faellig
    ? faellig + (faellig === 1 ? ' Screening ist fällig' : ' Screenings sind fällig') +
      ' – siehe die rot hinterlegten Daten in der Spalte Abstriche'
    : 'Kein Screening fällig';
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
