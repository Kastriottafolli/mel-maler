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
- Das Logo liegt als Vektorgrafik vor (`assets/mel-logo.svg`, aus der Original-PDF erzeugt) und wird in Kopf- und Fußzeile verwendet. Daraus abgeleitet sind Favicon (`assets/favicon.svg`, `favicon.ico`), App-Icons und `site.webmanifest`.

## Urheber der Website
Konzept, Gestaltung und Entwicklung: Kastriot Tafolli, Softwareingenieur – www.tafolli.net (im Impressum ausgewiesen).

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

## Startseite
Die Startseite ist als Erlebnis aufgebaut: Kino-Hero mit vier echten Projektfotos (automatischer Wechsel, pausierbar, `assets/hero/`), Schnelleinstieg, Leistungsraster, Projekt-Konfigurator (drei Fragen bis zur fertigen Anfrage, `home.js`), Leistungsfinder, Scroll-Story über den Projektablauf, Vorher/Nachher-Slider, Rechner-Übersicht, Kennzahlen, Projektgalerie, Farbwelt-Demo, FAQ und Abschluss-CTA. Telefonnummer und Anfrage sind durchgehend erreichbar: im Hero, in der eingeblendeten Sprungleiste (Desktop) und in der festen Leiste unten (Handy).

Alle Zahlen auf der Startseite sind nachprüfbar (Anzahl Leistungen, Rechner, Projektfotos). Es gibt bewusst keine erfundenen Kundenbewertungen oder Auszeichnungen.

## Logo
`assets/mel-logo.svg` ist das freigestellte Vektorlogo (MeL mit orangem „e" und Schriftzug „...wir renovieren"), `assets/mel-logo-light.svg` die helle Variante für dunkle Flächen. Auf der Startseite wird dasselbe Logo als Inline-SVG im Hero eingebunden und animiert: Die Konturen zeichnen sich nach, dann laufen die Flächen ein, das orange „e" springt hinein und der Schriftzug wird von links nach rechts aufgedeckt. Danach erscheinen Zeile für Zeile Überschrift, Text und Buttons. Bei aktivierter Systemeinstellung „Bewegung reduzieren" ist sofort der Endzustand sichtbar.

Die Kennzahlen direkt unter dem Hero (15+ Jahre, 250+ Projekte, 150+ Kunden, 1 Ansprechpartner) stammen vom Betrieb selbst und sollten bei Änderungen in `index.html` im Abschnitt `.hero-stats` angepasst werden.

## Symbole
Auf der Seite werden keine Unicode-Sonderzeichen mehr als Symbole verwendet. iOS stellt Zeichen wie U+2733 als farbiges Emoji dar und ignoriert dabei die CSS-Farbe – daraus wurde ein großes grünes Sternchen im Über-uns-Bereich. Stern, Telefonhörer, Pause/Play, Schließen-Kreuz und Häkchen sind deshalb Inline-SVG bzw. SVG-Data-URIs. Neue Symbole bitte ebenfalls als SVG einbauen, nicht als Zeichen.
