// Quellen-Icons der Medien: Zuordnung Medium -> Datei in public/logos (64 px, lokal ausgeliefert).
// Pflege: src/data/medien-logos.json (Skript scripts/logos-holen.py). Genutzt von /medien/ und der Startseite.
import logos from '../data/medien-logos.json';

/** Pfad des Logos zu einem Medium (exakt oder über Namenspräfix), sonst null. */
export function logoFuer(medium: string): string | null {
	const m = logos.medien as Record<string, string>;
	let key = m[medium];
	if (!key) key = Object.entries(logos.praefix).find(([pre]) => medium.startsWith(pre))?.[1] as string;
	return key ? `/logos/${key}.png` : null;
}
