# Änderungen

Die Fassung steht in `js/konfiguration.js` als `VERSION` und erscheint im Fuß der Hilfe.
Erste Stelle: grundlegender Umbau oder geänderte Datenhaltung. Zweite: neue Funktion oder
spürbar geänderte Bedienung. Dritte: Korrekturen und kleine Anpassungen.

## 2.9.0

- **Übergabezettel**: neue Schaltfläche in der Werkzeugleiste. Je belegtem Bettplatz lassen
  sich Diagnosen (Freitext), Neurologie und Katecholamine (beides Mehrfachauswahl) erfassen.
  Diese Angaben erscheinen **nicht** auf der Tafel, werden aber mitgespeichert, mit gesichert
  und mit exportiert – beim nächsten Öffnen stehen sie wieder bereit. Gedruckt wird ein
  eigenes Blatt mit Bettplatz, Patient, Isolation und den drei Angaben. Die Auswahllisten
  stehen in den Einstellungen unter „Neurologie" und „Katecholamine", die Schaltfläche selbst
  lässt sich unter „Allgemein" ein- und ausblenden
- **Norton-Skala mit Fälligkeit**: Das Häkchen „Norton“ setzt den nächsten Termin – ab Werk
  in sieben Tagen, einstellbar unter „Allgemein“. Er steht als Marke hinter den Häkchen und
  wird rot, sobald er erreicht ist; von Hand änderbar über einen Klick darauf
- **„Stammblatt" heißt jetzt „Pflegestatus"**; vorhandene Häkchen werden übernommen
- **Werte in Klammern gestrichelt**: `(INV)`, `(CiCa)` und alle weiteren Klammerwerte werden
  wie ein Verdacht in der Spalte Isolation gestrichelt umrandet – geplant, beendet oder nur
  zeitweise ist damit auf einen Blick vom laufenden Verfahren zu unterscheiden
- **Plausibilitätsprüfung**: Derselbe Wert mit und ohne Klammern zugleich – etwa `INV` und
  `(INV)` – wird als Widerspruch markiert. Gilt für jede Mehrfachauswahl, nicht nur die
  Beatmungsform

## 2.8.1

Vorbereitung der Auslieferung.

- **CSV-Ausgaben entschärft**: Werte, die mit `=`, `+`, `-` oder `@` beginnen, erhalten ein
  vorangestelltes Hochkomma. Ohne das führt eine Tabellenkalkulation sie beim Öffnen als
  Formel aus – die Anführungszeichen der CSV schützen davor nicht. Betrifft die Belegung
  wie die Statistik
- **Erfasste Statistik wird geprüft**, beim Laden wie beim Import: Nur Einträge mit gültigem
  Datum und Zahlen in den Kennzahlen werden übernommen. Eine beschädigte Sicherungsdatei
  kann die Auswertung damit nicht mehr verfälschen
- **`release.sh` / `release.ps1`** erzeugen den Auslieferungsstand als
  `dist/belegungstafel-<Fassung>.zip` – aus dem eingecheckten Stand, ohne `tests/` und die
  Entwicklungsunterlagen (`.gitattributes`), mit Prüfsumme und Inhaltsverzeichnis. Fehlt die
  Vorgabe der Station in `js/vorgaben.js`, wird darauf hingewiesen
- **`INSTALLATION.md`**: Abhakbare Anleitung von der Vorgabedatei über den schreibgeschützten
  Ordner und die Verknüpfung mit eigenem Browserprofil bis zum Aktualisieren
- neuer Abschnitt **Sicherheit** in `README.md`; die Prüfung
  `tests/15-ausgaben-sicherheit.mjs` hält fest, dass Eingaben Text bleiben

## 2.8.0

Datenschutz – drei Maßnahmen aus der Durchsicht des bisherigen Standes.

- **Fußzeile auf beiden Ausdrucken** mit Druckzeitpunkt, Kennung der Tafel und dem Hinweis
  „Enthält Patientendaten – nach Dienstende in den Datenschutzbehälter". Der Platz für die
  Tabellenzeilen wurde entsprechend angepasst, beide Blätter bleiben einseitig
- **Sicherungen**: Voreinstellung von 30 auf 7 Dateien gesenkt – die Sicherung soll einen
  Ausfall überbrücken, kein Archiv anlegen. Das Einstellungsfenster weist jetzt darauf hin,
  dass die Dateien alle Namen im Klartext enthalten, und warnt, wenn als Ablage der
  Download-Ordner eingestellt ist. Bestehende Einstellungen bleiben unberührt
- **`DATENSCHUTZ.md`**: Steckbrief für Datenschutzbeauftragte, IT und Personalrat – welche
  Daten, wo gespeichert, wie lange, wer hat Zugriff, was verlässt den Rechner, und welche
  Entscheidungen begründet sind. Als Entwurf mit auszufüllenden Stellen

## 2.7.0

- **Schichtleitung, Blutzuständigkeit und Notfallequipment** stehen jetzt **unter der
  Tabelle** statt im Kopfbereich – am Bildschirm wie im Ausdruck. Der Kopf bleibt schmal,
  die Tafel beginnt weiter oben, und es sind mehr Bettplätze ohne Scrollen zu sehen

## 2.6.0

- **Vorbelegungen des Patientennamens** sind über die Einstellungen zu pflegen (eigener
  Reiter „Patientenname“): hinzufügen, umbenennen, sortieren, entfernen und auf die Vorgabe
  zurücksetzen wie bei den übrigen Listen. Das Feld bleibt ein Freitextfeld; Zeilenfarbe und
  Zählung hängen weiterhin an den Wörtern `gesperrt`, `Reinigung`, `NA`, `OP` und `CV`

## 2.5.0

- **Sichtschutz** erfasst jetzt alle patientenbezogenen Spalten: zusätzlich Kostform, privat,
  Physiotherapie, Devices, Norton / Stammblatt, Abstriche und Sonstiges. Lesbar bleiben nur
  Anwesenheitsstatus, Bettplatz, Telefon und Pflegekraft; später ergänzte Spalten sind von
  sich aus geschützt
- **Verstorbene**: Ein für sich stehendes Plus im Feld Patientenname wird zum Kreuz `†`,
  dahinter steht der Todeszeitpunkt. Die Namenszelle wird dunkelgrau hinterlegt und hell
  beschriftet

## 2.4.1

- behoben: Die Schaltfläche der Statistik erschien in beiden Druckansichten

## 2.4.0

- **Statistik je Schicht**: neue Auswertung über die runde Schaltfläche unten rechts mit
  belegten Betten, maximaler Bettenzahl, Isolationen, Beatmungen und Dialysen je Schicht,
  Mittelwerten und CSV-Export. Erfassung, Abstand der Aufnahmen, Aufbewahrung, Sichtbarkeit
  der Schaltfläche und die Schichtzeiten stehen in den Einstellungen unter „Statistik“
- die erfasste Statistik geht in die automatische Sicherung und den Import mit ein

## 2.3.0

- **Vorgabe der Station**: „Aktuelle Einstellungen als Vorgabe sichern“ (Einstellungen → Daten)
  erzeugt die Datei `js/vorgaben.js`. Sie bestimmt den Startzustand eines noch nicht
  eingerichteten Arbeitsplatzes und den Bezugspunkt von „Kategorie zurücksetzen“; gespeicherte
  Einstellungen behalten Vorrang. Die Datei enthält keine Patientendaten

## 2.2.0

- **Druck Physio**: eigener Ausdruck für die Physiotherapie – A4 quer, schwarzweiß, nur
  belegte Bettplätze mit Bettplatz, Name, Fachdisziplin, Isolation, Telefon und Pflegekraft;
  Schriftgröße nach Zeilenzahl, lange Namen zeilenweise angepasst
- behoben: Bettplatz- und Statusspalte blieben im Ausdruck „klebend“ und schoben sich über die
  Nachbarspalte – betraf auch den bisherigen Ausdruck

## 2.1.0

- **Fällige Screenings** werden im Kopfbereich rot hervorgehoben
- **Fehlende Pflichtangaben** bei belegtem Bettplatz – Kostform, Devices, Norton / Stammblatt
  und Abstriche – werden in der jeweiligen Zelle dezent rot markiert; angekündigte Aufnahmen
  und Plätze wie „gesperrt“ bleiben außen vor

## 2.0.0

**Umbau der Dateistruktur.** `app.js` ist auf sechs Dateien im Ordner `js/` aufgeteilt:
`konfiguration.js`, `daten.js`, `tabelle.js`, `einstellungen.js`, `schoner.js`, `tafel.js`.
Sie werden von `index.html` in dieser Reihenfolge geladen und teilen sich einen gemeinsamen
Namensraum – bewusst keine ES-Module, weil der Browser diese beim Öffnen von der Festplatte
sperrt.

- **Automatische Sicherung** (Einstellungen → Daten): einmal am Tag eine vollständige
  JSON-Sicherung, wahlweise in einen gewählten Ordner oder in den Download-Ordner des
  Browsers; ältere Sicherungen werden nach einer einstellbaren Zahl entfernt
- **Kennung der Tafel** über `data-instanz` in `index.html`: trennt den Browser-Speicher
  mehrerer Kopien auf einem Rechner, damit eine Testkopie nicht in die Echtdaten schreibt
- **Verlauf** der letzten 20 Änderungen mit „Rückgängig“, Strg + Z und einem Fenster, in dem
  sich einzelne Schritte zurücknehmen lassen – auch Räumen, Verschieben, Leeren und Import
- **Seitenangabe je Diaeintrag**: eine mehrseitige PDF lässt sich mehrfach mit verschiedenen
  Seiten eintragen
- **Prüfungen** im Ordner `tests/`: neun Testdateien, die die Tafel in einem echten Browser
  bedienen; `node tests/run.mjs` führt sie aus
- Ohne Webserver unterbleiben die zwecklosen `fetch`-Versuche, die bisher Fehlermeldungen in
  der Browserkonsole hinterließen

## 1.7.0

- Zeitspanne der dunklen Ansicht einstellbar (Vorgabe 19:00 bis 07:00), minutengenau und über
  Mitternacht hinweg
- „Ordner wählen …“ übernimmt alle Dateien des Diaordners über den Dateidialog – der Weg ohne
  Webserver; dabei wird auch das Seitenformat der PDF aus den Dateien gelesen

## 1.6.1

- Eine fehlerhafte `slides/slides.json` wird beim Einlesen gemeldet statt stillschweigend
  übergangen

## 1.6.0

- Automatische Tag- und Nachtansicht: die Schaltfläche im Seitenkopf führt durch drei
  Zustände (Auto, dunkel, hell), „Auto“ richtet sich nach der Uhrzeit

## 1.5.1

- Diaschau wahlweise in zufälliger Reihenfolge

## 1.5.0

- Größe der Darstellung über einen Schieberegler von 25 % bis 300 %

## 1.4.1

- Dias werden vollständig eingepasst: PDF nach dem Seitenverhältnis der Seite, Bilder
  formatfüllend, zu lange Hinweistexte verkleinert

## 1.4.0

- Bildschirmschoner als Diaschau aus dem Ordner `slides` und eigenen Hinweisen, mit Start
  nach Zeit ohne Eingabe oder von Hand

## 1.3.0

- Aufnahme und Verlegung erscheinen als grüner bzw. dunkelroter Pfeil statt als Textkürzel

## 1.2.1

- Eigenes Logo (`logo.png`) ergänzt

## 1.2.0

- Druckansicht auf A4 quer in Schwarzweiß umgestellt, mit verkürzter Spaltenauswahl und
  einer Spalte für handschriftliche Notizen

## 1.1.1

- Passwortabfrage vor den Einstellungen

## 1.0.1

- Eine eingetragene Fachdisziplin allein zählt als belegtes Bett

## 1.0.0

- Hilfe-Fenster statt Legende, Fassung und Urheberhinweis

## Davor

Aufbau der Tafel: Tabelle mit 13 Bettplätzen und 20 Spalten, Auswahllisten aus der
Datenquelle der bisherigen Excel-Tafel, Isolation mit Verdacht je Keim, Screening-Datum,
Verschieben per Ziehen und Ablegen, Kopfbereich mit Meldestatus und Angaben zur Schicht,
Tastaturnavigation, Sichtschutz, Einstellungsfenster mit Bettplätzen, Spaltenköpfen,
Auswahllisten und Farben.
