import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			// Vorschaubild für Listen und Social-Media-Vorschau. Fehlt es, gilt heroImage;
			// fehlt auch das, erscheint eine gestaltete Kachel (Listen) bzw. das Standardbild (Teilen).
			vorschau: z.optional(image()),
			// Beschreibt das Vorschaubild für die Social-Media-Vorschau (in Listen ist es dekorativ).
			vorschauAlt: z.string().optional(),
			// Schlagwörter; jedes führt zu einer Themenseite unter /themen/.
			tags: z.array(z.string()).default([]),
			// Entwurf: wird nicht gebaut und taucht in keiner Liste, im RSS und in der Sitemap nicht auf.
			draft: z.boolean().default(false),
		}),
});

export const collections = { blog };
