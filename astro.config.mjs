// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Öffentliche Adresse des Blogs (für Sitemap, RSS und Vorschaubilder).
	site: 'https://blog.daniel-graf.workers.dev',
	integrations: [mdx(), sitemap()],
	// Schriften werden beim Build von Fontsource geholt und selbst ausgeliefert
	// (keine Anfragen an Google Fonts im Browser der Besucher).
	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: 'Source Serif 4',
			cssVariable: '--font-serif',
			weights: [400, 700],
			styles: ['normal', 'italic'],
			subsets: ['latin'],
			fallbacks: ['Georgia', 'serif'],
		},
		{
			provider: fontProviders.fontsource(),
			name: 'IBM Plex Sans',
			cssVariable: '--font-sans',
			weights: [500, 600, 700],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['system-ui', 'sans-serif'],
		},
		{
			provider: fontProviders.fontsource(),
			name: 'IBM Plex Mono',
			cssVariable: '--font-mono',
			weights: [400],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['ui-monospace', 'monospace'],
		},
	],
});
