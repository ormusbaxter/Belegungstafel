# Datenschutz-Steckbrief

Kurzbeschreibung der Belegungstafel für die Datenschutzbeauftragten, die IT und den
Personalrat. Sie ersetzt kein Verzeichnis von Verarbeitungstätigkeiten, liefert aber die
Angaben, die dafür gebraucht werden.

**Entwurf – vor der Verwendung von der Station auszufüllen und freizugeben.** Die mit
`⟨…⟩` gekennzeichneten Stellen kennt nur die Station selbst.

| | |
|---|---|
| Bezeichnung | Belegungstafel Intensivstation |
| Fassung | siehe `js/konfiguration.js`, `VERSION`, und `CHANGELOG.md` |
| Zweck | Organisation der laufenden Schicht: Wer liegt auf welchem Bettplatz, welche Vorkehrungen sind zu treffen, wer ist zuständig |
| Verantwortlich | ⟨Klinik, Abteilung⟩ |
| Fachlich zuständig | ⟨Stationsleitung⟩ |
| Betrieb | ⟨Arbeitsplätze, auf denen die Tafel läuft – vollständig aufführen⟩ |
| Ablösung von | bisherige Excel-Tabelle gleichen Inhalts |

## 1. Welche Daten

**Patientenbezogen** – je Bettplatz: Name, Fachdisziplin, Anwesenheitsstatus, Beatmungsform,
Kreislaufunterstützung, Dialyse, Isolation einschließlich Verdachtskennzeichen, TTM,
Intervention, Therapielimitierung, Telefon, Kostform, Privatstatus, Physiotherapie, Devices,
Norton / Pflegestatus, Datum des nächsten Abstrichs, Sonstiges. Bei Verstorbenen zusätzlich
das Kreuz und der Todeszeitpunkt.

**Übergabezettel** – je Bettplatz zusätzlich Diagnosen (Freitext), neurologischer Status und
laufende Katecholamine. Diese drei Angaben erscheinen **nicht auf der Tafel**; sie sind nur
über die Schaltfläche „Übergabezettel“ sichtbar und stehen auf dem zugehörigen Ausdruck.
Gespeichert werden sie wie die übrigen Angaben. Die Funktion lässt sich in den Einstellungen
vollständig abschalten; dann werden keine solchen Angaben erhoben.

Isolation, Beatmung, Dialyse, Therapielimitierung sowie die Angaben des Übergabezettels sind
**Gesundheitsdaten** im Sinne von Art. 9 DSGVO. Die Verarbeitung stützt sich auf Art. 9
Abs. 2 lit. h DSGVO in Verbindung mit ⟨landesrechtliche Grundlage, z. B. Krankenhausgesetz
des Landes⟩.

**Nicht erfasst** – bewusst: Geburtsdatum, Fallnummer, Adresse, Befunde, Medikation
(ausgenommen die vier Katecholamine des Übergabezettels), Angehörige.

**Beschäftigtenbezogen**: Pflegekraft je Bettplatz, Schichtleitung, Blutzuständigkeit,
Notfallequipment, jeweils mit Telefonnummer. Dazu ein technischer Änderungszeitstempel je
Bettplatz und ein Verlauf der letzten 20 Änderungen, beide ohne Angabe einer Person.

Die gleichnamigen Angaben im Fenster des Übergabezettels nennen die *kommende* Schicht. Sie
gelten allein für den Ausdruck, werden **nicht gespeichert** und sind mit dem Schließen der
Seite fort.

## 2. Wo die Daten liegen

Ausschließlich im `localStorage` des Browserprofils des jeweiligen Arbeitsplatzes, als
JSON im Klartext. Es gibt keine Datenbank, keinen Server und keine Netzverbindung; die
Anwendung sendet nichts nach außen. Mehrere Arbeitsplätze führen jeweils einen eigenen,
voneinander unabhängigen Bestand.

Schlüssel: `belegungstafel.intensiv.v1`, `.einstellungen`, `.theme`, `.sicherung`,
`.statistik`, gegebenenfalls ergänzt um die Kennung der Tafel aus `data-instanz`.

## 3. Was den Rechner verlässt

| Weg | Inhalt | Auslöser |
|---|---|---|
| Tägliche Sicherung (JSON) | vollständiger Bestand, Klarnamen | automatisch, wenn eingeschaltet |
| Export JSON / CSV | vollständiger Bestand, Klarnamen | von Hand |
| Ausdruck „Drucken" | Name, Bettplatz, Fachdisziplin, Isolation, Intervention, Therapielimitierung, Telefon, Pflegekraft | von Hand |
| Ausdruck „Druck Physio" | Bettplatz, Name, Fachdisziplin, **Isolation**, Telefon, Pflegekraft | von Hand |
| Ausdruck „Übergabezettel" | Bettplatz, Name, Fachdisziplin, **Isolation, Beatmung, Kreislauf, Nierenersatz, Therapielimitierung, Diagnosen, Neurologie, Katecholamine, Sonstiges**, dazu geplante Aufnahmen, die Zuständigkeiten der Schicht und die Bettenzahl | von Hand |
| Statistik-Export (CSV) | ausschließlich Zahlen je Schicht, **keine Personendaten** | von Hand |
| `js/vorgaben.js` | ausschließlich Einstellungen, **keine Personendaten** | von Hand |

Ablageort der Sicherungen: ⟨Ordner eintragen⟩. Er muss auf die Station beschränkt sein; der
Download-Ordner des Browsers ist dafür nicht geeignet.

Alle Ausdrucke tragen eine Fußzeile mit Druckzeitpunkt und dem Hinweis auf die Entsorgung
im Datenschutzbehälter. Der Übergabezettel ist von ihnen der empfindlichste – er enthält
Diagnosen im Klartext und sollte die Station nicht verlassen.

## 4. Aufbewahrung und Löschung

| Bestand | Frist |
|---|---|
| Tafel | Der Bettplatz wird beim Verlegen oder Entlassen geräumt; danach ist der Eintrag fort |
| Übergabezettel | dieselben Angaben je Bettplatz; „Bettplatz räumen“ löscht sie mit |
| Sicherungen | je Tag eine Datei, ältere werden automatisch gelöscht – eingestellt sind ⟨n⟩ Dateien, Voreinstellung 7 |
| Verlauf | letzte 20 Schritte, nur im Arbeitsspeicher, endet mit dem Schließen der Seite |
| Statistik | Zahlen ohne Personenbezug, Aufbewahrung nach Einstellung ⟨n⟩ Tage |
| Ausdrucke | bis Dienstende, danach Datenschutzbehälter |

Die Tafel ist keine Dokumentation und tritt nicht an die Stelle der Patientenakte; für sie
gelten die Aufbewahrungsfristen der Krankenakte ausdrücklich **nicht**.

Beim Ausmustern eines Arbeitsplatzes ist das Browserprofil zu löschen – die Daten liegen
nicht in einer Datei, die man übersieht, aber auch nicht in einer, die die IT von sich aus
findet.

## 5. Wer Zugriff hat

Jede Person, die sich am Windows-Konto des Arbeitsplatzes anmelden kann. Der Schutz ist
damit der Zugangsschutz des Rechners, nicht der der Anwendung.

Vor dem Einstellungsfenster stehen zwei Passwörter: eines öffnet nur Allgemein und
Bildschirmschoner, eines alle Einstellungen einschließlich Export, Import und „Tafel leeren“.
Die Abstufung verhindert versehentliches Verstellen und hält die eingreifenden Bereiche von
der laufenden Schicht fern. Die Passwörter sind als PBKDF2-Ableitung hinterlegt, nicht im
Klartext; aus den Dateien lassen sie sich also nicht ablesen. Ein **Zugriffsschutz ist das
dennoch nicht**: Wer die Dateien der Anwendung ändern kann, entfernt die Prüfung. Das darf
nicht anders dargestellt werden – der wirksame Schutz bleibt der Schreibschutz des Ordners
und die Anmeldung am Rechner.

Zwei Eigenschaften des Betriebs von der Festplatte gehören dazu:

- Alle unter `file://` geöffneten Seiten teilen sich denselben Browser-Speicher. Jede
  andere HTML-Datei, die im selben Browserprofil geöffnet wird, kann die Tafel mitlesen.
  Der Arbeitsplatz betreibt die Tafel deshalb in einem eigenen Browserprofil, in dem
  nichts anderes geöffnet wird
- Wer die Dateien der Anwendung ändern kann, führt beim nächsten Laden eigenen Code aus.
  Der Anwendungsordner ist deshalb für normale Benutzer schreibgeschützt

Wirksame Maßnahmen sind deshalb organisatorisch:

- automatische Bildschirmsperre des Arbeitsplatzes nach ⟨n⟩ Minuten
- Aufstellung des Monitors so, dass er von Besuchern nicht einzusehen ist
- Sichtschutz der Tafel: nach 120 Sekunden ohne Eingabe werden alle patientenbezogenen
  Spalten unkenntlich; lesbar bleiben nur Anwesenheitsstatus, Bettplatz, Telefon und
  Pflegekraft. Sofort auslösbar über die Schaltfläche „Datenschutz"
- der Bildschirmschoner legt sich nach ⟨n⟩ Sekunden über die Tafel und zeigt selbst keine
  Patientendaten

## 6. Beschäftigtendaten

Die Tafel hält fest, welche Pflegekraft welchen Bettplatz betreut, und speichert je
Bettplatz den Zeitpunkt der letzten Änderung. Die Auswertung je Schicht enthält
ausschließlich Zahlen zu Belegung, Isolationen, Beatmungen und Dialysen – keine Namen und
keine Zuordnung zu Personen.

Grundsätzlich ließe sich aus den Angaben dennoch auf Tätigkeiten schließen. Eine solche
Verwendung ist nicht vorgesehen; wegen § 87 Abs. 1 Nr. 6 BetrVG beziehungsweise der
entsprechenden Regelung im Personalvertretungsrecht ist der Personalrat vor der Einführung
zu beteiligen. ⟨Stand der Beteiligung eintragen⟩

## 7. Entscheidungen, die begründet sind

**Vollständige Namen statt Kürzel.** Datenminimierung nach Art. 5 Abs. 1 lit. c DSGVO würde
für abgekürzte Namen sprechen. Dagegen steht die Patientensicherheit: Auf einer
Intensivstation mit wechselnden Schichten wiegt die Verwechslungsgefahr bei ähnlichen Namen
schwerer als der Zugewinn an Datensparsamkeit, zumal die Tafel nur den aktuellen Bestand
führt und ohnehin nur von der Station eingesehen wird.

**Keine Verschlüsselung der Sicherungen.** Ein Schlüssel, den die Nachtschicht im
Ernstfall finden muss, läge am Bildschirmrand. Statt dessen: Ablage in einem Ordner mit
beschränkten Rechten und kurze Aufbewahrung.

**Keine Anbindung an KIS oder PDMS.** Die Tafel liest nichts aus anderen Systemen; alle
Angaben werden von der Schicht eingetragen. Damit entsteht kein weiterer Datenfluss.

**Diagnosen nur im Übergabezettel, nicht auf der Tafel.** Für die Übergabe zwischen zwei
Schichten werden Diagnosen, neurologischer Status und laufende Katecholamine gebraucht; auf
dem dauerhaft sichtbaren Bildschirm am Stützpunkt haben sie nichts zu suchen. Beides ist
deshalb getrennt: Die Angaben sind nur im eigenen Fenster und auf dem eigenen Ausdruck zu
sehen, und die Funktion lässt sich abschalten, wenn die Station sie nicht nutzt.

**Kein Medizinprodukt.** Die Tafel dient der Organisation der Schicht, nicht der Diagnose
oder Therapie. Sie zeigt keine Gerätedaten an und trifft keine Aussagen, auf die hin
behandelt wird. Der Übergabezettel gibt wieder, was in der Patientenakte steht; er tritt
nicht an deren Stelle und ist keine Dokumentation.

## 8. Was noch offen ist

- ⟨Freigabe durch die Datenschutzbeauftragten⟩
- ⟨Eintrag im Verzeichnis von Verarbeitungstätigkeiten⟩
- ⟨Beteiligung des Personalrats⟩
- ⟨Festlegung des Sicherungsordners und seiner Berechtigungen⟩
- ⟨Liste der Arbeitsplätze, auf denen die Tafel betrieben wird⟩
