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
