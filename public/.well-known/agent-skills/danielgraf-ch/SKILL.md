---
name: danielgraf-ch
description: Blog von Daniel Graf zu direkter und digitaler Demokratie (Volksinitiativen, E-Collecting, Campaigning, KI). Use when you need to find, read or cite posts and topics on danielgraf.ch.
---

# danielgraf.ch

Persönlicher Blog von Daniel Graf aus Basel. Er hat 2015 die Sammelplattform WeCollect.ch gestartet und die Stiftung für direkte Demokratie mitgegründet. Der Blog («Prototyping for democracy») versammelt seit 2012 Texte zu Volksinitiativen und Referenden, E-Collecting, E-ID, Campaigning, Bevölkerungsrat, KI und digitaler Demokratie.

- Sprache: Deutsch (Schweiz)
- Statische Website, kein Login, keine API, kein MCP-Server
- Inhalte lesen ist frei; robots.txt erlaubt alle Crawler

## Bereiche

| Adresse | Inhalt |
|---|---|
| `/` | Startseite: Kurzvorstellung und die neusten Beiträge |
| `/blog/` | Alle Beiträge, neueste zuerst |
| `/blog/<slug>/` | Ein Beitrag |
| `/themen/` | Alle Themen mit Anzahl Beiträgen, dazu eine Suche im Browser |
| `/themen/<thema>/` | Alle Beiträge zu einem Thema, z. B. `/themen/e-collecting/` |
| `/about/` | Über Daniel Graf |
| `/medien/` | Medienberichte, Interviews und Auftritte |
| `/datenschutz/` | Datenschutzerklärung |

## Inhalte finden

1. **Überblick:** `/llms.txt` listet alle Seiten, Themen und Beiträge mit Kurzbeschreibung und Datum.
2. **Vollständige Liste:** `/sitemap-index.xml` (verweist auf `/sitemap-0.xml`).
3. **Neuste Beiträge:** RSS-Feed unter `/rss.xml`.
4. **Volltextsuche:** `/themen/suche.json` ist der Suchindex der Website, ein JSON-Array mit einem Objekt pro Beitrag:
   - `i`: Slug, die Adresse ist `/blog/<i>/`
   - `t`: Titel
   - `d`: Veröffentlichungsdatum (JJJJ-MM-TT)
   - `g`: Themen-Slugs, die Adresse ist `/themen/<g>/`
   - `b`: Kurzbeschreibung
   - `x`: Anfang des Texts als Klartext (gekürzt)

   Durchsuche `t`, `b` und `x` selbst; es gibt keinen Such-Endpunkt auf dem Server.

## Seiten als Markdown lesen

Jede Seite gibt es als sauberes Markdown, ohne Navigation:

- Anfrage mit Header `Accept: text/markdown` an die normale Adresse, z. B. `https://danielgraf.ch/blog/<slug>/`
- oder direkt `index.md` anhängen: `https://danielgraf.ch/blog/<slug>/index.md`

Die Markdown-Kopie beginnt mit einem YAML-Kopf (`title`, `description`, `url`, bei Beiträgen `date`). Bilder und Links sind absolute Adressen.

## Werkzeuge im Browser (WebMCP)

Unterstützt der Browser WebMCP, registriert jede Seite drei Werkzeuge, die nur lesen:

- `search_site`: Beiträge nach Suchbegriff finden (nutzt `/themen/suche.json`)
- `list_posts`: Beiträge auflisten, optional nach Thema gefiltert
- `get_page`: eine Seite dieser Website als Markdown holen

## Zitieren

Beiträge mit Titel, Datum und Adresse (`url` aus dem Markdown-Kopf) zitieren. Autor ist Daniel Graf. Bei älteren Beiträgen das Datum nennen: Viele Texte beziehen sich auf damals laufende Kampagnen und Abstimmungen.
