/* Belegungstafel Intensivstation – Sichtschutz, Ansicht, Sicherung, Start
 *
 * Teil der Anwendung; die Dateien werden in der in index.html angegebenen
 * Reihenfolge geladen und teilen sich einen gemeinsamen Namensraum.
 */
'use strict';

/* ------------------------------------------------------------------ *
 * Sichtschutz
 * Nach der eingestellten Zeit ohne Eingabe werden die patientenbezogenen
 * Angaben unkenntlich gemacht. Jede Bewegung oder Taste hebt das wieder auf;
 * ein von Hand eingeschalteter Sichtschutz bleibt bis zu einem Klick oder
 * Tastendruck bestehen.
 * ------------------------------------------------------------------ */
let privacyDelay = 120;
let privacyTimer = null;
let manualLock = false;

function setPrivacy(on) {
  document.body.classList.toggle('privacy', on);
}

function restartPrivacyTimer() {
  clearTimeout(privacyTimer);
  if (privacyDelay > 0) privacyTimer = setTimeout(() => setPrivacy(true), privacyDelay * 1000);
}

function wake(event) {
  /* Läuft der Bildschirmschoner, beendet ihn die erste echte Eingabe. */
  if (saverOn && !stopSaver(event)) return;
  if (manualLock && event && event.type === 'mousemove') return;
  manualLock = false;
  setPrivacy(false);
  restartPrivacyTimer();
  restartSaverTimer();
}

function lockNow() {
  manualLock = true;
  clearTimeout(privacyTimer);
  setPrivacy(true);
}

function initPrivacy() {
  $('#btnLock').addEventListener('click', lockNow);

  for (const type of ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'focusin']) {
    document.addEventListener(type, wake, { passive: true });
  }
  restartPrivacyTimer();
}

/* ------------------------------------------------------------------ *
 * Hilfe
 * ------------------------------------------------------------------ */
function initHelp() {
  const list = $('#helpColors');
  for (const [cls, text] of ROW_COLORS) {
    const li = el('li');
    li.appendChild(el('span', 'swatch ' + cls));
    li.appendChild(el('span', null, text));
    list.appendChild(li);
  }
  $('#helpVersion').textContent = 'Version ' + VERSION + ' \u00B7 ' + COPYRIGHT;
  $('#btnHelp').addEventListener('click', () => $('#helpDlg').showModal());
  $('#helpClose').addEventListener('click', () => $('#helpDlg').close());
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
  const data = { ...state, settings };
  download('belegungstafel-' + stamp() + '.json', JSON.stringify(data, null, 2), 'application/json');
}

function exportCsv() {
  /* csvFeld entschärft Werte, die eine Tabellenkalkulation sonst als Formel
     lesen würde – siehe js/konfiguration.js. */
  const esc = csvFeld;
  const info = [
    [tafelTitel(), fullDate(isoToday()) + ' ' + timeStr(new Date())],
    ['Maximale Bettenzahl', state.station.maxBetten ? state.station.maxBetten + ' + 1 (Notbett)' : ''],
    ['Meldestatus', state.station.meldestatus],
    ...STATION_FIELDS.map(f => [f.label, state.station[f.key], state.station[f.key + 'Tel']]),
    ['Geplante Aufnahmen', state.station.aufnahmen.replace(/\r?\n/g, ' / ')],
    ['Allgemeine Informationen', state.station.infos.replace(/\r?\n/g, ' / ')]
  ].map(row => row.map(esc).join(';'));
  const head = COLUMNS.map(c => esc(c.label)).join(';');
  const lines = BEDS.map(bed => {
    const data = state.beds[bed.id];
    return COLUMNS.map(col => {
      if (col.type === 'bed') return esc(bed.label);
      let val = data[col.key];
      if (col.type === 'germs') val = val.map(germLabel).join('; ');
      else if (col.type === 'date') val = val ? fullDate(val) : '';
      else if (Array.isArray(val)) val = val.join('; ');
      else if (typeof val === 'boolean') val = val ? 'ja' : 'nein';
      return esc(val);
    }).join(';');
  });
  /* BOM, damit Excel die Umlaute korrekt anzeigt */
  download('belegungstafel-' + stamp() + '.csv',
    '﻿' + [...info, '', head, ...lines].join('\r\n'), 'text/csv');
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
    verlaufMerken('Stand vor dem Import');
    for (const bed of BEDS) {
      state.beds[bed.id] = emptyBed();
      merge(state.beds[bed.id], parsed.beds[bed.id]);
    }
    state.station = emptyStation();
    mergeStation(state.station, parsed.station);
    if (Array.isArray(parsed.statistik)) statistikSpeichern(statistikPruefen(parsed.statistik));
    if (parsed.settings) {
      mergeSettings(settings, parsed.settings);
      saveSettings();
      applySettings();
      syncBeds();
      buildHead();
      renderPhones();
      restartPrivacyTimer();
      restartSaverTimer();
    }
    buildBody();
    renderStation();
    renderStats();
    save();
    setSaveState('Daten importiert');
  };
  reader.readAsText(file);
}

/* ------------------------------------------------------------------ *
 * Automatische Sicherung
 * Die Tafel liegt nur im Browser dieses Rechners. Einmal am Tag schreibt
 * sie deshalb eine vollständige JSON-Sicherung – wahlweise in einen selbst
 * gewählten Ordner (etwa auf einem Netzlaufwerk) oder in den Download-
 * Ordner des Browsers. Der Zugriff auf den Ordner wird vom Browser
 * verwaltet und bleibt über IndexedDB erhalten.
 * ------------------------------------------------------------------ */
const BACKUP_DB = 'belegungstafel';
const BACKUP_STORE = 'ordner';
const BACKUP_FILE = /^belegungstafel-\d{8}-\d{4}\.json$/;
const ordnerWahlMoeglich = typeof window.showDirectoryPicker === 'function';

function backupInfo() {
  try {
    return JSON.parse(localStorage.getItem(BACKUP_KEY) || 'null') || {};
  } catch (err) {
    return {};
  }
}

function setBackupInfo(info) {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(info));
  } catch (err) {
    /* ohne Merkzettel wird eben erneut gesichert */
  }
}

/* Ordnerzugriff merken: Verweise auf Verzeichnisse lassen sich nur in
   IndexedDB ablegen, nicht im localStorage. */
function ordnerSpeicher(wert) {
  return new Promise(resolve => {
    let req;
    try {
      req = indexedDB.open(BACKUP_DB, 1);
    } catch (err) {
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => req.result.createObjectStore(BACKUP_STORE);
    req.onerror = () => resolve(null);
    req.onsuccess = () => {
      const db = req.result;
      const lesen = wert === undefined;
      let tx;
      try {
        tx = db.transaction(BACKUP_STORE, lesen ? 'readonly' : 'readwrite');
      } catch (err) {
        resolve(null);
        return;
      }
      const store = tx.objectStore(BACKUP_STORE);
      const op = lesen ? store.get('handle' + KEY_SUFFIX) : store.put(wert, 'handle' + KEY_SUFFIX);
      op.onsuccess = () => resolve(lesen ? op.result || null : wert);
      op.onerror = () => resolve(null);
    };
  });
}

async function ordnerRecht(handle, fragen) {
  if (!handle || !handle.queryPermission) return 'keiner';
  const opts = { mode: 'readwrite' };
  const stand = await handle.queryPermission(opts);
  if (stand === 'granted') return 'granted';
  if (!fragen) return stand;
  return await handle.requestPermission(opts);
}

/* Ordner auswählen – nur aus einer Nutzeraktion heraus möglich. */
async function ordnerWaehlen() {
  if (!ordnerWahlMoeglich) return null;
  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'belegungstafel' });
    await ordnerSpeicher(handle);
    return handle;
  } catch (err) {
    return null;   /* abgebrochen */
  }
}

function sicherungsName() {
  return 'belegungstafel-' + stamp() + '.json';
}

/* Schreibt eine Sicherung. Gibt eine Meldung für die Oberfläche zurück. */
async function sicherungSchreiben(fragen) {
  /* Die Sicherung umfasst auch die erfasste Statistik – sie liegt sonst
     nirgends sonst und wäre mit dem Browserprofil verloren. */
  const daten = JSON.stringify({ ...state, settings, statistik: statistikLaden() }, null, 2);
  const name = sicherungsName();

  if (settings.backup.ziel === 'download' || !ordnerWahlMoeglich) {
    download(name, daten, 'application/json');
    sicherungNotiert();
    return { ok: true, text: 'Sicherung ' + name + ' in den Download-Ordner gelegt.' };
  }

  const handle = await ordnerSpeicher();
  if (!handle) {
    return { ok: false, text: 'Für die Sicherung ist noch kein Ordner gewählt.' };
  }
  const recht = await ordnerRecht(handle, fragen);
  if (recht !== 'granted') {
    return { ok: false, text: 'Der Zugriff auf den Sicherungsordner „' + handle.name +
      '“ muss erneut bestätigt werden – in den Einstellungen unter „Daten“ auf ' +
      '„Jetzt sichern“ klicken.' };
  }

  try {
    const datei = await handle.getFileHandle(name, { create: true });
    const strom = await datei.createWritable();
    await strom.write(daten);
    await strom.close();
    await alteSicherungenEntfernen(handle, settings.backup.behalten);
    sicherungNotiert(handle.name);
    return { ok: true, text: 'Sicherung ' + name + ' in „' + handle.name + '“ geschrieben.' };
  } catch (err) {
    return { ok: false, text: 'Sicherung fehlgeschlagen: ' + err.message };
  }
}

function sicherungNotiert(ordner) {
  setBackupInfo({ datum: isoToday(), zeit: new Date().toISOString(), ordner: ordner || '' });
}

/* Ältere Sicherungen aufräumen, damit der Ordner nicht zuwächst. */
async function alteSicherungenEntfernen(handle, behalten) {
  if (!handle.entries || !(behalten > 0)) return;
  const namen = [];
  try {
    for await (const [name, eintrag] of handle.entries()) {
      if (eintrag.kind === 'file' && BACKUP_FILE.test(name)) namen.push(name);
    }
    namen.sort();
    for (const name of namen.slice(0, Math.max(0, namen.length - behalten))) {
      await handle.removeEntry(name);
    }
  } catch (err) {
    /* Aufräumen ist Beiwerk; die Sicherung selbst steht bereits */
  }
}

function sicherungFaellig() {
  return settings.backup.on && backupInfo().datum !== isoToday();
}

async function sicherungPruefen() {
  if (!sicherungFaellig()) return;
  const res = await sicherungSchreiben(false);
  setSaveState(res.text, !res.ok);
}

function initBackup() {
  /* Kurz nach dem Start und danach halbstündlich prüfen, damit auch eine
     durchlaufende Tafel um Mitternacht eine neue Sicherung anlegt. */
  setTimeout(sicherungPruefen, 8000);
  setInterval(sicherungPruefen, 30 * 60 * 1000);
}

function clearAll() {
  if (!confirm('Gesamte Tafel leeren? Alle Einträge aller ' + BEDS.length +
               ' Bettplätze werden gelöscht.')) return;
  if (!confirm('Wirklich alle Bettplätze leeren? Rückgängig geht das nur über den Verlauf, ' +
               'und der endet mit dem Schließen der Seite.')) return;
  for (const bed of BEDS) state.beds[bed.id] = emptyBed();
  buildBody();
  renderStats();
  verlaufMerken('Tafel geleert');
  save();
  setSaveState('Tafel geleert');
}

/* ------------------------------------------------------------------ *
 * Oberfläche
 * ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ *
 * Blatt für die Physiotherapie
 * Derselbe Datenbestand, aber ein eigener Ausdruck: nur belegte
 * Bettplätze mit Bettplatz, Name, Fachdisziplin, Isolation, Pflegekraft
 * und Telefon – A4 quer, schwarzweiß und in möglichst großer Schrift.
 * ------------------------------------------------------------------ */
/* Fußzeile beider Ausdrucke. Der Zettel verlässt die Station – er soll
   erkennen lassen, wie alt er ist und wohin er nach dem Dienst gehört. */
function druckfussSetzen() {
  const jetzt = new Date();
  $('#printFoot').textContent = tafelTitel() +
    (INSTANZ ? ' (' + INSTANZ + ')' : '') +
    ' · gedruckt am ' + fullDate(isoToday()) + ' um ' + timeStr(jetzt) + ' Uhr' +
    ' · Enthält Patientendaten – nach Dienstende Entsorgung in Datenmüll!';
}

function visiteDrucken() {
  visiteEinpassen();
  window.print();
}

function physioDrucken() {
  const zeilen = setPhysioRowHeight();
  if (!zeilen && !confirm('Zurzeit ist kein Bettplatz belegt. Trotzdem drucken?')) return;
  document.body.classList.add('physio-druck');
  window.print();
  /* Manche Browser lösen afterprint nicht aus; deshalb zusätzlich hier. */
  setTimeout(() => document.body.classList.remove('physio-druck'), 1000);
}

function tickClock() {
  const d = new Date();
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  $('#clock').textContent = days[d.getDay()] + ', ' + pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' +
    d.getFullYear() + ' · ' + timeStr(d) + ':' + pad(d.getSeconds()) + ' Uhr';
  /* Im Zustand „Auto“ wechselt die Darstellung zur eingestellten Stunde. */
  if (themeMode === 'auto') applyTheme();
}

/* Liegt eine Datei logo.png neben index.html, ersetzt sie den Platzhalter.
   Das Bild kann bereits geladen sein, bevor der Listener greift. */
function initLogo() {
  const img = $('#logoImg');
  const zeigen = () => $('#logo').classList.add('has-image');
  if (img.complete && img.naturalWidth > 0) zeigen();
  img.addEventListener('load', zeigen);
}

/* ------------------------------------------------------------------ *
 * Hell, dunkel, automatisch
 * Ohne den automatischen Tag/Nacht-Modus schaltet die Schaltfläche wie
 * bisher zwischen hell und dunkel. Ist er in den Einstellungen aktiviert,
 * kommt der Zustand „Auto“ hinzu: Er richtet sich nach der Uhrzeit und
 * steht als Beschriftung neben dem Symbol.
 * ------------------------------------------------------------------ */
const THEME_MODES = ['auto', 'dark', 'light'];
let themeMode = 'light';

/* Liegt die aktuelle Uhrzeit in der eingestellten Nachtspanne? Die Spanne
   darf über Mitternacht reichen (z. B. 19:00 bis 07:00). */
function nightNow() {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const from = clockMinutes(settings.night.from);
  const to = clockMinutes(settings.night.to);
  if (from === to) return false;
  return from < to ? cur >= from && cur < to : cur >= from || cur < to;
}

function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  themeMode = THEME_MODES.includes(stored) ? stored : (settings.autoTheme ? 'auto' : 'light');
  applyTheme();
}

/* Übernimmt den Zustand in die Darstellung und beschriftet die Schaltfläche. */
function applyTheme() {
  if (!settings.autoTheme && themeMode === 'auto') {
    themeMode = nightNow() ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, themeMode);
  }
  const dark = themeMode === 'auto' ? nightNow() : themeMode === 'dark';
  const next = dark ? 'dark' : 'light';
  if (document.documentElement.dataset.theme !== next) document.documentElement.dataset.theme = next;

  const btn = $('#btnTheme');
  if (!btn) return;
  const label = $('#themeLabel');
  label.textContent = themeMode === 'auto' ? 'Auto' : '';
  btn.classList.toggle('is-auto', themeMode === 'auto');
  btn.title = themeMode === 'auto'
    ? 'Automatisch nach Uhrzeit (dunkel von ' + settings.night.from + ' bis ' +
      settings.night.to + ' Uhr) – klicken für dunkel'
    : themeMode === 'dark'
      ? 'Dunkel – klicken für hell'
      : 'Hell – klicken für ' + (settings.autoTheme ? 'automatisch' : 'dunkel');
}

function cycleTheme() {
  const order = settings.autoTheme ? THEME_MODES : ['light', 'dark'];
  const at = order.indexOf(themeMode);
  themeMode = order[(at + 1) % order.length];
  localStorage.setItem(THEME_KEY, themeMode);
  applyTheme();
}

function init() {
  initLogo();
  initTheme();
  applySettings();
  buildHead();
  buildBody();
  renderStation();
  renderPhones();
  renderStats();
  initHelp();
  initDragDrop();
  initKeyboardNav();
  initAutoSize();
  visiteEinpassen();
  initPrivacy();
  initSaver();
  initSettings();
  initSlideFolderInput();
  initVerlauf();
  initStatistik();
  initUebergabe();
  initBackup();
  initCombo();
  standMerken();
  tickClock();
  setInterval(tickClock, 1000);

  if (state.saved) setSaveState('Zuletzt gespeichert um ' + timeStr(new Date(state.saved)));

  for (const [selector, key] of NOTE_FIELDS) {
    const field = $(selector);
    field.addEventListener('input', () => { state.station[key] = field.value; save(); });
  }
  $('#maxBetten').addEventListener('input', event => {
    state.station.maxBetten = event.target.value;
    updateMaxTitle();
    save();
  });
  $('#meldestatus').addEventListener('change', event => {
    state.station.meldestatus = event.target.value;
    $('#meldeCard').dataset.melde = event.target.value;
    save();
  });
  $('#btnPrint').addEventListener('click', visiteDrucken);
  $('#btnPrintPhysio').addEventListener('click', physioDrucken);
  $('#btnTheme').addEventListener('click', cycleTheme);

  $('#expJson').addEventListener('click', () => { exportJson(); $('#exportDlg').close(); });
  $('#expCsv').addEventListener('click', () => { exportCsv(); $('#exportDlg').close(); });
  $('#expCancel').addEventListener('click', () => $('#exportDlg').close());

  $('#fileInput').addEventListener('change', event => {
    const file = event.target.files[0];
    if (file) importJson(file);
    event.target.value = '';
  });

  $('#multiOk').addEventListener('click', commitMulti);
  $('#multiCancel').addEventListener('click', () => $('#multiDlg').close());
  $('#multiClear').addEventListener('click', () => {
    multiCtx.selected.clear();
    if (multiCtx.germs) multiCtx.germs.clear();
    renderMultiOpts();
  });
  $('#multiAdd').addEventListener('click', addCustom);
  $('#multiDateMon').addEventListener('click', () => { $('#multiDate').value = nextMonday(1); });
  $('#multiDateMon2').addEventListener('click', () => { $('#multiDate').value = nextMonday(2); });
  $('#multiDateDays').addEventListener('click', () => {
    $('#multiDate').value = addDays('', settings.norton.tage);
  });
  $('#multiDateOff').addEventListener('click', () => { $('#multiDate').value = ''; });
  $('#multiCustom').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); addCustom(); }
  });

  /* Offene Eingaben sichern, bevor die Seite verlassen oder verdeckt wird */
  window.addEventListener('beforeprint', () => {
    wake();
    /* Auch bei Strg + P, nicht nur über die Schaltfläche. */
    visiteEinpassen();
    druckfussSetzen();
  });
  /* Nach dem Druck gilt wieder die gewöhnliche Ansicht. */
  window.addEventListener('afterprint', () => document.body.classList.remove('physio-druck'));
  window.addEventListener('resize', () => {
    measureSticky();
    updateStickyHeader();
    if (saverOn) fitSlide();
  });
  window.addEventListener('beforeunload', writeNow);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') writeNow();
  });

  /* Änderungen in einem zweiten Tab übernehmen */
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY) return;
    state = load();
    buildBody();
    renderStation();
    renderStats();
    setSaveState('Aktualisiert (Änderung in anderem Fenster)');
  });
}

document.addEventListener('DOMContentLoaded', init);
