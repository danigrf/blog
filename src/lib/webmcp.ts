// WebMCP: Werkzeuge, die KI-Agenten im Browser auf dieser Seite nutzen können. Alle nur lesend.
// Nutzt den Suchindex der Themenseite (/themen/suche.json) und die Markdown-Kopien der Seiten (…/index.md).
// Browser ohne WebMCP überspringen alles.

type Eintrag = { i: string; t: string; d: string; g: string[]; b: string; x: string };
type Werkzeug = {
	name: string;
	description: string;
	inputSchema: object;
	annotations?: { readOnlyHint?: boolean };
	execute: (args: Record<string, unknown>) => Promise<string>;
};
type ModelContext = { registerTool: (tool: Werkzeug) => unknown };

const kontext: ModelContext | undefined =
	(document as unknown as { modelContext?: ModelContext }).modelContext ??
	(navigator as unknown as { modelContext?: ModelContext }).modelContext;

let index: Promise<Eintrag[]> | undefined;
const ladeIndex = () =>
	(index ??= fetch('/themen/suche.json').then((r) => {
		if (!r.ok) throw new Error(`Suchindex nicht erreichbar (${r.status})`);
		return r.json();
	}));

const treffer = (e: Eintrag) => ({
	title: e.t,
	url: new URL(`/blog/${e.i}/`, location.origin).href,
	date: e.d,
	topics: e.g,
	description: e.b,
});

const anzahl = (wert: unknown, standard: number) => Math.min(Math.max(Number(wert) || standard, 1), 50);

const werkzeuge: Werkzeug[] = [
	{
		name: 'search_site',
		description:
			'Durchsucht die Beiträge auf danielgraf.ch (Blog zu direkter und digitaler Demokratie) nach Stichworten in Titel, Beschreibung und Text. Liefert Titel, Adresse, Datum, Themen und Beschreibung.',
		inputSchema: {
			type: 'object',
			properties: {
				query: { type: 'string', description: 'Suchbegriffe, z. B. «E-Collecting Basel»' },
				limit: { type: 'integer', minimum: 1, maximum: 50, description: 'Höchstens so viele Treffer (Standard 10)' },
			},
			required: ['query'],
		},
		annotations: { readOnlyHint: true },
		async execute({ query, limit }) {
			const woerter = String(query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
			if (!woerter.length) return '[]';
			const liste = (await ladeIndex())
				.map((e) => {
					const t = e.t.toLowerCase(), b = e.b.toLowerCase(), x = e.x.toLowerCase();
					// Zuerst zählt, wie viele Suchbegriffe vorkommen, dann wo (Titel vor Beschreibung vor Text).
					let gefunden = 0, punkte = 0;
					for (const w of woerter) {
						const p = (t.includes(w) ? 3 : 0) + (b.includes(w) ? 2 : 0) + (x.includes(w) ? 1 : 0);
						if (p) gefunden++;
						punkte += p;
					}
					return { e, gefunden, punkte };
				})
				.filter((r) => r.gefunden > 0)
				.sort((a, b) => b.gefunden - a.gefunden || b.punkte - a.punkte || b.e.d.localeCompare(a.e.d))
				.slice(0, anzahl(limit, 10))
				.map((r) => treffer(r.e));
			return JSON.stringify(liste);
		},
	},
	{
		name: 'list_posts',
		description:
			'Listet Beiträge auf danielgraf.ch, neueste zuerst. Optional nach Thema gefiltert (Themen-Slug wie «e-collecting», «volksinitiative», «ki»; alle Themen unter /themen/).',
		inputSchema: {
			type: 'object',
			properties: {
				topic: { type: 'string', description: 'Themen-Slug, z. B. «digitale-demokratie»' },
				limit: { type: 'integer', minimum: 1, maximum: 50, description: 'Höchstens so viele Beiträge (Standard 20)' },
			},
		},
		annotations: { readOnlyHint: true },
		async execute({ topic, limit }) {
			const thema = topic ? String(topic).toLowerCase() : undefined;
			const liste = (await ladeIndex())
				.filter((e) => !thema || e.g.includes(thema))
				.sort((a, b) => b.d.localeCompare(a.d))
				.slice(0, anzahl(limit, 20))
				.map(treffer);
			return JSON.stringify(liste);
		},
	},
	{
		name: 'get_page',
		description:
			'Holt eine Seite von danielgraf.ch als Markdown (ohne Navigation), z. B. einen Beitrag aus search_site. Nimmt eine Adresse dieser Website oder einen Pfad wie «/about/».',
		inputSchema: {
			type: 'object',
			properties: {
				url: { type: 'string', description: 'Adresse oder Pfad einer Seite auf danielgraf.ch' },
			},
			required: ['url'],
		},
		annotations: { readOnlyHint: true },
		async execute({ url }) {
			const ziel = new URL(String(url ?? '/'), location.origin);
			if (ziel.origin !== location.origin) throw new Error('Nur Seiten von danielgraf.ch');
			const pfad = ziel.pathname.replace(/\/?(index\.(html|md))?$/, '/');
			const r = await fetch(`${pfad}index.md`);
			if (!r.ok) throw new Error(`Seite nicht gefunden: ${pfad}`);
			return r.text();
		},
	},
];

if (kontext && typeof kontext.registerTool === 'function') {
	for (const w of werkzeuge) {
		try {
			Promise.resolve(kontext.registerTool(w)).catch(() => {});
		} catch {
			// Ältere Umsetzungen kennen einzelne Felder nicht; die Seite funktioniert trotzdem.
		}
	}
}
