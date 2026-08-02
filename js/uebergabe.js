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

/* Angaben, die das Blatt aus der Tafel übernimmt. Sie werden nur wiedergegeben;
   geändert werden sie in der Tabelle. */
const UEBERGABE_TAFEL = [
  { key: 'beatmung',     label: 'Beatmung' },
  { key: 'kreislauf',    label: 'Kreislauf' },
  { key: 'dialyse',      label: 'Nierenersatz' },
  { key: 'isolation',    label: 'Isolation' },
  { key: 'limitierung',  label: 'Limitierung' }
];

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
  const spalten = [
    { key: 'bed', label: 'Bett' },
    { key: 'patient', label: 'Patient' },
    ...UEBERGABE_TAFEL,
    ...UEBERGABE_FIELDS,
    { key: 'uebernahme', label: 'übernimmt' }
  ];
  for (const spalte of spalten) kopfzeile.appendChild(el('th', 'sheet-' + spalte.key, spalte.label));
  thead.appendChild(kopfzeile);
  tabelle.appendChild(thead);

  const body = el('tbody');
  for (const bed of betten) {
    const data = state.beds[bed.id];
    const tr = el('tr');
    tr.appendChild(el('td', 'sheetbed', bed.label));

    const patient = el('td', 'sheetpatient');
    patient.appendChild(el('div', 'sheetname', data.name || '–'));
    if (data.disziplin) patient.appendChild(el('div', 'sheetmetaline', data.disziplin));
    tr.appendChild(patient);

    /* Angaben aus der Tafel – hier nur wiedergegeben, geändert werden sie
       dort. Die Isolation steht fett, sie bestimmt das Vorgehen am Bett. */
    for (const spalte of UEBERGABE_TAFEL) {
      tr.appendChild(el('td', 'sheet-' + spalte.key, tafelText(spalte.key, data)));
    }

    for (const feld of UEBERGABE_FIELDS) {
      const wert = data[feld.key];
      tr.appendChild(el('td', 'sheet-' + feld.key,
        Array.isArray(wert) ? wert.join(', ') : wert));
    }

    /* Leer: Hier trägt die übernehmende Pflegekraft ihr Kürzel von Hand ein. */
    tr.appendChild(el('td', 'sheet-uebernahme'));
    body.appendChild(tr);
  }
  tabelle.appendChild(body);
  blatt.appendChild(tabelle);
  blatt.appendChild(uebergabeFussAufbauen());
  return betten.length;
}

/* Wert einer Tafelspalte als Text für das Blatt */
function tafelText(key, data) {
  const col = COL_BY_KEY[key];
  const wert = data[key];
  if (col.type === 'germs') return wert.map(germLabel).join(', ');
  return Array.isArray(wert) ? wert.join(', ') : String(wert || '');
}

/* Fußteil des Blattes: geplante Aufnahmen, die Zuständigkeiten der Schicht
   und die Übernahme der Diensttelefone. Die beiden letzten Blöcke sind zum
   Ausfüllen von Hand gedacht. */
function uebergabeFussAufbauen() {
  const fuss = el('div', 'sheetfoot');

  const aufnahmen = el('div', 'sheetbox sheetbox-aufnahmen');
  aufnahmen.appendChild(el('h3', null, 'Geplante Aufnahmen'));
  const text = String(state.station.aufnahmen || '').trim();
  const zeilen = text ? text.split(/\r?\n/) : [];
  const inhalt = el('div', 'sheetnote');
  /* Immer mindestens vier Zeilen: Was während der Übergabe dazukommt, wird
     von Hand ergänzt. */
  for (let i = 0; i < Math.max(4, zeilen.length + 1); i++) {
    inhalt.appendChild(el('div', 'sheetnoteline', zeilen[i] || ''));
  }
  aufnahmen.appendChild(inhalt);
  fuss.appendChild(aufnahmen);

  const schicht = el('div', 'sheetbox sheetbox-schicht');
  schicht.appendChild(el('h3', null, 'Zuständig in der Schicht'));
  for (const feld of STATION_FIELDS) {
    const zeile = el('div', 'sheetrole');
    zeile.appendChild(el('span', 'sheetrolelabel', feld.label));
    zeile.appendChild(el('span', 'sheetrolename', state.station[feld.key] || ''));
    zeile.appendChild(el('span', 'sheetroletel', state.station[feld.key + 'Tel'] || ''));
    schicht.appendChild(zeile);
  }
  fuss.appendChild(schicht);

  const telefone = el('div', 'sheetbox sheetbox-telefone');
  telefone.appendChild(el('h3', null, 'Telefone – wer übernimmt?'));
  const gitter = el('div', 'sheetphones');
  /* Dieselbe Liste wie die Vorschläge der Spalte Telefon; sie wird in den
     Einstellungen gepflegt. */
  for (const eintrag of COL_BY_KEY.telefon.options) {
    const zeile = el('div', 'sheetphone');
    zeile.appendChild(el('span', 'sheetphonenr',
      typeof eintrag === 'string' ? eintrag : eintrag.value));
    zeile.appendChild(el('span', 'sheetphonelabel',
      typeof eintrag === 'string' ? '' : eintrag.label || ''));
    zeile.appendChild(el('span', 'sheetphoneline'));
    gitter.appendChild(zeile);
  }
  telefone.appendChild(gitter);
  fuss.appendChild(telefone);

  return fuss;
}

function uebergabeDrucken() {
  const zeilen = uebergabeBlattAufbauen();
  if (!zeilen && !confirm('Zurzeit ist kein Bettplatz belegt. Trotzdem drucken?')) return;
  /* Die Zeilenhöhe richtet sich nach der Zahl der Patienten, damit das Blatt
     gefüllt wird und bei voller Station trotzdem lesbar bleibt. Für den
     Fußteil mit Aufnahmen, Zuständigkeiten und Telefonen bleiben rund 35 mm. */
  const hoehe = Math.min(20, Math.max(7, 112 / Math.max(1, zeilen)));
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
