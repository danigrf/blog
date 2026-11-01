# Astro Starter Kit: Blog

```sh
npm create astro@latest -- --template blog
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

Features:

- ✅ Minimal styling (make it your own!)
- ✅ 100/100 Lighthouse performance
- ✅ SEO-friendly with canonical URLs and Open Graph data
- ✅ Sitemap support
- ✅ RSS Feed support
- ✅ Markdown & MDX support

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. Use `getCollection()` to retrieve posts from `src/content/blog/`, and type-check your frontmatter using an optional schema. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).

## Kontaktformular (/kontakt/)

Seite `src/pages/kontakt.astro` schickt per `fetch` an `POST /api/kontakt`. Den Endpunkt beantwortet ein kleiner Worker (`worker/index.ts`); alle anderen Adressen liefert Cloudflare wie bisher direkt aus `dist/` aus (`run_worker_first: ["/api/*"]`).

Schutz: Honeypot-Feld `website`, Zeitfalle (mind. 3 s), Cloudflare Turnstile, höchstens 5 Versuche pro IP und Minute (`ratelimits`), nur Anfragen von der eigenen Domain. Versand über Cloudflare Email Service (Binding `EMAIL`), Absender `kontakt@danielgraf.ch`, Reply-To = Adresse aus dem Formular.

**Die Empfängeradresse steht nirgends im Repo** (es ist öffentlich), nur im Secret `KONTAKT_TO`.

Einmalig online einrichten:

```sh
npx wrangler secret put KONTAKT_TO        # Empfängeradresse eingeben
npx wrangler secret put TURNSTILE_SECRET  # Secret des Turnstile-Widgets
```

Der öffentliche Turnstile-Site-Key steht fest in `src/consts.ts` (Build-Variable `PUBLIC_TURNSTILE_SITEKEY` überschreibt ihn, z. B. für lokale Tests). Ohne die Secrets antwortet der Endpunkt mit «nicht eingerichtet» (503).

Lokal testen (nichts wird verschickt, wrangler legt die Mail als Datei unter `.wrangler/tmp/email/` ab):

```sh
cp .dev.vars.example .dev.vars
PUBLIC_TURNSTILE_SITEKEY=1x00000000000000000000AA npm run build
npx wrangler dev --port 8799     # http://127.0.0.1:8799/kontakt/
```
