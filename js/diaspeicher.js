/* Speicher für die Dateien der Diaschau
 *
 * Warum die Dateien in der Tafel liegen und nicht nur ihr Name:
 *
 * Eine Seite, die von der Festplatte geöffnet wird (file://), darf kein
 * Verzeichnis lesen – weder über fetch noch über XHR noch über einen
 * eingebetteten Rahmen. Der einzige Weg, zu erfahren, was in einem Ordner
 * liegt, ist der Dateidialog. Bis Fassung 2.24 wurden daraus nur die *Namen*
 * übernommen; angezeigt wurden die Dateien über den festen Pfad „slides/…“.
 * Die Station musste ihre Aushänge also erst in diesen einen Ordner kopieren,
 * sonst blieb die Schau leer.
 *
 * Seit Fassung 2.25 werden die Dateien beim Auswählen mit ihrem Inhalt
 * übernommen und hier abgelegt. Danach ist gleichgültig, wo der Ordner lag –
 * auf dem Schreibtisch, auf einem Stick, auf einem Netzlaufwerk. Es muss keine
 * Datei mehr von Hand kopiert, umbenannt oder gepflegt werden.
 *
 * Abgelegt wird in einer eigenen Datenbank, nicht im localStorage: Dort liegt
 * das Limit bei etwa 5 MB, und alles müsste als Text kodiert werden. Die
 * Datenbank nimmt die Dateien so, wie sie sind.
 *
 * Wichtig für die Auslieferung: Diese Dateien stehen **nicht** im JSON-Export
 * und nicht in einer erzeugten js/vorgaben.js – dort stehen nur Einstellungen.
 * Ein neu aufgesetzter Arbeitsplatz bekommt die Aushänge über dieselbe
 * Ordnerauswahl.
 */
'use strict';

const DIA_DB = 'belegungstafel.dias' + KEY_SUFFIX;
const DIA_STORE = 'dateien';

/* Ab hier wird beim Übernehmen gewarnt. Kein hartes Limit: Was der Browser
   noch annimmt, hängt vom Arbeitsplatz ab – die Zahl soll nur verhindern,
   dass jemand versehentlich ein ganzes Bildarchiv übernimmt. */
const DIA_WARNUNG = 150 * 1024 * 1024;

function diaDatenbank() {
  return new Promise(fertig => {
    let anfrage;
    try {
      anfrage = indexedDB.open(DIA_DB, 1);
    } catch (err) {
      fertig(null);
      return;
    }
    anfrage.onupgradeneeded = () => anfrage.result.createObjectStore(DIA_STORE);
    anfrage.onerror = () => fertig(null);
    anfrage.onblocked = () => fertig(null);
    anfrage.onsuccess = () => fertig(anfrage.result);
  });
}

/* Ein Vorgang auf dem Speicher. Fällt die Datenbank aus – abgeschalteter
   Speicher, privates Fenster –, gibt es null statt eines Fehlers: Die Tafel
   soll auch ohne Diaschau laufen. */
function diaVorgang(modus, arbeit) {
  return diaDatenbank().then(db => {
    if (!db) return null;
    return new Promise(fertig => {
      let tx;
      try {
        tx = db.transaction(DIA_STORE, modus);
      } catch (err) {
        fertig(null);
        return;
      }
      let ergebnis = null;
      const anfrage = arbeit(tx.objectStore(DIA_STORE));
      if (anfrage) anfrage.onsuccess = () => { ergebnis = anfrage.result; };
      tx.oncomplete = () => { db.close(); fertig(ergebnis); };
      tx.onerror = () => { db.close(); fertig(null); };
      tx.onabort = () => { db.close(); fertig(null); };
    });
  });
}

/* Ein Satz: { name, typ, groesse, stand, blob } */
function diaSpeichern(id, satz) {
  return diaVorgang('readwrite', store => store.put(satz, id));
}

function diaLesen(id) {
  return diaVorgang('readonly', store => store.get(id));
}

function diaAlle() {
  return diaVorgang('readonly', store => store.getAll()).then(liste => liste || []);
}

function diaSchluessel() {
  return diaVorgang('readonly', store => store.getAllKeys()).then(liste => liste || []);
}

function diaLoeschen(id) {
  return diaVorgang('readwrite', store => store.delete(id));
}

/* Alles wegräumen, was zu keinem Eintrag der Liste mehr gehört. Ohne das
   bliebe eine gelöschte Datei für immer liegen und belegte Platz. */
async function diaAufraeumen(behalten) {
  const bekannt = new Set(behalten);
  const vorhanden = await diaSchluessel();
  const weg = vorhanden.filter(id => !bekannt.has(id));
  for (const id of weg) await diaLoeschen(id);
  return weg.length;
}

async function diaGesamtgroesse() {
  const alle = await diaAlle();
  return alle.reduce((summe, satz) => summe + (satz && satz.groesse || 0), 0);
}

/* ---- Adressen für die Anzeige ----
 *
 * Ein Blob aus der Datenbank braucht eine Adresse, damit ihn <img> oder der
 * PDF-Betrachter laden kann. Die Adressen entstehen einmal beim Start und
 * gelten, solange die Seite offen ist. */
const diaAdressen = new Map();

function diaAdresse(id) {
  return diaAdressen.get(id) || '';
}

async function diaAdressenAufbauen() {
  diaAdressenFreigeben();
  const db = await diaDatenbank();
  if (!db) return 0;
  db.close();
  const schluessel = await diaSchluessel();
  for (const id of schluessel) {
    const satz = await diaLesen(id);
    if (satz && satz.blob) diaAdressen.set(id, URL.createObjectURL(satz.blob));
  }
  return diaAdressen.size;
}

function diaAdressenFreigeben() {
  for (const url of diaAdressen.values()) URL.revokeObjectURL(url);
  diaAdressen.clear();
}

/* ---- Größenangaben ---- */
const MB = 1024 * 1024;
const komma = (wert, stellen) => wert.toFixed(stellen).replace('.', ',');

/* „1,2 MB“ – für einzelne Angaben */
function groesseText(bytes) {
  const zahl = Number(bytes) || 0;
  if (zahl < 1024) return zahl + ' B';
  if (zahl < MB) return Math.round(zahl / 1024) + ' kB';
  const mb = zahl / MB;
  return (mb < 100 ? komma(mb, 1) : String(Math.round(mb))) + ' MB';
}

/* „5,2 MB von 851 MB“ – belegter Platz und das, was der Browser zulässt.
   Beide Zahlen in derselben Einheit, sonst wäre der Vergleich mühsam. */
function platzPaar(belegt, grenze) {
  if (!(grenze > 0)) return groesseText(belegt);
  const mbBelegt = belegt / MB;
  const mbGrenze = grenze / MB;
  if (mbGrenze >= 10240) {
    return komma(mbBelegt / 1024, 1) + ' GB von ' + komma(mbGrenze / 1024, 1) + ' GB';
  }
  return (mbBelegt < 100 ? komma(mbBelegt, 1) : String(Math.round(mbBelegt))) +
    ' MB von ' + Math.round(mbGrenze) + ' MB';
}

/* Wie viel der Browser diesem Arbeitsplatz insgesamt zugesteht. Die Zahl
   richtet sich nach dem freien Plattenplatz und ändert sich mit ihm; sie ist
   eine Größenordnung, keine Zusage. Nennt der Browser sie nicht, bleibt es
   bei der belegten Menge allein. */
async function speicherGrenze() {
  if (!navigator.storage || !navigator.storage.estimate) return 0;
  try {
    const schaetzung = await navigator.storage.estimate();
    return schaetzung && schaetzung.quota > 0 ? schaetzung.quota : 0;
  } catch (err) {
    return 0;
  }
}
