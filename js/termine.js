/* Anstehende Termine – eigenes Fenster
 *
 * Fortbildung, Gerätewartung, Teambesprechung: organisatorische Termine, die
 * rechts neben der Diaschau erscheinen. Sie stehen bewusst nicht in den
 * Einstellungen, sondern hinter einer eigenen Schaltfläche ohne Zugangsstufe –
 * sie ändern sich wöchentlich und gehören dem Dienst, nicht der Verwaltung.
 *
 * Anders als das Einstellungsfenster arbeitet dieses ohne Entwurf: Jede
 * Eingabe steht sofort in den Einstellungen und wird gespeichert, wie bei den
 * Textfeldern der Tafel auch. Beim Schließen fallen unfertige Zeilen weg.
 */
'use strict';

function oeffneTermine() {
  renderTermine();
  $('#terminDlg').showModal();
}

/* Ein Termin, der noch keine Bezeichnung trägt, zählt nicht: Er entsteht beim
   Klick auf „Termin hinzufügen“ und verschwindet wieder, wenn niemand ihn
   ausfüllt. */
function termineAufraeumen() {
  const liste = settings.termine.liste;
  const geputzt = liste
    .filter(t => ISO_DATUM.test(t.datum || '') && t.text.trim())
    .map(t => ({ ...t, text: t.text.trim().slice(0, TERMIN_MAX) }));
  if (geputzt.length === liste.length &&
      geputzt.every((t, i) => t.text === liste[i].text)) return;
  settings.termine.liste = geputzt;
  saveSettings();
}

function terminSpeichern() {
  saveSettings();
  setSaveState('Termine gespeichert');
}

/* Sechs Felder je Zeile sagen von sich aus nicht, wofür sie stehen –
   besonders das Ende der Reihe nicht. Die Kopfzeile steht nur da, wenn es
   auch Zeilen gibt. */
const TERMIN_KOPF = ['Datum', 'Uhrzeit', 'Wiederholung', 'Ende der Reihe', 'Bezeichnung', ''];

function renderTermine() {
  const liste = $('#terminList');
  const termine = settings.termine.liste;
  liste.replaceChildren();

  if (termine.length) {
    const kopf = el('div', 'entry entry-termin terminkopf');
    for (const text of TERMIN_KOPF) kopf.appendChild(el('span', null, text));
    liste.appendChild(kopf);
  }

  termine.forEach((termin, index) => {
    const row = el('div', 'entry entry-termin');

    const datum = el('input', 'terminstart');
    datum.type = 'date';
    datum.value = termin.datum;
    datum.setAttribute('aria-label', 'Datum, bei einer Reihe der erste Termin');
    datum.addEventListener('input', () => {
      termin.datum = datum.value;
      terminSpeichern();
      terminVorschau(row, termin);
    });
    row.appendChild(datum);

    const zeit = el('input', 'terminzeit');
    zeit.type = 'time';
    zeit.value = termin.zeit;
    zeit.setAttribute('aria-label', 'Uhrzeit, kann leer bleiben');
    zeit.addEventListener('input', () => { termin.zeit = zeit.value; terminSpeichern(); });
    row.appendChild(zeit);

    const wdh = el('select', 'terminwdh');
    wdh.setAttribute('aria-label', 'Wiederholung');
    for (const eintrag of WIEDERHOLUNGEN) {
      const option = el('option', null, eintrag.label);
      option.value = eintrag.key;
      wdh.appendChild(option);
    }
    wdh.value = termin.wdh;
    row.appendChild(wdh);

    /* Das Ende gehört nur zu einer Reihe; bei „einmalig“ wäre es sinnlos. */
    const bis = el('input', 'terminbis');
    bis.type = 'date';
    bis.value = termin.bis;
    bis.title = 'Ende der Reihe – leer lassen, wenn sie nicht endet';
    bis.setAttribute('aria-label', 'Ende der Reihe, kann leer bleiben');
    bis.disabled = !termin.wdh;
    bis.addEventListener('input', () => {
      termin.bis = bis.value;
      terminSpeichern();
      terminVorschau(row, termin);
    });

    wdh.addEventListener('change', () => {
      termin.wdh = wdh.value;
      bis.disabled = !termin.wdh;
      if (!termin.wdh && termin.bis) { termin.bis = ''; bis.value = ''; }
      terminSpeichern();
      terminVorschau(row, termin);
    });
    row.appendChild(bis);

    row.appendChild(entryInput(termin.text, 'Bezeichnung', 'termintext', wert => {
      termin.text = wert;
      terminSpeichern();
      terminVorschau(row, termin);
    }));

    const remove = moveButton('×', 'entfernen', () => {
      termine.splice(index, 1);
      terminSpeichern();
      renderTermine();
    });
    remove.classList.add('remove');
    row.appendChild(remove);

    row.appendChild(el('span', 'terminvorschau'));
    liste.appendChild(row);
    terminVorschau(row, termin);
  });

  if (!termine.length) {
    liste.appendChild(el('p', 'panehint',
      'Noch keine Termine. Ohne Eintrag bleibt der rechte Teil der Diaschau fort und die ' +
      'Schau nutzt die volle Breite.'));
  }
}

/* Zeigt je Zeile, wann der Termin das nächste Mal auf dem Schirm steht. Das
   nimmt der Wiederholung das Rätselhafte – gerade beim Monatsletzten, der in
   kurzen Monaten vorrückt. */
function terminVorschau(row, termin) {
  const feld = row.querySelector('.terminvorschau');
  if (!feld) return;
  feld.classList.remove('vergangen');

  if (!ISO_DATUM.test(termin.datum || '') || !termin.text.trim()) {
    feld.textContent = '';
    return;
  }
  const naechster = naechsterTermin(termin, isoToday());
  if (!naechster) {
    feld.textContent = termin.wdh ? 'Reihe beendet – erscheint nicht mehr'
                                  : 'vorbei – erscheint nicht mehr';
    feld.classList.add('vergangen');
    return;
  }
  const heute = isoToday();
  /* Die Jahreszahl nur, wenn sie nicht die laufende ist – sonst steht sie in
     jeder Zeile und sagt nichts. */
  const jahr = naechster.slice(0, 4) === heute.slice(0, 4) ? '' : ' ' + naechster.slice(0, 4);
  feld.textContent = 'nächster Termin: ' +
    (naechster === heute ? 'heute' : terminDatum(naechster) + jahr);
}

function termineButtonZeigen() {
  const btn = $('#btnTermine');
  if (btn) btn.hidden = !settings.termine.button;
}

function initTermine() {
  $('#btnTermine').addEventListener('click', oeffneTermine);
  $('#terminAdd').addEventListener('click', () => {
    settings.termine.liste.push(terminItem({ datum: isoToday() }));
    renderTermine();
    focusLast($('#terminList'), '.termintext');
  });
  $('#terminClose').addEventListener('click', () => $('#terminDlg').close());
  $('#terminDlg').addEventListener('close', termineAufraeumen);
  termineButtonZeigen();
}
