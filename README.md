# alvadev-site

The public website for alvadev.com. Served by Cloudflare Workers (static assets).

- `public/` — everything in here IS the website. Folder = URL path.
- `wrangler.jsonc` — tells Cloudflare to serve the `public/` folder.

Push to `main` → Cloudflare rebuilds → live. See the ALVADEV master guide for setup.
