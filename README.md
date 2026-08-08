# Belegungstafel Intensivstation

Digitale Belegungstafel für eine Intensivstation mit 13 Bettplätzen – umgesetzt als
reine HTML-/CSS-/JavaScript-Anwendung ohne Framework, ohne Build-Schritt und ohne
Server-Anbindung.

## Start

`index.html` im Browser öffnen (Doppelklick genügt) oder den Ordner auf einem beliebigen
Webserver bereitstellen.

```
index.html            Grundgerüst und Dialoge
styles.css            Layout, Farbkodierung, Druckansicht
js/konfiguration.js   Bettplätze, Spalten, Auswahllisten, Hilfsfunktionen
js/vorgaben.js        Vorgabe der Station (überschreibt die ausgelieferten Werte)
js/daten.js           Einstellungen, Speicherung, Verlauf
js/tabelle.js         Aufbau und Bedienung der Tabelle
js/einstellungen.js   Einstellungsfenster
js/schoner.js         Bildschirmschoner und Diaschau
js/statistik.js       Auswertung je Schicht
js/uebergabe.js       Übergabezettel (Diagnosen, Neurologie, Katecholamine)
js/tafel.js           Sichtschutz, Ansicht, Sicherung, Start
slides/               Inhalte für den Bildschirmschoner (PDF, PNG, JPEG)
tests/                Prüfungen im echten Browser (siehe tests/README.md)
CHANGELOG.md          Änderungen je Fassung
DATENSCHUTZ.md        Steckbrief für Datenschutzbeauftragte, IT und Personalrat
INSTALLATION.md       Auslieferung und Einrichtung der Stationsrechner
release.sh/.ps1       erzeugt den Auslieferungsstand als ZIP unter dist/
```

Für den Betrieb auf Station wird nicht der Projektordner kopiert, sondern ein Archiv
erzeugt: `./release.sh` legt `dist/belegungstafel-<Fassung>.zip` an, ohne `tests/` und die
Entwicklungsunterlagen. Der Ablauf von der Vorgabedatei bis zur Verknüpfung auf dem
Stationsrechner steht in [INSTALLATION.md](INSTALLATION.md).

Die JavaScript-Dateien werden von `index.html` in dieser Reihenfolge geladen und teilen sich
einen gemeinsamen Namensraum – bewusst klassische Skripte statt ES-Module, weil der Browser
Module beim Öffnen von der Festplatte (`file://`) sperrt.

## Bettplätze

0 a · 0 b · 1 a · 1 b · 2 · 3 · 4 a · 4 b · 5 · 6 a · 6 b · 7 · 8 (13 Plätze)

## Spalten

Anwesenheitsstatus · Bettplatz · Patientenname · Fachdisziplin · Beatmungsform ·
Kreislaufunterstützung · Dialyse · Isolation · TTM · Intervention · Therapielimitierung ·
Telefon · Pflegekraft · Kostform · privat · Physiotherapie · Devices ·
Norton / Pflegestatus · Abstriche · Sonstiges

Nicht auf der Tafel, nur im Übergabezettel: Diagnosen · Neurologie · Katecholamine

### Herkunft der Auswahlwerte

Die Auswahllisten stammen aus dem Tabellenblatt „Datenquelle“ der bisherigen
Excel-Belegungstafel und sind wörtlich übernommen:

| Spalte der Tafel | Datenquelle | Werte |
|---|---|---|
| Anwesenheitsstatus | A | ➡ (grün, Aufnahme), `●`, `NVK`, `NVK 1`, `NVK 2`, `NVK 3`, ⬅ (dunkelrot, Verlegung) |
| Patientenname | J | Freitext mit optionaler Auswahl: `Notbett`, `gesperrt`, `Reinigung`, `NA`, `OP`, `CV` (in den Einstellungen änderbar) |
| Fachdisziplin | B | ACH, DIAB, GAST, GCH, INF, INT, KARD, ONKO, RAD, TCH, UCH, X |
| Beatmungsform | C | INV, NIV, HFNC, NIV/HF, (INV), (NIV), (HFNC), (NIV/HF), MIRUS – mehrere Einträge kombinierbar |
| Kreislaufunterstützung | D | ECMO, ECOS, ECPELLA, ILA, IMPELLA, pass. SM, PiCCO – mehrere Einträge kombinierbar |
| Dialyse | E | CiCa, (CiCa) |
| TTM | F | ❄, ☼ |
| Kostform | G | VK, %, nüchtern, Tee/H2O … Schonkost (26 Kostformen) |
| Telefon | H | Vorschlagsliste 4149 … 4212, freie Eingabe möglich |
| Intervention | I | Angio, Broncho, CT, Endo, ggf. OP, HKL, MRT, OP, PTR, RÖ, TEE, VAC, ext. Dial. |
| Therapielimitierung | M | DNR, DNI, DND – mehrere Einträge kombinierbar |
| Devices | N | ZVK, BDK, ZVK/BDK, keins |
| Isolation | O | 3MRGN … VRE, mehrere Einträge kombinierbar, je Eintrag bestätigt oder Verdacht |
| privat | P | Ankreuzfeld, entspricht dem Wert `ja` |
| Physiotherapie | Q | Mobi, AT, Mobi+AT, passiv, Rücksprache, keine KG |

Die vier Werte `V. a. CoViD`, `V.a. C. diff.`, `V.a. Noro` und `V.a. Rota` der Datenquelle
entfallen, da der Verdacht nun je Eintrag gekennzeichnet wird. Ältere Stände werden beim
Einlesen automatisch übernommen: `V. a. …` wird als Verdacht erkannt.

Ebenso entfallen die zusammengesetzten Werte `DNR/DNI`, `DNR/DND` und `DNR/I/D` der
Therapielimitierung; sie werden beim Einlesen in die einzelnen Einträge aufgeteilt.

Die Textkürzel `A >>>` und `<<< V` der ersten Spalte sind durch einen kräftigen grünen
Pfeil nach rechts (Aufnahme) und einen dunkelroten Pfeil nach links (Verlegung) ersetzt;
vorhandene Stände werden beim Einlesen umgestellt.

Ein Eintrag aus Spalte J im Feld Patientenname (z. B. `gesperrt` oder `OP`) beschreibt
den Bettplatz statt eines Patienten: Er wird kursiv dargestellt und färbt die Zeile ein.

Ohne Vorgabe in der Datenquelle: Pflegekraft und Sonstiges (Freitext),
Norton / Pflegestatus (zwei Ankreuzfelder) sowie Abstriche (Datum des nächsten
Screenings).

Die Spalten **K** (1, 2, 3) und **L** (N, S, V) der Datenquelle sind noch keiner
Spalte der Tafel zugeordnet.

### Bedienung der Felder

| Typ | Spalten | Bedienung |
|---|---|---|
| Auswahlliste | Anwesenheitsstatus, Fachdisziplin, Dialyse, TTM, Intervention, Kostform, Physiotherapie, Devices | Klick auf die Zelle, Wert wählen; leerer Eintrag setzt zurück |
| Mehrfachauswahl | Beatmungsform, Kreislaufunterstützung, Therapielimitierung | Klick öffnet Dialog, mehrere Einträge kombinierbar |
| Freitext mit Klappliste | Patientenname, Telefon | frei tippen oder über `▾` bzw. Alt + Pfeil nach unten die vollständige Liste öffnen |
| Datum | Abstriche | Klick öffnet Dialog mit Datumsfeld und den Schaltflächen „nächster Montag“, „übernächster Montag“ und „löschen“ |
| Keimliste | Isolation | Klick öffnet Dialog; Häkchen = bestätigt, zusätzlich „V. a.“ = Verdacht |
| Ankreuzfeld | privat, Norton / Pflegestatus | direkt anklicken; „Norton“ setzt zusätzlich den nächsten Termin |
| Freitext | Pflegekraft, Sonstiges | direkt tippen |

## Funktionen

- **Firmenlogo**: Der quadratische Platzhalter links im Seitenkopf zeigt eine Datei
  `logo.png`, sobald sie neben `index.html` liegt; ohne Datei bleibt der Platzhalter stehen
  und wird nicht mitgedruckt. Mitgeliefert wird ein schlichtes Kreuzzeichen (`logo.png`,
  512 × 512 px mit Transparenz); die Quelle dazu liegt als `logo.svg` daneben – dort lassen
  sich Farbwert (`#E9450C`) und Strichstärke ändern, anschließend neu als PNG ausgeben
- **Bezeichnung der Tafel**: **Krankenhaus** und **Station**, beide in den Einstellungen unter
  „Daten“. Sie stehen nebeneinander im Seitenkopf neben dem Logo – das Haus als Titel, die
  Station daneben in leichterer Schrift – und gelten zugleich für den Fenstertitel, den Kopf
  des Bildschirmschoners, die Fußzeile jedes Ausdrucks und die CSV-Ausgabe (`tafelTitel()` in
  `js/konfiguration.js`). Ein leer gelassenes Feld entfällt, statt eine Lücke zu hinterlassen.
  Ausgeliefert wird die bisherige Beschriftung „Belegungstafel Intensivstation“, damit sich für
  eine vorhandene Tafel nichts ändert
- **Autospeicherung** in den `localStorage` des Browsers
- **Farbkodierung** der Zeilen nach Anwesenheitsstatus (Aufnahme, belegt, NVK, außerhalb der
  Station, Verlegung, gesperrt), `ISO`-Kennzeichnung bei eingetragener Isolation,
  farbliche Hervorhebung einer hinterlegten Therapielimitierung. Die Zeilenfarben lassen sich
  unter Einstellungen → Allgemein **abschalten**; der Farbbalken am Zeilenanfang bleibt dabei
  stehen, der Status ist also weiter erkennbar
- **Kräftigere Trennlinie zwischen den Zimmern**: je Bettplatz an- und abwählbar
  (Einstellungen → Bettplätze, Kästchen hinter der Bezeichnung). Ab Werk unter 0 b, 1 b, 2, 3,
  4 b, 5, 6 b und 7 – also überall dort, wo ein Zimmer endet, und nicht zwischen den beiden
  Plätzen eines Zimmers. Die Linie gilt auch auf dem Visitenausdruck
- **Kopfbereich**: belegte Betten (x / 13; belegt ist jeder Bettplatz mit gesetztem
  Anwesenheitsstatus **oder** eingetragener Fachdisziplin, unabhängig davon, welche Werte in
  den Einstellungen hinterlegt sind; `gesperrt` oder `Reinigung` im Feld Patientenname zählt
  nie), maximale Bettenzahl als Eingabefeld mit
  festem Zusatz „+ 1“ für das Notbett, **Meldestatus** als farbige Kachel und Anzahl der
  fälligen Screenings. Die Stufen des Meldestatus stehen in den Einstellungen unter
  „Meldestatus“ – ausgeliefert grün, gelb und rot, ergänzbar und umbenennbar, **jede mit
  eigener Farbe** aus derselben Auswahl wie die übrigen Kategorien. Die Schriftfarbe rechnet
  die Tafel aus der Helligkeit (`lesbareSchrift()`), damit auch eine hell gewählte Stufe
  lesbar bleibt; ohne Farbe bleibt die Kachel neutral. **Eine leere Stufe gibt es nicht** – die
  Tafel trägt immer einen Status; hat sie noch keinen (frisch aufgesetzt oder aus einer Datei
  ohne dieses Feld eingelesen), gilt die erste Stufe, und zwar in den Daten und nicht nur in
  der Anzeige. Die letzte verbleibende Stufe lässt sich deshalb nicht entfernen. Ein gesetzter
  Wert, der später aus der Liste fällt, bleibt an der Tafel stehen und wählbar
- **Angaben zur Schicht** – Schichtleitung, Blutzuständigkeit und Notfallequipment mit
  jeweils zugehöriger Telefonnummer – **unter der Tabelle**, zwischen Tafel und den
  Textfeldern. Der Kopfbereich bleibt dadurch schmal, und es sind mehr Bettplätze ohne
  Scrollen zu sehen. Diese Angaben gelten für die gesamte Station, werden mitgespeichert,
  mit exportiert und mitgedruckt; „Tafel leeren“ lässt sie stehen
- **Isolation**: beliebig viele Einträge je Bettplatz, jeder einzeln als bestätigt oder als
  Verdacht geführt (z. B. MRSA bestätigt und Verdacht auf VRE). Bestätigte Keime erscheinen
  als gefüllte, Verdachtsfälle als gestrichelte Marke mit vorangestelltem `V. a.`.
  Am Bettplatz steht `ISO`, sobald ein Keim bestätigt ist, und `ISO?`, solange nur
  Verdachtsfälle eingetragen sind – **unter** der Bettbezeichnung, nicht daneben. Die Spalte
  braucht dadurch keine 32 px Zusatzbreite, und die Zahl bleibt mittig. Im Ausdruck steht das
  Kennzeichen weiterhin daneben, weil die Zeilenhöhe dort fest gedeckelt ist
- **Abstriche**: nur das Datum des nächsten Screenings, wahlweise über die Schaltflächen
  „nächster Montag“ und „übernächster Montag“; ein fälliges oder überfälliges Datum wird rot
  hervorgehoben und im Kopfbereich gezählt. Ist mindestens ein Screening fällig, wird die
  Kennzahl **Screening fällig** im Kopf rot hinterlegt
- **Fehlende Pflichtangaben**: Bei einem belegten Bettplatz prüft die Tafel **Kostform**,
  **Devices**, **Norton / Pflegestatus** und **Abstriche**; fehlt eine Angabe, wird die Zelle
  dezent rot unterlegt und nennt im Zeigertext die fehlende Angabe. `keins` bei den Devices
  gilt als Angabe, Norton / Pflegestatus erst mit beiden Häkchen. Eine angekündigte Aufnahme
  (grüner Pfeil) sowie `gesperrt` oder `Reinigung` werden nicht angemahnt; der Ausdruck bleibt
  ohne Färbung
- **Norton-Skala mit Fälligkeit**: Das Häkchen `Norton` gilt als „heute erhoben“ und setzt den
  nächsten Termin – ab Werk in sieben Tagen, einstellbar unter Allgemein. Er steht als Marke
  **neben** dem Häkchen, wird rot, sobald er erreicht ist, und lässt sich per Klick ändern.
  Neben statt darunter, damit die Zelle mit zwei statt drei Zeilen auskommt: Bei voller Station
  mit überall gesetztem Norton war die Tabelle sonst 723 statt 601 px hoch und musste
  entsprechend gescrollt werden. Die Spalte ist dafür 152 px breit; den Platz gibt **Sonstiges**
  ab, das keine feste Breite hat
- **Werte in Klammern** (`(INV)`, `(CiCa)` …) stehen für geplant, beendet oder nur zeitweise
  und werden gestrichelt umrandet – dieselbe Lesart wie beim Verdacht in der Spalte Isolation.
  Derselbe Wert mit **und** ohne Klammern zugleich ist ein Widerspruch: Die Zelle erhält einen
  roten Rahmen mit Erklärung im Zeigertext. Geprüft wird jede Mehrfachauswahl
- **Übergabezettel** (Schaltfläche oben, in den Einstellungen ein- und ausblendbar): je
  belegtem Bettplatz Diagnosen als Freitext sowie Neurologie und Katecholamine als
  Mehrfachauswahl. Diese Angaben erscheinen **nicht auf der Tafel**, werden aber mitgespeichert,
  mit gesichert und mit exportiert; „Bettplatz räumen“ löscht sie mit. Die Auswahllisten stehen
  in den Einstellungen unter „Neurologie“ und „Katecholamine“.
  Die **Zuständigkeit** – Schichtleitung, Blutzuständigkeit, Notfallequipment – steht im Fenster
  an erster Stelle und meint die *kommende* Schicht: Die Felder beginnen bei jedem Aufruf leer,
  gelten nur für diesen Zettel und ändern die gleichnamigen Angaben unter der Tafel nicht. Sie
  werden nicht gespeichert und sind kein Pflichtfeld.
  Gedruckt wird ein eigenes Blatt (A4 quer) mit **allen Bettplätzen**, auch den freien, in
  zwölf Spalten: Bettplatz, Patient, **Diagnosen**, dann **Beatmung, Kreislauf, Nierenersatz,
  Isolation, Therapielimitierung** aus der Tafel, dazu Neurologie, Katecholamine und rechts
  zwei Spalten für die Hand – ein leeres Feld für das Kürzel der **übernehmenden Pflegekraft**
  und **Notizen**, die den Text aus **Sonstiges** mitbringen und darunter Platz zum Ergänzen
  lassen. Die Spalten sind mit **Symbolen** überschrieben (🛏 👤 ⚕ 🫁 ♥ 🫘 ☣ ⊘ 🧠 💉 ✍ ✎),
  damit die Kopfzeile einzeilig bleibt; der Klartext steht im Zeigertext. Unter der Tabelle
  die **geplanten Aufnahmen** mit Platz zum Ergänzen, die **Zuständigkeit** samt
  **Bettenzahl** (X + 1 und die belegten Plätze; leer gelassene Felder bleiben zum Ausfüllen
  frei) und die **Telefone** mit je einer Linie, wer sie übernimmt – nur die Nummern, ohne die
  Bezeichnung der Geräte.
  Das Blatt **passt auf eine Seite**: Vor dem Druck wird es unsichtbar vermessen und die
  Schriftgröße so gewählt, dass alles hineingeht (`uebergabeEinpassen` in `js/uebergabe.js`) –
  bei leerer Tafel 3,6 mm, bei voller Station knapp 2,6 mm. Unter 2,1 mm wird nicht
  verkleinert; treffen dreizehn sehr lange Diagnosen zusammen, läuft das Blatt lieber auf eine
  zweite Seite
- **Tastatur**: Navigation durch die Tabelle mit den Pfeiltasten, Zeilenwechsel mit der
  Eingabetaste (mit Umschalt aufwärts). In Textfeldern wechseln Links und Rechts erst am
  Anfang bzw. Ende des Textes die Zelle. Auswahlfelder werden über die Anfangsbuchstaben
  oder mit Alt + Pfeil nach unten geändert, damit die Pfeiltasten zum Navigieren frei bleiben
- **Unter der Tafel**: Textfeld für geplante Aufnahmen, feste Rufnummernliste der Station
  und Textfeld für allgemeine Informationen; die beiden Textfelder werden mitgespeichert
  und exportiert. Der Block **füllt die Höhe aus, die Kopfbereich und Tabelle übrig lassen**:
  Die Seite ist eine Spalte über die volle Bildschirmhöhe, in der die Tabelle nachgibt und in
  sich scrollt, sobald der Platz knapp wird. Die beiden Textfelder nehmen die Höhe ihres
  Kastens auf, sind dadurch **immer gleich hoch** und lassen sich nicht von Hand ziehen – die
  Höhe kommt aus dem Platz. Rechts bleibt eine Gasse für die schwebenden Schaltflächen frei
- **Hilfe** über den runden Fragezeichen-Knopf unten rechts, oberhalb des Zahnrads: eine
  Kurzanleitung **für die Schicht** – Eingabe der Felder, Zählung der belegten Betten,
  Verschieben per Ziehen und Ablegen, Kennzeichen und Zeilenfarben, Datenschutz,
  Bildschirmschoner, Ansicht und Größe, Drucken, Übergabezettel, Physio-Blatt und Statistik.
  Links steht ein **Menü der Abschnitte**, das aus den Überschriften des Textes entsteht
  (`helpMenueAufbauen()` in `js/tafel.js`) und beim Blättern mitwandert.
  Was allein die Administration betrifft – Passwortstufen, Vorgabedatei, Sicherung, Kennung,
  Export und Import –, steht **nicht** in der Hilfe, sondern in
  [INSTALLATION.md](INSTALLATION.md). Am Fuß stehen Fassung und Urheberhinweis
- **Verschieben per Ziehen und Ablegen**: Bettplatz-Zelle greifen und auf einen anderen
  Bettplatz ziehen. Ist das Ziel belegt, tauschen beide Plätze ihre Einträge. Am Zeiger hängt
  ein Abbild der **gesamten Zeile** statt nur der angefassten Zelle (`zeileAlsZiehbild()` in
  `js/tabelle.js`): Der Klon wandert mit den gemessenen Spaltenbreiten in eine eigene Tabelle,
  weil eine Zeile für sich kein Layout hat, und die Werte der Eingabefelder werden einzeln
  nachgezogen – `cloneNode` überträgt nur Attribute, nicht den eingetippten Stand
- **Verlauf**: Die letzten **20 Schritte** dieser Sitzung lassen sich zurücknehmen – über
  „Rückgängig“ in der Statuszeile, mit **Strg + Z** oder gezielt über „Verlauf …“. Erfasst
  werden Feldeingaben (mehrere Tastendrücke im selben Feld gelten als ein Schritt), Räumen,
  Verschieben, „Tafel leeren“ und Import; das Zurücknehmen selbst wird ebenfalls erfasst.
  Der Verlauf liegt nur im Arbeitsspeicher und endet mit dem Neuladen der Seite
- **Einstellungen** über das Zahnrad unten rechts, geschützt durch eine Passwortabfrage mit
  **zwei Stufen** (`SETTINGS_ZUGANG` in `js/einstellungen.js`): Das erste Passwort öffnet
  nur **Allgemein** und **Bildschirmschoner** – Sichtschutz, Zoom, Nachtansicht, Diaschau,
  also das, was im Dienst gebraucht wird. **Welche** Reiter das sind, legt die volle Stufe im
  Reiter **Berechtigungen** fest (ab Werk Allgemein und Bildschirmschoner); der Reiter
  Berechtigungen selbst steht dort nie zur Wahl, und mindestens einer muss offenbleiben.
  Zusätzlich lassen sich **einzelne Unterpunkte wegnehmen** – die sieben Blöcke unter
  Allgemein, die zwei unter Statistik und die fünf unter Daten (`REITER_TEILE` in
  `js/konfiguration.js`). Gesperrt wird einzeln, nicht einzeln freigegeben: Wer einen Reiter
  öffnet, öffnet ihn ganz, bis auf die genannten Ausnahmen. Die Nummerierung unter Allgemein
  rückt dabei auf, sodass keine Lücken entstehen.
  Das zweite Passwort gibt alle Reiter frei,
  einschließlich Bettplätzen, Spaltenköpfen, Auswahllisten, Statistik und dem Bereich Daten
  mit Export, Import und „Tafel leeren“. Mit der einfachen Stufe erscheinen die übrigen
  Reiter gar nicht erst. Die Passwörter liegen als **PBKDF2-Ableitung** mit eigenem Salt vor
  (600 000 Runden, SHA-256), nicht im Klartext; neue erzeugt
  `node werkzeuge/passwort.mjs <einfach|voll> "<Passwort>"`. Das verhindert das bloße
  Mitlesen, ersetzt aber keine Zugriffskontrolle – wer die Dateien ändern kann, baut die
  Prüfung aus. Inhalt der Einstellungen: Beschriftung der Spaltenköpfe,
  Bezeichnung, Reihenfolge und Anzahl der **Bettplätze** sowie Bearbeiten der Auswahllisten
  für Anwesenheitsstatus, Patientenname, Fachdisziplinen, Beatmungsformen, Kreislaufunterstützung, Dialyse, Isolation,
  Interventionen, Therapielimitierung, Kostformen, Physiotherapie, der Telefonvorschläge
  der Tabelle und der Rufnummernliste unter der Tafel – Einträge lassen sich hinzufügen,
  umbenennen, sortieren und entfernen, jede Kategorie einzeln auf die Voreinstellung
  zurücksetzen. Der Patientenname bleibt dabei ein Freitextfeld; die Liste schlägt nur vor.
  Wie die Zeile eingefärbt wird und ob der Platz als belegt zählt, hängt weiterhin an den
  Wörtern `gesperrt`, `Reinigung`, `NA`, `OP` und `CV` in genau dieser Schreibweise –
  eigene Einträge erscheinen in der Klappliste, färben die Zeile aber nicht.
  Je Kategorie lassen sich zusätzlich **Textfarbe, Hintergrundfarbe und
  Rahmenstil** festlegen (z. B. alle Isolationen gelb hinterlegt mit dunkler Schrift). Die
  Farbauswahl erfolgt über 16 feste Farbkästchen plus „Standard“; eine Beispielmarke zeigt
  das Ergebnis sofort. Die Angaben gelten in der Tabelle für das Auswahlfeld der Spalte und
  für alle Marken der Mehrfachauswahl und bleiben im Ausdruck erhalten.
  Unter „Allgemein“ als Punkt 1 der Sichtschutz und als Punkt 2 der Bildschirmschoner –
  jeweils mit Ein/Aus und Zeit in Sekunden –, als Punkt 3 die automatische Tag-/Nachtansicht
  und als Punkt 4 die Größe der Darstellung, unter „Bildschirmschoner“ die Inhalte der
  Diaschau, unter „Daten“ Export, Import und „Tafel leeren“.
  Ein Wert, der in einem Bettplatz steht, bleibt erhalten, auch wenn er später aus der
  Liste entfernt wird
- **Verstorbene**: Ein für sich stehendes Pluszeichen im Feld Patientenname wird sofort zum
  Kreuz `†`; dahinter steht der Todeszeitpunkt (`Mustermann, Max † 14:30`). Die Namenszelle
  wird dann dunkelgrau hinterlegt und die Schrift hell gesetzt. Ein Plus innerhalb eines
  Wortes bleibt unverändert; ältere Stände werden beim Einlesen umgesetzt. Der Bettplatz zählt
  weiterhin als belegt
- **Sichtschutz**: Nach der eingestellten Zeit ohne Eingabe (Voreinstellung 120 Sekunden)
  werden **alle patientenbezogenen Spalten** – Patientenname bis Sonstiges, also auch Kostform,
  privat, Physiotherapie, Devices, Norton / Pflegestatus und Abstriche – sowie die beiden
  Textfelder unter der Tafel
  unkenntlich gemacht. Jede Mausbewegung oder Taste hebt das auf; die Schaltfläche
  „Datenschutz“ schaltet sofort um und bleibt dann bis zu einem Klick oder Tastendruck
  bestehen. Lesbar bleiben allein Anwesenheitsstatus, Bettplatz, Telefon und Pflegekraft
  sowie die Kennzahlen; der Ausdruck wird nie unkenntlich gemacht. Eine später ergänzte
  Spalte ist von sich aus geschützt (`PRIVATE_OFFEN` in `js/daten.js` nennt die Ausnahmen)
- **Bildschirmschoner (Diaschau)**: zeigt bildschirmfüllend die freigegebenen Inhalte
  nacheinander – Dateien aus dem Ordner `slides` (PDF, PNG, JPEG) und in den Einstellungen
  angelegte Hinweise aus Überschrift und Infotext. Der Start erfolgt über die Schaltfläche
  „Diaschau“ im Seitenkopf oder, wenn der Bildschirmschoner eingeschaltet ist, nach der
  eingestellten Zeit ohne Eingabe (mindestens 10 Sekunden); jede Mausbewegung oder Taste
  beendet ihn wieder. Solange ein Dialog geöffnet ist, startet er nicht. Jeder Eintrag lässt
  sich einzeln an- und abschalten, in der Reihenfolge verschieben und mit einer eigenen
  Anzeigedauer versehen; ohne eigene Angabe gilt die zentrale Vorgabe (10 Sekunden). Bei
  einem mehrseitigen PDF lässt sich in der Spalte „S.“ die Seite angeben – dieselbe Datei kann
  mehrfach mit verschiedenen Seiten eingetragen werden.
  Mit der Option **Reihenfolge zufällig** werden die Einträge bei jedem Start und nach jedem
  vollen Durchlauf neu gemischt (Fisher-Yates); je Durchlauf kommt jeder Eintrag genau einmal
  an die Reihe, und an der Nahtstelle wiederholt sich kein Eintrag.
  Jeder Inhalt wird vollständig eingepasst und muss nie gescrollt werden: Bilder füllen die
  Fläche formatfüllend ohne Beschnitt, PDF-Seiten werden über `view=Fit` und das aus
  `/MediaBox` gelesene Seitenverhältnis auf die Bühnengröße gerechnet, zu lange Hinweistexte
  werden schrittweise verkleinert, bis sie ganz sichtbar sind. Von mehrseitigen PDF erscheint
  die erste Seite.
  Patientendaten werden nie angezeigt, unten stehen Uhrzeit, Datum und die Position in der
  Schau. Ein Browser darf ein Verzeichnis nicht von sich aus lesen; die Dateinamen kommen
  deshalb aus einer der drei Quellen (Einzelheiten in `slides/LIESMICH.txt`):
  - **„Ordner wählen …“** – der Dateidialog (`<input type="file" webkitdirectory>`) übernimmt
    alle Dateien des gewählten Ordners auf einmal. Funktioniert **ohne Webserver**, also auch
    beim Öffnen von der Festplatte; dabei wird zugleich das Seitenformat der PDF aus den Dateien
    gelesen, was ohne Server sonst nicht möglich ist
  - **„Ordner einlesen“** – ohne Dialog über `slides/slides.json` oder die Verzeichnisübersicht
    des Webservers; eine fehlerhafte `slides.json` wird gemeldet
  - **„+ Datei von Hand“** – einzelner Dateiname
- **Tag- und Nachtansicht**: Die Schaltfläche `◐` oben rechts schaltet hell und dunkel um. Ist
  in den Einstellungen unter „Allgemein“ (Punkt 3) die **automatische Tag-/Nachtansicht**
  aktiviert, führt sie durch drei Zustände – **Auto → dunkel → hell**. Im Zustand Auto steht
  „Auto“ neben dem Symbol, und die Darstellung richtet sich nach der Uhrzeit. Die **Zeitspanne
  der dunklen Ansicht** ist im selben Abschnitt einstellbar („Dunkel von … bis …“, Vorgabe
  19:00 bis 07:00 Uhr) und darf über Mitternacht reichen; der Wechsel geschieht minutengenau im
  laufenden Betrieb. Der zuletzt gewählte Zustand liegt im `localStorage` unter
  `belegungstafel.theme` (`auto`, `dark`, `light`)
- **Größe der Darstellung**: Schieberegler in den Einstellungen unter „Allgemein“ (Punkt 4),
  **25 % bis 300 %** in Schritten von 5 %, passend zu Monitor und Auflösung. Er wirkt über die
  CSS-Eigenschaft `zoom` auf Kopfbereich, Stationszeile, Tabelle und die Textfelder darunter;
  Dialoge, Hilfe, Bildschirmschoner und der Ausdruck bleiben unverändert. Die Größe wird beim
  Schieben sofort angezeigt, gilt aber erst mit „Übernehmen“ dauerhaft; „Abbrechen“ stellt den
  gespeicherten Wert wieder her. Die sichtbare Höhe der Tabelle rechnet den Zoom mit ein, und
  ab einem Kopfbereich von mehr als zwei Fünfteln der Bildschirmhöhe läuft dieser nicht mehr
  mit, damit die Tabelle nutzbar bleibt
- **Bedienleiste** oben rechts: „Datenschutz“, „Diaschau“ und „Druck Visite“ mit Symbol sowie die
  Umschaltung der Tag-/Nachtansicht. Export, Import und „Tafel leeren“ stehen in den Einstellungen
  unter „Daten“
- **Kontextmenü der rechten Maustaste**: unter Einstellungen → Allgemein abschaltbar (ab Werk
  unterdrückt). **In Eingabefeldern bleibt es immer erreichbar** – dort hängen die Vorschläge
  der Rechtschreibprüfung und das Einfügen per Maus daran. Tastenkürzel wie `F12` oder
  `Strg + R` lassen sich damit nicht abstellen; dafür ist der Kioskbetrieb des Browsers
  zuständig (siehe [INSTALLATION.md](INSTALLATION.md))
- **Bettplatz räumen** über das `×` in der Bettspalte
- **Export/Import** als JSON (Belegung, Angaben zur Schicht und Einstellungen) sowie
  CSV-Export für Excel
- **Statistik je Schicht** über die runde Schaltfläche unten rechts (über der Hilfe; ihre
  Sichtbarkeit ist einstellbar): je Schicht **belegte Betten, maximale Bettenzahl,
  Auslastung (%), Isolationen (bestätigt oder Verdacht), Beatmungen und Dialysen**, dazu
  Mittelwerte je Schichtart und gesamt sowie ein CSV-Export. Die **Auslastung** ist der
  Anteil der belegten an den maximal betreibbaren Plätzen – ohne das Notbett im Nenner, ein
  belegtes Notbett ergibt also mehr als 100 %. Sie wird bei jeder Anzeige gerechnet und nicht
  gespeichert, steht damit auch für früher erfasste Schichten zur Verfügung; ohne eingetragene
  Bettenzahl bleibt sie leer. Die Tafel legt dafür in einstellbarem Abstand (ab Werk 15 min)
  eine Momentaufnahme ab und ordnet sie der laufenden Schicht zu; eine spätere Aufnahme ersetzt
  die frühere derselben Schicht. Gezählt werden nur belegte Bettplätze; `gesperrt` und
  `Reinigung` bleiben außen vor, ebenso die externe Dialyse (sie steht als Intervention
  `ext. Dial.`). Schichten (Bezeichnung und Beginn, ab Werk 06:00 / 14:12 / 20:30), Abstand,
  Aufbewahrung und Sichtbarkeit der Schaltfläche stehen in den Einstellungen unter „Statistik“.
  Die Daten liegen im `localStorage` unter `belegungstafel.statistik`, enthalten keine
  Patientendaten und gehen in die automatische Sicherung mit ein. Erfasst wird nur, solange die
  Tafel geöffnet ist
- **Vorgabe der Station**: Die Datei `js/vorgaben.js` legt fest, mit welchen Einstellungen die
  Tafel startet, wenn im Browser noch nichts gespeichert ist, und worauf „Kategorie
  zurücksetzen“ zurückführt. Erzeugt wird sie in den Einstellungen unter „Daten“ über
  **Aktuelle Einstellungen als Vorgabe sichern**; die heruntergeladene Datei ersetzt die
  gleichnamige im Ordner `js/`. Bewusst eine JavaScript-Datei und keine JSON-Datei, weil der
  Browser beim Betrieb von der Festplatte keine Datei nachladen darf, ein `<script>` aber
  einbindet. Sie enthält nur Einstellungen, keine Patientendaten. Reihenfolge der Geltung:
  eingebaute Werte → `js/vorgaben.js` → gespeicherte Einstellungen des Arbeitsplatzes
- **Automatische Sicherung** (Einstellungen → Daten): einmal am Tag eine vollständige
  JSON-Sicherung, wahlweise in einen einmalig gewählten Ordner – etwa auf einem Netzlaufwerk,
  der Zugriff wird über die File System Access API vergeben und in IndexedDB behalten – oder
  in den Download-Ordner des Browsers. Ältere Sicherungen entfernt die Tafel nach einer
  einstellbaren Zahl selbst; „Jetzt sichern“ schreibt sofort. Der Zeitpunkt der letzten
  Sicherung liegt unter `belegungstafel.sicherung` im `localStorage`
- **Kennung der Tafel**: Beim Betrieb ohne Webserver teilen sich **alle Kopien der Tafel auf
  einem Rechner denselben Browser-Speicher** – eine Testkopie würde also in die Echtdaten
  schreiben. Das Attribut `data-instanz` am `<html>`-Tag in `index.html` hängt eine Kennung an
  alle Speicherschlüssel und trennt die Kopien; ohne Angabe bleiben die bisherigen Schlüssel
  unverändert. Die aktive Kennung steht in den Einstellungen unter „Daten“
- **Blatt für die Physiotherapie** über die Schaltfläche **Druck Physio**: eigener Ausdruck
  auf **A4 quer in Schwarzweiß** mit Bettplatz, Patientenname, Fachdisziplin, Isolation,
  Telefon und Pflegekraft. Aufgeführt werden nur belegte Bettplätze – freie sowie `gesperrt`
  und `Reinigung` entfallen. Zeilenhöhe und Schrift werden aus der Zahl der Zeilen berechnet
  (`setPhysioRowHeight`), sodass bei wenigen Patienten sehr groß und bei voller Station immer
  noch auf einer Seite gedruckt wird; ein besonders langer Name wird allein in seiner Zeile
  verkleinert, damit er vollständig lesbar bleibt
- **Druck Visite** (Schaltfläche oben, früher „Drucken“): eine Seite **A4 quer in Schwarzweiß**. Oben stehen belegte Betten,
  maximale Bettenzahl und Meldestatus (ausgeschrieben), darunter eine verkürzte Tabelle mit
  Anwesenheitsstatus, Bettplatz, Patientenname, Fachdisziplin, Isolation, Intervention,
  Therapielimitierung, Telefon und Pflegekraft, ergänzt um eine breite Spalte **Notizen**;
  unter der Tabelle Schichtleitung und Blutzuständigkeit mit Telefonnummer sowie die
  geplanten Aufnahmen – dieselbe Anordnung wie am Bildschirm.
  Das Blatt bleibt **immer eine Seite**. Die Zeilenhöhe ergibt sich aus der Zahl der
  Bettplätze und ist im Druck fest gedeckelt (`--print-row`, `visiteEinpassen` in
  `js/tabelle.js`); die Höhe der Tabelle steht damit vorab fest, statt sich aus dem Inhalt zu
  ergeben. Wie viel Text in diese Höhe passt, entscheidet die Schriftgröße: Vor dem Druck
  wird für jeden Bettplatz der Wortumbruch der schmalen Druckspalten nachgerechnet und die
  Schrift so weit verkleinert, bis die vollste Zeile hineingeht – bei leerer Tafel 10,5 px,
  bei voller Station mit langen Namen und mehreren Isolationen rund 8 px. Ein zu langer
  Patientenname wird allein in seiner Zeile kleiner gesetzt, statt abgeschnitten zu werden.
  Geprüft wird das nicht an gerechneten Millimetern, sondern am erzeugten PDF
  (`tests/03-drucken.mjs`), bis hinauf zu 26 Bettplätzen
- Änderungen werden zwischen mehreren Browser-Tabs desselben Rechners abgeglichen

## Prüfungen

Im Ordner `tests/` liegen **17 Testdateien**, die die Tafel in einem echten Browser bedienen
(Chromium über Playwright) und das Ergebnis prüfen – Zählung, Pfeile, Ausdruck, Zoom,
Bildschirmschoner, Tag-/Nachtansicht, Verlauf, Sicherung, Einstellungen, Pflichtangaben,
Physio- und Visitendruck, Stationsvorgabe, Statistik, Sichtschutz, Sicherheit der Ausgaben
und den Übergabezettel. Jede meldet Skript- und Konsolenfehler als Fehlschlag.

```
cd tests && npm install && npx playwright install chromium
node run.mjs            die regulären Tests, vier nebeneinander (~45 s)
node run.mjs --alle     zusätzlich die optionalen
```

Der Bildschirmschoner-Test prüft Zeitverhalten und läuft deshalb nur mit `--alle` mit; der Test
der Stationsvorgabe läuft allein, weil er `js/vorgaben.js` schreibt. Wo auf Zeit gewartet wird,
stellen die Tests die Uhr der Seite an und spulen sie vor, statt die Spanne abzusitzen.

Einzelheiten in `tests/README.md`. Die Tafel selbst bleibt abhängigkeitsfrei; Playwright wird
nur für die Prüfungen gebraucht.

## Fassung

Die Fassung steht in `js/konfiguration.js` als Konstante `VERSION` und erscheint im Fuß der Hilfe
zusammen mit dem Urheberhinweis. Sie wird mit jeder Änderung erhöht:

| Stelle | wann |
|---|---|
| erste (1.x.x) | grundlegender Umbau, geänderte Datenhaltung |
| zweite (x.1.x) | neue Funktion oder spürbar geänderte Bedienung |
| dritte (x.x.1) | Korrekturen, Beschriftungen, kleine Anpassungen |

## Anpassung

Die Auswahllisten der meisten Spalten werden über das Zahnrad unten rechts gepflegt und
liegen im `localStorage` unter `belegungstafel.einstellungen`; die Werte in `js/konfiguration.js` sind
die Voreinstellung, auf die sich jede Kategorie zurücksetzen lässt.

Bettplätze und Spalten sind am Anfang von `js/konfiguration.js` in `BEDS` und `COLUMNS` hinterlegt.
Neue Spalten werden allein durch einen weiteren Eintrag in `COLUMNS` angelegt; soll eine
Liste im Einstellungsdialog erscheinen, genügt ein Eintrag in `OPTION_CATEGORIES`.

Alle 20 Spalten passen auf einem 1920 px breiten Bildschirm ohne Querscrollen nebeneinander;
auf schmaleren Geräten bleiben Anwesenheitsstatus und Bettplatz beim Scrollen stehen.

Spaltenköpfe und Zellinhalte sind mittig ausgerichtet; Ausnahme sind die beiden
Ankreuzfelder unter „Norton / Pflegestatus“, die linksbündig untereinander stehen.

Fünf Spalten richten sich in der Breite nach ihrem Inhalt: gemessen werden der längste
Statuswert, die längste Bettbezeichnung sowie der längste Eintrag unter Patientenname
(96 bis 300 px), Telefon (78 bis 170 px) und Pflegekraft (62 bis 170 px); die drei
Freitextspalten werden beim Verlassen des Feldes angepasst. Platz für das Kennzeichen `ISO` kommt nur hinzu, wenn eine
Isolation eingetragen ist. Die Spalte „Sonstiges“ hat keine feste Breite und
nimmt den verbleibenden Platz auf, sodass alle übrigen Spalten genau ihre Vorgabe behalten.

## Sicherheit

Die Anwendung baut ihre Oberfläche ausschließlich über `el()` mit `textContent`; es gibt
kein `innerHTML`, kein `eval` und kein `srcdoc`. Eingaben können deshalb nicht als Markup
oder Skript wirksam werden – auch nicht aus einer importierten Datei, denn alle Übernahmen
laufen über feste Schlüssellisten (`COLUMNS`, `STATION_KEYS`, `OPTION_CATEGORIES`, `BEDS`).
Die Prüfung `tests/15-ausgaben-sicherheit.mjs` hält das fest.

Die **CSV-Ausgaben** entschärfen Werte, die mit `=`, `+`, `-` oder `@` beginnen, durch ein
vorangestelltes Hochkomma (`csvFeld` in `js/konfiguration.js`). Ohne das würde eine
Tabellenkalkulation sie beim Öffnen als Formel ausführen – die Anführungszeichen der CSV
schützen davor nicht.

Drei Punkte kann die Anwendung nicht selbst lösen; sie gehören zur Einrichtung des
Arbeitsplatzes und stehen in [INSTALLATION.md](INSTALLATION.md):

- **Der Anwendungsordner muss für normale Benutzer schreibgeschützt sein.** Wer eine der
  Dateien unter `js/` ändern kann – etwa `vorgaben.js` – führt beim nächsten Laden
  beliebigen Code in der Seite aus. Das gilt für jede Seite, die von der Festplatte läuft
- **Der Browser-Speicher ist nicht abgeschottet.** Alle unter `file://` geöffneten Seiten
  teilen sich denselben `localStorage`; jede andere HTML-Datei, die im selben Browserprofil
  geöffnet wird, kann die Tafel mitlesen. Deshalb ein eigenes Profil nur für die Tafel
- **In `slides/` gehören nur geprüfte Dateien**, weil PDFs im Betrachter des Browsers
  angezeigt werden

## Datenschutz

Die Anwendung überträgt keine Daten. Sämtliche Eingaben verbleiben im Browser des
jeweiligen Arbeitsplatzes. Da es sich um Patientendaten handelt, gilt für den Einsatz:
nur auf Stationsrechnern innerhalb des Kliniknetzes betreiben, Bildschirmsperre nutzen
und Export-Dateien nicht ungeschützt ablegen. Ein Mehrplatzbetrieb mit gemeinsamer
Datenhaltung würde eine Server-Komponente erfordern und ist bewusst nicht enthalten.

Welche Daten wo liegen, wie lange sie bleiben, was den Rechner verlässt und welche
Entscheidungen dabei begründet sind, steht in **[DATENSCHUTZ.md](DATENSCHUTZ.md)** – als
Vorlage für das Verzeichnis von Verarbeitungstätigkeiten. Die dort mit `⟨…⟩` markierten
Stellen füllt die Station selbst aus.

Drei Punkte, die dabei leicht übersehen werden:

- Die **Sicherungsdateien** enthalten alle Namen im Klartext. Sie gehören in einen Ordner
  mit Rechten für die Station, nicht in den Download-Ordner; voreingestellt sind sieben
  Dateien, ältere werden gelöscht
- Beide **Ausdrucke** tragen eine Fußzeile mit Druckzeitpunkt und dem Hinweis auf den
  Datenschutzbehälter – besonders das Physio-Blatt verlässt die Station
- Die **Passwörter** vor den Einstellungen schützen vor versehentlichem Verstellen, nicht vor
  Zugriff. Sie stehen im Quelltext. Die zweite Stufe hält die eingreifenden Bereiche – Daten,
  Bettplätze, Listen – von der laufenden Schicht fern, ersetzt aber keine Zugriffskontrolle.
  Der wirksame Schutz ist die Bildschirmsperre des Arbeitsplatzes
