// Dateien für KI-Agenten, erzeugt nach dem Build (Astro-Integration, Hook astro:build:done):
// - zu jeder HTML-Seite eine Markdown-Kopie daneben (…/index.md), die der Worker bei «Accept: text/markdown» ausliefert
// - /llms.txt: Übersicht über Seiten, Themen und Beiträge mit Links auf die Markdown-Kopien
// - /.well-known/agent-skills/index.json mit sha256-Prüfsumme der SKILL.md (liegt in public/)
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import TurndownService from 'turndown';

const SKILL = '.well-known/agent-skills/danielgraf-ch/SKILL.md';

/** Alle .html-Dateien unter `ordner` (rekursiv). */
async function htmlDateien(ordner) {
	const eintraege = await readdir(ordner, { withFileTypes: true, recursive: true });
	return eintraege
		.filter((e) => e.isFile() && e.name.endsWith('.html'))
		.map((e) => join(e.parentPath, e.name));
}

/** HTML-Entitäten in Attributwerten und Titeln zurückwandeln. */
function entitaeten(text) {
	return text
		.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
		.replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

function meta(html, muster) {
	const m = html.match(muster);
	return m ? entitaeten(m[1]).trim() : undefined;
}

function turndown(site) {
	const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-', emDelimiter: '*' });
	td.remove(['script', 'style', 'noscript', 'iframe', 'button', 'svg']);
	// Achtung: Später hinzugefügte Regeln gehen bei Turndown vor. Allgemeines zuerst.
	// Relative Links absolut machen.
	td.addRule('link', {
		filter: (n) => n.nodeName === 'A' && !!n.getAttribute('href'),
		replacement: (inhalt, n) => {
			const text = inhalt.trim();
			if (!text) return '';
			return `[${text}](${new URL(n.getAttribute('href'), site)})`;
		},
	});
	// Dekoratives (Vorschaukacheln u. ä.) und die interaktive Jahresgrafik weglassen.
	td.addRule('versteckt', {
		filter: (n) => n.getAttribute?.('aria-hidden') === 'true' || (n.nodeName === 'FIGURE' && n.classList.contains('ju')),
		replacement: () => '',
	});
	// Beitragslisten: «[Titel](Adresse) (Datum): Beschreibung» statt eines zusammengeklebten Links.
	td.addRule('beitragsliste', {
		filter: (n) => n.nodeName === 'A' && !!n.querySelector('.post-title'),
		replacement: (_, n) => {
			const text = (sel) => n.querySelector(sel)?.textContent.replace(/\s+/g, ' ').trim();
			const datum = n.querySelector('time')?.getAttribute('datetime')?.slice(0, 10);
			const desc = text('.post-desc');
			return `[${text('.post-title')}](${new URL(n.getAttribute('href'), site)})${datum ? ` (${datum})` : ''}${desc ? `: ${desc}` : ''}`;
		},
	});
	// Navigationslinks «← Alle Beiträge» gehören nicht zum Inhalt.
	td.addRule('zurueck', { filter: (n) => n.nodeName === 'P' && /\bzurueck\b/.test(n.getAttribute('class') ?? ''), replacement: () => '' });
	// Videos als Link statt Fallback-Text.
	td.addRule('video', {
		filter: 'video',
		replacement: (_, n) => {
			const src = n.querySelector('source')?.getAttribute('src') ?? n.getAttribute('src');
			return src ? `\n\n[Video](${new URL(src, site)})\n\n` : '';
		},
	});
	// Bilder: absolute Adresse, damit die Markdown-Kopie auch ausserhalb der Seite funktioniert.
	td.addRule('bild', {
		filter: 'img',
		replacement: (_, n) => {
			const src = n.getAttribute('src');
			const alt = (n.getAttribute('alt') ?? '').replace(/[\[\]]/g, '');
			return src && alt ? `![${alt}](${new URL(src, site)})` : '';
		},
	});
	return td;
}

/** Markdown-Kopie einer gebauten Seite; undefined, wenn kein <main> gefunden wird. */
function markdownKopie(html, td, adresse) {
	const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
	if (!main) return undefined;
	// Seitentitel ohne den Zusatz « – Daniel Graf» (ausser auf der Startseite).
	const titel = meta(html, /<title>([^<]*)<\/title>/i)?.replace(/ – Daniel Graf$/, '');
	const beschreibung = meta(html, /<meta name="description" content="([^"]*)"/i);
	const kanonisch = meta(html, /<link rel="canonical" href="([^"]*)"/i) ?? adresse;
	// Erstes <time> im Artikelkopf = Veröffentlichungsdatum (nur bei Beiträgen).
	const datum = /<article\b/.test(main) ? meta(main, /<time datetime="([^"]*)"/i)?.slice(0, 10) : undefined;
	const kopf = ['---', `title: ${JSON.stringify(titel ?? '')}`];
	if (beschreibung) kopf.push(`description: ${JSON.stringify(beschreibung)}`);
	kopf.push(`url: ${kanonisch}`);
	if (datum) kopf.push(`date: ${datum}`);
	kopf.push('---', '');
	const text = td.turndown(main).replace(/\n{3,}/g, '\n\n').trim();
	return { md: `${kopf.join('\n')}\n${text}\n`, titel, beschreibung, datum };
}

function llmsTxt(seiten, site) {
	const md = (pfad) => new URL(`${pfad}index.md`, site).href;
	const zeile = (s) => `- [${s.titel}](${md(s.pfad)})${s.beschreibung ? `: ${s.beschreibung}` : ''}`;
	const start = seiten.find((s) => s.pfad === '/');
	const fest = ['/about/', '/medien/', '/blog/', '/themen/', '/datenschutz/']
		.map((p) => seiten.find((s) => s.pfad === p))
		.filter(Boolean);
	const themen = seiten.filter((s) => /^\/themen\/[^/]+\/$/.test(s.pfad)).sort((a, b) => a.pfad.localeCompare(b.pfad));
	const beitraege = seiten
		.filter((s) => /^\/blog\/[^/]+\/$/.test(s.pfad))
		.sort((a, b) => (b.datum ?? '').localeCompare(a.datum ?? ''));
	return [
		'# Daniel Graf',
		'',
		`> ${start?.beschreibung ?? 'Notizen zu direkter und digitaler Demokratie'}. Blog von Daniel Graf (Basel) zu Volksinitiativen, E-Collecting, Campaigning und digitaler Demokratie, seit 2012. Sprache: Deutsch (Schweiz).`,
		'',
		'Jede Seite gibt es auch als Markdown: an die Adresse `index.md` anhängen oder mit `Accept: text/markdown` anfragen. Weitere Einstiege: [Sitemap](https://danielgraf.ch/sitemap-index.xml), [RSS](https://danielgraf.ch/rss.xml), [Agent Skill](https://danielgraf.ch/.well-known/agent-skills/danielgraf-ch/SKILL.md).',
		'',
		'## Seiten',
		'',
		...fest.map(zeile),
		'',
		'## Themen',
		'',
		...themen.map(zeile),
		'',
		'## Beiträge',
		'',
		...beitraege.map((s) => `${zeile(s)}${s.datum ? ` (${s.datum})` : ''}`),
		'',
	].join('\n');
}

export default function agentenDateien() {
	return {
		name: 'agenten-dateien',
		hooks: {
			'astro:build:done': async ({ dir, logger }) => {
				const ziel = fileURLToPath(dir);
				const site = 'https://danielgraf.ch';
				const td = turndown(site);
				const seiten = [];
				for (const datei of await htmlDateien(ziel)) {
					const rel = relative(ziel, datei).split(sep).join('/');
					if (!rel.endsWith('index.html')) continue; // z.B. 404.html
					const pfad = `/${rel.slice(0, -'index.html'.length)}`;
					const kopie = markdownKopie(await readFile(datei, 'utf8'), td, new URL(pfad, site).href);
					if (!kopie) continue;
					await writeFile(join(ziel, rel.replace(/index\.html$/, 'index.md')), kopie.md);
					seiten.push({ pfad, ...kopie });
				}
				await writeFile(join(ziel, 'llms.txt'), llmsTxt(seiten, site));

				const skill = await readFile(join(ziel, SKILL));
				const index = {
					$schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
					version: '0.2.0',
					publisher: { name: 'Daniel Graf', url: `${site}/` },
					skills: [
						{
							name: 'danielgraf-ch',
							type: 'skill-md',
							description:
								'Blog von Daniel Graf zu direkter und digitaler Demokratie (Volksinitiativen, E-Collecting, Campaigning, KI). Use when you need to find, read or cite posts and topics on danielgraf.ch.',
							url: `${site}/${SKILL}`,
							digest: `sha256:${createHash('sha256').update(skill).digest('hex')}`,
						},
					],
				};
				await writeFile(join(ziel, '.well-known/agent-skills/index.json'), `${JSON.stringify(index, null, 2)}\n`);
				logger.info(`${seiten.length} Markdown-Kopien, llms.txt und Agent-Skills-Index geschrieben`);
			},
		},
	};
}
