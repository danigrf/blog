// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Öffentliche Adresse des Blogs (für Sitemap, RSS und Vorschaubilder).
	site: 'https://danielgraf.ch',
	integrations: [mdx(), sitemap()],
	// Schrift wird beim Build von Fontsource geholt und selbst ausgeliefert
	// (keine Anfragen an Google Fonts im Browser der Besucher).
	fonts: [
		{
			// Archivo: einzige Schrift der Site (Design A6, gewählt 01.11.2026).
			// Variabel, Gewicht 100–900 und Breite 62–125 (Datei «standard» von Fontsource).
			provider: fontProviders.fontsource(),
			name: 'Archivo',
			cssVariable: '--font-archivo',
			weights: ['100 900'],
			styles: ['normal', 'italic'],
			subsets: ['latin'],
			fallbacks: ['Arial', 'sans-serif'],
		},
	],
});
