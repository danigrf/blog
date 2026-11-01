// Gemeinsame Daten für die Design-Entwürfe unter /entwurf/ (A, B, C).
// Alles wird beim Build berechnet; nichts davon ist von Hand gezählt.
import { execSync } from 'node:child_process';
import highlightsDatei from '../data/entwurf-highlights.json';
import medienDatei from '../data/medien.json';
import projekteDatei from '../data/projekte.json';
import { getPosts, type Post, themaSlug } from './posts';

export interface Medium {
	id: string;
	datum: string | null;
	ungefaehr: boolean;
	medium: string;
	titel: string;
	format: string;
	art: string | null;
	link: string;
	abo: boolean;
	geprueft: boolean;
	highlight: number | null;
}

export interface Projekt {
	id: string;
	name: string;
	rolle: string;
	status: string;
	seit: string;
	kurz: string;
	link: string;
	thema: string;
	stationen: { jahr: string; label: string }[];
	themaSlug: string;
	themaAnzahl: number;
	letzterBeitrag?: Post;
}

export const FORMAT: Record<string, string> = { tv: 'TV', audio: 'Radio', podcast: 'Podcast', video: 'Video', text: 'Text' };
export const STARTJAHR = 2012;
/** Beispielbeitrag für die Artikelseiten der Entwürfe (lang, mit Bild, Zwischentiteln). */
export const ARTIKEL_SLUG = 'bevoelkerungsrat-basel-gruenes-licht-fuer-demokratie-update';

const MONATE_KURZ = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];

/** «25. Okt. 2026» */
export function datumLang(d: Date): string {
	return `${d.getDate()}. ${MONATE_KURZ[d.getMonth()]} ${d.getFullYear()}`;
}
/** «25.10.2026» */
export function datumPunkt(d: Date): string {
	return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}
/** «2026-10-25» */
export function datumIso(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Mediendatum: bei «ungefähr» nur das Jahr. Stil: lang | punkt | iso. */
export function medienDatum(m: Medium, stil: 'lang' | 'punkt' | 'iso' = 'punkt'): string {
	if (!m.datum) return '';
	if (m.ungefaehr) return m.datum.slice(0, 4);
	const d = new Date(`${m.datum}T12:00:00`);
	return stil === 'lang' ? datumLang(d) : stil === 'iso' ? datumIso(d) : datumPunkt(d);
}

/** Metazeile Medien: «Interview · TV · 2026» (+ «Abo»). */
export function medienMeta(m: Medium, mitJahr = true): string {
	const teile: string[] = [];
	if (m.art) teile.push(m.art);
	const f = FORMAT[m.format] ?? m.format;
	if (!m.art || m.format !== 'text') teile.push(f);
	if (mitJahr && m.datum) teile.push(m.datum.slice(0, 4));
	if (m.abo) teile.push('Abo');
	return teile.join(' · ');
}

function buildInfo() {
	const jetzt = new Date();
	let commit = 'unbekannt';
	try {
		commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
	} catch {
		/* kein Git verfügbar: bleibt «unbekannt» */
	}
	const zeit = jetzt.toLocaleString('de-CH', {
		timeZone: 'Europe/Zurich',
		hour: '2-digit',
		minute: '2-digit',
	});
	const tag = jetzt.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' }); // ISO-Form
	return { commit, datum: tag, zeit };
}

export async function startseitenDaten() {
	const posts = await getPosts(); // neueste zuerst
	const anzahl = posts.length;
	// Beitragsnummer = chronologische Position (ältester = 1).
	const nummer = new Map<string, number>();
	posts.forEach((p, i) => nummer.set(p.id, anzahl - i));

	const highlights = highlightsDatei.blog
		.map((slug) => posts.find((p) => p.id === slug))
		.filter((p): p is Post => !!p);
	const hlIds = new Set(highlights.map((p) => p.id));
	const neue = posts.filter((p) => !hlIds.has(p.id)).slice(0, 5);

	const medien = (medienDatei as Medium[]).filter((m) => m.geprueft);
	const medienHighlights = medien
		.filter((m) => typeof m.highlight === 'number')
		.sort((a, b) => (a.highlight ?? 0) - (b.highlight ?? 0))
		.slice(0, 3);
	const mhIds = new Set(medienHighlights.map((m) => m.id));
	const medienNeu = medien
		.filter((m) => !mhIds.has(m.id) && m.datum)
		.sort((a, b) => (b.datum ?? '').localeCompare(a.datum ?? ''))
		.slice(0, 5);

	// Alle geprüften, neueste zuerst (ohne Ausschluss der Highlights; für A6 ohne Pressespiegel).
	const medienNeuAlle = medien
		.filter((m) => m.datum)
		.sort((a, b) => (b.datum ?? '').localeCompare(a.datum ?? ''))
		.slice(0, 5);

	const projekte: Projekt[] = (projekteDatei.projekte as Omit<Projekt, 'themaSlug' | 'themaAnzahl'>[])
		.slice(0, 4)
		.map((p) => {
			const zumThema = posts.filter((post) => post.data.tags.includes(p.thema));
			return { ...p, themaSlug: themaSlug(p.thema), themaAnzahl: zumThema.length, letzterBeitrag: zumThema[0] };
		});

	const jetztJahr = new Date().getFullYear();
	const jahre: { jahr: number; n: number }[] = [];
	for (let j = STARTJAHR; j <= jetztJahr; j++) {
		jahre.push({ jahr: j, n: posts.filter((p) => p.data.pubDate.getFullYear() === j).length });
	}

	return {
		posts,
		anzahl,
		nummer,
		highlights,
		neue,
		medienAnzahl: medien.length,
		medienHighlights,
		medienNeu,
		medienNeuAlle,
		projekte,
		jahre,
		heute: new Date(),
		artikel: posts.find((p) => p.id === ARTIKEL_SLUG) ?? posts[0],
		build: buildInfo(),
	};
}

export type { Post };
