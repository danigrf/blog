// Globale Angaben, die überall auf der Seite verwendet werden.

export const SITE_TITLE = 'Daniel Graf';
export const SITE_DESCRIPTION = 'Wie gelingt das Update unseres politischen Systems? Diese Frage treibt mich an.';

// Profile auf anderen Plattformen (Startseite, Über mich, Fuss). Reihenfolge = Anzeige.
export const SOZIAL = [
	{ name: 'LinkedIn', url: 'https://www.linkedin.com/in/grafdaniel/' },
	{ name: 'Instagram', url: 'https://www.instagram.com/dani_graf/' },
];

// Social-Media- und YouTube-Beiträge direkt sichtbar einbetten (true)
// oder erst nach Klick laden (false, datenschutzfreundlicher).
export const EINBETTUNG_DIREKT = true;

// Medienseite: Einträge, deren Original noch nicht geprüft ist (Status «… prüfen» / «… offen»
// in der Masterliste). In der lokalen Vorschau erscheinen sie immer grau markiert;
// online nur, wenn hier true steht.
export const MEDIEN_UNGEPRUEFTE_ZEIGEN = false;

// Kontaktformular: öffentlicher Turnstile-Site-Key des Widgets «danielgraf.ch Kontaktformular»
// (darf im HTML stehen; das Gegenstück TURNSTILE_SECRET liegt nur als Secret im Worker).
// Für lokale Tests überschreiben: PUBLIC_TURNSTILE_SITEKEY=1x00000000000000000000AA npm run build
export const TURNSTILE_SITEKEY = import.meta.env.PUBLIC_TURNSTILE_SITEKEY || '0x4AAAAAAFvjI0eLQH4RwVnj';
