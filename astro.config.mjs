// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Öffentliche Adresse des Blogs (für Sitemap, RSS und Vorschaubilder).
	site: 'https://danielgraf.ch',
	integrations: [
		mdx(),
		// Entwurfsseiten (/entwurf/…) nicht in die Sitemap.
		sitemap({ filter: (page) => !page.includes('/entwurf/') }),
	],
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
		// --- Nur für die Design-Entwürfe unter /entwurf/ (eigene Variablen, bestehende Seiten unberührt) ---
		{
			provider: fontProviders.fontsource(),
			name: 'Source Serif 4',
			cssVariable: '--entwurf-serif',
			weights: [400, 600, 700],
			styles: ['normal', 'italic'],
			subsets: ['latin'],
			fallbacks: ['Georgia', 'serif'],
		},
		{
			provider: fontProviders.fontsource(),
			name: 'IBM Plex Sans',
			cssVariable: '--entwurf-sans',
			weights: [500, 600],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['system-ui', 'sans-serif'],
		},
		{
			provider: fontProviders.fontsource(),
			name: 'IBM Plex Mono',
			cssVariable: '--entwurf-mono',
			weights: [400, 500, 600],
			styles: ['normal', 'italic'],
			subsets: ['latin'],
			fallbacks: ['ui-monospace', 'monospace'],
		},
		{
			provider: fontProviders.fontsource(),
			name: 'Inter Tight',
			cssVariable: '--entwurf-grotesk',
			weights: [400, 500, 700, 800],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['Helvetica Neue', 'Arial', 'sans-serif'],
		},
	],
});
