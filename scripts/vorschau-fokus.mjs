// Fokuspunkt für Vorschaubilder: erkennt Gesichter (Apple Vision, lokal) und schreibt
// `vorschauFokus: 'x% y%'` in den Kopf jedes Beitrags, der ein Vorschaubild hat
// (vorschau, sonst heroImage). Listen und Kacheln schneiden das Bild damit so zu,
// dass Köpfe ganz drin bleiben.
//
// Aufruf (nur macOS):  node scripts/vorschau-fokus.mjs [--bericht pfad.md]
//
// Bestehende `vorschauFokus`-Werte werden NIE überschrieben (auch von Hand gesetzte).
// Neu berechnen: Zeile im Beitrag löschen und das Skript nochmals laufen lassen.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'src/content/blog');
const REF = 3 / 2; // Seitenverhältnis der Vorschau-Kacheln (Listen, «Auch interessant», Startseite)

const argBericht = process.argv.indexOf('--bericht');
const berichtPfad = argBericht > -1 ? resolve(process.argv[argBericht + 1]) : null;

// 1. Beiträge und ihre Vorschaubilder einsammeln
const beitraege = [];
for (const datei of readdirSync(BLOG).filter((d) => /\.mdx?$/.test(d)).sort()) {
	const pfad = join(BLOG, datei);
	const text = readFileSync(pfad, 'utf8');
	const kopf = text.match(/^---\n([\s\S]*?)\n---/);
	if (!kopf) continue;
	const feld = (name) => kopf[1].match(new RegExp(`^${name}:\\s*['"]?([^'"\\n]+)['"]?\\s*$`, 'm'))?.[1];
	const quelle = feld('vorschau') ? 'vorschau' : feld('heroImage') ? 'heroImage' : null;
	beitraege.push({
		slug: datei.replace(/\.mdx?$/, ''),
		pfad,
		text,
		quelle,
		bild: quelle ? resolve(BLOG, feld(quelle)) : null,
		vorhanden: feld('vorschauFokus'),
	});
}

// 2. Gesichter erkennen (ein Swift-Aufruf für alle Bilder)
const bilder = [...new Set(beitraege.filter((b) => b.bild).map((b) => b.bild))];
const erkannt = new Map();
if (bilder.length) {
	const out = execFileSync('swift', [join(ROOT, 'scripts/gesichter.swift'), ...bilder], {
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
	});
	for (const zeile of out.split('\n').filter(Boolean)) {
		const j = JSON.parse(zeile);
		erkannt.set(resolve(j.pfad), j);
	}
}

// 3. Fokus berechnen: Kopfbereich (Gesichter + Haare darüber) soll im 3:2-Ausschnitt mittig
//    und ganz sichtbar sein. object-position p% heisst: Fensteranfang = p * (1 - sichtbarerAnteil).
const prozent = (v) => `${Math.round(Math.min(1, Math.max(0, v)) * 100)}%`;
function fokus(info) {
	const seite = info.breite / info.hoehe;
	const g = info.gesichter ?? [];
	if (!g.length) return seite < 1 ? '50% 30%' : '50% 50%';
	const hMittel = g.reduce((s, f) => s + f[3], 0) / g.length;
	const x0 = Math.min(...g.map((f) => f[0]));
	const x1 = Math.max(...g.map((f) => f[0] + f[2]));
	const kopfOben = Math.max(0, Math.min(...g.map((f) => f[1])) - 0.5 * hMittel); // Haare/Stirn
	const kopfUnten = Math.min(1, Math.max(...g.map((f) => f[1] + f[3])) + 0.1 * hMittel); // Kinn
	const lage = (mitte, anfang, ende, sichtbar) => {
		if (sichtbar >= 1) return 0.5;
		let start = Math.min(Math.max(mitte - sichtbar / 2, 0), 1 - sichtbar);
		if (anfang < start) start = anfang; // Kopf ist höher als das Fenster: oben bündig
		if (ende > start + sichtbar && ende - anfang <= sichtbar) start = ende - sichtbar;
		return start / (1 - sichtbar);
	};
	if (seite < REF) {
		// Bild höher als die Kachel: vertikal verschieben
		return `50% ${prozent(lage((kopfOben + kopfUnten) / 2, kopfOben, kopfUnten, seite / REF))}`;
	}
	// Bild breiter als die Kachel: horizontal verschieben
	return `${prozent(lage((x0 + x1) / 2, x0, x1, REF / seite))} 50%`;
}

// 4. Schreiben (nur wo das Feld fehlt) und Bericht
const zeilen = [];
let neu = 0;
for (const b of beitraege) {
	if (!b.bild) {
		zeilen.push({ slug: b.slug, fokus: '–', gesicht: '–', hinweis: 'kein Vorschaubild (Farbkachel)' });
		continue;
	}
	const info = erkannt.get(b.bild);
	if (!info || info.fehler) {
		zeilen.push({ slug: b.slug, fokus: b.vorhanden ?? '–', gesicht: '?', hinweis: `Bild nicht lesbar: ${relative(ROOT, b.bild)}` });
		continue;
	}
	const anzahl = info.gesichter.length;
	const wert = fokus(info);
	if (b.vorhanden) {
		zeilen.push({ slug: b.slug, fokus: b.vorhanden, gesicht: anzahl ? `ja (${anzahl})` : 'nein', hinweis: `bestehend, nicht überschrieben (berechnet: ${wert})` });
		continue;
	}
	const ersetzt = b.text.replace(
		new RegExp(`^(${b.quelle}:.*)$`, 'm'),
		(z) => `${z}\nvorschauFokus: '${wert}'`,
	);
	writeFileSync(b.pfad, ersetzt);
	neu++;
	zeilen.push({ slug: b.slug, fokus: wert, gesicht: anzahl ? `ja (${anzahl})` : 'nein', hinweis: '' });
}

const mitGesicht = zeilen.filter((z) => z.gesicht.startsWith('ja')).length;
console.log(`${beitraege.length} Beiträge, ${bilder.length} Vorschaubilder, ${mitGesicht} mit Gesicht, ${neu} Werte neu gesetzt.`);

if (berichtPfad) {
	const md = [
		'# Vorschau-Fokus (Gesichtserkennung)',
		'',
		`Stand: ${new Date().toISOString().slice(0, 10)} · Skript: \`scripts/vorschau-fokus.mjs\` (Repo Astro-Blog) · Apple Vision, lokal`,
		'',
		`${beitraege.length} Beiträge, ${bilder.length} Vorschaubilder, ${mitGesicht} mit Gesicht, ${neu} Werte neu gesetzt.`,
		'Ohne Gesicht: Bildmitte (50% 50%), bei Hochformat 50% 30%. Bezugsformat der Kacheln: 3:2.',
		'',
		'| Beitrag | Fokus | Gesicht | Hinweis |',
		'|---|---|---|---|',
		...zeilen.map((z) => `| ${z.slug} | ${z.fokus} | ${z.gesicht} | ${z.hinweis} |`),
		'',
	].join('\n');
	writeFileSync(berichtPfad, md);
	console.log(`Bericht: ${berichtPfad}`);
}
