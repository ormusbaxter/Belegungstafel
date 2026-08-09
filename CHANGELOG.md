# Änderungen

Die Fassung steht in `js/konfiguration.js` als `VERSION` und erscheint im Fuß der Hilfe.
Erste Stelle: grundlegender Umbau oder geänderte Datenhaltung. Zweite: neue Funktion oder
spürbar geänderte Bedienung. Dritte: Korrekturen und kleine Anpassungen.

## 2.26.1

- **Laufbalken am unteren Rand der Diaschau:** Er läuft je Eintrag durch und zeigt, wie lange
  das Bild noch steht. Bei nur einem Eintrag bleibt er fort – dann wechselt nichts
- bewegt wird er über einen CSS-Übergang auf `transform`, nicht über einen zweiten Zeitgeber
  neben dem, der das Dia weiterschaltet. Ein Arbeitsplatz mit `prefers-reduced-motion` bekommt
  ihn ohne Bewegung

## 2.26.0

- **Ein PDF aus genau zwei Hochkantseiten wird nebeneinander gezeigt.** Ein Merkblatt oder ein
  beidseitiger Aushang ist damit auf einen Blick zu lesen, statt dass die zweite Seite nur bei
  gesondertem Eintrag erscheint. Umgesetzt als zwei Rahmen derselben Datei, auf Seite 1 und 2
  gestellt – der Betrachter des Browsers kennt keine Doppelseitenansicht
- die **Seitenzahl** wird beim Übernehmen aus `/Count` gelesen. Für Dateien, die vor dieser
  Fassung übernommen wurden, trägt die Tafel sie beim nächsten Start aus dem gespeicherten
  Inhalt nach – niemand muss den Ordner erneut wählen
- **entschieden wird an der Bühne, nicht an einer festen Zahl:** Nebeneinander fallen die
  Seiten kleiner aus, sobald die Bühne schmaler ist als zwei Seiten breit. Bis zu drei
  Vierteln der Höhe, die eine einzelne Seite hätte, ist der Gewinn den Verlust wert; darunter
  bleibt es bei der ersten Seite. Gerechnet wird bei jedem Dia neu, denn die Bühne ist
  schmaler, wenn rechts die Termine stehen
- eine in der Spalte „S." eingetragene Seite geht vor – wer eine bestimmte will, bekommt diese
- die Liste im Einstellungsfenster nennt jetzt die Seitenzahl und kündigt die Doppelseite an
- **behoben:** Bei jedem mehrseitigen PDF stand eine Bildlaufleiste am Rand und schob die
  Seite aus der Passung, sodass die Nachbarseite angeschnitten hineinragte. Der heutige
  Betrachter des Browsers befolgt `scrollbar=0` nicht mehr; die Seite steckt deshalb jetzt in
  einem Kasten, der ihren Rahmen beschneidet. Das galt schon für die einzelne Seite
- neue Prüfdatei `tests/20-doppelseite.mjs` (21 Prüfungen)

## 2.25.2

- das Terminfenster heißt jetzt **„Termin-Management"** statt „Anstehende Termine"
- der Erklärtext darüber (Reihenfolge, „Heute", Reihen) und der Datenschutzhinweis sind
  entfallen; das Fenster beginnt mit der Liste. Beides steht weiterhin in der Kurzanleitung,
  der Hinweis auf die Patientendaten zusätzlich in `DATENSCHUTZ.md`

## 2.25.1

- die Passwortabfrage der Einstellungen nennt die beiden Zugangsstufen nicht mehr. Wer das
  Passwort hat, weiß, welches er hat; wer es nicht hat, brauchte den Hinweis auch nicht

## 2.25.0

- **Ein Ordner für die Diaschau, sonst nichts.** „Ordner wählen …“ fragt nach einem Ordner und
  übernimmt alle darin liegenden Dateien der Art PDF, PNG und JPEG **mit ihrem Inhalt** in die
  Tafel. Wo der Ordner liegt, ist gleichgültig: Schreibtisch, USB-Stick, Netzlaufwerk. Es muss
  keine Datei kopiert, umbenannt oder von Hand eingetragen werden
- bis dahin wurden nur die **Namen** übernommen und über den festen Pfad `slides/…` angezeigt.
  Wer einen anderen Ordner wählte, bekam eine Warnung und eine leere Schau – die Aushänge
  mussten erst in den einen richtigen Ordner kopiert werden
- die Dateien liegen jetzt im Browserprofil (`IndexedDB`, neue Datei `js/diaspeicher.js`) und
  werden über eine Blob-Adresse angezeigt, nicht über einen Pfad
- **derselbe Ordner erneut gewählt frischt auf, statt zu verdoppeln**: Gleichnamige Einträge
  behalten Anzeigedauer und Platz in der Reihenfolge, bekommen aber den neuen Inhalt. So wird
  ein ausgetauschter Aushang übernommen; neue Dateien kommen hinten dazu
- unter der Liste stehen **Anzahl und belegter Platz**, daneben „Übernommene Dateien
  entfernen“. Entfernte Einträge geben ihren Platz wieder frei – auch dann, wenn eine
  Ordnerauswahl über „Schließen“ verworfen wurde
- das **Seitenformat einer PDF** wird beim Übernehmen aus `/MediaBox` gelesen und steht damit
  auch ohne Webserver zur Verfügung
- entfallen: „Ordner einlesen“ über `slides/slides.json` oder die Verzeichnisübersicht eines
  Webservers, und damit die Notwendigkeit, eine Liste von Hand zu pflegen. `slides/slides.json`
  ist gelöscht, `slides/LIESMICH.txt` neu geschrieben. „+ Datei aus „slides““ bleibt als
  Notnagel für den Betrieb über einen Webserver
- **behoben:** Nach einer Ordnerauswahl blieb „Übernehmen“ verborgen, bis man irgendwo sonst
  im Fenster klickte. Der Dateidialog liegt außerhalb des Fensters, sein Ereignis erreichte die
  Änderungserkennung nicht (seit 2.22.0)
- die Dateien stehen **nicht** im JSON-Export und nicht in einer erzeugten `js/vorgaben.js`;
  ein neuer Arbeitsplatz bekommt sie über dieselbe Ordnerauswahl. In `DATENSCHUTZ.md` steht
  der neue Speicher mit dem Hinweis, dass dort keine Patientendaten hineingehören
- neue Prüfdatei `tests/19-diaordner.mjs` (22 Prüfungen); sie wählt einen Ordner **außerhalb**
  des Anwendungsordners und prüft, dass die Schau die Bilder wirklich zeigt

## 2.24.1

- **Die Schaltfläche „Termine" steht jetzt unten rechts** bei Statistik, Hilfe und Zahnrad –
  nicht mehr in der Werkzeugleiste oben. Die obere Leiste führt damit weiter nur Ansicht und
  Ausdruck, die runden Knöpfe unten die Fenster
- die vier Knöpfe sind dabei zu einem **Stapel** geworden, statt einzeln festgesetzt zu sein:
  Blendet man Termine oder Statistik aus, rückt er zusammen, statt eine Lücke stehen zu lassen.
  Die verbliebenen Knöpfe behalten ihre bisherigen Plätze

## 2.24.0

- **Die Termine haben ein eigenes Fenster.** Die Schaltfläche „Termine" in der Werkzeugleiste
  öffnet sie **ohne Zugangsstufe**: Sie gehören zum Stationsalltag und ändern sich wöchentlich;
  dafür jedes Mal das Administrationspasswort zu verlangen, war verkehrt. Aus den Einstellungen
  sind sie damit heraus – dort steht nur noch, ob die Schaltfläche erscheint (Allgemein)
- jede Eingabe im Fenster ist **sofort gespeichert**, wie bei den Textfeldern der Tafel; eine
  Zeile ohne Bezeichnung fällt beim Schließen weg
- **wiederkehrende Termine:** wöchentlich, alle 2 Wochen, monatlich, jährlich. Das Datum ist
  dann der **erste** Termin der Reihe, das Feld „Ende der Reihe" begrenzt sie – leer gelassen
  läuft sie weiter
- eine Reihe belegt in der Schau immer nur **eine Zeile**: die mit ihrem nächsten Termin. Sonst
  füllte ein wöchentlicher Eintrag die Spalte allein. Hinter der Bezeichnung steht ihr
  Rhythmus („wöchentlich", „monatlich" …)
- ein monatlicher Termin am 29., 30. oder 31. **rutscht in einem kürzeren Monat auf dessen
  letzten Tag** (31.01. → 28.02.) und steht im nächsten langen Monat wieder auf seinem Tag;
  gerechnet wird immer vom ursprünglichen Datum aus. Ebenso der 29.02. einer jährlichen Reihe
- unter jeder Zeile des Fensters steht, **wann der Termin das nächste Mal fällig ist** – das
  nimmt der Wiederholung das Rätselhafte, gerade beim Monatsletzten
- gespeichert wird jetzt unter `settings.termine.liste`; ein Stand aus `screensaver.termine`
  (bis 2.23.0) **zieht beim ersten Start mit um**
- neue Datei `js/termine.js`; `tests/18-termine.mjs` erweitert (43 Prüfungen)

## 2.23.0

- **Die Diaschau ist zweigeteilt:** links wie bisher die Schau aus Dateien und eigenen
  Hinweisen, rechts die **anstehenden Termine** – Datum, wahlweise Uhrzeit und Bezeichnung,
  die früheste zuerst. Gepflegt unter Einstellungen → Bildschirmschoner
- ein Termin des **heutigen Tages** steht als „Heute" und hervorgehoben; **abgelaufene fallen
  von selbst heraus**, niemand muss aufräumen. Läuft die Schau über Mitternacht, wird der
  rechte Teil neu aufgebaut – sonst hieße „Heute" dort weiter der Vortag
- **ohne Termin bleibt der rechte Teil fort** und die Schau nutzt die volle Breite. Eine
  dauerhaft leere Spalte wäre nur verschenkter Platz
- die Termine sind organisatorisch und dürfen **keine Patientendaten** enthalten – die Schau
  hängt bildschirmfüllend über der Tafel und ist von jedem im Raum zu lesen. Der Hinweis steht
  in den Einstellungen, in der Kurzanleitung und in `DATENSCHUTZ.md`
- neue Prüfdatei `tests/18-termine.mjs` (17 Prüfungen), im regulären Durchlauf enthalten

## 2.22.3

- **Lizenz ergänzt: MIT** (`LICENSE`, mit deutscher Lesefassung). Ohne Lizenzdatei galt
  „alle Rechte vorbehalten" – das Haus hätte die Tafel formal weder ändern noch von einem
  Dritten pflegen lassen dürfen, also genau die Abhängigkeit von einer Person, die eine
  Übergabe auflösen soll
- die Datei steht **nicht** unter `export-ignore` und liegt damit in jedem Auslieferungsstand
  neben `index.html`
- der Fuß der Kurzanleitung nennt sie mit: „© 2026 Oliver Becker · MIT-Lizenz". Damit steht
  auf dem Stationsrechner selbst, unter welchen Bedingungen die Tafel läuft
- `DATENSCHUTZ.md` führt Lizenz und die noch offene Rechteklärung nach § 69b UrhG als eigene
  Zeile im Kopf

## 2.22.2

Kürzungen in der Kurzanleitung, aus dem Stationsbetrieb.

- entfallen: der Zusatz zu Schichtleitung/Blutzuständigkeit/Notfallequipment („gelten für die
  ganze Station …“), die drei Absätze zu Zeilenfarben und Trennlinien unter „Kennzeichen und
  Farben“, der Warnhinweis zum Touchscreen beim Ziehen und Ablegen, der Warnhinweis zur
  Lebensdauer des Verlaufs sowie die sechs Aufzählungspunkte zur Einrichtung der Diaschau
- der Hinweis auf die Fußzeile der Ausdrucke nennt jetzt kurz den **Datenmüll** statt den
  Datenschutzbehälter samt Erklärung
- das Kapitel **Statistik je Schicht** ist entfallen; die Kurzanleitung führt damit
  13 Abschnitte statt 14

Die Anwendung selbst ist unverändert – gestrichen wurde nur beschreibender Text.

## 2.22.1

Zwei Fehler an den Trennlinien aus 2.21.0, beide aus dem Stationsbetrieb gemeldet.

- **Auf einer eingerichteten Tafel wurde keine Linie gezeichnet.** Ein gespeicherter Stand
  kennt die Angabe `trenner` nicht; sie galt damit als abgewählt, und zwar für jeden
  Bettplatz. Betroffen war jede Tafel, an der schon einmal etwas eingestellt worden war – nur
  ein frischer Browser zeigte die Linien

  Ein Stand, in dem **kein einziger** Bettplatz die Angabe trägt, gilt jetzt als älter als
  2.21.0 und bekommt die Vorgabe je Bettplatz. Wer die Linien bewusst abwählt, hat danach
  überall ein ausdrückliches „nein" gespeichert und wird von dieser Übernahme nicht mehr
  erfasst
- **Das Häkchen ließ sich nicht speichern.** Beim Übernehmen baute das Einstellungsfenster
  jede Bettzeile als `{ id, label }` neu – die Angabe fiel dabei heraus, noch bevor
  gespeichert wurde
- die Prüfungen liefen bisher stets mit leerem Browserspeicher und konnten den Fehler deshalb
  nicht sehen. `tests/01-belegung.mjs` prüft jetzt zusätzlich den gespeicherten Stand, das
  Neuladen und beide Fälle eines älteren Standes

## 2.22.0

- **„Übernehmen" schließt das Einstellungsfenster nicht mehr.** Wer mehrere Bereiche ändert,
  musste bisher jedes Mal neu aufschließen – mit Passwort. Der Entwurf beginnt nach dem
  Übernehmen beim gespeicherten Stand von vorn
- **„Übernehmen" erscheint nur, wenn es etwas zu übernehmen gibt.** Verglichen wird der
  Entwurf mit dem gespeicherten Stand; die Bausteine der Reiter schreiben unmittelbar in den
  Entwurf, deshalb wird nach jeder Eingabe und jedem Klick im Fenster nachgesehen
- **Neu: „Schließen".** Ohne Änderungen schließt es sofort, sonst fragt es: OK übernimmt,
  Abbrechen verwirft. Die **Esc-Taste** verhält sich genauso – sonst wäre sie der stille Weg
  an der Rückfrage vorbei. Die frühere Schaltfläche „Abbrechen" entfällt; ihre Aufgabe
  übernimmt die Rückfrage
- die Prüfungen bekamen dafür zwei Hilfen: `uebernehmen()` für das frühere Verhalten
  (übernehmen und schließen) und `verneineRueckfrage()`, weil die Testseite Rückfragen sonst
  von sich aus bestätigt und der Verwerfen-Fall dadurch nie geprüft würde

## 2.21.0

- **Kräftigere Trennlinie zwischen den Zimmern.** Sie steht ab Werk unter 0 b, 1 b, 2, 3, 4 b,
  5, 6 b und 7 – überall dort, wo ein Zimmer endet, und nicht zwischen den beiden Plätzen
  eines Zimmers. Je Bettplatz an- und abwählbar unter Einstellungen → **Bettplätze**, Kästchen
  hinter der Bezeichnung. Die Linie gilt auch auf dem Visitenausdruck
- **Die farbigen Zeilen lassen sich abschalten** – Einstellungen → Allgemein, Punkt 2. Der
  **Farbbalken am Zeilenanfang bleibt stehen**: Der Anwesenheitsstatus ist also weiter auf
  einen Blick zu erkennen, nur die Fläche bleibt ruhig. Der Ausdruck ist ohnehin schwarzweiß
- beide Punkte lassen sich über **Berechtigungen** einzeln freigeben oder wegnehmen; die
  Zeilenfarben sind dort als eigener Unterpunkt von Allgemein geführt
- zwei Prüfungen wählten ihr Ankreuzfeld über die Position in der Liste. Ein neuer Punkt unter
  Allgemein verschob sie; sie greifen jetzt auf die Beschriftung zu

## 2.20.2

- **Das Kennzeichen `ISO` steht unter der Bettbezeichnung statt daneben.** Nebeneinander
  schob es die Zahl aus der Mitte, und die Spalte hielt 32 px Zusatzbreite bereit, sobald
  irgendwo eine Isolation eingetragen war. Sie ist jetzt 55 statt 87 px breit; die gewonnene
  Breite geht an die Spalte Sonstiges

  Die Zeilenhöhe bleibt unverändert: Sie richtet sich ohnehin nach der Spalte
  Norton / Pflegestatus, die zwei Zeilen führt
- **Im Ausdruck bleibt es daneben.** Dort ist die Zeilenhöhe fest gedeckelt, damit das Blatt
  auf eine Seite passt – eine zweite Zeile in der Bettspalte würde abgeschnitten

## 2.20.1

- **Eine einzelne Marke stand vier Pixel zu hoch.** Betroffen war jede Zelle der
  Mehrfachauswahl – Beatmung, Kreislauf, Isolation, Therapielimitierung, Abstriche –, sobald
  genau ein Eintrag darin stand: Der Text saß auf 17 statt auf 21 Pixel, während die
  Auswahlfelder der Nachbarspalten auf 20 standen. Bei mehreren Einträgen fiel es nicht auf,
  weil die Zeilen die Höhe ausfüllten

  Ursache war die Voreinstellung `align-items: stretch` des Flex-Kastens: Die einzelne Marke
  wurde über die volle Höhe des Feldes gezogen, und ihr Text stand oben in dem zu hohen
  Kästchen. Mit `align-items: center` und `align-content: center` steht der Text jetzt auf
  20 Pixel – genau wie die Auswahlfelder daneben

## 2.20.0

- **Auch einzelne Unterpunkte der Einstellungen lassen sich freigeben oder wegnehmen** – die
  sieben Blöcke unter **Allgemein**, die zwei unter **Statistik** und die fünf unter **Daten**.
  Im Reiter Berechtigungen stehen sie eingerückt unter ihrem Reiter; ist der Reiter selbst
  nicht freigegeben, sind sie ausgegraut

  Beispiel: Die Schicht darf Sichtschutz, Diaschau und Zoom stellen, aber nicht den Abstand
  der Norton-Skala – oder sie darf unter Daten die Bezeichnung der Tafel ändern, ohne an
  Export, Import und „Tafel leeren“ zu kommen

  **Gesperrt wird einzeln, nicht einzeln freigegeben.** Wer einen Reiter öffnet, öffnet ihn
  ganz, bis auf die ausgenommenen Punkte. Damit bleibt die Vorgabe leer, und ein später
  hinzukommender Punkt geht nicht unbemerkt verloren
- die **Nummerierung unter Allgemein rückt auf**: Fällt Punkt 5 weg, heißt der bisherige
  Punkt 6 dann 5. Vorher standen die Nummern fest im Text
- ist in einem Reiter kein einziger Punkt freigegeben, steht dort ein Hinweis statt einer
  leeren Fläche

## 2.19.0

- **Das Kontextmenü der rechten Maustaste wird unterdrückt** – abschaltbar unter
  Einstellungen → Allgemein. Bei einem Fehlklick auf die Tafel klappte bisher das Browsermenü
  auf, mit Einträgen wie „Neu laden“ oder „Seitenquelltext anzeigen“

  **In Eingabefeldern bleibt es erreichbar.** Dort hängen die Vorschläge der
  Rechtschreibprüfung und das Einfügen per Maus daran – pauschal geblockt hätte die Änderung
  in den Freitextfeldern mehr genommen als gegeben

  Ein Ersatz für den Kioskbetrieb ist das nicht: `F12`, `Strg + R`, `Strg + P` und das Menü
  des Browsers reserviert dieser für sich, daran kommt eine Seite nicht heran
- **Die volle Zugangsstufe legt fest, was die einfache ändern darf** – neuer Reiter
  **Berechtigungen** mit einem Häkchen je Reiter. Bisher stand das als Liste im Quelltext
  (`EINFACHE_REITER`), eine Änderung war eine Codeänderung

  Zwei Grenzen sind eingebaut: Der Reiter **Berechtigungen selbst steht nie zur Wahl** – sonst
  könnte sich die einfache Stufe darüber alles freischalten –, und **mindestens ein Reiter**
  muss offenbleiben, sonst öffnete das erste Passwort ein leeres Fenster
- die Liste aller Reiter steht jetzt an einer Stelle (`alleReiter()` in `js/konfiguration.js`)
  statt im Aufbau der Leiste – Leiste und Berechtigungen können dadurch nicht auseinanderlaufen

## 2.18.0

- **Die leere Stufe „–“ des Meldestatus entfällt.** Die Tafel trägt damit immer einen Status;
  die Auswahl führt nur noch die eingerichteten Stufen

  Hat eine Tafel noch keinen – frisch aufgesetzt oder aus einer Datei ohne dieses Feld
  eingelesen –, gilt die **erste Stufe der Liste**, und zwar in den Daten und nicht nur in der
  Anzeige. Ohne das zeigte die Kachel eine Stufe, während Ausdruck und Export das Feld leer
  ließen
- ein **bereits gesetzter Wert wird dabei nicht angetastet**, auch wenn er nicht mehr in der
  Liste steht. Er bliebe sonst nicht bloß unvollständig, sondern spränge still auf eine andere
  Stufe – bei einer Angabe, die der Leitstelle gilt, die falsche Richtung
- die **letzte verbleibende Stufe lässt sich nicht entfernen**; ohne leere Stufe stünde sonst
  eine Auswahl ohne Einträge im Kopf der Tafel

## 2.17.0

- **Die Kurzanleitung richtet sich nur noch an die Schicht.** Drei Abschnitte betrafen
  ausschließlich die Administration und sind entfallen: **Zugang zu den Einstellungen**
  (Passwortstufen), **Vorgabe der Station** (`vorgaben.js` erzeugen und einlegen) und
  **Sicherung** (Sicherungsordner, Aufbewahrung, Kennung der Tafel). Dazu gestrichen: Export,
  Import und „Tafel leeren“ aus „Speichern, Drucken, Austausch“ – der Abschnitt heißt jetzt
  **Drucken und Speichern** –, der Absatz über die Statistik-Einstellungen und der Hinweis auf
  die Sicherungsdateien im Abschnitt Datenschutz

  Verloren ist nichts: Alle drei stehen jetzt ausführlicher in `INSTALLATION.md` unter
  „Hintergrund: drei Dinge, die nur die Administration betreffen“
- **Die Hilfe hat ein Menü.** Links stehen die Abschnitte, ein Klick führt an die Stelle, und
  beim Blättern wandert die Hervorhebung mit. Die Einträge entstehen aus den Überschriften des
  Textes, nicht aus einer zweiten, von Hand gepflegten Liste – ein neuer Abschnitt erscheint
  dadurch von selbst. Auf schmalen Schirmen steht das Menü über dem Text statt daneben
- Der Hinweis auf die Fußzeile der Ausdrucke sprach von „beiden Ausdrucken“; es sind drei

## 2.16.0

- **Der Meldestatus ist konfigurierbar.** Bisher standen die drei Stufen fest im Markup und
  ihre Farben fest im Stil; die CSS-Regeln griffen auf den Wortlaut zu (`[data-melde="grün"]`).
  Eine vierte Stufe hätte Änderungen an zwei Dateien verlangt

  Jetzt ist es eine Kategorie wie die übrigen: Einstellungen → **Meldestatus**, Einträge
  hinzufügen, umbenennen, sortieren, entfernen, Kategorie zurücksetzen. **Jede Stufe trägt
  ihre eigene Farbe** aus derselben Auswahl wie die anderen Kategorien; eine Ansicht der
  fertigen Kachel steht daneben. Die feste Kopplung an die Schreibweise entfällt damit
- die **Schriftfarbe rechnet die Tafel aus der Helligkeit** der gewählten Farbe
  (`lesbareSchrift()`). Sonst stünde eine hell gewählte Stufe weiß auf hell
- ein **gesetzter Wert, der später aus der Liste fällt**, bleibt an der Tafel stehen und
  wählbar – wie bei den Spaltenlisten auch. Ohne das spränge die Kachel beim nächsten Aufbau
  still auf „–“
- Zwei Stellen mussten mitgezogen werden, sonst wäre die Kachel stehen geblieben: das
  Übernehmen der Einstellungen und der Umschalter im Kopf selbst. Beide bauen die Kachel
  jetzt neu auf, statt ein Attribut zu setzen

  **Hinweis zur Darstellung:** Die Farbe gilt in Tag- und Nachtansicht gleichermaßen. Die
  bisherigen Stufen hatten je Ansicht einen eigenen Ton; das entfällt, wie schon bei den
  Farben der übrigen Kategorien. Das ausgelieferte Rot ist dadurch `#c62828` statt `#b3261e`

## 2.15.1

- **Das Fälligkeitsdatum der Norton-Skala steht neben dem Häkchen statt darunter.** Bei voller
  Station mit überall gesetztem Norton kostete die Marke je Bettplatz eine dritte Zeile; die
  Zeile war 51 statt 42 px hoch, die Tabelle 723 statt 601 px, und der sichtbare Ausschnitt
  musste entsprechend weit gescrollt werden. Auf einem 1920 × 800 großen Ausschnitt sind jetzt
  141 statt 263 px verdeckt
- die Spalte **Norton / Pflegestatus** ist dafür 152 statt 92 px breit. Den Platz gibt
  **Sonstiges** ab – die einzige Spalte ohne festes Maß, die auf jedem Bildschirm aufnimmt, was
  übrig bleibt. Auf 1920 px behält sie 225 px
- die Testdateien warten großzügiger auf Downloads und geöffnete Fenster, und ein Prozessorkern
  bleibt beim gleichzeitigen Lauf frei. Ein Durchlauf war unter Volllast an einer knapp
  bemessenen Wartezeit gescheitert, ohne dass an der Anwendung etwas fehlte

## 2.15.0

- **Der Block unter der Tafel füllt die verbleibende Höhe.** Bisher stand er in fester Höhe
  unter der Tabelle; auf einem hohen Monitor blieb darunter ein leerer Streifen, und die
  Textfelder waren 58 px hoch, gleich wie viel Platz da war

  Die Seite ist jetzt eine Spalte über die volle Bildschirmhöhe: Kopfbereich und
  Stationsleiste nehmen, was sie brauchen, die Tabelle so viel sie hat, und der Block darunter
  bekommt den Rest. Wird der Platz knapp – viele Bettplätze, kleiner Bildschirm, starke
  Vergrößerung –, gibt die Tabelle nach und scrollt in sich, statt den Block aus dem Bild zu
  schieben. Bei dreizehn Bettplätzen auf 1080 Zeilen wachsen die Textfelder von 58 auf 162 px
- **Die beiden Textfelder sind immer gleich hoch** und lassen sich nicht mehr von Hand ziehen.
  Die Höhe kommt aus dem Platz, nicht aus dem Ziehen an einer Ecke. Damit sie gleich bleiben,
  sind die Überschriften einzeilig gesetzt: Bräche „Allgemeine Informationen“ um, stünde
  daneben eine Zeile mehr zur Verfügung
- rechts bleibt eine Gasse für Statistik, Hilfe und Zahnrad frei – die drei schweben über der
  Seite und lägen sonst über dem Textfeld für die Informationen

## 2.14.1

- **Beim Ziehen hängt die ganze Zeile am Zeiger**, nicht mehr nur die angefasste
  Bettplatz-Zelle. Über dreizehn Zeilen und zwanzig Spalten hinweg war an der kleinen Zelle
  nicht zu erkennen, welcher Patient gerade bewegt wird; jetzt ist das Abbild die vollständige
  Zeile mit Namen, Verfahren und Kennzeichen, angefasst an der Stelle des Griffs

  Der Browser bildet von sich aus nur das angefasste Element ab. Das Abbild wird deshalb
  vorgegeben: ein Klon der Zeile in einer eigenen Tabelle mit den gemessenen Spaltenbreiten –
  eine Zeile für sich hat kein Layout – und mit einzeln nachgezogenen Feldwerten, denn
  `cloneNode` überträgt nur Attribute, nicht den eingetippten Stand

## 2.14.0

- **Krankenhaus und Station lassen sich benennen** – zwei Felder in den Einstellungen unter
  „Daten“. Sie ersetzen die feste Beschriftung neben dem Logo: das Haus als Titel, die Station
  daneben in leichterer Schrift

  Beide gelten zugleich für den Fenstertitel, den Kopf des Bildschirmschoners, die Fußzeile
  jedes Ausdrucks und die Kopfzeile der CSV-Ausgabe. Diese vier Stellen trugen die Bezeichnung
  bisher jede für sich im Quelltext; sie kommt jetzt aus `tafelTitel()`. Ein leer gelassenes
  Feld entfällt, statt eine Lücke zu hinterlassen

  Ausgeliefert wird weiterhin „Belegungstafel Intensivstation“ – für eine vorhandene Tafel
  ändert sich nichts, bis die Station ihre Namen einträgt

## 2.13.0

Ausdruck der Tafel.

- **„Drucken" heißt jetzt „Druck Visite"** – wie „Druck Physio" und „Übergabezettel" nennt
  die Schaltfläche damit den Anlass, nicht den Vorgang
- **Der Ausdruck passt immer auf eine Seite A4 quer.** Vorher lief er bei voller Station mit
  langen Namen und mehreren Isolationen auf zwei Seiten, bei mehr als 20 Bettplätzen auf drei

  Zwei Ursachen, beide behoben. Die eine steckte im Stil: `.multicell` hält am Bildschirm
  30 px Mindesthöhe bereit, damit sich die Mehrfachauswahl sicher anklicken lässt – im Druck
  war das ein Boden, unter den keine Zeile kam. Die andere war die Rechnung: Die Zeilenhöhe
  richtete sich allein nach der Zahl der Bettplätze, während die tatsächliche Höhe am Inhalt
  hängt, denn für eine Tabellenzelle ist eine Höhenangabe nur ein Mindestmaß

  Jetzt ist die Zeilenhöhe im Druck fest gedeckelt (`tbody td > *`), die Höhe der Tabelle
  steht damit vorab fest. Die Schriftgröße wird davor so gewählt, dass der Inhalt hineingeht:
  `visiteEinpassen()` rechnet je Bettplatz den Wortumbruch der schmalen Druckspalten nach und
  verkleinert, bis die vollste Zeile passt – bei leerer Tafel 10,5 px, bei voller Station mit
  langen Namen rund 8 px. Die eine Seite hängt damit nicht mehr an der Schätzung: Trifft sie
  daneben, kostet das eine angeschnittene Zelle statt eines zweiten Blattes
- ein **zu langer Patientenname** wird allein in seiner Zeile kleiner gesetzt, statt
  abgeschnitten zu werden – dasselbe Vorgehen wie auf dem Physio-Blatt
- `tests/03-drucken.mjs` prüft die Seitenzahl am erzeugten PDF, nicht an gerechneten
  Millimetern: leere Tafel, volle Station, volle Station mit langen Namen und vier
  Isolationen, und 26 Bettplätze

## 2.12.1

Übergabezettel, aus dem Stationsbetrieb.

- **Die Zuständigkeit im Vorbereitungsfenster beginnt bei jedem Aufruf leer.** Eingetragen
  wird dort, wer die *kommende* Schicht übernimmt – das ist eine andere Angabe als die unter
  der Tafel, die die *laufende* Schicht nennt. Die drei Felder sind deshalb von der Tafel
  getrennt: eigene, nicht gespeicherte Werte allein für diesen Zettel, die unter der Tafel
  nichts ändern

  Das kehrt die Entscheidung aus 2.9.2 um („dieselben Felder wie unter der Tafel, keine
  zweite Wahrheit“). Der Grund: Wären es dieselben Felder, müsste jeder Aufruf des Fensters
  die Angaben der laufenden Schicht löschen, um leer zu starten – ein bloßer Blick auf den
  Zettel würde Daten auf der Tafel vernichten
- **Die Telefone stehen nur noch mit ihrer Nummer** auf dem Blatt, ohne Bezeichnung des
  Geräts; wofür ein Gerät zuständig ist, weiß die Schicht. Nummer und Schreiblinie passen
  dadurch nebeneinander in eine Zeile statt untereinander in zwei – der Kasten wird um vier
  Zeilenhöhen flacher, was der Tabelle zugutekommt

## 2.12.0

Ausdruck des Übergabezettels.

- **Alle Bettplätze** stehen auf dem Blatt, auch die freien: Die Übergabe kann die Tafel
  Zeile für Zeile durchgehen und einen leeren Platz als solchen bestätigen
- **Diagnosen** stehen jetzt direkt hinter dem Patientennamen, vor den Verfahren
- **Nierenersatz** ist breit genug für `CVVHD`, auch in Klammern, ohne Umbruch
- die Fußzeile aller Ausdrucke endet auf „nach Dienstende Entsorgung in Datenmüll!"
- **Das Blatt passt auf eine Seite.** Vor dem Druck wird es unsichtbar eingehängt, vermessen
  und die Schriftgröße so gewählt, dass alles hineingeht – bei leerer Tafel 3,6 mm, bei voller
  Station knapp 2,6 mm. Unter 2,1 mm wird nicht verkleinert; treffen dreizehn sehr lange
  Diagnosen zusammen, läuft das Blatt lieber auf eine zweite Seite, als unlesbar zu werden

  Dafür stehen die Stilregeln des Blattes jetzt außerhalb von `@media print` – nur so lässt
  sich seine Höhe vor dem Druck messen. Name und Fachdisziplin stehen nebeneinander statt
  untereinander, die Telefonliste vierspaltig statt zweispaltig; beides gibt der Tabelle Höhe
  zurück und damit Schriftgröße

## 2.11.0

- **Auslastung (%)** als neue Spalte in beiden Tabellen der Statistik und in der CSV-Ausgabe:
  belegte Plätze geteilt durch die maximale Bettenzahl, ohne das Notbett im Nenner. War es
  belegt, steht dort folglich mehr als 100 % – eine Überbelegung soll sichtbar bleiben und
  nicht rechnerisch verschwinden. Ohne eingetragene Bettenzahl bleibt die Spalte leer

  Der Wert wird bei jeder Anzeige gerechnet und nicht gespeichert; er steht damit auch für
  früher erfasste Schichten zur Verfügung
- die Kopfzeilen der Statistiktabellen brechen um, statt bei acht Kennzahlen abgeschnitten
  zu werden

## 2.10.2

- Der Hinweis auf die eingeschränkte Zugangsstufe im Einstellungsfenster entfällt; die
  beiden verfügbaren Reiter sprechen für sich

## 2.10.1

- Die **Einstellungspasswörter stehen nicht mehr im Klartext** in den Dateien, sondern als
  PBKDF2-Ableitung mit eigenem Salt (600 000 Runden, SHA-256, geprüft über `crypto.subtle`).
  Ein Blick in `js/einstellungen.js` verrät sie damit nicht mehr. Neue Passwörter erzeugt
  `node werkzeuge/passwort.mjs <einfach|voll> "<Passwort>"`; das Werkzeug gehört nicht zum
  Auslieferungsarchiv

  Das hebt die Hürde von „Datei öffnen und mitlesen" auf „Prüfung ausbauen oder Passwort
  durchprobieren". Ein Zugriffsschutz wird daraus nicht: Wer die Dateien ändern kann, kommt
  weiterhin hinein. Dagegen hilft allein der Schreibschutz des Anwendungsordners

## 2.10.0

- **Zwei Stufen beim Zugang zu den Einstellungen.** Das erste Passwort öffnet nur
  **Allgemein** und **Bildschirmschoner** – Sichtschutz, Zoom, Nachtansicht, Norton-Abstand,
  Diaschau –, also das, was im Dienst gebraucht wird; die übrigen Reiter erscheinen dabei
  gar nicht. Das zweite Passwort gibt alles frei, einschließlich Bettplätzen, Spaltenköpfen,
  Auswahllisten, Statistik und dem Bereich Daten mit Export, Import und „Tafel leeren“.
  Bei der einfachen Stufe nennt ein Hinweis im Fenster, was fehlt und warum

  Die Abstufung soll versehentliches Verstellen im Dienst verhindern. Ein Zugriffsschutz ist
  sie nicht: Beide Passwörter stehen weiterhin im Quelltext der Seite

## 2.9.3

Ausdruck des Übergabezettels.

- Die Spalte **Notizen** bringt jetzt den Text aus der Tafelspalte **Sonstiges** mit und
  lässt darunter Platz zum handschriftlichen Ergänzen
- Im Kasten **Zuständigkeit** steht darunter die **Bettenzahl**: die maximale Zahl zuzüglich
  Notbett und die zurzeit belegten Plätze. Ohne Eintrag bleibt eine Linie zum Ausfüllen
- Die Spalten sind mit **Symbolen** überschrieben statt mit Wörtern – 🛏 👤 🫁 ♥ 🫘 ☣ ⊘ ⚕ 🧠
  💉 ✍ ✎. Die Kopfzeile wird dadurch einzeilig, der gewonnene Platz geht an die Zeilen. Am
  Bildschirm nennt der Zeigertext die Spalte weiterhin im Klartext

  Lunge, Niere und Hirn stammen aus einer neueren Unicode-Fassung und können auf älteren
  Windows-Schriften als leeres Kästchen erscheinen. `INSTALLATION.md` führt das als Prüfpunkt
  beim Testdruck; der Austausch gegen ältere Zeichen ist eine Zeile in `js/uebergabe.js`

## 2.9.2

Ausdruck des Übergabezettels, nach Rückmeldung aus der Station.

- **Bettplatz, Beatmung, Nierenersatz und Limitierung** auf die knappste Breite gesetzt, die
  ihre Kürzel zulassen; der gewonnene Platz geht an die Diagnosen und an eine **neue letzte
  Spalte „Notizen"** zum handschriftlichen Ergänzen
- **Schichtleitung, Blutzuständigkeit und Notfallequipment** lassen sich jetzt im Fenster
  „Übergabezettel" an erster Stelle eintragen – dieselben Angaben wie unter der Tafel, kein
  Pflichtfeld. Was leer bleibt, lässt der Ausdruck zum Eintragen von Hand frei
- „Zuständig in der Schicht" heißt auf dem Blatt jetzt **„Zuständigkeit"**,
  „Telefone – wer übernimmt?" nur noch **„Telefone"**
- behoben: Die allgemeinen Druckregeln der Tafel überschrieben die Spaltenbreiten des
  Blattes – alle zwölf Spalten waren gleich breit, und der Zettel brauchte dadurch schon bei
  sechs Patienten zwei Seiten

## 2.9.1

- **Übergabezettel erweitert**: Das Blatt führt jetzt zusätzlich **Beatmungsform,
  Kreislaufunterstützung, Nierenersatz, Isolation und Therapielimitierung** aus der Tafel mit;
  ganz rechts bleibt je Patient ein leeres Feld für das Kürzel der **übernehmenden
  Pflegekraft**
- Unter der Tabelle stehen nun die **geplanten Aufnahmen** (mit Zeilen zum Ergänzen von Hand),
  daneben **Schichtleitung, Blutzuständigkeit und Notfallequipment** und rechts die
  **Diensttelefone** mit je einer Linie für die Person, die das Gerät übernimmt. Die Liste
  entspricht den Vorschlägen der Spalte Telefon und wird in den Einstellungen gepflegt

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
