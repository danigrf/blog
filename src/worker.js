// Cloudflare Worker vor den statischen Dateien (siehe wrangler.jsonc, run_worker_first).
// Fragt ein Agent mit «Accept: text/markdown» nach einer Seite, liefert er die Markdown-Kopie
// (…/index.md, beim Build erzeugt von scripts/agenten-dateien.mjs). Browser erhalten wie bisher HTML.

// Startseite: verweist Agenten auf maschinenlesbare Fassungen (RFC 8288).
const LINK_STARTSEITE = '</llms.txt>; rel="describedby"; type="text/plain", </index.md>; rel="alternate"; type="text/markdown"';

/** Gewichtung (q) eines Medientyps im Accept-Header; 0, wenn er fehlt. */
function gewicht(accept, typ) {
	let q = 0;
	for (const teil of accept.split(',')) {
		const [name, ...params] = teil.trim().toLowerCase().split(';');
		if (name.trim() !== typ) continue;
		const qParam = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
		q = Math.max(q, qParam ? Number(qParam.slice(2)) || 0 : 1);
	}
	return q;
}

function willMarkdown(request) {
	const accept = request.headers.get('Accept');
	if (!accept) return false;
	const md = gewicht(accept, 'text/markdown');
	return md > 0 && md >= gewicht(accept, 'text/html');
}

function mitVary(headers) {
	const vary = headers.get('Vary');
	if (!vary) headers.set('Vary', 'Accept');
	else if (!/\baccept\b/i.test(vary)) headers.set('Vary', `${vary}, Accept`);
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const lesend = request.method === 'GET' || request.method === 'HEAD';

		if (lesend && willMarkdown(request)) {
			const mdUrl = new URL(url);
			mdUrl.search = '';
			mdUrl.pathname = `${url.pathname.replace(/\/?$/, '/')}index.md`;
			const md = await env.ASSETS.fetch(new Request(mdUrl, { method: request.method }));
			if (md.ok) {
				const headers = new Headers(md.headers);
				headers.set('Content-Type', 'text/markdown; charset=utf-8');
				mitVary(headers);
				if (url.pathname === '/') headers.set('Link', LINK_STARTSEITE);
				return new Response(md.body, { status: 200, headers });
			}
		}

		const antwort = await env.ASSETS.fetch(request);
		if (!(antwort.headers.get('Content-Type') ?? '').startsWith('text/html')) return antwort;
		const headers = new Headers(antwort.headers);
		mitVary(headers);
		if (url.pathname === '/') headers.set('Link', LINK_STARTSEITE);
		return new Response(antwort.body, { status: antwort.status, statusText: antwort.statusText, headers });
	},
};
