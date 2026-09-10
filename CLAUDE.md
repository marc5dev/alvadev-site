# alvadev-site
Public website for alvadev.com. Cloudflare Workers serves the public/ folder
as static assets — folder = URL (public/kontakt/index.html → alvadev.com/kontakt).
Every push to main deploys automatically within ~1 minute. No build step.
Plain HTML/CSS/JS only. Don't add frameworks without asking.
Protected pages do NOT go in this repo — internal content has its own
Access-gated project (see master guide, Part 14.3).

Legal pages live at public/{impressum,privacy,terms,data-deletion}/index.html.
They load style.css only — no app.js, no aurora — so don't use .stage or
.reveal on them (those need JS to become visible). Keep the four in sync.

style.css and app.js are cache-busted with ?v=N. Change either file and you
must bump N in every page that links it, or visitors keep the stale copy.

Unfilled legal details are marked <span class="todo">…</span> — amber and
dashed, meant to be impossible to miss. Never replace one with a plausible
guess: a made-up VAT number or address on an Impressum is worse than a gap,
and Meta's business verification compares it against real documents.
