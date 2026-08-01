/* Belegungstafel Intensivstation – Einstellungsfenster
 *
 * Teil der Anwendung; die Dateien werden in der in index.html angegebenen
 * Reihenfolge geladen und teilen sich einen gemeinsamen Namensraum.
 */
'use strict';

/* ------------------------------------------------------------------ *
 * Einstellungen
 * ------------------------------------------------------------------ */
let draft = null;
let activeTab = 'allgemein';

/* Zugang zu den Einstellungen. Der Schutz verhindert versehentliches
   Verstellen auf dem Stationsrechner; er ersetzt keine Zugriffskontrolle,
   da das Passwort im Quelltext der Seite steht. */
const SETTINGS_PASSWORD = 'Vinzenz1';

function askPassword() {
  const dlg = $('#pwDlg');
  $('#pwInput').value = '';
  $('#pwError').hidden = true;
  dlg.showModal();
  $('#pwInput').focus();
}

function openSettings() {
  draft = copy(settings);
  activeTab = 'allgemein';
  renderTabs();
  renderPane();
  $('#settingsDlg').showModal();
}

function renderTabs() {
  const box = $('#settingsTabs');
  box.replaceChildren();
  const tabs = [
    { key: 'allgemein', label: 'Allgemein' },
    { key: 'schoner', label: 'Bildschirmschoner' },
    { key: 'statistik', label: 'Statistik' },
    { key: 'header', label: 'Spaltenköpfe' },
    { key: 'betten', label: 'Bettplätze' },
    ...OPTION_CATEGORIES,
    { key: 'daten', label: 'Daten' }
  ];
  for (const tab of tabs) {
    const btn = el('button', 'tab' + (tab.key === activeTab ? ' active' : ''), tab.label);
    btn.type = 'button';
    btn.addEventListener('click', () => { activeTab = tab.key; renderTabs(); renderPane(); });
    box.appendChild(btn);
  }
  $('#settingsReset').hidden = activeTab === 'allgemein' || activeTab === 'daten';
}

function renderPane() {
  const pane = $('#settingsPane');
  pane.replaceChildren();
  if (activeTab === 'allgemein') return renderGeneralPane(pane);
  if (activeTab === 'schoner') return renderSaverPane(pane);
  if (activeTab === 'statistik') return renderStatistikPane(pane);
  if (activeTab === 'daten') return renderDataPane(pane);
  if (activeTab === 'header') return renderHeaderPane(pane);
  if (activeTab === 'betten') return renderBedPane(pane);

  const cat = OPTION_CATEGORIES.find(c => c.key === activeTab);
  pane.appendChild(el('h3', null, cat.label));
  if (cat.hint) pane.appendChild(el('p', 'panehint', cat.hint));

  if (hatStil(cat)) renderStyleBlock(pane, cat);

  const list = el('div', 'entrylist');
  pane.appendChild(list);
  renderEntries(list, cat);

  const add = el('button', 'addentry', '+ Eintrag hinzufügen');
  add.type = 'button';
  add.addEventListener('click', () => {
    draft.options[cat.key].push(cat.kind === 'phone' ? { value: '', label: '' } : '');
    renderEntries(list, cat);
    const inputs = list.querySelectorAll('input');
    if (inputs.length) inputs[inputs.length - (cat.kind === 'phone' ? 2 : 1)].focus();
  });
  pane.appendChild(add);
}

function renderEntries(list, cat) {
  const entries = draft.options[cat.key];
  list.replaceChildren();

  entries.forEach((entry, index) => {
    const row = el('div', 'entry' + (cat.kind === 'phone' ? ' entry-phone' : ''));

    if (cat.kind === 'phone') {
      row.appendChild(entryInput(entry.value, 'Nummer', 'nr', value => { entry.value = value; }));
      row.appendChild(entryInput(entry.label, 'Bezeichnung', '', value => { entry.label = value; }));
    } else {
      row.appendChild(entryInput(entry, 'Bezeichnung', '', value => { entries[index] = value; }));
    }

    row.appendChild(moveButton('↑', 'nach oben', () => {
      if (index === 0) return;
      [entries[index - 1], entries[index]] = [entries[index], entries[index - 1]];
      renderEntries(list, cat);
    }));
    row.appendChild(moveButton('↓', 'nach unten', () => {
      if (index === entries.length - 1) return;
      [entries[index + 1], entries[index]] = [entries[index], entries[index + 1]];
      renderEntries(list, cat);
    }));
    const remove = moveButton('×', 'entfernen', () => {
      entries.splice(index, 1);
      renderEntries(list, cat);
    });
    remove.classList.add('remove');
    row.appendChild(remove);
    list.appendChild(row);
  });

  if (!entries.length) list.appendChild(el('p', 'panehint', 'Noch keine Einträge.'));
}

/* Darstellung einer ganzen Spalte: Textfarbe, Hintergrundfarbe, Rahmen */
function renderStyleBlock(pane, cat) {
  const block = el('div', 'styleblock');
  const style = draft.styles[cat.key] || (draft.styles[cat.key] = {});

  const redraw = () => {
    const next = el('div', 'styleblock');
    block.replaceWith(next);
    fillStyleBlock(next, cat, redraw);
  };
  fillStyleBlock(block, cat, redraw);
  pane.appendChild(block);
  return block;
}

function fillStyleBlock(block, cat, redraw) {
  const style = draft.styles[cat.key];
  const set = (key, value) => {
    if (value) style[key] = value;
    else delete style[key];
    redraw();
  };

  const head = el('div', 'stylehead');
  head.appendChild(el('span', 'styletitle', 'Darstellung in der Tabelle'));
  const sample = el('span', 'sample', 'Beispiel');
  if (style.fg) sample.style.color = style.fg;
  if (style.bg) sample.style.background = style.bg;
  if (style.border) sample.style.border = '1px ' + style.border + ' ' + (style.fg || 'currentColor');
  head.appendChild(sample);
  block.appendChild(head);

  block.appendChild(paletteRow('Textfarbe', style.fg, value => set('fg', value)));
  block.appendChild(paletteRow('Hintergrund', style.bg, value => set('bg', value)));

  const row = el('div', 'palrow');
  row.appendChild(el('span', 'palname', 'Rahmen'));
  const border = el('select', 'borderpick');
  for (const [value, name] of BORDER_STYLES) border.appendChild(new Option(name, value));
  border.value = style.border || '';
  border.addEventListener('change', () => set('border', border.value));
  row.appendChild(border);
  block.appendChild(row);
}

function paletteRow(label, current, onPick) {
  const row = el('div', 'palrow');
  row.appendChild(el('span', 'palname', label));
  const grid = el('div', 'swatches');

  const none = el('button', 'swatch none' + (current ? '' : ' active'));
  none.type = 'button';
  none.title = 'Standard';
  none.addEventListener('click', () => onPick(''));
  grid.appendChild(none);

  for (const color of PALETTE) {
    const item = el('button', 'swatch' + (current === color ? ' active' : ''));
    item.type = 'button';
    item.title = color;
    item.style.background = color;
    item.addEventListener('click', () => onPick(color));
    grid.appendChild(item);
  }
  row.appendChild(grid);
  return row;
}

function entryInput(value, placeholder, cls, onInput) {
  const input = el('input', cls);
  input.type = 'text';
  input.value = value;
  input.placeholder = placeholder;
  input.addEventListener('input', () => onInput(input.value));
  return input;
}

function moveButton(text, title, onClick) {
  const btn = el('button', 'entrybtn', text);
  btn.type = 'button';
  btn.title = title;
  btn.addEventListener('click', onClick);
  return btn;
}

function checkRow(label, checked, onChange) {
  const row = el('label', 'setrow');
  const box = el('input');
  box.type = 'checkbox';
  box.checked = checked;
  box.addEventListener('change', () => onChange(box.checked));
  row.appendChild(box);
  row.appendChild(el('span', null, label));
  return row;
}

function timeField(value, onInput) {
  const field = el('input', 'timefield');
  field.type = 'time';
  field.value = value;
  field.addEventListener('input', () => {
    if (CLOCK.test(field.value)) onInput(field.value);
  });
  return field;
}

function numberRow(label, value, limits, onInput) {
  const row = el('label', 'setrow');
  row.appendChild(el('span', null, label));
  const field = el('input');
  field.type = 'number';
  field.min = String(limits.min);
  field.max = String(limits.max);
  field.step = String(limits.step || 1);
  field.value = String(value);
  field.addEventListener('input', () => onInput(parseInt(field.value, 10) || 0));
  row.appendChild(field);
  row.appendChild(el('span', 'unit', limits.unit || 'Sekunden'));
  row.field = field;
  return row;
}

function renderGeneralPane(pane) {
  pane.appendChild(el('h3', null, '1. Sichtschutz'));
  pane.appendChild(el('p', 'panehint',
    'Blendet die patientenbezogenen Angaben aus, wenn eine Zeit lang keine Eingabe erfolgt.'));

  const time = numberRow('Zeit ohne Eingabe', draft.privacy.seconds, { min: 5, max: 3600, step: 5 },
    value => { draft.privacy.seconds = value; });
  time.field.disabled = !draft.privacy.on;

  pane.appendChild(checkRow('Sichtschutz aktiv', draft.privacy.on, on => {
    draft.privacy.on = on;
    time.field.disabled = !on;
  }));
  pane.appendChild(time);

  pane.appendChild(el('h3', null, '2. Bildschirmschoner'));
  pane.appendChild(el('p', 'panehint',
    'Startet nach der eingestellten Zeit ohne Eingabe eine Diaschau aus den Inhalten unter ' +
    '„Bildschirmschoner“. Unabhängig davon lässt sich die Schau jederzeit über die ' +
    'Schaltfläche im Seitenkopf starten; jede Eingabe beendet sie wieder.'));

  const saverTime = numberRow('Zeit ohne Eingabe', draft.screensaver.seconds,
    { min: SAVER_MIN, max: 3600, step: 10 }, value => { draft.screensaver.seconds = value; });
  saverTime.field.disabled = !draft.screensaver.on;

  pane.appendChild(checkRow('Bildschirmschoner aktiv', draft.screensaver.on, on => {
    draft.screensaver.on = on;
    saverTime.field.disabled = !on;
  }));
  pane.appendChild(saverTime);

  pane.appendChild(el('h3', null, '3. Tag- und Nachtansicht'));
  pane.appendChild(el('p', 'panehint',
    'Mit dieser Option schaltet die Schaltfläche ◐ im Seitenkopf durch drei Zustände: ' +
    '„Auto“, dunkel und hell. Im Zustand Auto – erkennbar an der Beschriftung neben dem ' +
    'Symbol – stellt sich die Tafel nach der Uhrzeit ein. Ohne diese Option schaltet die ' +
    'Schaltfläche wie bisher nur zwischen hell und dunkel um.'));

  const nightRow = el('div', 'setrow nightrow');
  nightRow.appendChild(el('span', null, 'Dunkel von'));
  const from = timeField(draft.night.from, value => { draft.night.from = value; });
  nightRow.appendChild(from);
  nightRow.appendChild(el('span', null, 'bis'));
  const to = timeField(draft.night.to, value => { draft.night.to = value; });
  nightRow.appendChild(to);
  const nightBack = el('button', 'entrybtn zoomreset', 'Vorgabe');
  nightBack.type = 'button';
  nightBack.title = DEFAULT_NIGHT.from + ' bis ' + DEFAULT_NIGHT.to + ' Uhr';
  nightBack.addEventListener('click', () => {
    draft.night = { ...DEFAULT_NIGHT };
    from.value = draft.night.from;
    to.value = draft.night.to;
  });
  nightRow.appendChild(nightBack);

  pane.appendChild(checkRow('Automatische Tag-/Nachtansicht', draft.autoTheme, on => {
    draft.autoTheme = on;
    for (const field of [from, to, nightBack]) field.disabled = !on;
  }));
  pane.appendChild(nightRow);
  for (const field of [from, to, nightBack]) field.disabled = !draft.autoTheme;
  pane.appendChild(el('p', 'panehint',
    'Zeitspanne, in der die Tafel im Zustand „Auto“ dunkel dargestellt wird; sie darf über ' +
    'Mitternacht reichen. Der Wechsel erfolgt im laufenden Betrieb.'));

  pane.appendChild(el('h3', null, '4. Größe der Darstellung'));
  pane.appendChild(el('p', 'panehint',
    'Vergrößert oder verkleinert die ganze Tafel – Kopfbereich, Tabelle und die Textfelder ' +
    'darunter – passend zu Monitor und Auflösung. Die Änderung ist sofort im Hintergrund zu ' +
    'sehen und gilt erst mit „Übernehmen“ dauerhaft. Dialoge, Hilfe, Bildschirmschoner und ' +
    'der Ausdruck bleiben unverändert.'));

  const row = el('div', 'setrow zoomrow');
  row.appendChild(el('span', null, 'Zoom'));
  const slider = el('input', 'zoomslider');
  slider.type = 'range';
  slider.min = String(ZOOM_MIN);
  slider.max = String(ZOOM_MAX);
  slider.step = '5';
  slider.value = String(draft.zoom);
  slider.setAttribute('aria-label', 'Größe der Darstellung in Prozent');
  const value = el('span', 'zoomvalue', draft.zoom + ' %');
  slider.addEventListener('input', () => {
    draft.zoom = clampZoom(parseInt(slider.value, 10));
    value.textContent = draft.zoom + ' %';
    applyZoom(draft.zoom);
  });
  row.appendChild(slider);
  row.appendChild(value);

  const back = el('button', 'entrybtn zoomreset', '100 %');
  back.type = 'button';
  back.title = 'auf 100 % zurücksetzen';
  back.addEventListener('click', () => {
    draft.zoom = 100;
    slider.value = '100';
    value.textContent = '100 %';
    applyZoom(100);
  });
  row.appendChild(back);
  pane.appendChild(row);
}

/* Beschriftung der Spaltenköpfe */
function renderHeaderPane(pane) {
  pane.appendChild(el('h3', null, 'Spaltenköpfe'));
  pane.appendChild(el('p', 'panehint',
    'Beschriftung der Tabellenköpfe. Ein leeres Feld lässt den Kopf frei; ' +
    'ein Bindestrich am Zeilenende ist nicht nötig, lange Wörter werden automatisch getrennt.'));

  const list = el('div', 'entrylist');
  for (const col of COLUMNS) {
    const row = el('div', 'entry entry-header');
    row.appendChild(el('span', 'headname', DEFAULT_HEADS[col.key].label));
    const value = draft.headers[col.key] !== undefined
      ? draft.headers[col.key]
      : DEFAULT_HEADS[col.key].head;
    row.appendChild(entryInput(value.replace(/\u00AD/g, ''), DEFAULT_HEADS[col.key].label, '',
      text => { draft.headers[col.key] = text; }));
    list.appendChild(row);
  }
  pane.appendChild(list);
}

/* Inhalte der Diaschau: Dateien aus dem Ordner „slides“ und eigene Hinweise */
function renderSaverPane(pane) {
  pane.appendChild(el('h3', null, 'Bildschirmschoner'));
  pane.appendChild(el('p', 'panehint',
    'Gezeigt werden alle angehakten Einträge nacheinander – in der Reihenfolge dieser Liste ' +
    'oder gemischt, siehe „Reihenfolge zufällig“. ' +
    'Dateien (PDF, PNG, JPEG) gehören in den Ordner „slides“ neben index.html. ' +
    '„Ordner wählen“ öffnet den Dateidialog und übernimmt alle Dateien des Ordners – das ' +
    'funktioniert auch ohne Webserver. „Ordner einlesen“ kommt ohne Dialog aus, setzt aber ' +
    'einen Webserver voraus (slides/slides.json oder Verzeichnisübersicht). Einzelne Namen ' +
    'lassen sich außerdem von Hand eintragen.'));

  pane.appendChild(numberRow('Anzeigedauer je Eintrag', draft.screensaver.defaultSeconds,
    { min: SAVER_ITEM_MIN, max: 600, step: 1 }, value => { draft.screensaver.defaultSeconds = value; }));
  pane.appendChild(el('p', 'panehint',
    'Gilt für alle Einträge ohne eigene Angabe in der Spalte „Dauer“.'));

  pane.appendChild(checkRow('Reihenfolge zufällig', draft.screensaver.shuffle, on => {
    draft.screensaver.shuffle = on;
  }));
  pane.appendChild(el('p', 'panehint',
    'Mischt die Einträge bei jedem Start der Schau und nach jedem vollen Durchlauf neu. ' +
    'Ohne Haken laufen sie in der Reihenfolge dieser Liste.'));

  const status = el('p', 'panehint slidestatus');
  const list = el('div', 'entrylist');
  /* Der Dateidialog liegt außerhalb des Fensters und meldet sich später
     zurück; er braucht deshalb den Zugriff auf diese beiden Bereiche. */
  slideUI = { list, status };

  const bar = el('div', 'slidebar');
  const pick = el('button', 'addentry', 'Ordner wählen …');
  pick.type = 'button';
  pick.addEventListener('click', () => $('#folderInput').click());
  bar.appendChild(pick);

  const scan = el('button', 'addentry', 'Ordner einlesen');
  scan.type = 'button';
  scan.addEventListener('click', async () => {
    scan.disabled = true;
    status.textContent = 'Ordner „slides“ wird gelesen …';
    const found = await scanSlideFolder();
    scan.disabled = false;
    const added = mergeFoundSlides(draft.screensaver.items, found);
    markMissingSlides(draft.screensaver.items, found);
    renderSlideEntries(list, status);
    status.textContent = (found.hinweis ? found.hinweis + ' ' : '') + (!found.length
      ? 'Im Ordner „slides“ wurde keine Datei gefunden. Entweder liegt dort nichts, oder der ' +
        'Browser darf das Verzeichnis nicht lesen – dann bitte slides/slides.json pflegen oder ' +
        'den Dateinamen von Hand eintragen.'
      : found.length + (found.length === 1 ? ' Datei gefunden' : ' Dateien gefunden') +
        (added ? ', ' + added + ' neu übernommen.' : ', nichts Neues.'));
    status.classList.toggle('warnstatus', !!found.hinweis);
  });
  bar.appendChild(scan);

  const addFile = el('button', 'addentry', '+ Datei von Hand');
  addFile.type = 'button';
  addFile.addEventListener('click', () => {
    draft.screensaver.items.push(slideItem({ kind: 'datei', file: '' }));
    renderSlideEntries(list, status);
    focusLast(list, '.slidefile');
  });
  bar.appendChild(addFile);

  const addText = el('button', 'addentry', '+ Eigener Hinweis');
  addText.type = 'button';
  addText.addEventListener('click', () => {
    draft.screensaver.items.push(slideItem({ kind: 'text' }));
    renderSlideEntries(list, status);
    focusLast(list, '.slidetitle');
  });
  bar.appendChild(addText);

  pane.appendChild(bar);
  pane.appendChild(status);
  pane.appendChild(list);
  renderSlideEntries(list, status);
}

/* Ordner über den Dateidialog übernehmen. Der Browser darf ein Verzeichnis
   nicht von sich aus lesen; nach dieser einmaligen Auswahl kennt die Tafel
   aber alle Dateinamen – auch ohne Webserver. Angezeigt werden die Dateien
   weiterhin über den Pfad slides/…, die Auswahl dient nur den Namen. */
let slideUI = null;

function initSlideFolderInput() {
  const input = $('#folderInput');
  input.addEventListener('change', async () => {
    const files = [...input.files];
    input.value = '';
    if (!slideUI || !draft || !files.length) return;
    const { list, status } = slideUI;

    const ordner = (files[0].webkitRelativePath || '').split('/')[0] || '';
    const dateien = files.filter(file => SLIDE_TYPES.test(file.name))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));
    const namen = [];
    for (const file of dateien) {
      if (!namen.some(n => n.toLowerCase() === file.name.toLowerCase())) namen.push(file.name);
    }

    const added = mergeFoundSlides(draft.screensaver.items, namen);
    markMissingSlides(draft.screensaver.items, namen);
    renderSlideEntries(list, status);

    const fremd = ordner && ordner.toLowerCase() !== 'slides'
      ? 'Achtung: gewählt wurde der Ordner „' + ordner + '“. Die Dateien müssen im Ordner ' +
        '„slides“ neben index.html liegen, sonst bleibt die Anzeige leer. '
      : '';
    status.textContent = fremd + (!namen.length
      ? 'In diesem Ordner liegt keine Datei der Art PDF, PNG oder JPEG.'
      : namen.length + (namen.length === 1 ? ' Datei übernommen' : ' Dateien gefunden') +
        (added ? ', ' + added + ' neu übernommen.' : ', nichts Neues.') +
        ' Seitenformate werden gelesen …');
    status.classList.toggle('warnstatus', !!fremd);

    /* Seitenverhältnis der PDF gleich aus den gewählten Dateien lesen –
       ohne Webserver ist das später nicht mehr möglich. */
    let gelesen = 0;
    for (const file of dateien) {
      if (!/\.pdf$/i.test(file.name)) continue;
      const ratio = aspectFromPdfBytes(new Uint8Array(await file.arrayBuffer()));
      if (!ratio) continue;
      pdfRatios.set(SLIDE_DIR + encodeURIComponent(file.name), ratio);
      for (const item of draft.screensaver.items) {
        if (item.kind === 'datei' && item.file.toLowerCase() === file.name.toLowerCase()) {
          item.ratio = ratio;
          gelesen++;
        }
      }
    }
    if (namen.length) {
      status.textContent = status.textContent.replace('Seitenformate werden gelesen …',
        gelesen ? 'Seitenformat von ' + gelesen + ' PDF übernommen.' : '');
    }
  });
}

function focusLast(list, selector) {
  const fields = list.querySelectorAll(selector);
  if (fields.length) fields[fields.length - 1].focus();
}

/* Neu gefundene Dateien hinten anfügen; bekannte behalten ihre Einstellungen. */
function mergeFoundSlides(items, found) {
  let added = 0;
  for (const file of found) {
    if (items.some(item => item.kind === 'datei' && item.file.toLowerCase() === file.toLowerCase())) continue;
    items.push(slideItem({ kind: 'datei', file }));
    added++;
  }
  return added;
}

/* Nur kennzeichnen, wenn überhaupt etwas gefunden wurde – sonst wäre jeder
   Eintrag als fehlend markiert, obwohl bloß das Auslesen nicht möglich war. */
function markMissingSlides(items, found) {
  for (const item of items) {
    if (item.kind !== 'datei') continue;
    item.missing = found.length > 0 &&
      !found.some(file => file.toLowerCase() === item.file.toLowerCase());
  }
}

function renderSlideEntries(list, status) {
  const items = draft.screensaver.items;
  list.replaceChildren();

  items.forEach((item, index) => {
    const row = el('div', 'entry entry-slide' + (item.on ? '' : ' off'));

    const box = el('input', 'slideon');
    box.type = 'checkbox';
    box.checked = item.on;
    box.title = 'Eintrag zeigen';
    box.addEventListener('change', () => {
      item.on = box.checked;
      row.classList.toggle('off', !item.on);
    });
    row.appendChild(box);

    const main = el('div', 'slidemain');
    if (item.kind === 'text') {
      row.appendChild(el('span', 'slidekind', 'Hinweis'));
      main.appendChild(entryInput(item.title, 'Überschrift', 'slidetitle',
        value => { item.title = value; }));
      const text = el('textarea', 'slidetext');
      text.rows = 2;
      text.value = item.text;
      text.placeholder = 'Infotext';
      text.addEventListener('input', () => { item.text = text.value; });
      main.appendChild(text);
    } else {
      row.appendChild(el('span', 'slidekind', /\.pdf$/i.test(item.file) ? 'PDF' : 'Bild'));
      main.appendChild(entryInput(item.file, 'dateiname.pdf', 'slidefile', value => {
        item.file = slideName(value);
        item.missing = false;
        item.ratio = 0;   /* neues Ziel, altes Seitenformat verwerfen */
      }));
      if (item.missing) main.appendChild(el('span', 'slidewarn', 'im Ordner nicht gefunden'));
    }
    row.appendChild(main);

    /* Seitenangabe nur für PDF – so lässt sich eine mehrseitige Datei
       mehrfach mit verschiedenen Seiten eintragen. */
    const seite = el('input', 'slidepage');
    if (item.kind === 'datei' && /\.pdf$/i.test(item.file)) {
      seite.type = 'number';
      seite.min = '1';
      seite.max = '999';
      seite.value = String(item.page || 1);
      seite.title = 'Seite des PDF';
      seite.addEventListener('input', () => {
        item.page = Math.min(999, Math.max(1, parseInt(seite.value, 10) || 1));
      });
      row.appendChild(seite);
      row.appendChild(el('span', 'unit', 'S.'));
    } else {
      row.appendChild(el('span'));
      row.appendChild(el('span'));
    }

    const secs = el('input', 'slidesec');
    secs.type = 'number';
    secs.min = String(SAVER_ITEM_MIN);
    secs.max = '600';
    secs.value = item.seconds > 0 ? String(item.seconds) : '';
    secs.placeholder = String(draft.screensaver.defaultSeconds);
    secs.title = 'Dauer in Sekunden, leer = Vorgabe';
    secs.addEventListener('input', () => {
      const value = parseInt(secs.value, 10);
      item.seconds = Number.isFinite(value) && value > 0 ? value : null;
    });
    row.appendChild(secs);
    row.appendChild(el('span', 'unit', 's'));

    row.appendChild(moveButton('↑', 'nach oben', () => {
      if (index === 0) return;
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
      renderSlideEntries(list, status);
    }));
    row.appendChild(moveButton('↓', 'nach unten', () => {
      if (index === items.length - 1) return;
      [items[index + 1], items[index]] = [items[index], items[index + 1]];
      renderSlideEntries(list, status);
    }));
    const remove = moveButton('×', 'entfernen', () => {
      items.splice(index, 1);
      renderSlideEntries(list, status);
    });
    remove.classList.add('remove');
    row.appendChild(remove);

    list.appendChild(row);
  });

  if (!items.length) {
    list.appendChild(el('p', 'panehint',
      'Noch keine Inhalte. Ohne Inhalte zeigt der Bildschirmschoner nur Uhrzeit und Datum.'));
  }
}

/* Statistik: Erfassung, Schichten, Aufbewahrung */
function renderStatistikPane(pane) {
  const stat = draft.statistik;

  pane.appendChild(el('h3', null, 'Statistik je Schicht'));
  pane.appendChild(el('p', 'panehint',
    'Die Tafel legt in regelmäßigen Abständen eine Momentaufnahme ab: belegte Betten, ' +
    'maximale Bettenzahl, Isolationen (bestätigt oder Verdacht), Beatmungen und Dialysen. ' +
    'Jede Aufnahme gehört zu der Schicht, die gerade läuft, und ersetzt die vorherige ' +
    'derselben Schicht – am Ende steht je Schicht der zuletzt gesehene Stand. Erfasst wird ' +
    'nur, solange die Tafel geöffnet ist. Externe Dialysen zählen nicht mit, da sie als ' +
    'Intervention „ext. Dial.“ geführt werden.'));

  const takt = numberRow('Abstand der Aufnahmen', stat.intervall,
    { min: 1, max: 120, step: 1, unit: 'Minuten' }, value => { stat.intervall = value; });
  const tage = numberRow('Aufbewahrung', stat.tage,
    { min: 7, max: 3650, step: 1, unit: 'Tage' }, value => { stat.tage = value; });

  pane.appendChild(checkRow('Erfassung aktiv', stat.on, on => {
    stat.on = on;
    takt.field.disabled = !on;
    tage.field.disabled = !on;
  }));
  pane.appendChild(takt);
  pane.appendChild(tage);
  takt.field.disabled = !stat.on;
  tage.field.disabled = !stat.on;

  pane.appendChild(checkRow('Schaltfläche in der Tafel zeigen', stat.button, on => {
    stat.button = on;
  }));
  pane.appendChild(el('p', 'panehint',
    'Die runde Schaltfläche unten rechts über der Hilfe öffnet die Auswertung. Ohne sie ' +
    'bleibt die Erfassung bestehen, die Auswertung ist dann nur über diese Einstellungen ' +
    'erreichbar.'));

  pane.appendChild(el('h3', null, 'Schichten'));
  pane.appendChild(el('p', 'panehint',
    'Bezeichnung und Beginn jeder Schicht. Die Schichten schließen lückenlos aneinander an; ' +
    'die letzte reicht über Mitternacht bis zum Beginn der ersten.'));

  const liste = el('div', 'entrylist');
  pane.appendChild(liste);
  renderSchichtEntries(liste);

  const add = el('button', 'addentry', '+ Schicht hinzufügen');
  add.type = 'button';
  add.addEventListener('click', () => {
    stat.schichten.push({ key: 'schicht' + Math.random().toString(36).slice(2, 7),
                          name: '', start: '12:00' });
    renderSchichtEntries(liste);
  });
  pane.appendChild(add);

  const zeigen = el('button', 'addentry', 'Auswertung öffnen');
  zeigen.type = 'button';
  zeigen.addEventListener('click', () => {
    $('#settingsDlg').close();
    oeffneStatistik();
  });
  pane.appendChild(zeigen);

  const leeren = el('button', 'addentry danger', 'Erfasste Daten löschen');
  leeren.type = 'button';
  leeren.addEventListener('click', () => {
    const anzahl = statistikLaden().length;
    if (!anzahl) {
      setSaveState('Es ist nichts erfasst.');
      return;
    }
    if (!confirm('Alle ' + anzahl + ' erfassten Schichten löschen? Das lässt sich nicht ' +
                 'rückgängig machen.')) return;
    statistikSpeichern([]);
    setSaveState('Erfasste Statistik gelöscht');
  });
  pane.appendChild(leeren);
}

function renderSchichtEntries(liste) {
  const schichten = draft.statistik.schichten;
  liste.replaceChildren();

  schichten.forEach((schicht, index) => {
    const row = el('div', 'entry entry-schicht');
    row.appendChild(entryInput(schicht.name, 'Bezeichnung', '', value => { schicht.name = value; }));
    row.appendChild(el('span', 'palname', 'ab'));
    row.appendChild(timeField(schicht.start, value => { schicht.start = value; }));
    const remove = moveButton('×', 'entfernen', () => {
      if (schichten.length <= 2) {
        alert('Mindestens zwei Schichten sind nötig.');
        return;
      }
      schichten.splice(index, 1);
      renderSchichtEntries(liste);
    });
    remove.classList.add('remove');
    row.appendChild(remove);
    liste.appendChild(row);
  });
}

/* Bettplätze */
function renderBedPane(pane) {
  pane.appendChild(el('h3', null, 'Bettplätze'));
  pane.appendChild(el('p', 'panehint',
    'Bezeichnung, Reihenfolge und Anzahl der Bettplätze. Ein umbenannter Bettplatz behält ' +
    'seine Einträge; ein entfernter Bettplatz wird mit seinen Einträgen gelöscht.'));

  const list = el('div', 'entrylist');
  pane.appendChild(list);
  renderBedEntries(list);

  const add = el('button', 'addentry', '+ Bettplatz hinzufügen');
  add.type = 'button';
  add.addEventListener('click', () => {
    draft.beds.push({ id: newBedId(), label: '' });
    renderBedEntries(list);
    const inputs = list.querySelectorAll('input');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });
  pane.appendChild(add);
}

function renderBedEntries(list) {
  const beds = draft.beds;
  list.replaceChildren();

  beds.forEach((bed, index) => {
    const row = el('div', 'entry');
    row.appendChild(entryInput(bed.label, 'Bezeichnung', '', value => { bed.label = value; }));
    row.appendChild(moveButton('↑', 'nach oben', () => {
      if (index === 0) return;
      [beds[index - 1], beds[index]] = [beds[index], beds[index - 1]];
      renderBedEntries(list);
    }));
    row.appendChild(moveButton('↓', 'nach unten', () => {
      if (index === beds.length - 1) return;
      [beds[index + 1], beds[index]] = [beds[index], beds[index + 1]];
      renderBedEntries(list);
    }));
    const remove = moveButton('×', 'entfernen', () => {
      const data = state.beds[bed.id];
      const belegt = data && COLUMNS.some(c => c.type !== 'bed' && isSet(data[c.key]));
      if (belegt && !confirm('Bettplatz ' + bed.label + ' enthält Einträge. Wirklich entfernen?')) return;
      beds.splice(index, 1);
      renderBedEntries(list);
    });
    remove.classList.add('remove');
    row.appendChild(remove);
    list.appendChild(row);
  });
}

function renderDataPane(pane) {
  pane.appendChild(el('h3', null, 'Daten'));
  pane.appendChild(el('p', 'panehint',
    'Export und Import umfassen die Belegung, die Angaben zur Schicht und die Einstellungen. ' +
    'Die Schaltflächen schließen die Einstellungen; noch nicht übernommene Änderungen an den ' +
    'Listen gehen dabei verloren.'));

  const actions = el('div', 'dataactions');
  const add = (label, hint, onClick, danger) => {
    const row = el('div', 'dataaction');
    const btn = el('button', danger ? 'danger' : '', label);
    btn.type = 'button';
    btn.addEventListener('click', onClick);
    row.appendChild(btn);
    row.appendChild(el('span', 'panehint', hint));
    actions.appendChild(row);
  };

  add('Export …', 'als JSON zum Wiedereinlesen oder als CSV für Excel', () => {
    $('#settingsDlg').close();
    $('#exportDlg').showModal();
  });
  add('Import …', 'eine zuvor exportierte JSON-Datei einlesen', () => {
    $('#settingsDlg').close();
    $('#fileInput').click();
  });
  add('Tafel leeren', 'alle Bettplätze zurücksetzen; Angaben zur Schicht bleiben stehen', () => {
    $('#settingsDlg').close();
    clearAll();
  }, true);

  pane.appendChild(actions);
  renderVorgabeBlock(pane);
  renderBackupBlock(pane);
  renderInstanzBlock(pane);
}

/* Vorgabe der Station: js/vorgaben.js erzeugen */
function renderVorgabeBlock(pane) {
  pane.appendChild(el('h3', null, 'Vorgabe der Station'));
  pane.appendChild(el('p', 'panehint',
    'Die Datei js/vorgaben.js bestimmt, mit welchen Einstellungen die Tafel startet, wenn im ' +
    'Browser noch nichts gespeichert ist – und worauf „Kategorie zurücksetzen“ zurückführt. ' +
    'Die Schaltfläche erzeugt sie aus den zuletzt übernommenen Einstellungen; sie enthält ' +
    'keine Patientendaten und darf weitergegeben werden.'));

  const status = el('p', 'panehint slidestatus vorgabestatus');
  const stand = vorgabeStand();
  status.textContent = stand
    ? 'Hinterlegte Vorgabe vom ' + fullDate(stand.slice(0, 10)) + ', ' +
      timeStr(new Date(stand)) + ' Uhr.'
    : 'Zurzeit ist keine eigene Vorgabe hinterlegt – es gelten die ausgelieferten Werte.';

  const btn = el('button', 'addentry', 'Aktuelle Einstellungen als Vorgabe sichern');
  btn.type = 'button';
  btn.addEventListener('click', () => {
    download('vorgaben.js', vorgabenDatei(), 'text/javascript');
    status.textContent = 'Datei vorgaben.js erzeugt. Sie gehört in den Ordner js/ neben ' +
      'konfiguration.js und ersetzt die dortige Datei; danach die Tafel neu laden.';
  });

  pane.appendChild(btn);
  pane.appendChild(status);
}

/* Inhalt der Datei js/vorgaben.js aus den gespeicherten Einstellungen. */
function vorgabenDatei() {
  const werte = { erzeugt: new Date().toISOString(), ...copy(settings) };
  const jetzt = new Date();
  return [
    '/* Vorgaben dieser Station',
    ' *',
    ' * Erzeugt am ' + fullDate(isoToday()) + ' um ' + timeStr(jetzt) + ' Uhr aus den',
    ' * Einstellungen dieses Arbeitsplatzes' + (INSTANZ ? ' (Kennung: ' + INSTANZ + ')' : '') + '.',
    ' *',
    ' * Diese Datei gehört in den Ordner js/ neben konfiguration.js und bestimmt,',
    ' * mit welchen Einstellungen die Tafel startet, wenn im Browser noch nichts',
    ' * gespeichert ist – und worauf „Kategorie zurücksetzen“ zurückführt.',
    ' *',
    ' * Sie enthält ausschließlich Einstellungen, keine Patientendaten.',
    ' */',
    'const VORGABEN = ' + JSON.stringify(werte, null, 2) + ';',
    ''
  ].join('\n');
}

/* Automatische Sicherung */
function renderBackupBlock(pane) {
  pane.appendChild(el('h3', null, 'Automatische Sicherung'));
  pane.appendChild(el('p', 'panehint',
    'Die Tafel liegt ausschließlich im Browser dieses Rechners – wird das Browserprofil ' +
    'zurückgesetzt oder der Rechner getauscht, sind alle Daten verloren. Mit dieser Option ' +
    'legt die Tafel einmal am Tag eine vollständige Sicherung als JSON-Datei ab, die sich ' +
    'über „Import“ wieder einlesen lässt.'));
  pane.appendChild(el('p', 'panehint',
    'Achtung: Diese Datei enthält alle Patientennamen im Klartext. Als Ablage gehört ' +
    'deshalb ein Ordner gewählt, den nur die Station lesen kann – nicht der Download-Ordner ' +
    'und kein allgemein zugängliches Laufwerk. Die Sicherung soll den Ausfall eines ' +
    'Arbeitsplatzes überbrücken, kein Archiv anlegen: Je Tag entsteht eine Datei, alles ' +
    'darüber hinaus wird gelöscht. Sieben Dateien sind dafür in aller Regel genug.'));

  const status = el('p', 'panehint slidestatus backupstatus');
  const zielRow = el('div', 'setrow');
  zielRow.appendChild(el('span', null, 'Ablage'));
  const ziel = el('select', 'zielpick');
  ziel.appendChild(new Option('gewählter Ordner', 'ordner'));
  ziel.appendChild(new Option('Download-Ordner des Browsers', 'download'));
  ziel.value = ordnerWahlMoeglich ? draft.backup.ziel : 'download';
  ziel.disabled = !ordnerWahlMoeglich;
  ziel.addEventListener('change', () => {
    draft.backup.ziel = ziel.value;
    zeigeStatus();
  });
  zielRow.appendChild(ziel);

  const wahl = el('button', 'entrybtn zoomreset', 'Ordner wählen …');
  wahl.type = 'button';
  wahl.disabled = !ordnerWahlMoeglich;
  wahl.addEventListener('click', async () => {
    const handle = await ordnerWaehlen();
    if (handle) status.textContent = 'Sicherungsordner: ' + handle.name;
    else zeigeStatus();
  });
  zielRow.appendChild(wahl);

  const behalten = numberRow('Sicherungen behalten', draft.backup.behalten,
    { min: 1, max: 365, step: 1, unit: 'Dateien' }, value => { draft.backup.behalten = value; });

  const sofort = el('button', 'addentry', 'Jetzt sichern');
  sofort.type = 'button';
  sofort.addEventListener('click', async () => {
    sofort.disabled = true;
    status.textContent = 'Sicherung wird geschrieben …';
    /* Die Ablage ist Teil des Entwurfs; für die Sicherung von Hand zählt,
       was gerade im Fenster steht. */
    const merk = settings.backup;
    settings.backup = { ...draft.backup };
    const res = await sicherungSchreiben(true);
    settings.backup = merk;
    sofort.disabled = false;
    status.textContent = res.text;
    status.classList.toggle('warnstatus', !res.ok);
  });

  const anRow = checkRow('Tägliche Sicherung', draft.backup.on, on => {
    draft.backup.on = on;
    for (const node of [ziel, wahl, behalten.field, sofort]) {
      node.disabled = !on || (node !== behalten.field && node !== sofort && !ordnerWahlMoeglich);
    }
    zeigeStatus();
  });
  pane.appendChild(anRow);
  pane.appendChild(zielRow);
  pane.appendChild(behalten);
  pane.appendChild(sofort);
  pane.appendChild(status);

  function zeigeStatus() {
    const info = backupInfo();
    const teile = [];
    if (!ordnerWahlMoeglich) {
      teile.push('Dieser Browser kann keinen Ordner auswählen – gesichert wird in den ' +
        'Download-Ordner.');
    }
    teile.push(info.zeit
      ? 'Zuletzt gesichert am ' + fullDate(info.datum) + ' um ' + timeStr(new Date(info.zeit)) +
        (info.ordner ? ' in „' + info.ordner + '“.' : ' (Download-Ordner).')
      : 'Bisher wurde noch nicht gesichert.');
    /* Der Download-Ordner ist auf einem gemeinsam genutzten Rechner für alle
       Angemeldeten lesbar – als Ablage für Klarnamen ungeeignet. */
    const inDownload = draft.backup.ziel === 'download' || !ordnerWahlMoeglich;
    if (draft.backup.on && inDownload) {
      teile.push('Der Download-Ordner ist kein geschützter Ablageort für Patientendaten.');
    }
    status.textContent = teile.join(' ');
    status.classList.toggle('warnstatus', draft.backup.on && inDownload);
  }
  zeigeStatus();

  /* Anfangszustand der Bedienelemente */
  for (const node of [ziel, wahl, behalten.field, sofort]) node.disabled = !draft.backup.on;
  if (!ordnerWahlMoeglich) { ziel.disabled = true; wahl.disabled = true; }
}

/* Kennung dieser Tafel */
function renderInstanzBlock(pane) {
  pane.appendChild(el('h3', null, 'Kennung dieser Tafel'));
  pane.appendChild(el('p', 'panehint',
    'Beim Betrieb ohne Webserver greifen alle Kopien der Tafel auf demselben Rechner auf ' +
    'denselben Browser-Speicher zu. Eine zweite Kopie – etwa zum Ausprobieren – würde also ' +
    'in die Echtdaten schreiben. Eine eigene Kennung trennt sie davon.'));
  const row = el('div', 'setrow');
  row.appendChild(el('span', null, 'Kennung'));
  const wert = el('input', 'timefield');
  wert.type = 'text';
  wert.value = INSTANZ || '(keine)';
  wert.readOnly = true;
  wert.size = 16;
  row.appendChild(wert);
  pane.appendChild(row);
  pane.appendChild(el('p', 'panehint',
    'Die Kennung steht in index.html im Attribut data-instanz des <html>-Tags und lässt sich ' +
    'nur dort ändern – sie muss die Kopie überdauern und kann deshalb nicht im Browser ' +
    'gespeichert werden. Achtung: Eine geänderte Kennung startet mit leerer Tafel; die Daten ' +
    'der bisherigen Kennung bleiben unangetastet.'));
}

function commitSettings() {
  /* Leere Einträge fallen weg, damit keine leeren Auswahlwerte entstehen. */
  for (const cat of OPTION_CATEGORIES) {
    draft.options[cat.key] = cat.kind === 'phone'
      ? draft.options[cat.key].filter(e => e.value.trim() || e.label.trim())
          .map(e => ({ value: e.value.trim(), label: e.label.trim() }))
      : draft.options[cat.key].map(e => e.trim()).filter(Boolean);
  }
  draft.privacy.seconds = Math.min(3600, Math.max(5, draft.privacy.seconds || 120));
  draft.zoom = clampZoom(draft.zoom);
  if (!CLOCK.test(draft.night.from)) draft.night.from = DEFAULT_NIGHT.from;
  if (!CLOCK.test(draft.night.to)) draft.night.to = DEFAULT_NIGHT.to;

  /* Bildschirmschoner: Zeiten begrenzen, leere Einträge verwerfen */
  const saver = draft.screensaver;
  saver.seconds = Math.min(3600, Math.max(SAVER_MIN, saver.seconds || DEFAULT_SAVER.seconds));
  saver.defaultSeconds = Math.min(600, Math.max(SAVER_ITEM_MIN,
    saver.defaultSeconds || DEFAULT_SAVER.defaultSeconds));
  saver.items = saver.items
    .map(item => ({ ...item, title: item.title.trim(), text: item.text.trim(),
                    seconds: item.seconds > 0 ? Math.min(600, Math.max(SAVER_ITEM_MIN, item.seconds)) : null }))
    .filter(item => item.kind === 'text' ? (item.title || item.text) : item.file);

  /* Statistik: Schichten ohne Bezeichnung bekommen eine, Reihenfolge nach Beginn */
  const stat = draft.statistik;
  stat.schichten = sortiereSchichten(stat.schichten
    .filter(s => CLOCK.test(s.start))
    .map((s, i) => ({ key: s.key || 'schicht' + i,
                      name: s.name.trim() || 'Schicht ' + (i + 1),
                      start: s.start })));
  if (stat.schichten.length < 2) stat.schichten = copy(DEFAULT_STATISTIK.schichten);

  draft.beds = draft.beds.filter(bed => bed.label.trim())
    .map(bed => ({ id: bed.id, label: bed.label.trim() }));
  if (!draft.beds.length) draft.beds = copy(DEFAULT_BEDS);

  /* Frisch eingeschaltet, beginnt die Tafel im Zustand „Auto“. */
  const autoNeu = draft.autoTheme && !settings.autoTheme;

  settings = draft;
  saveSettings();
  if (autoNeu) {
    themeMode = 'auto';
    localStorage.setItem(THEME_KEY, themeMode);
  }
  applySettings();
  syncBeds();
  buildHead();
  buildBody();
  renderPhones();
  renderStats();
  manualLock = false;
  setPrivacy(false);
  restartPrivacyTimer();
  restartSaverTimer();
  statistikButtonZeigen();
  statistikTaktStarten();
  $('#settingsDlg').close();
  setSaveState('Einstellungen übernommen');
}

/* Zurückgesetzt wird auf die Vorgabe der Station (js/vorgaben.js); ohne eine
   solche Datei sind das die eingebauten Werte. */
function resetCategory() {
  if (activeTab === 'allgemein' || activeTab === 'daten') return;
  if (activeTab === 'statistik') {
    draft.statistik = copy(VORGABE.statistik);
  }
  else if (activeTab === 'schoner') {
    if (!confirm('Inhalte des Bildschirmschoners auf die Vorgabe zurücksetzen?')) return;
    draft.screensaver = copy(VORGABE.screensaver);
  }
  else if (activeTab === 'header') draft.headers = copy(VORGABE.headers);
  else if (activeTab === 'betten') draft.beds = copy(VORGABE.beds);
  else {
    draft.options[activeTab] = copy(VORGABE.options[activeTab]);
    if (draft.styles[activeTab]) draft.styles[activeTab] = copy(VORGABE.styles[activeTab] || {});
  }
  renderPane();
}

function initSettings() {
  $('#btnSettings').addEventListener('click', askPassword);
  $('#pwCancel').addEventListener('click', () => $('#pwDlg').close());
  $('#pwForm').addEventListener('submit', event => {
    if ($('#pwInput').value !== SETTINGS_PASSWORD) {
      event.preventDefault();
      $('#pwError').hidden = false;
      $('#pwInput').select();
      return;
    }
    $('#pwInput').value = '';
    $('#pwDlg').close();
    openSettings();
  });
  $('#settingsSave').addEventListener('click', commitSettings);
  $('#settingsCancel').addEventListener('click', () => $('#settingsDlg').close());
  /* Wird der Dialog ohne „Übernehmen“ geschlossen, gilt wieder die
     gespeicherte Größe – die Vorschau des Schiebereglers verfällt. */
  $('#settingsDlg').addEventListener('close', () => applyZoom(settings.zoom));
  $('#settingsReset').addEventListener('click', resetCategory);
}
