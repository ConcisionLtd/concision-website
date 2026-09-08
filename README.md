# Concision website

The company website for Concision Ltd, served at [concision.io](https://concision.io).

Plain HTML, CSS and JavaScript built with Vite. No framework, no runtime dependencies. Company
details live once in `site.config.js` and are injected into the HTML at build time.

## Requirements

- Node 22 (see `.nvmrc`); the unit test script relies on Node's own glob support, so Node 20 cannot run it
- `npm ci`, then `npx playwright install chromium` for the browser tests and asset rendering

## Commands

| Command                 | What it does                                                   |
| ----------------------- | -------------------------------------------------------------- |
| `npm run dev`           | Dev server with live reload (partials included)                |
| `npm run build`         | Production build into `dist/`, including `_headers`            |
| `npm run preview`       | Serve `dist/` with the production security headers             |
| `npm run lint`          | ESLint                                                         |
| `npm run format`        | Prettier, write                                                |
| `npm run format:check`  | Prettier, check only                                           |
| `npm run test:unit`     | Node's test runner over `tests/unit`                           |
| `npm run test:e2e`      | Playwright against a fresh build (desktop and mobile Chromium) |
| `npm run test`          | Unit then browser tests                                        |
| `npm run render-assets` | Regenerate the favicon PNGs and the social preview image       |

`npm run test:e2e` reuses a preview server already running on port 4173 (outside CI), so stop any
stale one first or the tests run against an old build.

## Layout

| Path                      | Purpose                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `index.html`              | Home page                                                                                      |
| `privacy/index.html`      | Privacy notice                                                                                 |
| `partials/`               | Shared head, header and footer, inlined at build time                                          |
| `site.config.js`          | Company facts, URLs and contact email: the single source of truth                              |
| `styles/`                 | `variables.css` tokens, `base.css`, one file per component                                     |
| `scripts/`                | Progressive enhancement: mobile menu, reveal on scroll                                         |
| `plugins/`                | Vite plugins: HTML partials, Cloudflare `_headers`                                             |
| `config/`                 | Security header rules shared by the build and the preview server                               |
| `public/`                 | Static files copied as-is: `static/` (logos, icons, social preview), manifest, sitemap, robots |
| `tools/`                  | Asset rendering script and its templates                                                       |
| `tests/unit`, `tests/e2e` | Node tests and Playwright specs                                                                |
| `branding/`               | Logo source files supplied by the company                                                      |
| `docs/superpowers/`       | Design spec and implementation plan                                                            |

## How the HTML is assembled

Pages contain `<!-- @include partials/site-footer.html -->` directives and `{{ company.number }}`
placeholders. `plugins/htmlPartials.js` expands both during the Vite build and in the dev server.
An unknown placeholder or a missing partial fails the build.

## Security headers

`config/securityHeaders.js` defines the Content Security Policy and cache rules. The build writes
them to `dist/_headers` for Cloudflare Pages, and `vite preview` serves them too, so the browser
tests run under the real policy. Inline styles and inline scripts are not allowed by the policy.
`/assets/` holds only Vite's hashed bundle and is cached as immutable; committed files under
`/static/` are cached for a day.

## Assets

`branding/` holds the files supplied by the company: the wordmark (`concision-logo.svg`), the
wordmark with its tagline line (`concision-logo-with-tagline.svg`) and the icon mark
(`concision-mark.svg`). The header serves a copy of the wordmark from `public/static/`.
`public/static/favicon.svg` puts the icon mark, in the brand teal, on a white rounded square.
`npm run render-assets` renders the favicon to the PNG sizes and composes `social-preview.png` from
`tools/asset-templates/social-preview.html`, which reads the tagline version of the logo from
`branding/`. Re-run it, and commit the results, whenever the branding files change.

## Deployment (Cloudflare Pages)

The site deploys through Cloudflare's Git integration. Production is the `main` branch; every
other branch gets a preview URL. Nothing in the repo holds a token.

One-time setup, in the Cloudflare dashboard for the Concision account:

1. **Create the repository.** GitHub → New repository, owner `ConcisionLtd`, name
   `concision-website`, public, no template. Push this branch, then merge it to `main`.
2. **Authorise Cloudflare's GitHub app** for the `ConcisionLtd` organisation. This is only needed
   the first time you connect a repository from the organisation; Cloudflare prompts for it
   during the next step.
3. **Workers & Pages → Create → Pages → Connect to Git.** Choose `ConcisionLtd/concision-website`.
4. **Build settings.** Framework preset: None. Build command: `npm run build`. Build output
   directory: `dist`. Root directory: `/`. No environment variables. Node comes from `.nvmrc`.
5. **Deploy** and confirm the `*.pages.dev` URL renders the site.
6. **Remove the old redirect.** In the `concision.io` zone, delete the rule that redirects the
   domain to nudgesupport.com (Rules → Redirect Rules, or Bulk Redirects, or Page Rules,
   wherever it lives) and any placeholder DNS records it relied on for `@` and `www`.
7. **Custom domains.** In the Pages project, Custom domains → Set up a custom domain: add
   `concision.io`, then `www.concision.io`. Cloudflare creates the DNS records.
8. **Redirect `www` to the apex.** In the `concision.io` zone: Rules → Redirect Rules → Create
   rule. Expression `(http.host eq "www.concision.io")`; type Dynamic; expression
   `concat("https://concision.io", http.request.uri.path)`; status 301; preserve query string on.
   Pages cannot do this from a `_redirects` file.
9. **Turn off Email Address Obfuscation.** Zone → Scrape Shield → Email Address Obfuscation →
   Off. Cloudflare enables it by default and it rewrites `mailto:` links and visible addresses in
   the served HTML, which would hide the contact email the site exists to show.
10. **HTTPS.** Zone → SSL/TLS → Edge Certificates: Always Use HTTPS on, and enable HSTS (max-age
    6 months, include subdomains only if every subdomain is on HTTPS).
11. **Analytics.** In the Pages project, Metrics → Web Analytics → Enable. The beacon is injected
    at the edge and is already allowed by the Content Security Policy.
12. **Check.**
    - `https://concision.io` renders, and `https://www.concision.io/privacy/` redirects to
      `https://concision.io/privacy/`.
    - `curl -sI https://concision.io | grep -i content-security-policy` shows the policy.
    - `curl -s https://concision.io | grep -c hello@concision.io` prints at least 2: the contact
      button and the footer.
13. **Protect `main`.** In the GitHub repo, Settings → Branches → add a rule for `main`: require a
    pull request and require the `ci` status check. No force pushes.

## Production differs from preview

- Cloudflare may inject the analytics beacon, and, if Email Address Obfuscation is left on,
  rewrite the email addresses in the served HTML (Scrape Shield).
- `vite preview` applies only the `/*` block of `_headers`; the per-path cache rules are not
  served locally.
- Pages normalises `/privacy` to `/privacy/` with a 308, while the preview server returns 404 for
  the slash-less path.
- The `www` to apex redirect is a zone rule and does not exist locally.

## Contributing

Work on a branch, open a pull request, let `ci` pass, merge to `main`. Commit messages use
Conventional Commits, for example `feat(hero): tighten the headline`.
