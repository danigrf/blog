// Trennt im gerenderten Beitrags-HTML den Quellenhinweis am Textende ab («Dieser Beitrag erschien
// zuerst auf LinkedIn …», «Zuerst erschienen auf X» samt Embed). Er steht in den Inhaltsdateien
// als letzter kursiver Absatz; das Layout setzt Box und Themen davor.

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const LETZTE = 5; // der Hinweis steht immer unter den letzten Blöcken

/** Blöcke der obersten Ebene: { tag, start, end }. */
function bloecke(html) {
	const out = [];
	const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/g;
	let tiefe = 0;
	let start = -1;
	let tag = '';
	let m;
	while ((m = re.exec(html))) {
		if (m[0].startsWith('<!--')) continue;
		const zu = m[1] === '/';
		const name = m[2].toLowerCase();
		const selbst = m[3] === '/' || VOID.has(name);
		if (!zu) {
			if (tiefe === 0) {
				start = m.index;
				tag = name;
			}
			if (selbst) {
				if (tiefe === 0) out.push({ tag, start, end: re.lastIndex });
			} else tiefe++;
		} else {
			tiefe--;
			if (tiefe === 0) out.push({ tag, start, end: re.lastIndex });
			if (tiefe < 0) tiefe = 0;
		}
	}
	return out;
}

/** [Text, Quellenhinweis]; Quellenhinweis ist leer, wenn es keinen gibt. */
export function trenneQuellenhinweis(html) {
	const bl = bloecke(html);
	for (let i = bl.length - 1; i >= Math.max(0, bl.length - LETZTE); i--) {
		const h = html.slice(bl[i].start, bl[i].end);
		if (bl[i].tag === 'p' && /^<p[^>]*>\s*<em/i.test(h) && /erschien zuerst|zuerst erschienen/i.test(h)) {
			return [html.slice(0, bl[i].start), html.slice(bl[i].start)];
		}
	}
	return [html, ''];
}
