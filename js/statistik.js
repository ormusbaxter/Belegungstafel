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
function statistikLaden() {
  try {
    const daten = JSON.parse(localStorage.getItem(STATS_KEY) || '[]');
    return Array.isArray(daten) ? daten.filter(e => e && e.datum && e.schicht) : [];
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
/* Feldname, ausführliche Beschriftung, kurze Beschriftung für die Tabelle */
const STATS_FELDER = [
  ['belegt', 'belegte Betten', 'belegt'],
  ['max', 'max. Bettenzahl', 'max.'],
  ['isolation', 'Isolationen', 'Isolation'],
  ['beatmung', 'Beatmungen', 'Beatmung'],
  ['dialyse', 'Dialysen', 'Dialyse']
];

let statistikZeitraum = 30;   /* Tage; 0 = alles */

function statistikZeitraumDaten() {
  const daten = statistikLaden();
  if (!statistikZeitraum) return daten;
  const grenze = new Date();
  grenze.setDate(grenze.getDate() - statistikZeitraum + 1);
  const ab = isoDatum(grenze);
  return daten.filter(e => e.datum >= ab);
}

/* Mittelwert einer Kennzahl; leere Angaben bleiben außen vor. */
function mittel(liste, feld) {
  const werte = liste.map(e => e[feld]).filter(v => typeof v === 'number' && Number.isFinite(v));
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
  for (const [, label] of STATS_FELDER) kopf.appendChild(el('th', 'num', label));
  tabelle.appendChild(el('thead')).appendChild(kopf);

  const body = el('tbody');
  const gruppen = settings.statistik.schichten
    .map(s => ({ name: s.name, liste: daten.filter(e => e.schicht === s.key) }))
    .filter(g => g.liste.length);
  for (const gruppe of [...gruppen, { name: 'alle Schichten', liste: daten, summe: true }]) {
    const tr = el('tr', gruppe.summe ? 'summe' : null);
    tr.appendChild(el('td', null, gruppe.name));
    tr.appendChild(el('td', 'num', String(gruppe.liste.length)));
    for (const [feld] of STATS_FELDER) {
      tr.appendChild(el('td', 'num', zahl(mittel(gruppe.liste, feld), 1)));
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
  for (const [, , kurz] of STATS_FELDER) kopf.appendChild(el('th', 'num', kurz));
  kopf.appendChild(el('th', 'num', 'erfasst'));
  tabelle.appendChild(el('thead')).appendChild(kopf);

  const body = el('tbody');
  for (const eintrag of [...daten].reverse()) {
    const tr = el('tr');
    tr.appendChild(el('td', null, fullDate(eintrag.datum)));
    tr.appendChild(el('td', null, eintrag.name || schichtName(eintrag.schicht)));
    for (const [feld] of STATS_FELDER) tr.appendChild(el('td', 'num', zahl(eintrag[feld])));
    tr.appendChild(el('td', 'num', timeStr(new Date(eintrag.zeit))));
    body.appendChild(tr);
  }
  tabelle.appendChild(body);
  box.appendChild(tabelle);
}

/* Auswertung als CSV für die Tabellenkalkulation */
function statistikCsv() {
  const esc = v => '"' + String(v).replace(/"/g, '""') + '"';
  const kopf = ['Datum', 'Schicht', 'Beginn', ...STATS_FELDER.map(([, label]) => label), 'erfasst um'];
  const zeilen = statistikZeitraumDaten().map(e => [
    e.datum,
    e.name || schichtName(e.schicht),
    e.start || '',
    ...STATS_FELDER.map(([feld]) => (e[feld] === null || e[feld] === undefined ? '' : e[feld])),
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
