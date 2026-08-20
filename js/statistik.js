/* Belegungstafel Intensivstation – Statistik je Schicht
 *
 * Teil der Anwendung; die Dateien werden in der in index.html angegebenen
 * Reihenfolge geladen und teilen sich einen gemeinsamen Namensraum.
 *
 * Die Tafel kennt nur ihren jetzigen Stand. Für eine Auswertung legt sie
 * deshalb regelmäßig eine Momentaufnahme der Kennzahlen ab, jeweils der
 * laufenden Schicht zugeordnet. Eine spätere Aufnahme derselben Schicht
 * ersetzt die frühere; am Ende steht je Schicht der letzte erfasste Stand.
 * Erfasst wird nur, solange die Tafel geöffnet ist.
 */
'use strict';

const STATS_KEY = 'belegungstafel.statistik' + KEY_SUFFIX;
const STATS_MAX = 5000;

let statistikTimer = null;

/* ------------------------------------------------------------------ *
 * Kennzahlen des jetzigen Standes
 * ------------------------------------------------------------------ */
function statistikKennzahlen() {
  const belegte = BEDS.map(bed => state.beds[bed.id]).filter(isOccupied);
  const zahl = parseInt(state.station.maxBetten, 10);
  return {
    belegt: belegte.length,
    max: Number.isFinite(zahl) ? zahl : null,
    /* Isolation zählt, sobald ein Keim eingetragen ist – bestätigt oder Verdacht. */
    isolation: belegte.filter(d => Array.isArray(d.isolation) && d.isolation.length > 0).length,
    beatmung: belegte.filter(d => Array.isArray(d.beatmung) && d.beatmung.length > 0).length,
    /* Nur die Spalte Dialyse; die externe Dialyse steht als Intervention
       „ext. Dial.“ in einer anderen Spalte und zählt hier nicht mit. */
    dialyse: belegte.filter(d => String(d.dialyse || '').trim() !== '').length,
    faecher: faecherZaehlen(belegte)
  };
}

/* Belegte Bettplätze je Fachdisziplin.
 *
 * Gezählt wird der eingetragene Wert, nicht die Auswahlliste: Wird eine
 * Abteilung später aus den Einstellungen genommen, bleibt sie in den bereits
 * erfassten Ständen stehen und verschwindet nicht rückwirkend aus der
 * Auswertung. Ein belegter Bettplatz ohne Angabe zählt unter '' und wird als
 * „ohne Angabe“ ausgewiesen – das macht Lücken in der Pflege sichtbar,
 * statt sie zu verstecken. */
function faecherZaehlen(belegte) {
  const zaehler = {};
  for (const daten of belegte) {
    const fach = String(daten.disziplin || '').trim();
    zaehler[fach] = (zaehler[fach] || 0) + 1;
  }
  return zaehler;
}

const FACH_MAX = 40;          /* Abteilungen je Eintrag */
const FACH_NAME_MAX = 40;     /* Zeichen je Bezeichnung */
const OHNE_FACH = 'ohne Angabe';

/* Wie die übrigen Kennzahlen wird auch diese Angabe beim Einlesen geprüft –
   sie kommt gegebenenfalls aus einer fremden Sicherungsdatei. */
function faecherPruefen(wert) {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null;
  const rein = {};
  for (const [name, anzahl] of Object.entries(wert)) {
    if (Object.keys(rein).length >= FACH_MAX) break;
    if (typeof anzahl !== 'number' || !Number.isFinite(anzahl) || anzahl < 0) continue;
    rein[String(name).slice(0, FACH_NAME_MAX)] = Math.round(anzahl);
  }
  return rein;
}

/* ------------------------------------------------------------------ *
 * Schichten
 * ------------------------------------------------------------------ */
function isoDatum(datum) {
  return datum.getFullYear() + '-' + pad(datum.getMonth() + 1) + '-' + pad(datum.getDate());
}

/* Welche Schicht läuft zu diesem Zeitpunkt? Vor der ersten Anfangszeit des
   Tages läuft noch die letzte Schicht des Vortages. */
function schichtAm(zeit) {
  const liste = sortiereSchichten(settings.statistik.schichten);
  const minuten = zeit.getHours() * 60 + zeit.getMinutes();
  let treffer = null;
  for (const schicht of liste) {
    if (clockMinutes(schicht.start) <= minuten) treffer = schicht;
  }
  if (treffer) return { ...treffer, datum: isoDatum(zeit) };

  const vortag = new Date(zeit.getTime());
  vortag.setDate(vortag.getDate() - 1);
  return { ...liste[liste.length - 1], datum: isoDatum(vortag) };
}

function schichtName(key) {
  const treffer = settings.statistik.schichten.find(s => s.key === key);
  return treffer ? treffer.name : key;
}

/* ------------------------------------------------------------------ *
 * Ablage
 * ------------------------------------------------------------------ */
/* Erfasste Stände prüfen und auf das erwartete Format bringen.
 *
 * Die Auswertung wird weitergegeben; eine verdorbene Sicherungsdatei oder ein
 * beschädigter Speicher dürfen deshalb keine Werte einschleusen, die als Zahl
 * gelesen und dann zu NaN werden. Übernommen wird nur, was erkennbar zu einem
 * Eintrag gehört – alles Übrige fällt weg, auch zusätzliche Felder.
 */
const STATS_DATUM = /^\d{4}-\d{2}-\d{2}$/;

function statistikPruefen(liste) {
  if (!Array.isArray(liste)) return [];
  const text = wert => (typeof wert === 'string' ? wert : '');
  const zahl = wert => (typeof wert === 'number' && Number.isFinite(wert) ? wert : null);
  return liste
    .filter(e => e && typeof e === 'object' && STATS_DATUM.test(text(e.datum)) && text(e.schicht))
    .map(e => {
      const eintrag = {
        datum: e.datum,
        schicht: e.schicht,
        name: text(e.name),
        start: CLOCK.test(text(e.start)) ? e.start : '',
        zeit: text(e.zeit)
      };
      for (const [feld] of STATS_FELDER) eintrag[feld] = zahl(e[feld]);
      /* Vor Fassung 2.27 nicht erfasst – dann bleibt das Feld leer und der
         Eintrag fällt aus der Auswertung je Fachabteilung heraus, statt sie
         mit Nullen zu verfälschen. */
      const faecher = faecherPruefen(e.faecher);
      if (faecher) eintrag.faecher = faecher;
      return eintrag;
    });
}

function statistikLaden() {
  try {
    return statistikPruefen(JSON.parse(localStorage.getItem(STATS_KEY) || '[]'));
  } catch (err) {
    console.warn('Statistik unlesbar, beginne neu.', err);
    return [];
  }
}

function statistikSpeichern(daten) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(daten));
    return true;
  } catch (err) {
    setSaveState('Statistik konnte nicht gespeichert werden: ' + err.message, true);
    return false;
  }
}

/* Zu alte Einträge entfernen, damit der Speicher nicht zuwächst. */
function statistikAufraeumen(daten) {
  const grenze = new Date();
  grenze.setDate(grenze.getDate() - settings.statistik.tage);
  const ab = isoDatum(grenze);
  const rest = daten.filter(e => e.datum >= ab);
  return rest.length > STATS_MAX ? rest.slice(rest.length - STATS_MAX) : rest;
}

/* Momentaufnahme der laufenden Schicht ablegen. Ein vorhandener Eintrag
   derselben Schicht wird überschrieben. */
function statistikErfassen(zeit) {
  const jetzt = zeit || new Date();
  const schicht = schichtAm(jetzt);
  const werte = statistikKennzahlen();
  const daten = statistikAufraeumen(statistikLaden());
  const eintrag = {
    datum: schicht.datum,
    schicht: schicht.key,
    name: schicht.name,
    start: schicht.start,
    zeit: jetzt.toISOString(),
    ...werte
  };
  const stelle = daten.findIndex(e => e.datum === eintrag.datum && e.schicht === eintrag.schicht);
  if (stelle >= 0) daten[stelle] = eintrag;
  else daten.push(eintrag);
  daten.sort((a, b) => (a.datum + a.start).localeCompare(b.datum + b.start));
  statistikSpeichern(daten);
  return eintrag;
}

/* ------------------------------------------------------------------ *
 * Auswertung
 * ------------------------------------------------------------------ */
/* Gespeicherte Kennzahlen: Feldname, ausführliche Beschriftung, kurze
   Beschriftung für die Tabelle. Was hier steht, liegt so im Speicher. */
const STATS_FELDER = [
  ['belegt', 'belegte Betten', 'belegt'],
  ['max', 'max. Bettenzahl', 'max.'],
  ['isolation', 'Isolationen', 'Isolation'],
  ['beatmung', 'Beatmungen', 'Beatmung'],
  ['dialyse', 'Dialysen', 'Dialyse']
];

/* Auslastung der Schicht in Prozent.
 *
 * Nenner ist die maximale Bettenzahl ohne das Notbett – so, wie sie im Kopf
 * der Tafel eingetragen ist. War das Notbett belegt, steht hier folglich mehr
 * als 100 %; das ist gewollt, denn eine Überbelegung soll sichtbar bleiben
 * und nicht rechnerisch verschwinden. Ohne eingetragene Bettenzahl bleibt die
 * Spalte leer, statt eine Zahl zu erfinden.
 */
function auslastung(eintrag) {
  const belegt = eintrag.belegt;
  const max = eintrag.max;
  if (!Number.isFinite(belegt) || !Number.isFinite(max) || max <= 0) return null;
  return belegt / max * 100;
}

/* Spalten der Auswertung: die gespeicherten Kennzahlen, dazu die aus ihnen
   berechnete Auslastung hinter der Bettenzahl. Sie wird nicht mitgespeichert –
   dadurch steht sie auch für früher erfasste Schichten zur Verfügung. */
const STATS_SPALTEN = [
  ...STATS_FELDER.slice(0, 2),
  ['auslastung', 'Auslastung (%)', 'Ausl. %', auslastung],
  ...STATS_FELDER.slice(2)
];

/* Wert einer Spalte für einen Eintrag – gespeichert oder gerechnet. */
function spaltenWert(spalte, eintrag) {
  const [feld, , , rechner] = spalte;
  return rechner ? rechner(eintrag) : eintrag[feld];
}

/* Zeitraum der Auswertung: zwei Datumsangaben, jede für sich weglassbar.
 *
 * Die Schnellwahl („letzte 30 Tage“) schreibt in dieselben beiden Felder,
 * die auch von Hand zu füllen sind. So steht immer sichtbar da, worauf sich
 * die Zahlen beziehen, statt dass eine Angabe die andere heimlich aussticht.
 * Ein leeres Feld heißt „nach unten bzw. oben offen“; beide leer ist der
 * ganze Bestand. Tabellen, Bild und CSV nehmen denselben Ausschnitt. */
let statistikVon = '';
let statistikBis = '';

function statistikGrenzen() {
  return { von: statistikVon, bis: statistikBis };
}

/* Schnellwahl: die letzten n Tage bis heute, 0 für alles. */
function statistikZeitraumSetzen(tage) {
  if (!tage) {
    statistikVon = '';
    statistikBis = '';
  } else {
    statistikBis = isoToday();
    statistikVon = addDays(statistikBis, -(tage - 1));
  }
}

function statistikZeitraumDaten() {
  return statistikLaden().filter(e =>
    (!statistikVon || e.datum >= statistikVon) &&
    (!statistikBis || e.datum <= statistikBis));
}

/* Mittelwert einer Spalte; leere Angaben bleiben außen vor. Bei der Auslastung
   wird über die Werte der einzelnen Schichten gemittelt – wie bei den übrigen
   Spalten auch, nicht über die Summen. */
function mittel(liste, spalte) {
  const werte = liste.map(e => spaltenWert(spalte, e))
    .filter(v => typeof v === 'number' && Number.isFinite(v));
  if (!werte.length) return null;
  return werte.reduce((a, b) => a + b, 0) / werte.length;
}

function zahl(wert, stellen) {
  if (wert === null || wert === undefined || wert === '') return '–';
  return stellen ? wert.toFixed(stellen).replace('.', ',') : String(wert);
}

/* ---- Monatliche Staffelung ---- */

const MONATSNAMEN = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                     'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

/* „2026-08“ → „August 2026“ */
function monatName(monat) {
  const [jahr, nr] = monat.split('-');
  return MONATSNAMEN[parseInt(nr, 10) - 1] + ' ' + jahr;
}

/* Die Einträge des Zeitraums nach Monat gebündelt, der jüngste zuerst –
   wie in der Tabelle der einzelnen Schichten.
   Gemittelt wird über die Schichten des Monats, nicht über die Tage: Ein Tag,
   an dem die Tafel nur eine Schicht lang lief, zieht das Ergebnis dann nicht
   nach unten. Ein Monat mit weniger Schichten ist an der Spalte „Schichten“
   erkennbar. */
function monateAuswerten(daten) {
  const gruppen = new Map();
  for (const eintrag of daten) {
    const monat = eintrag.datum.slice(0, 7);
    if (!gruppen.has(monat)) gruppen.set(monat, []);
    gruppen.get(monat).push(eintrag);
  }
  return [...gruppen.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([monat, liste]) => ({
      monat,
      name: monatName(monat),
      liste,
      /* Die höchste Belegung des Monats – für einen Bericht oft die zweite
         Zahl nach dem Mittelwert. */
      spitze: liste.reduce((groesste, e) =>
        Number.isFinite(e.belegt) ? Math.max(groesste, e.belegt) : groesste, 0)
    }));
}

/* ---- Fachabteilungen ---- */

/* Auswertung je Fachabteilung über die Einträge, die sie überhaupt führen.
 *
 * Der Mittelwert wird über diese Einträge gebildet, nicht über alle: Eine
 * Abteilung, die in einer Schicht kein Bett belegt, geht dort mit 0 ein –
 * das ist gewollt. Ein Eintrag ohne die Angabe (vor Fassung 2.27) bleibt
 * dagegen ganz außen vor, sonst sänke jeder Mittelwert grundlos. */
function faecherAuswerten(daten) {
  const mitAngabe = daten.filter(e => e.faecher);
  if (!mitAngabe.length) return { schichten: 0, zeilen: [] };

  const namen = new Set();
  for (const eintrag of mitAngabe) for (const name of Object.keys(eintrag.faecher)) namen.add(name);

  const belegtMittel = mittel(mitAngabe, STATS_FELDER[0]) || 0;
  const zeilen = [...namen].map(name => {
    const werte = mitAngabe.map(e => e.faecher[name] || 0);
    const summe = werte.reduce((a, b) => a + b, 0);
    return {
      name: name || OHNE_FACH,
      ohneAngabe: !name,
      mittel: summe / werte.length,
      hoechst: Math.max(...werte),
      anteil: belegtMittel > 0 ? summe / werte.length / belegtMittel * 100 : null
    };
  });

  /* Die stärkste Abteilung zuerst; „ohne Angabe“ steht immer am Ende, es ist
     keine Abteilung. */
  zeilen.sort((a, b) => (a.ohneAngabe - b.ohneAngabe) || (b.mittel - a.mittel) ||
    a.name.localeCompare(b.name, 'de'));
  return { schichten: mitAngabe.length, zeilen };
}

/* ------------------------------------------------------------------ *
 * Fenster
 * ------------------------------------------------------------------ */
function oeffneStatistik() {
  renderStatistik();
  $('#statsDlg').showModal();
}

function renderStatistik() {
  const daten = statistikZeitraumDaten();
  statistikFelderZeigen();
  renderStatistikKopf(daten);
  /* Das Bild steht über den Tabellen: der Verlauf zuerst, die Zahlen dazu.
     Gezeichnet wird es in js/statistikbild.js. */
  statistikBildZeichnen(daten);
  renderStatistikSummen(daten);
  renderStatistikMonate(daten);
  renderStatistikFaecher(daten);
  renderStatistikTabelle(daten);
}

/* Die beiden Datumsfelder auf den geltenden Zeitraum stellen. */
function statistikFelderZeigen() {
  const von = $('#statsVon');
  const bis = $('#statsBis');
  if (!von || !bis) return;
  von.value = statistikVon;
  bis.value = statistikBis;
}

/* Monatsübersicht. Sie erscheint erst, wenn der Zeitraum über einen Monat
   hinausreicht – bei einem einzigen Monat stünde dort dieselbe Zeile wie
   unter „alle Schichten“. */
function renderStatistikMonate(daten) {
  const box = $('#statsMonate');
  box.replaceChildren();
  if (!daten.length) return;

  const monate = monateAuswerten(daten);
  box.appendChild(el('h3', null, 'Monatsübersicht'));
  if (monate.length < 2) {
    box.appendChild(el('p', 'panehint',
      'Der gewählte Zeitraum liegt in einem einzigen Monat. Für eine monatliche Staffelung ' +
      'einen größeren Zeitraum wählen.'));
    return;
  }
  box.appendChild(el('p', 'panehint',
    'Mittelwerte je Monat, gerechnet über die erfassten Schichten des Monats. Die Spalte ' +
    '„Schichten“ zeigt, auf wie vielen Ständen ein Monat beruht.'));

  const tabelle = el('table', 'statstab');
  const kopf = el('tr');
  kopf.appendChild(el('th', null, 'Monat'));
  kopf.appendChild(el('th', 'num', 'Schichten'));
  for (const [, , kurz] of STATS_SPALTEN) kopf.appendChild(el('th', 'num', kurz));
  kopf.appendChild(el('th', 'num', 'Spitze'));
  tabelle.appendChild(el('thead')).appendChild(kopf);

  const body = el('tbody');
  for (const monat of monate) {
    const tr = el('tr');
    tr.appendChild(el('td', null, monat.name));
    tr.appendChild(el('td', 'num', String(monat.liste.length)));
    for (const spalte of STATS_SPALTEN) {
      tr.appendChild(el('td', 'num', zahl(mittel(monat.liste, spalte), 1)));
    }
    tr.appendChild(el('td', 'num', zahl(monat.spitze, 0)));
    body.appendChild(tr);
  }
  tabelle.appendChild(body);
  box.appendChild(tabelle);
}

/* Belegung je Fachabteilung. Eine eigene Tabelle und keine weiteren Spalten
   in der großen: Ein Dutzend Abteilungen neben den Kennzahlen wäre nicht
   mehr zu lesen. */
function renderStatistikFaecher(daten) {
  const box = $('#statsFaecher');
  box.replaceChildren();
  if (!daten.length) return;

  const { schichten, zeilen } = faecherAuswerten(daten);
  box.appendChild(el('h3', null, 'Belegung je Fachabteilung'));
  if (!zeilen.length) {
    box.appendChild(el('p', 'panehint',
      'Für diesen Zeitraum liegt keine Aufteilung vor. Erfasst wird sie seit Fassung 2.27; ' +
      'früher aufgenommene Schichten führen sie nicht.'));
    return;
  }
  box.appendChild(el('p', 'panehint',
    'Mittelwert über ' + schichten + (schichten === 1 ? ' Schicht' : ' Schichten') +
    ' mit dieser Angabe. Der Anteil bezieht sich auf die mittlere Belegung im selben ' +
    'Zeitraum; er kann sich durch Rundung auf mehr oder weniger als 100 % summieren.'));

  const tabelle = el('table', 'statstab');
  const kopf = el('tr');
  kopf.appendChild(el('th', null, 'Fachabteilung'));
  for (const text of ['Mittel', 'Höchstwert', 'Anteil %']) kopf.appendChild(el('th', 'num', text));
  tabelle.appendChild(el('thead')).appendChild(kopf);

  const body = el('tbody');
  for (const zeile of zeilen) {
    const tr = el('tr', zeile.ohneAngabe ? 'ohnefach' : null);
    tr.appendChild(el('td', null, zeile.name));
    tr.appendChild(el('td', 'num', zahl(zeile.mittel, 1)));
    tr.appendChild(el('td', 'num', zahl(zeile.hoechst, 0)));
    tr.appendChild(el('td', 'num', zahl(zeile.anteil, 1)));
    body.appendChild(tr);
  }
  tabelle.appendChild(body);
  box.appendChild(tabelle);
}

function renderStatistikKopf(daten) {
  const kopf = $('#statsInfo');
  const alle = statistikLaden();
  const teile = [];
  if (!settings.statistik.on) teile.push('Die Erfassung ist ausgeschaltet.');
  teile.push(alle.length
    ? alle.length + (alle.length === 1 ? ' Schicht erfasst, ' : ' Schichten erfasst, ') +
      'von ' + fullDate(alle[0].datum) + ' bis ' + fullDate(alle[alle.length - 1].datum) + '.'
    : 'Noch nichts erfasst.');
  teile.push('Im gewählten Zeitraum: ' + daten.length + '.');
  kopf.textContent = teile.join(' ');
}

/* Mittelwerte je Schichtart und über alles */
function renderStatistikSummen(daten) {
  const box = $('#statsSummary');
  box.replaceChildren();
  if (!daten.length) return;

  const tabelle = el('table', 'statstab');
  const kopf = el('tr');
  kopf.appendChild(el('th', null, 'Mittelwerte'));
  kopf.appendChild(el('th', 'num', 'Schichten'));
  for (const [, label] of STATS_SPALTEN) kopf.appendChild(el('th', 'num', label));
  tabelle.appendChild(el('thead')).appendChild(kopf);

  const body = el('tbody');
  const gruppen = settings.statistik.schichten
    .map(s => ({ name: s.name, liste: daten.filter(e => e.schicht === s.key) }))
    .filter(g => g.liste.length);
  for (const gruppe of [...gruppen, { name: 'alle Schichten', liste: daten, summe: true }]) {
    const tr = el('tr', gruppe.summe ? 'summe' : null);
    tr.appendChild(el('td', null, gruppe.name));
    tr.appendChild(el('td', 'num', String(gruppe.liste.length)));
    for (const spalte of STATS_SPALTEN) {
      tr.appendChild(el('td', 'num', zahl(mittel(gruppe.liste, spalte), 1)));
    }
    body.appendChild(tr);
  }
  tabelle.appendChild(body);
  box.appendChild(tabelle);
}

function renderStatistikTabelle(daten) {
  const box = $('#statsTable');
  box.replaceChildren();
  if (!daten.length) {
    box.appendChild(el('p', 'panehint',
      'Für diesen Zeitraum liegt nichts vor. Erfasst wird, solange die Tafel geöffnet ist – ' +
      'je Schicht der zuletzt gesehene Stand.'));
    return;
  }

  const tabelle = el('table', 'statstab');
  const kopf = el('tr');
  kopf.appendChild(el('th', null, 'Datum'));
  kopf.appendChild(el('th', null, 'Schicht'));
  for (const [, , kurz] of STATS_SPALTEN) kopf.appendChild(el('th', 'num', kurz));
  kopf.appendChild(el('th', 'num', 'erfasst'));
  tabelle.appendChild(el('thead')).appendChild(kopf);

  const body = el('tbody');
  for (const eintrag of [...daten].reverse()) {
    const tr = el('tr');
    tr.appendChild(el('td', null, fullDate(eintrag.datum)));
    tr.appendChild(el('td', null, eintrag.name || schichtName(eintrag.schicht)));
    for (const spalte of STATS_SPALTEN) {
      /* Die gerechnete Auslastung mit einer Nachkommastelle, die gezählten
         Kennzahlen als ganze Zahl. */
      tr.appendChild(el('td', 'num', zahl(spaltenWert(spalte, eintrag), spalte[3] ? 1 : 0)));
    }
    tr.appendChild(el('td', 'num', timeStr(new Date(eintrag.zeit))));
    body.appendChild(tr);
  }
  tabelle.appendChild(body);
  box.appendChild(tabelle);
}

/* Auswertung als CSV für die Tabellenkalkulation */
function statistikCsv() {
  /* Auch hier über csvFeld: Die Schichtbezeichnungen sind frei wählbar. */
  const esc = csvFeld;
  const daten = statistikZeitraumDaten();

  /* In der Tabellenkalkulation ist Platz: Dort bekommt jede Fachabteilung
     eine eigene Spalte, statt wie im Fenster nur den Mittelwert. Ein Feld
     bleibt leer, wenn die Schicht die Aufteilung nicht führt – das ist etwas
     anderes als eine Null. */
  const faecher = [...new Set(daten.filter(e => e.faecher)
    .flatMap(e => Object.keys(e.faecher)))]
    .sort((a, b) => (!a - !b) || a.localeCompare(b, 'de'));

  const kopf = ['Datum', 'Schicht', 'Beginn', ...STATS_SPALTEN.map(([, label]) => label),
    ...faecher.map(name => name || OHNE_FACH), 'erfasst um'];
  const zeilen = daten.map(e => [
    e.datum,
    e.name || schichtName(e.schicht),
    e.start || '',
    ...STATS_SPALTEN.map(spalte => {
      const wert = spaltenWert(spalte, e);
      if (wert === null || wert === undefined) return '';
      /* Dezimalkomma, damit die Tabellenkalkulation die Auslastung als Zahl
         liest und nicht als Text. */
      return spalte[3] ? wert.toFixed(1).replace('.', ',') : wert;
    }),
    ...faecher.map(name => (e.faecher ? e.faecher[name] || 0 : '')),
    timeStr(new Date(e.zeit))
  ].map(esc).join(';'));
  download('belegungstafel-statistik-' + stamp() + '.csv',
    '﻿' + [kopf.map(esc).join(';'), ...zeilen].join('\r\n'), 'text/csv');
}

/* Dieselben Zahlen, monatlich gestaffelt.
 *
 * Für einen Bericht nach oben ist nicht die einzelne Schicht gefragt, sondern
 * der Monat. Anders als im Fenster stehen hier auch die Fachabteilungen mit –
 * eine Tabellenkalkulation verträgt die Breite. */
function statistikCsvMonate() {
  const esc = csvFeld;
  const daten = statistikZeitraumDaten();
  const monate = monateAuswerten(daten);
  const faecher = [...new Set(daten.filter(e => e.faecher)
    .flatMap(e => Object.keys(e.faecher)))]
    .sort((a, b) => (!a - !b) || a.localeCompare(b, 'de'));

  const komma = wert => (wert === null || wert === undefined ? '' : wert.toFixed(1).replace('.', ','));
  const kopf = ['Monat', 'Schichten',
    ...STATS_SPALTEN.map(([, label]) => label + ' (Mittel)'),
    'höchste Belegung',
    ...faecher.map(name => (name || OHNE_FACH) + ' (Mittel)')];

  const zeilen = monate.map(monat => {
    /* Fachabteilungen nur über die Schichten mitteln, die die Aufteilung
       führen – wie im Fenster auch. */
    const mitFach = monat.liste.filter(e => e.faecher);
    return [
      monat.name,
      monat.liste.length,
      ...STATS_SPALTEN.map(spalte => komma(mittel(monat.liste, spalte))),
      monat.spitze,
      ...faecher.map(name => mitFach.length
        ? komma(mitFach.reduce((summe, e) => summe + (e.faecher[name] || 0), 0) / mitFach.length)
        : '')
    ].map(esc).join(';');
  });

  download('belegungstafel-statistik-monate-' + stamp() + '.csv',
    '﻿' + [kopf.map(esc).join(';'), ...zeilen].join('\r\n'), 'text/csv');
}

/* ------------------------------------------------------------------ *
 * Start
 * ------------------------------------------------------------------ */
function statistikTaktStarten() {
  clearInterval(statistikTimer);
  if (!settings.statistik.on) return;
  statistikErfassen();
  statistikTimer = setInterval(statistikErfassen, settings.statistik.intervall * 60 * 1000);
}

function statistikButtonZeigen() {
  const btn = $('#btnStats');
  if (btn) btn.hidden = !settings.statistik.button;
}

function initStatistik() {
  $('#btnStats').addEventListener('click', oeffneStatistik);
  $('#statsClose').addEventListener('click', () => $('#statsDlg').close());
  $('#statsCsv').addEventListener('click', statistikCsv);
  $('#statsCsvMonat').addEventListener('click', statistikCsvMonate);
  $('#statsNow').addEventListener('click', () => {
    const eintrag = statistikErfassen();
    renderStatistik();
    setSaveState('Statistik erfasst: ' + (eintrag.name || eintrag.schicht) + ' am ' +
      fullDate(eintrag.datum));
  });
  $('#statsRange').addEventListener('change', event => {
    if (event.target.value === 'frei') return;   /* nur Anzeige der Handwahl */
    statistikZeitraumSetzen(parseInt(event.target.value, 10) || 0);
    renderStatistik();
  });

  /* Ein Datum von Hand: Die Schnellwahl springt auf „frei gewählt“, damit
     dort nicht länger ein Zeitraum steht, der nicht mehr gilt. Verdrehte
     Angaben werden getauscht statt abgewiesen – gemeint ist offensichtlich
     die Spanne dazwischen. */
  const handWahl = () => {
    statistikVon = $('#statsVon').value;
    statistikBis = $('#statsBis').value;
    if (statistikVon && statistikBis && statistikBis < statistikVon) {
      [statistikVon, statistikBis] = [statistikBis, statistikVon];
    }
    $('#statsRange').value = 'frei';
    renderStatistik();
  };
  $('#statsVon').addEventListener('change', handWahl);
  $('#statsBis').addEventListener('change', handWahl);

  statistikZeitraumSetzen(parseInt($('#statsRange').value, 10) || 0);
  initStatistikBild();
  statistikButtonZeigen();
  statistikTaktStarten();
}
