// Suchindex für «Themen und Beiträge durchsuchen»: wird beim Build erzeugt und erst bei Bedarf geladen.
// Felder (kurz gehalten): i = Adresse, t = Titel, d = Datum (ISO, nur Tag), g = Themen-Slugs,
// b = Beschreibung, x = gekürzter Klartext.
import { getPosts, themaSlug } from '../../lib/posts';

const MAX_TEXT = 6000;

/** Markdown/MDX grob zu Klartext: Importe, Komponenten, Links, Bilder, Auszeichnungen raus. */
function klartext(src: string): string {
	return src
		.replace(/^(import|export)\s.+$/gm, ' ')
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/<!--[\s\S]*?-->/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/<[A-Z][^>]*\/>/g, ' ') // MDX-Bausteine wie <Bild ... />
		.replace(/<[^>]+>/g, ' ')
		.replace(/https?:\/\/\S+/g, ' ')
		.replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+[.)])\s+/gm, '')
		.replace(/[*_`~\\]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

export async function GET() {
	const posts = await getPosts();
	const index = posts.map((p) => ({
		i: p.id,
		t: p.data.title,
		d: p.data.pubDate.toISOString().slice(0, 10),
		g: p.data.tags.map(themaSlug),
		b: p.data.description,
		x: klartext(p.body ?? '').slice(0, MAX_TEXT),
	}));
	return new Response(JSON.stringify(index), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}
