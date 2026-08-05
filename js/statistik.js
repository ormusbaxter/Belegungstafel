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
    dialyse: belegte.filter(d => String(d.dialyse || '').trim() !== '').length
  };
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

let statistikZeitraum = 30;   /* Tage; 0 = alles */

function statistikZeitraumDaten() {
  const daten = statistikLaden();
  if (!statistikZeitraum) return daten;
  const grenze = new Date();
  grenze.setDate(grenze.getDate() - statistikZeitraum + 1);
  const ab = isoDatum(grenze);
  return daten.filter(e => e.datum >= ab);
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

/* ------------------------------------------------------------------ *
 * Fenster
 * ------------------------------------------------------------------ */
function oeffneStatistik() {
  renderStatistik();
  $('#statsDlg').showModal();
}

function renderStatistik() {
  const daten = statistikZeitraumDaten();
  renderStatistikKopf(daten);
  renderStatistikSummen(daten);
  renderStatistikTabelle(daten);
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
  const kopf = ['Datum', 'Schicht', 'Beginn', ...STATS_SPALTEN.map(([, label]) => label), 'erfasst um'];
  const zeilen = statistikZeitraumDaten().map(e => [
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
    timeStr(new Date(e.zeit))
  ].map(esc).join(';'));
  download('belegungstafel-statistik-' + stamp() + '.csv',
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
  $('#statsNow').addEventListener('click', () => {
    const eintrag = statistikErfassen();
    renderStatistik();
    setSaveState('Statistik erfasst: ' + (eintrag.name || eintrag.schicht) + ' am ' +
      fullDate(eintrag.datum));
  });
  $('#statsRange').addEventListener('change', event => {
    statistikZeitraum = parseInt(event.target.value, 10) || 0;
    renderStatistik();
  });
  statistikButtonZeigen();
  statistikTaktStarten();
}
