/* Belegungstafel Intensivstation – Bildschirmschoner und Diaschau
 *
 * Teil der Anwendung; die Dateien werden in der in index.html angegebenen
 * Reihenfolge geladen und teilen sich einen gemeinsamen Namensraum.
 */
'use strict';

/* ------------------------------------------------------------------ *
 * Bildschirmschoner: Diaschau
 * Zeigt nacheinander die freigegebenen Dateien und die von Hand angelegten
 * Hinweise. Die Dateien liegen in der Tafel (js/diaspeicher.js) oder – bei
 * älteren Einträgen – im Ordner „slides“ neben index.html.
 * Der Start erfolgt nach der eingestellten
 * Zeit ohne Eingabe oder von Hand über die Schaltfläche im Seitenkopf; jede
 * Eingabe beendet die Schau wieder.
 * ------------------------------------------------------------------ */
let saverDelay = 0;
let saverTimer = null;
let saverOn = false;
let saverGuard = 0;
let saverPos = null;
let slideTimer = null;
let slideClock = null;
let slideList = [];
let slideIndex = 0;

/* Alle freigegebenen Einträge mit Inhalt, in eingestellter Reihenfolge –
   auf Wunsch gemischt. */
function saverPlaylist() {
  const list = settings.screensaver.items.filter(item => item.on &&
    (item.kind === 'text' ? (item.title.trim() || item.text.trim()) : item.file));
  return settings.screensaver.shuffle ? shuffled(list) : list;
}

/* Mischen nach Fisher und Yates. Beim Neumischen einer laufenden Schau steht
   der zuletzt gezeigte Eintrag nicht gleich wieder am Anfang. */
function shuffled(list, notFirst) {
  const mixed = list.slice();
  for (let i = mixed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
  }
  if (notFirst && mixed.length > 1 && mixed[0] === notFirst) {
    [mixed[0], mixed[mixed.length - 1]] = [mixed[mixed.length - 1], mixed[0]];
  }
  return mixed;
}

function slideSeconds(item) {
  return item && item.seconds > 0 ? item.seconds : settings.screensaver.defaultSeconds;
}

function restartSaverTimer() {
  clearTimeout(saverTimer);
  if (saverOn || saverDelay <= 0) return;
  saverTimer = setTimeout(() => {
    /* Ein offenes Fenster (Einstellungen, Auswahl) bleibt unangetastet. */
    if (document.querySelector('dialog[open]')) restartSaverTimer();
    else startSaver();
  }, saverDelay * 1000);
}

/* Erste Eingabe nach dem Start beendet die Schau. Ein winziges Zucken der
   Maus zählt nicht, sonst ließe sich die Schau von Hand kaum starten. */
function saverWakes(event) {
  if (Date.now() < saverGuard) return false;
  if (event && event.type === 'mousemove') {
    if (!saverPos) {
      saverPos = { x: event.clientX, y: event.clientY };
      return false;
    }
    if (Math.abs(event.clientX - saverPos.x) + Math.abs(event.clientY - saverPos.y) < 30) return false;
  }
  return true;
}

function startSaver() {
  if (saverOn) return;
  slideList = saverPlaylist();
  saverOn = true;
  saverGuard = Date.now() + 800;
  saverPos = null;
  clearTimeout(saverTimer);
  clearTimeout(privacyTimer);
  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  setPrivacy(true);
  $('#saver').hidden = false;
  document.body.classList.add('saver-on');
  termineAufbauen();
  showSlide(0);
  tickSlideClock();
  slideClock = setInterval(tickSlideClock, 1000);
}

function stopSaver(event) {
  if (!saverWakes(event)) return false;
  saverOn = false;
  clearTimeout(slideTimer);
  clearInterval(slideClock);
  $('#saverStage').replaceChildren();
  $('#saverTermine').replaceChildren();
  $('#saver').hidden = true;
  document.body.classList.remove('saver-on');
  return true;
}

/* Rechter Teil der Schau: was heute oder später ansteht.
 *
 * Ohne Termine bleibt der Bereich fort, damit die Schau die volle Breite
 * behält – eine dauerhaft leere Spalte wäre nur verschenkter Platz. */
let termineStand = '';

function termineAufbauen() {
  const kasten = $('#saverTermine');
  const liste = anstehendeTermine(settings.termine.liste);
  termineStand = isoToday();
  kasten.replaceChildren();
  kasten.hidden = !liste.length;
  if (!liste.length) return;

  kasten.appendChild(el('h2', null, 'Anstehende Termine'));
  const heute = isoToday();
  for (const termin of liste) {
    const zeile = el('div', 'savertermin' + (termin.datum === heute ? ' heute' : ''));
    const wann = terminDatum(termin.datum) + (termin.zeit ? ' \u00B7 ' + termin.zeit : '');
    zeile.appendChild(el('span', 'saverterminzeit',
      termin.datum === heute ? 'Heute' + (termin.zeit ? ' \u00B7 ' + termin.zeit : '') : wann));
    const text = el('span', 'savertermintext', termin.text);
    /* Bei einer Reihe steht der n\u00E4chste Termin da; der Zusatz sagt, dass es
       nicht bei diesem einen bleibt. */
    const kurz = wiederholungKurz(termin.wdh);
    if (kurz) text.appendChild(el('span', 'saverterminwdh', kurz));
    zeile.appendChild(text);
    kasten.appendChild(zeile);
  }
}

function showSlide(index) {
  clearTimeout(slideTimer);
  const count = slideList.length;

  /* Nach einem vollen Durchlauf wird neu gemischt, damit sich die Abfolge
     nicht wiederholt. */
  if (settings.screensaver.shuffle && count > 1 && index >= count) {
    slideList = shuffled(slideList, slideList[count - 1]);
    index = 0;
  }

  slideIndex = count ? ((index % count) + count) % count : 0;
  const item = count ? slideList[slideIndex] : null;

  const stage = $('#saverStage');
  stage.replaceChildren(item ? slideNode(item) : emptySlideNode());
  fitSlide();
  $('#saverCount').textContent = count > 1 ? slideIndex + 1 + ' / ' + count : '';

  /* Bei nur einem Eintrag gibt es nichts weiterzuschalten. */
  if (count > 1) slideTimer = setTimeout(() => showSlide(slideIndex + 1), slideSeconds(item) * 1000);
}

function slideNode(item) {
  if (item.kind === 'text') {
    const card = el('div', 'slide slide-text');
    if (item.title.trim()) card.appendChild(el('h2', null, item.title));
    if (item.text.trim()) card.appendChild(el('p', null, item.text));
    return card;
  }

  const src = slideQuelle(item);
  if (!src) return missingSlideNode(item.file, item.quelle);
  if (/\.pdf$/i.test(item.file)) {
    /* „view=Fit“ zeigt die ganze Seite statt sie auf die Breite zu ziehen;
       zusätzlich erhält der Rahmen das Seitenverhältnis der ersten Seite,
       damit die Seite die Fläche ohne Ränder und ohne Blättern ausfüllt. */
    const frame = el('iframe', 'slide slide-pdf');
    frame.src = src + '#page=' + (item.page > 1 ? item.page : 1) +
      '&view=Fit&toolbar=0&navpanes=0&scrollbar=0&statusbar=0';
    frame.title = item.file + (item.page > 1 ? ', Seite ' + item.page : '');
    applyPdfRatio(frame, src, item.ratio);
    return frame;
  }

  const img = el('img', 'slide slide-img');
  img.src = src;
  img.alt = item.file;
  img.addEventListener('error', () => img.replaceWith(missingSlideNode(item.file, item.quelle)));
  return img;
}

/* Adresse der Datei: entweder der Ordner „slides“ neben index.html oder der
   in der Tafel gespeicherte Inhalt. */
function slideQuelle(item) {
  return item.quelle === 'gespeichert'
    ? diaAdresse(item.id)
    : SLIDE_DIR + encodeURIComponent(item.file);
}

/* ---- Einpassen der Inhalte: nichts abschneiden, nichts scrollen ---- */

/* Seitenverhältnis der ersten PDF-Seite, je Datei nur einmal gelesen */
const pdfRatios = new Map();

async function applyPdfRatio(frame, src, known) {
  let ratio = known > 0 ? known : pdfRatios.get(src);
  if (ratio === undefined) {
    ratio = await pdfAspect(src);
    pdfRatios.set(src, ratio);
  }
  if (!ratio) return;
  frame.dataset.ratio = String(ratio);
  /* Hängt der Rahmen noch nicht in der Bühne, passt showSlide() ihn gleich
     selbst ein; ein spät gelesenes Verhältnis wird hier nachgezogen. */
  if (frame.isConnected) fitSlide();
}

/* Liest /MediaBox und /Rotate aus der PDF-Datei. Steckt die Seitenangabe in
   einem komprimierten Objektstrom, bleibt es beim vollflächigen Rahmen. */
const OHNE_SERVER = location.protocol === 'file:';

async function pdfAspect(src) {
  /* Ohne Webserver ist fetch gesperrt. Der Versuch würde nur eine
     Fehlermeldung in der Browserkonsole hinterlassen; das Seitenformat
     kommt in diesem Fall aus der Ordnerauswahl.
     Eine in der Tafel gespeicherte Datei (blob:) ist davon nicht betroffen –
     sie liegt im Browser und lässt sich immer lesen. */
  if (OHNE_SERVER && !src.startsWith('blob:')) return 0;
  try {
    const res = await fetch(src, { cache: 'force-cache' });
    if (!res.ok) return 0;
    return aspectFromPdfBytes(new Uint8Array(await res.arrayBuffer()));
  } catch (err) {
    /* Ohne Webserver ist fetch gesperrt – dann bleibt es beim vollen Rahmen
       oder beim Wert aus der Ordnerauswahl. */
    return 0;
  }
}

function aspectFromPdfBytes(bytes) {
  const text = new TextDecoder('latin1').decode(bytes);
  const box = text.match(/\/MediaBox\s*\[\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/);
  if (!box) return 0;
  let width = Math.abs(parseFloat(box[3]) - parseFloat(box[1]));
  let height = Math.abs(parseFloat(box[4]) - parseFloat(box[2]));
  const turn = text.match(/\/Rotate\s+(-?\d+)/);
  if (turn && Math.abs(parseInt(turn[1], 10) / 90) % 2 === 1) [width, height] = [height, width];
  return width > 0 && height > 0 ? width / height : 0;
}

/* Passt das aktuelle Dia in die Fläche ein: PDF auf das Seitenverhältnis,
   Textkarten so weit verkleinert, bis der ganze Text sichtbar ist. */
function fitSlide() {
  const stage = $('#saverStage');
  const slide = stage.firstElementChild;
  if (!slide) return;

  const frame = slide.classList.contains('slide-pdf') && slide.dataset.ratio
    ? slide : null;
  if (frame) {
    const ratio = parseFloat(frame.dataset.ratio);
    const height = Math.min(stage.clientWidth / ratio, stage.clientHeight);
    frame.style.height = Math.floor(height) + 'px';
    frame.style.width = Math.floor(height * ratio) + 'px';
    return;
  }

  if (!slide.classList.contains('slide-text')) return;
  slide.style.fontSize = '';
  const start = parseFloat(getComputedStyle(slide).fontSize);
  let size = start;
  /* Die Karte ist auf die Bühnenhöhe begrenzt; ragt der Inhalt darüber
     hinaus, wird schrittweise verkleinert. */
  for (let step = 0; step < 40 && slide.scrollHeight > slide.clientHeight + 1 && size > 11; step++) {
    size *= 0.93;
    slide.style.fontSize = size + 'px';
  }
}

function missingSlideNode(file, quelle) {
  const card = el('div', 'slide slide-text slide-missing');
  card.appendChild(el('h2', null, 'Datei nicht gefunden'));
  card.appendChild(el('p', null, quelle === 'gespeichert'
    ? file + ' – der gespeicherte Inhalt fehlt. In den Einstellungen den Ordner erneut wählen.'
    : SLIDE_DIR + file));
  return card;
}

function emptySlideNode() {
  const card = el('div', 'slide slide-text');
  card.appendChild(el('h2', null, tafelTitel()));
  card.appendChild(el('p', null,
    'Für die Diaschau sind noch keine Inhalte freigegeben. In den Einstellungen unter ' +
    '„Bildschirmschoner“ den Ordner wählen, in dem die Dateien (PDF, PNG, JPEG) liegen – ' +
    'sie werden dann in die Tafel übernommen. Eigene Hinweise lassen sich dort ebenfalls ' +
    'anlegen.'));
  return card;
}

function tickSlideClock() {
  /* Läuft die Schau über Mitternacht, wäre „Heute" sonst von gestern. */
  if (saverOn && termineStand && termineStand !== isoToday()) termineAufbauen();
  const d = new Date();
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  $('#saverClock').textContent = timeStr(d);
  $('#saverDate').textContent = days[d.getDay()] + ', ' + pad(d.getDate()) + '.' +
    pad(d.getMonth() + 1) + '.' + d.getFullYear();
}

function initSaver() {
  $('#btnSaver').addEventListener('click', startSaver);
  restartSaverTimer();
  /* Die gespeicherten Dateien bekommen ihre Adressen, bevor die Schau zum
     ersten Mal läuft. Das Lesen ist asynchron, der Start der Schau nicht –
     deshalb einmal im Voraus und nicht bei jedem Dia. */
  diaAdressenAufbauen();
}
