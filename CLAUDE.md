# alvadev-site
Public website for alvadev.com. Cloudflare Workers serves the public/ folder
as static assets — folder = URL (public/kontakt/index.html → alvadev.com/kontakt).
Every push to main deploys automatically within ~1 minute. No build step.
Plain HTML/CSS/JS only. Don't add frameworks without asking.
Protected pages do NOT go in this repo — internal content has its own
Access-gated project (see master guide, Part 14.3).
