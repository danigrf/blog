// Daten für die Startseite (/). Alles wird beim Build berechnet; nichts davon ist von Hand gezählt.
// Highlights: Frontmatter-Feld «highlight» (Rang), die drei mit kleinstem Rang.
// Projekte: src/data/projekte.json. Medien: src/data/medien.json (nur geprüfte Einträge).
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
	themaSlug: string;
	themaAnzahl: number;
}

export const FORMAT: Record<string, string> = { tv: 'TV', audio: 'Radio', podcast: 'Podcast', video: 'Video', text: 'Text' };

const MONATE_KURZ = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];

/** «25. Okt. 2026» */
export function datumLang(d: Date): string {
	return `${d.getDate()}. ${MONATE_KURZ[d.getMonth()]} ${d.getFullYear()}`;
}

/** Mediendatum: bei «ungefähr» nur das Jahr, sonst «21. Sept. 2026». */
export function medienDatum(m: Medium): string {
	if (!m.datum) return '';
	if (m.ungefaehr) return m.datum.slice(0, 4);
	return datumLang(new Date(`${m.datum}T12:00:00`));
}

export async function startseitenDaten() {
	const posts = await getPosts(); // neueste zuerst

	const highlights = posts
		.filter((p) => typeof p.data.highlight === 'number')
		.sort((a, b) => (a.data.highlight ?? 0) - (b.data.highlight ?? 0))
		.slice(0, 3);
	const hlIds = new Set(highlights.map((p) => p.id));
	const neueste = posts.filter((p) => !hlIds.has(p.id)).slice(0, 3);

	const medienNeu = (medienDatei as Medium[])
		.filter((m) => m.geprueft && m.datum)
		.sort((a, b) => (b.datum ?? '').localeCompare(a.datum ?? ''))
		.slice(0, 3);

	const projekte: Projekt[] = (projekteDatei.projekte as Omit<Projekt, 'themaSlug' | 'themaAnzahl'>[])
		.slice(0, 4)
		.map((p) => ({
			...p,
			themaSlug: themaSlug(p.thema),
			themaAnzahl: posts.filter((post) => post.data.tags.includes(p.thema)).length,
		}));

	return { highlights, neueste, medienNeu, projekte };
}

export type { Post };
