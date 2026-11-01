// Erzeugt die Sharing-Bilder (og:image), reproduzierbar und nur mit lokalen Werkzeugen:
//   1. src/assets/og-standard.jpg            Standardkarte (Design A6, Iris-Spec 02.11.2026)
//   2. src/assets/ueber-mich/daniel-graf-hemd-quer.jpg   Querausschnitt für /about/
//
// Aufruf (macOS): node scripts/og-standard.mjs
// Braucht: Google Chrome (Pfad per CHROME überschreibbar), sharp (Projekt-Abhängigkeit),
// für 2. die Gesichtserkennung scripts/gesichter.swift (Apple Vision).
// Schrift: Archivo (SIL OFL 1.1, Fontsource), variabel; Chrome setzt die Gewichte 500/700/800
// als Instanzen der variablen Datei scripts/og/archivo-latin-variabel.woff2. Kein Fallback:
// lädt die Schrift nicht, bricht das Skript ab.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const tmp = mkdtempSync(join(tmpdir(), 'og-'));

function chrome(args) {
	return execFileSync(
		CHROME,
		[
			'--headless=new',
			`--user-data-dir=${join(tmp, 'profil')}`,
			'--disable-gpu',
			'--hide-scrollbars',
			'--allow-file-access-from-files',
			'--force-device-scale-factor=1',
			'--force-color-profile=srgb',
			'--window-size=1200,630',
			'--virtual-time-budget=8000',
			...args,
		],
		{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 32 * 1024 * 1024 },
	);
}

try {
	// 1. Standardkarte
	const html = readFileSync(join(ROOT, 'scripts/og/karte.html'), 'utf8')
		.replaceAll('{{FONT}}', pathToFileURL(join(ROOT, 'scripts/og/archivo-latin-variabel.woff2')).href)
		.replaceAll('{{BILD}}', pathToFileURL(join(ROOT, 'src/assets/ueber-mich/daniel-graf-quer.jpg')).href);
	const seite = join(tmp, 'karte.html');
	writeFileSync(seite, html);

	const dom = chrome(['--dump-dom', pathToFileURL(seite).href]);
	const roh = dom.match(/<pre id="mess"[^>]*>([^<]*)<\/pre>/)?.[1] ?? '';
	const mess = roh ? JSON.parse(roh.replace(/&quot;/g, '"')) : {};
	if (!roh) console.error('Keine Messung im DOM gefunden. DOM-Anfang:', dom.slice(0, 300));
	if (!mess.schriftGeladen) throw new Error('Schrift Archivo nicht geladen – Abbruch (kein Fallback).');
	if (!mess.bildGeladen) throw new Error('Porträt nicht geladen – Abbruch.');
	console.log('Messung:', mess);

	const png = join(tmp, 'karte.png');
	chrome([`--screenshot=${png}`, pathToFileURL(seite).href]);
	const ziel = join(ROOT, 'src/assets/og-standard.jpg');
	await sharp(png).resize(1200, 630).flatten({ background: '#fafaf7' }).jpeg({ quality: 85, mozjpeg: true }).toFile(ziel);
	const kb = Math.round(statSync(ziel).size / 1024);
	if (kb >= 300) throw new Error(`og-standard.jpg ist ${kb} KB (Ziel < 300 KB).`);
	console.log(`og-standard.jpg: 1200×630, ${kb} KB`);

	// 2. Querausschnitt für /about/: volle Breite, Höhe 1200:630, Kopf (Gesicht + Haare) mittig
	const quelle = join(ROOT, 'src/assets/ueber-mich/daniel-graf-hemd.jpg');
	const { width: w, height: h } = await sharp(quelle).metadata();
	const info = JSON.parse(execFileSync('swift', [join(ROOT, 'scripts/gesichter.swift'), quelle], { encoding: 'utf8' }).trim());
	const hoehe = Math.round((w * 630) / 1200);
	let oben = Math.round((h - hoehe) * 0.3);
	if (info.gesichter?.length) {
		const [, fy, , fh] = info.gesichter[0];
		const kopfOben = (fy - 0.5 * fh) * h;
		const kopfUnten = (fy + fh * 1.1) * h;
		oben = Math.round((kopfOben + kopfUnten) / 2 - hoehe / 2);
	}
	oben = Math.max(0, Math.min(h - hoehe, oben));
	const quer = join(ROOT, 'src/assets/ueber-mich/daniel-graf-hemd-quer.jpg');
	await sharp(quelle).extract({ left: 0, top: oben, width: w, height: hoehe }).resize(1200, 630).jpeg({ quality: 85, mozjpeg: true }).toFile(quer);
	console.log(`daniel-graf-hemd-quer.jpg: Ausschnitt y ${oben}–${oben + hoehe} von ${h}, ${Math.round(statSync(quer).size / 1024)} KB`);
} finally {
	rmSync(tmp, { recursive: true, force: true });
}
