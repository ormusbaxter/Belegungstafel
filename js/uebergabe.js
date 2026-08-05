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

/* Kopfzeile des Blattes: Die Spalten sind mit Symbolen beschriftet, nicht mit
 * Wörtern – das spart die zweite Kopfzeile und damit Platz für die Zeilen.
 * Der Klartext bleibt als title am th erhalten; er druckt nicht, hilft aber am
 * Bildschirm und der Vorlesefunktion.
 *
 * Jedes Zeichen trägt die Textvariante U+FE0E, damit der Browser es als Schrift
 * und nicht als buntes Emoji setzt – dieselbe Vorkehrung wie bei den Pfeilen der
 * ersten Spalte. Bei den drei anatomischen Zeichen (Lunge, Niere, Hirn) gibt es
 * keine monochrome Form; sie stammen aus Unicode 13/14 und fehlen in älteren
 * Schriftfassungen. Der Testdruck auf dem Stationsrechner prüft das, siehe
 * INSTALLATION.md.
 */
const VS = '︎';
const SYMBOLE = {
  bed:           '\u{1F6CF}' + VS,   /* Bett */
  patient:       '\u{1F464}' + VS,   /* Patient */
  beatmung:      '\u{1FAC1}' + VS,   /* Lunge */
  kreislauf:     '♥' + VS,      /* Herz */
  dialyse:       '\u{1FAD8}' + VS,   /* Niere */
  isolation:     '☣' + VS,      /* Biohazard */
  limitierung:   '⊘' + VS,      /* durchgestrichener Kreis */
  diagnosen:     '⚕' + VS,      /* Äskulapstab */
  neuro:         '\u{1F9E0}' + VS,   /* Hirn */
  katecholamine: '\u{1F489}' + VS,   /* Spritze */
  uebernahme:    '✍' + VS,      /* schreibende Hand */
  notizen:       '✎' + VS       /* Bleistift */
};

/* Angaben, die das Blatt aus der Tafel übernimmt. Sie werden nur wiedergegeben;
   geändert werden sie in der Tabelle. */
const UEBERGABE_TAFEL = [
  { key: 'beatmung',     label: 'Beatmung' },
  { key: 'kreislauf',    label: 'Kreislauf' },
  { key: 'dialyse',      label: 'Nierenersatz' },
  { key: 'isolation',    label: 'Isolation' },
  { key: 'limitierung',  label: 'Therapielimitierung' }
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

/* Zuständigkeiten der Schicht – dieselben Angaben wie unter der Tafel.
   Sie stehen hier am Anfang, weil sie bei der Übergabe zuerst geklärt werden;
   Pflicht sind sie nicht. Bleiben sie leer, lässt das Blatt die Zeilen frei. */
function renderUebergabeStation() {
  const box = $('#handoverStation');
  box.replaceChildren();
  box.appendChild(el('h3', null, 'Zuständigkeit'));
  const hinweis = el('p', 'panehint',
    'Gilt für die ganze Station und steht auch unter der Tafel. Was hier leer bleibt, ' +
    'lässt der Ausdruck zum Eintragen von Hand frei.');
  box.appendChild(hinweis);

  const gitter = el('div', 'handoverroles');
  for (const feld of STATION_FIELDS) {
    const zeile = el('div', 'handoverrole');
    zeile.appendChild(el('span', 'handoverlabel', feld.label));

    const name = el('input');
    name.type = 'text';
    name.placeholder = feld.placeholder;
    name.value = state.station[feld.key];
    name.setAttribute('aria-label', feld.label);
    name.addEventListener('input', () => {
      state.station[feld.key] = name.value;
      spiegelStation(feld.key, 'sf-name', name.value);
      save();
    });

    const tel = el('input', 'handovertel');
    tel.type = 'tel';
    tel.placeholder = 'Telefon';
    tel.value = state.station[feld.key + 'Tel'];
    tel.setAttribute('aria-label', feld.label + ' – Telefon');
    tel.addEventListener('input', () => {
      state.station[feld.key + 'Tel'] = tel.value;
      spiegelStation(feld.key, 'sf-tel', tel.value);
      save();
    });

    zeile.appendChild(name);
    zeile.appendChild(tel);
    gitter.appendChild(zeile);
  }
  box.appendChild(gitter);
}

/* Die Felder unter der Tafel zeigen dieselben Werte; sie werden mitgeführt,
   ohne die ganze Leiste neu aufzubauen (das würde den Fokus kosten). */
function spiegelStation(key, klasse, wert) {
  const feld = document.querySelector('.stationfield.sf-' + key + ' .' + klasse);
  if (feld && feld.value !== wert) feld.value = wert;
}

function renderUebergabe() {
  renderUebergabeStation();
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
 * Ein eigenes Blatt mit allen Bettplätzen – auch den freien, damit die
 * Übergabe die Tafel Zeile für Zeile durchgehen kann und ein leerer Platz
 * als solcher bestätigt wird.
 * ------------------------------------------------------------------ */

/* Spalten des Blattes in ihrer Reihenfolge. Jede weiß, wie ihre Zelle
   gefüllt wird; Kopfzeile und Zeilen laufen dadurch über dieselbe Liste. */
function blattSpalten() {
  const [diagnosen, ...weitere] = UEBERGABE_FIELDS;
  const ausFeld = feld => data => {
    const wert = data[feld.key];
    return Array.isArray(wert) ? wert.join(', ') : wert;
  };
  return [
    { key: 'bed', label: 'Bettplatz', zelle: (data, bed) => bed.label, klasse: 'sheetbed' },
    { key: 'patient', label: 'Patient', knoten: patientenZelle },
    /* Die Diagnosen stehen direkt hinter dem Namen. */
    { key: diagnosen.key, label: diagnosen.label, zelle: ausFeld(diagnosen) },
    /* Angaben aus der Tafel – hier nur wiedergegeben, geändert werden sie
       dort. Die Isolation steht fett, sie bestimmt das Vorgehen am Bett. */
    ...UEBERGABE_TAFEL.map(spalte => ({
      key: spalte.key, label: spalte.label, zelle: data => tafelText(spalte.key, data)
    })),
    ...weitere.map(feld => ({ key: feld.key, label: feld.label, zelle: ausFeld(feld) })),
    /* Leer für das Kürzel der übernehmenden Pflegekraft. */
    { key: 'uebernahme', label: 'übernehmende Pflegekraft', zelle: () => '' },
    /* Bemerkungen aus der Spalte Sonstiges; darunter bleibt Platz zum
       Ergänzen von Hand. */
    { key: 'notizen', label: 'Sonstiges und Notizen', zelle: data => tafelText('sonstiges', data) }
  ];
}

function patientenZelle(data) {
  const zelle = el('td', 'sheet-patient sheetpatient');
  zelle.appendChild(el('span', 'sheetname', data.name || '–'));
  if (data.disziplin) zelle.appendChild(el('span', 'sheetmetaline', data.disziplin));
  return zelle;
}

function uebergabeBlattAufbauen() {
  const blatt = $('#handoverSheet');
  blatt.replaceChildren();
  const belegte = uebergabeBetten().length;

  const kopf = el('div', 'sheethead');
  kopf.appendChild(el('span', 'sheettitle', 'Übergabe'));
  kopf.appendChild(el('span', 'sheetmeta',
    fullDate(isoToday()) + ' · ' + timeStr(new Date()) + ' Uhr · ' +
    belegte + ' von ' + BEDS.length + ' Bettplätzen belegt'));
  blatt.appendChild(kopf);

  const spalten = blattSpalten();
  const tabelle = el('table', 'sheettable');
  const kopfzeile = el('tr');
  for (const spalte of spalten) {
    const th = el('th', 'sheet-' + spalte.key, SYMBOLE[spalte.key] || spalte.label);
    th.title = spalte.label;
    th.setAttribute('aria-label', spalte.label);
    kopfzeile.appendChild(th);
  }
  tabelle.appendChild(el('thead')).appendChild(kopfzeile);

  const body = el('tbody');
  for (const bed of BEDS) {
    const data = state.beds[bed.id];
    const tr = el('tr', isOccupied(data) ? null : 'frei');
    for (const spalte of spalten) {
      tr.appendChild(spalte.knoten
        ? spalte.knoten(data, bed)
        : el('td', 'sheet-' + spalte.key + (spalte.klasse ? ' ' + spalte.klasse : ''),
             spalte.zelle(data, bed)));
    }
    body.appendChild(tr);
  }
  tabelle.appendChild(body);
  blatt.appendChild(tabelle);
  blatt.appendChild(uebergabeFussAufbauen());
  return BEDS.length;
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
  schicht.appendChild(el('h3', null, 'Zuständigkeit'));
  for (const feld of STATION_FIELDS) {
    const zeile = el('div', 'sheetrole');
    zeile.appendChild(el('span', 'sheetrolelabel', feld.label));
    zeile.appendChild(el('span', 'sheetrolename', state.station[feld.key] || ''));
    zeile.appendChild(el('span', 'sheetroletel', state.station[feld.key + 'Tel'] || ''));
    schicht.appendChild(zeile);
  }

  /* Bettenzahl: dieselbe Darstellung wie im Kopf der Tafel – die maximal
     betreibbaren Plätze zuzüglich Notbett. Ohne Eintrag bleibt eine Linie. */
  const betten = el('div', 'sheetbeds');
  betten.appendChild(el('span', 'sheetbedslabel', 'Bettenzahl'));
  const zahl = String(state.station.maxBetten || '').trim();
  const wert = el('span', 'sheetbedsvalue', zahl);
  if (!zahl) wert.classList.add('leer');
  betten.appendChild(wert);
  betten.appendChild(el('span', 'sheetbedsplus', '+ 1'));
  betten.appendChild(el('span', 'sheetbedsbelegt',
    'belegt ' + uebergabeBetten().length));
  schicht.appendChild(betten);
  fuss.appendChild(schicht);

  const telefone = el('div', 'sheetbox sheetbox-telefone');
  telefone.appendChild(el('h3', null, 'Telefone'));
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

/* Höhe eines Elements in Millimetern (96 dpi sind die Rechengrundlage des
   Browsers für physische Einheiten). */
function hoeheMm(knoten) {
  return knoten.getBoundingClientRect().height / 96 * 25.4;
}

/* Das Blatt auf eine Seite bringen.
 *
 * Es soll immer alle Bettplätze zeigen und trotzdem einseitig bleiben. Wie
 * viel Platz die Zeilen brauchen, hängt aber an der Länge der Diagnosen und
 * lässt sich nicht vorausberechnen. Deshalb wird das Blatt kurz unsichtbar
 * in der Breite einer A4-Seite eingehängt, gemessen und die Schrift so lange
 * verkleinert, bis es passt – dasselbe Vorgehen wie beim Einpassen der
 * Hinweistexte im Bildschirmschoner.
 */
const BLATT_HOEHE_MM = 188;      /* A4 quer, 7 mm Rand, abzüglich Fußzeile */
const BLATT_SCHRIFT_MM = 3.6;    /* Ausgangsgröße – bei wenig Inhalt bleibt es dabei */
const BLATT_SCHRIFT_MIN = 2.1;   /* darunter wird es unlesbar; dann lieber zwei Seiten */

function uebergabeEinpassen() {
  const blatt = $('#handoverSheet');
  const wurzel = document.documentElement;
  const setze = (name, wert) => wurzel.style.setProperty(name, wert);

  /* Zeilenhöhe: Der Rest der Seite, gleichmäßig auf die Bettplätze verteilt,
     nach unten begrenzt, damit sich in die leeren Spalten schreiben lässt. */
  setze('--uebergabe-row', Math.min(16, Math.max(6, 120 / Math.max(1, BEDS.length))).toFixed(1) + 'mm');

  let schrift = BLATT_SCHRIFT_MM;
  setze('--uebergabe-schrift', schrift + 'mm');
  blatt.classList.add('messen');
  for (let schritt = 0; schritt < 40; schritt++) {
    if (hoeheMm(blatt) <= BLATT_HOEHE_MM) break;
    const kleiner = Math.round(schrift * 0.96 * 100) / 100;
    /* Unter die Lesbarkeitsgrenze wird nicht verkleinert – dann läuft das
       Blatt lieber auf eine zweite Seite. */
    if (kleiner < BLATT_SCHRIFT_MIN) break;
    schrift = kleiner;
    setze('--uebergabe-schrift', schrift + 'mm');
  }
  /* Reicht die Schrift allein nicht, geben die Zeilen ihre Mindesthöhe auf. */
  if (hoeheMm(blatt) > BLATT_HOEHE_MM) setze('--uebergabe-row', '0mm');
  blatt.classList.remove('messen');
  return schrift;
}

function uebergabeDrucken() {
  uebergabeBlattAufbauen();
  uebergabeEinpassen();
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
