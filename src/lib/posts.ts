// Gemeinsame Hilfen für Beitragslisten und Themenseiten.
// Entwürfe (draft: true) werden hier immer herausgefiltert.
import { type CollectionEntry, getCollection } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/** Alle veröffentlichten Beiträge, neueste zuerst. */
export async function getPosts(): Promise<Post[]> {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Adresse eines Themas: «Digitale Demokratie» -> «digitale-demokratie». */
export function themaSlug(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue')
		.replace(/ß/g, 'ss')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export interface Thema {
	slug: string;
	name: string;
	posts: Post[];
}

/** Themen aus den Schlagwörtern der veröffentlichten Beiträge, häufigste zuerst. */
export async function getThemen(): Promise<Thema[]> {
	const map = new Map<string, Thema>();
	for (const post of await getPosts()) {
		for (const name of post.data.tags) {
			const slug = themaSlug(name);
			if (!slug) continue;
			const thema = map.get(slug) ?? { slug, name, posts: [] };
			thema.posts.push(post);
			map.set(slug, thema);
		}
	}
	return [...map.values()].sort(
		(a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name, 'de'),
	);
}

/** Vorschaubild eines Beitrags: erst `vorschau`, dann `heroImage`; sonst nichts (-> Platzhalter-Kachel). */
export function vorschauBild(post: Post): { src: ImageMetadata; alt: string } | undefined {
	const src = post.data.vorschau ?? post.data.heroImage;
	return src ? { src, alt: post.data.vorschauAlt ?? '' } : undefined;
}

/** Stabile Kachelvariante 0-3 je Beitrag (gleiche Adresse, gleiche Farbe). */
export function kachelVariante(id: string): number {
	let h = 0;
	for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
	return h % 4;
}

/** Anriss auf ca. `max` Zeichen kürzen (an der Wortgrenze, mit «…»). */
export function kurz(text: string, max = 140): string {
	const t = text.replace(/\s+/g, ' ').trim();
	if (t.length <= max) return t;
	const schnitt = t.slice(0, max);
	const wort = schnitt.lastIndexOf(' ');
	return `${schnitt.slice(0, wort > max * 0.6 ? wort : max).replace(/[\s,;:.–-]+$/, '')}…`;
}

/**
 * «Mehr zum Thema»: bis zu drei Beiträge (die neusten), nie der aktuelle.
 * Reihenfolge: zuerst Beiträge mit dem Hauptthema (tags[0]), dann mit weiteren
 * gemeinsamen Themen, dann die neusten Beiträge allgemein. `alle` ist neueste-zuerst.
 */
export function verwandtePosts(aktuell: Post, alle: Post[], anzahl = 3): { posts: Post[]; haupt?: string } {
	const tags = aktuell.data.tags;
	const haupt = tags[0];
	const andere = alle.filter((p) => p.id !== aktuell.id);
	const gewaehlt: Post[] = [];
	const nimm = (liste: Post[]) => {
		for (const p of liste) {
			if (gewaehlt.length >= anzahl) break;
			if (!gewaehlt.includes(p)) gewaehlt.push(p);
		}
	};
	if (haupt) nimm(andere.filter((p) => p.data.tags.includes(haupt)));
	const hauptAnzahl = gewaehlt.length;
	nimm(andere.filter((p) => p.data.tags.some((t) => tags.includes(t))));
	nimm(andere);
	return { posts: gewaehlt, haupt: haupt && hauptAnzahl > 0 ? haupt : undefined };
}
