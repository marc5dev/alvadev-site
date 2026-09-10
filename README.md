# alvadev-site

The public website for alvadev.com. Served by Cloudflare Workers (static assets).

- `public/` — everything in here IS the website. Folder = URL path.
- `wrangler.jsonc` — tells Cloudflare to serve the `public/` folder.

Push to `main` → Cloudflare rebuilds → live. See the ALVADEV master guide for setup.

## Pages

| URL | File |
|---|---|
| `/` | `public/index.html` |
| `/impressum` | `public/impressum/index.html` |
| `/privacy` | `public/privacy/index.html` |
| `/terms` | `public/terms/index.html` |
| `/data-deletion` | `public/data-deletion/index.html` |

The four legal pages carry no JavaScript — just `style.css`. They are linked
from the footer of every page and from the ⌘K palette.

## Before this goes in front of Meta

Opening a Facebook business page or using the WhatsApp Business API means
someone at Meta reads this site, and business verification compares it against
your registration documents. Three things still need real values:

1. **The NIF / NIE number.** `public/impressum/index.html` has one
   `<span class="todo">` marker left, on the tax identification line. It is
   deliberately loud (amber, dashed border) so it cannot ship unnoticed.
   Put your real NIE there — the one on your TIE card or NIE certificate.
   Never a made-up one: this is the field Meta checks against the documents
   you upload, and a wrong number fails verification.
2. **Check the address against your paperwork.** It currently reads
   Edificio Lanzadera · Marina de Empresas, Carrer del Moll de la Duana, s/n,
   46024 València. If the address on your registration or tax documents is
   written differently, match those instead — Meta compares the two.
3. **Domain verification.** `public/index.html` has a commented-out
   `<meta name="facebook-domain-verification">` near the top. Get the token
   from Business Suite → Brand safety and suitability → Domains, paste it in,
   uncomment, push. Meta reads the root URL, so that one page is enough.

The URLs Meta asks for in the app dashboard:

| Meta field | URL |
|---|---|
| Privacy Policy URL | `https://alvadev.com/privacy` |
| Terms of Service URL | `https://alvadev.com/terms` |
| User data deletion | `https://alvadev.com/data-deletion` |

## Editing conventions

- No build step, no frameworks. Plain HTML/CSS/JS, hand-edited.
- `style.css` and `app.js` are loaded with a `?v=N` query. **Bump `N` in every
  page that links them whenever you change either file**, or returning visitors
  keep the cached copy.
- The legal pages share one layout. If you restyle one, restyle all four —
  they are four separate files on purpose, so there is no template to forget.
