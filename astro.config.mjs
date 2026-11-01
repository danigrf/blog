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
	// Site: Archivo (--font-archivo). Die übrigen Einträge dienen nur den Entwürfen unter /entwurf/.
	fonts: [
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
		// --- Runde 2: Schriften für A1–A3 ---
		{
			// Archivo: Grundschrift der Site (Design A6, gewählt 01.11.2026) und Entwurf A1/A4–A6.
			// Variabel, Gewicht 100–900 und Breite 62–125 (Datei «standard» von Fontsource).
			provider: fontProviders.fontsource(),
			name: 'Archivo',
			cssVariable: '--font-archivo',
			weights: ['100 900'],
			styles: ['normal', 'italic'],
			subsets: ['latin'],
			fallbacks: ['Arial', 'sans-serif'],
		},
		{
			// A2 «Sonntag»: Display-Serif, nur 400
			provider: fontProviders.fontsource(),
			name: 'Gloock',
			cssVariable: '--entwurf-gloock',
			weights: [400],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['Georgia', 'serif'],
		},
		{
			provider: fontProviders.fontsource(),
			name: 'Hanken Grotesk',
			cssVariable: '--entwurf-hanken',
			weights: [400, 500, 600],
			styles: ['normal', 'italic'],
			subsets: ['latin'],
			fallbacks: ['Arial', 'sans-serif'],
		},
		{
			// A3 «Garten»
			provider: fontProviders.fontsource(),
			name: 'Atkinson Hyperlegible Next',
			cssVariable: '--entwurf-atkinson',
			weights: [400, 600, 700, 800],
			styles: ['normal', 'italic'],
			subsets: ['latin'],
			fallbacks: ['Arial', 'sans-serif'],
		},
		{
			provider: fontProviders.fontsource(),
			name: 'Atkinson Hyperlegible Mono',
			cssVariable: '--entwurf-atkinson-mono',
			weights: [400],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['ui-monospace', 'monospace'],
		},
	],
});
