# Beiträge schreiben

Kurzanleitung für Daniel und Larry. Ein Beitrag ist eine Textdatei in `src/content/blog/`. Der Dateiname wird zur Adresse: `mein-beitrag.mdx` wird zu `/blog/mein-beitrag/`.

## Aufbau

Jeder Beitrag beginnt mit dem Kopf zwischen zwei `---`-Linien:

```
---
title: 'Titel des Beitrags'
description: 'Ein bis zwei Sätze, erscheint in Listen und bei der Vorschau.'
pubDate: 'Oct 20 2026'
heroImage: '../../assets/blog/mein-beitrag/titelbild.jpg'
---
```

- `title`, `description`, `pubDate` sind Pflicht. Datum im Format `Oct 20 2026` oder `2026-10-20`.
- `heroImage` ist optional (grosses Bild über dem Titel), `updatedDate` ebenfalls.
- `vorschau` ist optional: das Bild, das in Beitragslisten und beim Teilen (Facebook, LinkedIn, Messenger) erscheint. Pfad wie bei `heroImage`; `vorschauAlt` beschreibt es kurz für die Social-Media-Vorschau. Reihenfolge: `vorschau`, sonst `heroImage`; ohne beides zeigt die Liste eine ruhige Farbkachel (Jahr und erstes Thema) und das Teilen das Standardbild. Querformat 3:2 oder breiter, mind. 1200 Pixel breit; Hochformat wird oben angeschnitten.
- `tags` sind die Themen, z. B. `tags: ['E-Collecting', 'E-ID']`. Jedes Thema erhält eine Seite unter `/themen/`. Höchstens drei, und nur Themen, die im Beitrag wirklich Schwerpunkt sind. Nur Namen aus dieser Liste verwenden (genau so geschrieben), damit nichts doppelt entsteht:
  Abstimmungen · ADHS & Neurodiversität · Basel · Bevölkerungsrat · Bilaterale III · Bildung · Bundesverfassung · Campaigning · Digitale Demokratie · Direkte Demokratie · E-Collecting · E-ID · Fundraising · Inklusion · KI · Klima & Umwelt · Lobbying · Medien · Menschenrechte · Netzpolitik · Rechtsextremismus · Referendum · Social Media · SRG · Unterschriften-Bschiss · Volksinitiative · Wahlen · WeCollect.
  Neues Thema nur, wenn mehrere Beiträge dazu absehbar sind; dann hier ergänzen.
- Darunter folgt der Text in Markdown: `## Zwischentitel`, `**fett**`, `*kursiv*`, `[Linktext](https://…)`, `- Liste`, `> Zitat`.

## .md oder .mdx?

- **`.md`**: reiner Text, keine Bausteine.
- **`.mdx`**: wie `.md`, aber mit den Bausteinen unten. Sie sind ohne `import` sofort nutzbar. Im Zweifel `.mdx` nehmen.

Wichtig in `.mdx`: Zwischen dem Baustein und dem Text darin eine Leerzeile lassen, wenn Markdown (Listen, Links) darin vorkommen soll. Pfeil- und geschweifte Klammern im Text sind heikel; `{` und `<` im Fliesstext vermeiden.

## Bilder

Bilder liegen in `src/assets/blog/<beitrags-name>/`. Astro macht sie automatisch kleiner und moderner (WebP, mehrere Grössen). Originale in normaler Qualität ablegen, mehr als 2000 Pixel Breite braucht es nicht.

Mit Legende und Quelle (alt ist Pflicht und beschreibt, was man sieht; fehlt es, bricht der Build ab):

```mdx
<Bild
	src="mein-beitrag/foto.jpg"
	alt="Menschen vor dem Bundeshaus bei Regen"
	legende="Übergabe der Unterschriften am 20. Oktober."
	quelle="Foto: Name Nachname"
	quelleUrl="https://example.org"
/>
```

`quelleUrl` ist optional. Einfach ohne Legende geht auch normales Markdown:

```md
![Alt-Text hier](../../assets/blog/mein-beitrag/foto.jpg)
```

## Boxen (Info und Kontext)

Zwei blaue Varianten: `info` (kräftig, für das Wichtigste) und `kontext` (dezenter, für Hintergrund). `titel` ist optional.

```mdx
<Box typ="info" titel="Das Wichtigste in Kürze">
Text mit **Hervorhebung** und [Link](https://example.org).
</Box>

<Box typ="kontext" titel="Hintergrund">
Hintergrund, der den Lesefluss nicht stören soll.
</Box>
```

## Video

Videos liegen in `public/videos/<beitrags-name>/`. Format: **MP4 (H.264)** oder WebM. MPEG-1/2 (`.mpg`, `.mpeg`) spielt kein Browser ab, die müssen umgewandelt werden.

```mdx
<Video
	src="/videos/mein-beitrag/clip.mp4"
	poster="/videos/mein-beitrag/clip.jpg"
	legende="Kurzbeschreibung."
	quelle="Wer hat es gefilmt"
/>
```

Das Video startet nie von selbst und lädt erst beim Abspielen.

**Grösse:** Cloudflare erlaubt pro Datei höchstens 25 MiB (Workers Static Assets). Darüber schlägt das Veröffentlichen fehl. Für den Blog reichen meist 5 bis 15 MB. ffmpeg ist auf diesem Mac installiert:

```bash
# Umwandeln und verkleinern (auch aus .mpg/.mpeg/.mov), Breite 1280, ohne Ruckeln beim Start
ffmpeg -i original.mpeg -vf "scale='min(1280,iw)':-2" -c:v libx264 -crf 28 -preset slow \
  -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart clip.mp4

# Vorschaubild (Poster) aus Sekunde 1
ffmpeg -i clip.mp4 -ss 1 -frames:v 1 clip.jpg

# Zu gross? crf höher (30 bis 32) oder Breite auf 960 senken. Dateigrösse prüfen: ls -lh clip.mp4
```

Ist das Video trotzdem über 25 MiB (lange Aufnahmen): bei YouTube hochladen und so einbinden. Der Baustein nutzt die datenärmere Adresse youtube-nocookie.com (direkt sichtbar oder erst nach Klick, siehe Schalter unten):

```mdx
<YouTube id="VIDEO-ID" titel="Titel des Videos" />
```

Die ID steht in der YouTube-Adresse nach `v=`.

## Instagram und LinkedIn

**Schalter:** In `src/consts.ts` steht `EINBETTUNG_DIREKT`. Bei `true` (aktuell) erscheinen Instagram-, LinkedIn- und YouTube-Beiträge direkt im Text (sie laden erst, wenn man in ihre Nähe scrollt). Dabei überträgt der Browser der Lesenden Daten an die Plattform. Bei `false` erscheint stattdessen eine Karte mit Hinweis und Knopf «Beitrag laden», und erst nach dem Klick lädt das Original. Unter jedem Beitrag steht ein Link «Auf … öffnen».

```mdx
<Instagram url="https://www.instagram.com/p/XXXXXXXXXXX/" />

<LinkedIn url="https://www.linkedin.com/posts/name_titel-activity-7123456789012345678-AbCd" />
```

Optional für eine reichere Karte: `titel="…"`, `text="…"`, `bild="mein-beitrag/vorschau.jpg"` (Bild aus `src/assets/blog/`, lokal, nicht von der Plattform).

LinkedIn: Die Einbettungsadresse wird aus der normalen Beitrags-Adresse abgeleitet (die Zahl hinter `activity-`, `share-` oder `ugcPost-`). Falls nur eine leere Fläche erscheint: Beitrag öffnen, `…` → «Beitrag einbetten», die Adresse aus `src="…"` kopieren und so angeben:

```mdx
<LinkedIn url="https://www.linkedin.com/posts/…" embed="https://www.linkedin.com/embed/feed/update/urn:li:share:123…" />
```

Nicht öffentliche Beiträge lassen sich nicht einbetten.

## Vorschau und Veröffentlichen

- Vorschau lokal: `npm run dev`, dann http://localhost:4321.
- Prüfen: `npm run build` muss ohne Fehler durchlaufen.
- Veröffentlicht wird durch Push auf `main` (Cloudflare baut automatisch). Beiträge mit Namen `test-…` sind Testinhalte und vor dem Veröffentlichen zu löschen.
