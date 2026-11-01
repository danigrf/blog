// Kleiner Worker vor der statischen Website: beantwortet nur POST /api/kontakt (Kontaktformular).
// Alle anderen Adressen liefert Cloudflare direkt aus dist/ aus (wrangler.jsonc: run_worker_first nur für /api/*).
//
// Die Empfängeradresse steht NICHT im Code und nicht in wrangler.jsonc (das Repo ist öffentlich),
// sondern nur als Secret KONTAKT_TO:  npx wrangler secret put KONTAKT_TO

interface SendEmail {
	send(msg: {
		from: string | { email: string; name: string };
		to: string;
		subject: string;
		text: string;
		replyTo?: string;
	}): Promise<unknown>;
}
interface RateLimit {
	limit(opts: { key: string }): Promise<{ success: boolean }>;
}
interface Env {
	ASSETS: { fetch(req: Request): Promise<Response> };
	EMAIL?: SendEmail;
	KONTAKT_RL?: RateLimit;
	KONTAKT_TO?: string; // Secret
	KONTAKT_FROM?: string; // z. B. kontakt@danielgraf.ch (muss in Cloudflare Email Service freigeschaltet sein)
	TURNSTILE_SECRET?: string; // Secret; ohne Secret wird der Versand abgelehnt (ausser DEV_MODE)
	DEV_MODE?: string; // nur lokal in .dev.vars: "true"
}

const MAX = { name: 100, email: 200, nachricht: 5000 };
const MIN_NACHRICHT = 10;
const MIN_SEKUNDEN = 3; // schneller ausgefüllt = Bot
const MAX_STUNDEN = 24;

function json(status: number, body: Record<string, unknown>): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
	});
}

const istDev = (env: Env) => env.DEV_MODE === 'true';
// Zeilenumbrüche und Steuerzeichen raus (Betreff, Name), Länge kappen
const einzeilig = (s: string, max: number) => s.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max);
const istEmail = (s: string) => /^[^\s@<>"(),;:]+@[^\s@<>"(),;:]+\.[a-z]{2,}$/i.test(s);

async function turnstileOk(env: Env, token: string, ip: string | null): Promise<'ok' | 'failed' | 'misconfigured'> {
	if (!env.TURNSTILE_SECRET) return istDev(env) ? 'ok' : 'misconfigured';
	// Öffentliche Test-Schlüssel (1x0000…) bestehen immer: online wie «nicht eingerichtet» behandeln
	if (env.TURNSTILE_SECRET.startsWith('1x0000') && !istDev(env)) return 'misconfigured';
	if (!token || token.length > 2048) return 'failed';
	const body = new FormData();
	body.append('secret', env.TURNSTILE_SECRET);
	body.append('response', token);
	if (ip) body.append('remoteip', ip);
	try {
		const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
		const j = (await r.json()) as { success?: boolean };
		return j.success ? 'ok' : 'failed';
	} catch {
		return 'failed';
	}
}

async function kontakt(req: Request, env: Env): Promise<Response> {
	if (req.method !== 'POST') return json(405, { ok: false, fehler: 'methode' });

	// Nur Anfragen von der eigenen Seite (Browser schicken Origin bei fetch-POST immer mit)
	const origin = req.headers.get('origin');
	if (origin && new URL(origin).host !== new URL(req.url).host) return json(403, { ok: false, fehler: 'herkunft' });

	const ip = req.headers.get('cf-connecting-ip');
	if (env.KONTAKT_RL) {
		const { success } = await env.KONTAKT_RL.limit({ key: ip || 'ohne-ip' });
		if (!success) return json(429, { ok: false, fehler: 'zu-viele' });
	}

	if (Number(req.headers.get('content-length') || 0) > 20_000) return json(413, { ok: false, fehler: 'zu-gross' });
	let d: Record<string, unknown>;
	try {
		d = (await req.json()) as Record<string, unknown>;
	} catch {
		return json(400, { ok: false, fehler: 'format' });
	}
	const str = (k: string) => (typeof d[k] === 'string' ? (d[k] as string) : '');

	// Honeypot: Feld «website» ist für Menschen unsichtbar. Ausgefüllt = Bot. Wir tun so, als hätte es geklappt.
	if (str('website').trim() !== '') return json(200, { ok: true });

	// Zeitfalle: Formular wurde in weniger als 3 s (oder vor über 24 h) geladen und abgeschickt
	const t = Number(str('t'));
	const alter = (Date.now() - t) / 1000;
	if (!Number.isFinite(t) || alter < MIN_SEKUNDEN || alter > MAX_STUNDEN * 3600) return json(400, { ok: false, fehler: 'zeit' });

	const name = einzeilig(str('name'), MAX.name);
	const email = einzeilig(str('email'), MAX.email);
	const nachricht = str('nachricht').replace(/\r\n?/g, '\n').trim();
	const felder: string[] = [];
	if (!name) felder.push('name');
	if (!istEmail(email)) felder.push('email');
	if (nachricht.length < MIN_NACHRICHT || nachricht.length > MAX.nachricht) felder.push('nachricht');
	if (felder.length) return json(422, { ok: false, fehler: 'felder', felder });

	const ts = await turnstileOk(env, str('turnstile'), ip);
	if (ts === 'failed') return json(400, { ok: false, fehler: 'spamschutz' });
	if (ts === 'misconfigured') return json(503, { ok: false, fehler: 'nicht-eingerichtet' });

	if (!env.KONTAKT_TO || !env.KONTAKT_FROM) {
		if (!istDev(env)) return json(503, { ok: false, fehler: 'nicht-eingerichtet' });
		console.log(`\n=== DEV: Kontaktformular (nicht versendet, KONTAKT_TO/KONTAKT_FROM fehlen) ===\nVon: ${name} <${email}>\n\n${nachricht}\n===\n`);
		return json(200, { ok: true, dev: true });
	}
	if (!env.EMAIL) return json(503, { ok: false, fehler: 'nicht-eingerichtet' });

	const zeit = new Date().toLocaleString('de-CH', { timeZone: 'Europe/Zurich' });
	const text = [
		`Nachricht über das Kontaktformular auf danielgraf.ch`,
		``,
		`Name: ${name}`,
		`E-Mail: ${email}`,
		`Zeit: ${zeit}`,
		``,
		nachricht,
		``,
		`--`,
		`«Antworten» geht direkt an ${email}.`,
	].join('\n');

	try {
		await env.EMAIL.send({
			from: { email: env.KONTAKT_FROM, name: 'Kontaktformular danielgraf.ch' },
			to: env.KONTAKT_TO,
			subject: einzeilig(`Kontakt: ${name}`, 120),
			text,
			replyTo: email,
		});
	} catch (e) {
		// Bewusst ohne Meldungstext (könnte Adressen enthalten), nur der Fehlercode
		const code = typeof (e as { code?: unknown })?.code === 'string' ? (e as { code: string }).code : 'UNBEKANNT';
		console.error(`Kontaktformular: Versand fehlgeschlagen (${code})`);
		return json(502, { ok: false, fehler: 'versand' });
	}
	return json(200, { ok: true });
}

export default {
	async fetch(req: Request, env: Env): Promise<Response> {
		const url = new URL(req.url);
		if (url.pathname === '/api/kontakt' || url.pathname === '/api/kontakt/') return kontakt(req, env);
		if (url.pathname.startsWith('/api/')) return json(404, { ok: false, fehler: 'unbekannt' });
		return env.ASSETS.fetch(req);
	},
};
