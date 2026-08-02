# Installation auf den Stationsrechnern

Vier Teile: einmal je Fassung vorbereiten, dann je Rechner aufspielen, einrichten und
später aktualisieren. Die Kästchen sind zum Abhaken gedacht.

---

## 1. Vorbereiten (einmal je Fassung, am Entwicklungsrechner)

- [ ] **Einstellungen der Station festlegen.** Einen Rechner vollständig einrichten:
      Bettplätze, Spaltenköpfe, alle Auswahllisten, Farben, Telefonliste, Sichtschutz,
      Bildschirmschoner, Nachtansicht, Zoom, Schichtzeiten der Statistik.
- [ ] **Vorgabedatei erzeugen.** Einstellungen → Daten → „Aktuelle Einstellungen als
      Vorgabe sichern". Die erzeugte Datei als `js/vorgaben.js` **ins Repository**
      übernehmen und committen.

      Das ist der Schritt, an dem alles hängt: Ein frisch aufgespielter Rechner hat leeren
      Browser-Speicher und startet ohne diese Datei mit den eingebauten Werten. Die Datei
      enthält ausschließlich Einstellungen und **keine Patientendaten**, sie darf deshalb
      versioniert und weitergegeben werden.
- [ ] **Fassung prüfen.** `VERSION` in `js/konfiguration.js` erhöht, passender Abschnitt in
      `CHANGELOG.md` vorhanden.
- [ ] **Prüfungen laufen lassen:** `node tests/run.mjs` – alle Dateien bestanden.
- [ ] **Archiv erzeugen:** `./release.sh` (oder `powershell -File .\release.ps1`).
      Ergebnis: `dist/belegungstafel-<Fassung>.zip`, dazu Prüfsumme und Inhaltsverzeichnis
      auf dem Bildschirm. `tests/` und die Entwicklungsunterlagen sind nicht enthalten.
- [ ] Archiv auf den Datenträger kopieren. **Vorher mit der IT klären** – in vielen Häusern
      ist der private USB-Stick nicht der vorgesehene Weg, eine Softwareverteilung oder eine
      Freigabe schon.

---

## 2. Aufspielen (je Rechner)

- [ ] Archiv nach `C:\Programme\Belegungstafel\` entpacken.
- [ ] **Ordner für normale Benutzer schreibgeschützt setzen.** Wer eine Datei unter `js\`
      ändern kann, führt beim nächsten Laden eigenen Code in der Seite aus. `slides\` darf
      beschreibbar bleiben, wenn die Station selbst Aushänge ergänzen soll – eine PDF ist
      ungefährlich, eine Skriptdatei nicht.
- [ ] **Verknüpfung anlegen** statt Doppelklick auf `index.html`:

      ```
      chrome.exe --user-data-dir="C:\ProgramData\Belegungstafel\profil"
                 --app="file:///C:/Programme/Belegungstafel/index.html"
      ```

      `--user-data-dir` gibt der Tafel ein eigenes Browserprofil. Das ist keine Kosmetik:
      Alle unter `file://` geöffneten Seiten teilen sich denselben Speicher, und ohne
      eigenes Profil könnte jede andere HTML-Datei, die jemand in diesem Browser öffnet,
      die Tafel mitlesen. `--app` gibt ein Fenster ohne Adressleiste.

      Das Profilverzeichnis muss **beschreibbar** sein – dort liegen die Daten der Tafel.
- [ ] Verknüpfung an die Taskleiste heften oder in den Autostart legen.

### Die Windows-Anmeldung vorher klären

Melden sich mehrere Personen mit **eigenen Windows-Konten** an diesem Rechner an, sieht
jedes Konto eine andere Tafel – der Browser-Speicher hängt am Profil. Ein gemeinsames
Profilverzeichnis unter `ProgramData` löst das nicht, denn Chrome sperrt es gegen die
gleichzeitige Nutzung durch zwei Anmeldungen.

Der Tafel-Arbeitsplatz braucht deshalb **ein gemeinsames Stationskonto**, das angemeldet
bleibt. Das ist auf Station üblich, muss aber vor dem Rollout feststehen – sonst wundert
sich die Spätschicht über eine leere Tafel.

---

## 3. Einrichten (je Rechner, einmalig)

Vier Dinge kann die Vorgabedatei nicht mitbringen:

- [ ] **Kennung** in `index.html` (`data-instanz`) setzen, falls auf diesem Rechner mehrere
      Kopien liegen – etwa eine Übungskopie. Sie trennt den Speicher und erscheint in der
      Fußzeile der Ausdrucke.
- [ ] **Sicherungsordner** auswählen: Einstellungen → Daten → Tägliche Sicherung. Die
      Berechtigung dafür hängt am Browserprofil und lässt sich nicht mitliefern. Der Ordner
      muss auf die Station beschränkt sein – die Dateien enthalten alle Namen im Klartext.
- [ ] **Zoom** auf den tatsächlichen Monitor einstellen (Einstellungen → Allgemein).
- [ ] **Alle Ausdrucke auf dem echten Drucker prüfen** – „Drucken", „Druck Physio" und
      „Übergabezettel". A4 quer. Die Seitenränder des Druckerdialogs sind je Rechner
      voreingestellt und können das einseitige Layout kippen.
- [ ] **Kopfzeile des Übergabezettels ansehen:** Erscheinen alle zwölf Symbole, oder stehen
      dort leere Kästchen? Drei von ihnen – Lunge, Niere und Hirn – stammen aus einer neueren
      Unicode-Fassung und fehlen in älteren Windows-Schriften. Der Rechner ist ohne Netz und
      bekommt keine Schriftaktualisierungen. Fällt es auf: in `js/uebergabe.js` in der Tabelle
      `SYMBOLE` die betroffenen Zeichen austauschen (etwa `≈` für Beatmung, `⚗` für
      Nierenersatz, `⚡` für Neurologie) – eine Zeile je Spalte.
- [ ] **Fassung kontrollieren:** Hilfe öffnen, unten steht die Nummer. So ist später
      beantwortbar, was auf welchem Rechner läuft.

---

## 4. Aktualisieren

- [ ] **Vorher sichern:** Einstellungen → Daten → „Jetzt sichern".
- [ ] Neues Archiv **daneben** entpacken, etwa nach `C:\Programme\Belegungstafel-2.9.0\`.
- [ ] Verknüpfung auf den neuen Ordner umbiegen, Tafel starten, Fassung in der Hilfe prüfen.
- [ ] Den alten Ordner erst löschen, wenn der neue Stand ein paar Schichten gelaufen ist.
      Bis dahin ist ein Rückweg eine Sache von zehn Sekunden.

Die Daten bleiben beim Wechsel erhalten, weil der Browser den Speicher nicht am Pfad
festmacht. Aus demselben Grund sollten am Ende nicht zwei benutzbare Kopien stehen bleiben:
Beide schreiben in denselben Speicher.

---

## Was auf dem Rechner landet

```
index.html      Grundgerüst
styles.css      Darstellung, Druckansichten
js/             acht Skriptdateien, darunter vorgaben.js mit den Einstellungen der Station
logo.png        Logo im Seitenkopf
slides/         Inhalte des Bildschirmschoners
README.md       Beschreibung
CHANGELOG.md    Änderungen je Fassung
```

Nicht enthalten sind `tests/`, `logo.svg`, `DATENSCHUTZ.md` und diese Anleitung – sie
gehören zu den Unterlagen, nicht auf die Station. Geändert wird das in `.gitattributes`.
