/* Belegungstafel Intensivstation – Übergabezettel
 *
 * Teil der Anwendung; die Dateien werden in der in index.html angegebenen
 * Reihenfolge geladen und teilen sich einen gemeinsamen Namensraum.
 *
 * Für die Übergabe werden Angaben gebraucht, die auf der Tafel nichts zu
 * suchen haben: Diagnosen, neurologischer Status und laufende Katecholamine.
 * Sie werden je Bettplatz geführt, mitgespeichert und mit exportiert, sind
 * aber in keiner Spalte sichtbar. Der Zettel selbst ist ein eigener Ausdruck.
 */
'use strict';

function uebergabeButtonZeigen() {
  const btn = $('#btnHandover');
  if (btn) btn.hidden = !settings.uebergabe.button;
}

/* Belegte Bettplätze in der Reihenfolge der Tafel */
function uebergabeBetten() {
  return BEDS.filter(bed => isOccupied(state.beds[bed.id]));
}

function oeffneUebergabe() {
  renderUebergabe();
  $('#handoverDlg').showModal();
}

function renderUebergabe() {
  const liste = $('#handoverList');
  liste.replaceChildren();
  const betten = uebergabeBetten();

  if (!betten.length) {
    liste.appendChild(el('p', 'panehint', 'Zurzeit ist kein Bettplatz belegt.'));
    return;
  }

  for (const bed of betten) {
    const data = state.beds[bed.id];
    const block = el('div', 'handoverbed');

    const kopf = el('div', 'handoverhead');
    kopf.appendChild(el('span', 'handoverbednr', bed.label));
    kopf.appendChild(el('span', 'handovername', data.name || '(ohne Namen)'));
    const zusatz = [data.disziplin, data.beatmung.join(', ')].filter(Boolean).join(' · ');
    if (zusatz) kopf.appendChild(el('span', 'handovermeta', zusatz));
    block.appendChild(kopf);

    for (const feld of UEBERGABE_FIELDS) {
      const zeile = el('div', 'handoverfield');
      zeile.appendChild(el('span', 'handoverlabel', feld.label));
      zeile.appendChild(feld.type === 'multi'
        ? uebergabeAuswahl(bed, feld, data)
        : uebergabeText(bed, feld, data));
      block.appendChild(zeile);
    }
    liste.appendChild(block);
  }
}

function uebergabeText(bed, feld, data) {
  const ta = el('textarea');
  ta.rows = 2;
  ta.value = data[feld.key];
  ta.placeholder = feld.placeholder || '';
  ta.setAttribute('aria-label', feld.label + ' – Bett ' + bed.label);
  ta.addEventListener('input', () => {
    data[feld.key] = ta.value;
    touch(bed.id, { label: 'Bett ' + bed.label + ' · ' + feld.label,
                    key: bed.id + '|' + feld.key });
  });
  return ta;
}

function uebergabeAuswahl(bed, feld, data) {
  const box = el('div', 'handoverpick');
  for (const opt of feld.options) {
    const label = el('label');
    const cb = el('input');
    cb.type = 'checkbox';
    cb.checked = data[feld.key].includes(opt);
    cb.setAttribute('aria-label', feld.label + ' ' + opt + ' – Bett ' + bed.label);
    cb.addEventListener('change', () => {
      const gewaehlt = new Set(data[feld.key]);
      cb.checked ? gewaehlt.add(opt) : gewaehlt.delete(opt);
      /* Reihenfolge der Liste beibehalten, eigene Einträge hinten anfügen. */
      const bekannt = feld.options.filter(o => gewaehlt.has(o));
      const eigen = [...gewaehlt].filter(v => !feld.options.includes(v));
      data[feld.key] = [...bekannt, ...eigen];
      touch(bed.id, { label: 'Bett ' + bed.label + ' · ' + feld.label,
                      key: bed.id + '|' + feld.key });
    });
    label.appendChild(cb);
    label.appendChild(el('span', null, opt));
    box.appendChild(label);
  }
  return box;
}

/* ------------------------------------------------------------------ *
 * Ausdruck
 * Ein eigenes Blatt: nur belegte Bettplätze, je Platz eine Zeile mit
 * Bettplatz, Name, Fachdisziplin und den drei Angaben der Übergabe.
 * ------------------------------------------------------------------ */
function uebergabeBlattAufbauen() {
  const blatt = $('#handoverSheet');
  blatt.replaceChildren();
  const betten = uebergabeBetten();

  const kopf = el('div', 'sheethead');
  kopf.appendChild(el('span', 'sheettitle', 'Übergabe'));
  kopf.appendChild(el('span', 'sheetmeta',
    fullDate(isoToday()) + ' · ' + timeStr(new Date()) + ' Uhr · ' +
    betten.length + (betten.length === 1 ? ' belegter Bettplatz' : ' belegte Bettplätze')));
  blatt.appendChild(kopf);

  const tabelle = el('table', 'sheettable');
  const thead = el('thead');
  const kopfzeile = el('tr');
  for (const text of ['Bett', 'Patient', ...UEBERGABE_FIELDS.map(f => f.label)]) {
    kopfzeile.appendChild(el('th', null, text));
  }
  thead.appendChild(kopfzeile);
  tabelle.appendChild(thead);

  const body = el('tbody');
  for (const bed of betten) {
    const data = state.beds[bed.id];
    const tr = el('tr');
    tr.appendChild(el('td', 'sheetbed', bed.label));

    const patient = el('td', 'sheetpatient');
    patient.appendChild(el('div', 'sheetname', data.name || '–'));
    const meta = [data.disziplin, ...data.beatmung, data.dialyse].filter(Boolean).join(' · ');
    if (meta) patient.appendChild(el('div', 'sheetmetaline', meta));
    if (isSet(data.isolation)) {
      patient.appendChild(el('div', 'sheetiso',
        data.isolation.map(germLabel).join(', ')));
    }
    tr.appendChild(patient);

    for (const feld of UEBERGABE_FIELDS) {
      const wert = data[feld.key];
      tr.appendChild(el('td', 'sheet-' + feld.key,
        Array.isArray(wert) ? wert.join(', ') : wert));
    }
    body.appendChild(tr);
  }
  tabelle.appendChild(body);
  blatt.appendChild(tabelle);
  return betten.length;
}

function uebergabeDrucken() {
  const zeilen = uebergabeBlattAufbauen();
  if (!zeilen && !confirm('Zurzeit ist kein Bettplatz belegt. Trotzdem drucken?')) return;
  /* Die Zeilenhöhe richtet sich nach der Zahl der Patienten, damit das Blatt
     gefüllt wird und bei voller Station trotzdem lesbar bleibt. */
  const hoehe = Math.min(26, Math.max(8, 150 / Math.max(1, zeilen)));
  document.documentElement.style.setProperty('--uebergabe-row', hoehe.toFixed(1) + 'mm');
  document.body.classList.add('uebergabe-druck');
  window.print();
  setTimeout(() => document.body.classList.remove('uebergabe-druck'), 1000);
}

function initUebergabe() {
  $('#btnHandover').addEventListener('click', oeffneUebergabe);
  $('#handoverClose').addEventListener('click', () => $('#handoverDlg').close());
  $('#handoverPrint').addEventListener('click', uebergabeDrucken);
  uebergabeButtonZeigen();
}
