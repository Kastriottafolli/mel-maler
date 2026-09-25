# Mel Maler – eigenständige Website

Die Website funktioniert ohne Squarespace, Installation oder laufende Software-Abonnements. Alle Bilder liegen lokal im Ordner assets.

## Vorschau
index.html im Browser öffnen oder in diesem Ordner `python3 -m http.server 8765` starten.

## Hochladen
Alle HTML-Dateien, styles.css, script.js, tools.js, robots.txt, sitemap.xml und den Ordner assets gemeinsam in das Webverzeichnis eines Hosting-Anbieters hochladen. Danach die eigene Domain mit dem Hosting verbinden und HTTPS aktivieren.

## Vor Veröffentlichung
- Vollständigen rechtlichen Namen des Anbieters ergänzen. Impressum und Datenschutz sind ausdrücklich gekennzeichnete Entwürfe; nach Wahl des Hostings vervollständigen und prüfen.
- Kontaktdaten und Nutzungsrechte der übernommenen Bilder bestätigen.
- Die Kontaktfunktion öffnet das E-Mail-Programm. Sie sendet nicht automatisch und benötigt keinen Server. Für ein direkt versendendes Formular später einen Formular-Dienst oder eigenen Endpunkt anbinden.
- Das Logo wird aus der Originaldatei über einen engen CSS-Bildausschnitt angezeigt. Die Originaldatei bleibt erhalten.

## Gestaltung
Apple-inspirierte Reduktion: warmer Off-White-Hintergrund, dunkles Grün, Terrakotta-Akzente, großzügige Typografie. Responsive Navigation, Bild-Großansicht, zugängliche Fokusmarkierungen, reduzierte Bewegung nach Systemeinstellung. Keine erfundenen Kundenbewertungen.

Die verwendeten Raum- und Materialbilder wurden mit KI generiert und als Inspiration gekennzeichnet. Sie sind keine Referenzprojekte. Die Originalbilder von Squarespace werden im neuen Design nicht verwendet; übernommen wurde das MEL-Logo.

## Seitenstruktur
Startseite, Leistungsübersicht, Rechner-Übersicht (rechner.html), neun Leistungsseiten (Malerarbeiten, Lackierarbeiten, Trockenbau, Renovierung, Parkett/Böden, Bodenbeschichtungen, Fassaden, Tapezieren), Über uns, Inspiration und Kontakt. Alle Seiten nutzen dieselben Styles und Navigation. Die Kontaktseite übernimmt die Leistung aus dem Anfrage-Link.

Zum Veröffentlichen alle HTML-Dateien auf derselben Verzeichnisebene gemeinsam mit styles.css, script.js, tools.js und assets hochladen. Das ZIP enthält alle benötigten Dateien.

## Interaktive Rechner
Jede Leistungsseite hat ein eigenes Werkzeug (Abschnitt `#rechner`, Logik in `tools.js`): Heizkosten-Sparrechner (Fassade), Farbbedarf mit 3D-Raum (Malerarbeiten), Tapetenrollen, Ständerwand, Boden/Verlegemuster, Beschichtungs-Zeitplan, Lack-Planer, Renovierungs-Reihenfolge und Hausmeister-Bedarfs-Check. Alle Ergebnisse sind Richtwerte mit Hinweistext und lassen sich per Klick als vorausgefüllte Anfrage ins Kontaktformular übernehmen (`kontakt.html?leistung=…&nachricht=…`).

Nach Änderungen an CSS oder JavaScript die Versionsnummer `?v=` in allen HTML-Dateien erhöhen, damit Browser keine alte Version aus dem Cache laden.

`assets/projekte/renovierung-rohbau-umbau.jpg` wird als „Symbolbild Umbau" gekennzeichnet, da es nicht eindeutig als MEL-Projekt erkennbar ist. Nutzungsrechte bitte bestätigen.
