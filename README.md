# Concision website

The company website for Concision Ltd, served at [concision.io](https://concision.io).

Plain HTML, CSS and JavaScript built with Vite. No framework, no runtime dependencies. Company
details live once in `site.config.js` and are injected into the HTML at build time.

## Requirements

- Node 20 (see `.nvmrc`)
- `npm ci`, then `npx playwright install chromium` for the browser tests and asset rendering

## Commands

| Command                   | What it does                                                   |
| ------------------------- | -------------------------------------------------------------- |
| `npm run dev`             | Dev server with live reload (partials included)                |
| `npm run build`           | Production build into `dist/`, including `_headers`            |
| `npm run preview`         | Serve `dist/` with the production security headers             |
| `npm run lint`            | ESLint                                                         |
| `npm run format`          | Prettier, write                                                |
| `npm run format:check`    | Prettier, check only                                           |
| `npm run test:unit`       | Node's test runner over `tests/unit`                           |
| `npm run test:e2e`        | Playwright against a fresh build (desktop and mobile Chromium) |
| `npm run test`            | Unit then browser tests                                        |
| `npm run render-assets`   | Regenerate the favicon PNGs and the social preview image       |
| `npm run derive-wordmark` | Rebuild the header wordmark SVG from the logo in `branding/`   |

## Layout

| Path                      | Purpose                                                           |
| ------------------------- | ----------------------------------------------------------------- |
| `index.html`              | Home page                                                         |
| `privacy/index.html`      | Privacy notice                                                    |
| `partials/`               | Shared head, header and footer, inlined at build time             |
| `site.config.js`          | Company facts, URLs and contact email: the single source of truth |
| `styles/`                 | `variables.css` tokens, `base.css`, one file per component        |
| `scripts/`                | Progressive enhancement: mobile menu, reveal on scroll            |
| `plugins/`                | Vite plugins: HTML partials, Cloudflare `_headers`                |
| `config/`                 | Security header rules shared by the build and the preview server  |
| `public/`                 | Static files copied as-is: assets, manifest, redirects, sitemap   |
| `tools/`                  | Asset rendering script and its templates                          |
| `tests/unit`, `tests/e2e` | Node tests and Playwright specs                                   |
| `branding/`               | Logo source files supplied by the company                         |
| `docs/superpowers/`       | Design spec and implementation plan                               |

## How the HTML is assembled

Pages contain `<!-- @include partials/site-footer.html -->` directives and `{{ company.number }}`
placeholders. `plugins/htmlPartials.js` expands both during the Vite build and in the dev server.
An unknown placeholder or a missing partial fails the build.

## Security headers

`config/securityHeaders.js` defines the Content Security Policy and cache rules. The build writes
them to `dist/_headers` for Cloudflare Pages, and `vite preview` serves them too, so the browser
tests run under the real policy. Inline styles and inline scripts are not allowed by the policy.

## Assets

`branding/` holds the logo and icon mark supplied by the company. `public/assets/concision-logo.svg`
is a copy of the logo. `npm run derive-wordmark` writes `public/assets/concision-wordmark.svg`, the
logo without its tagline line, which the header uses because the tagline is illegible at header
size. `public/assets/favicon.svg` wraps the icon mark in a teal rounded square. `npm run
render-assets` renders the favicon to the PNG sizes and composes `social-preview.png` from
`tools/asset-templates/social-preview.html`. Re-run both, and commit the results, whenever the
branding files change.

## Deployment (Cloudflare Pages)

The site deploys through Cloudflare's Git integration. Production is the `main` branch; every
other branch gets a preview URL. Nothing in the repo holds a token.

One-time setup, in the Cloudflare dashboard for the Concision account:

1. **Workers & Pages → Create → Pages → Connect to Git.** Choose `ConcisionLtd/concision-website`.
2. **Build settings.** Framework preset: None. Build command: `npm run build`. Build output
   directory: `dist`. Root directory: `/`. No environment variables. Node comes from `.nvmrc`.
3. **Deploy** and confirm the `*.pages.dev` URL renders the site.
4. **Remove the old redirect.** In the `concision.io` zone, delete the rule that redirects the
   domain to nudgesupport.com (Rules → Redirect Rules, or Bulk Redirects, or Page Rules,
   wherever it lives) and any placeholder DNS records it relied on for `@` and `www`.
5. **Custom domains.** In the Pages project, Custom domains → Set up a custom domain: add
   `concision.io`, then `www.concision.io`. Cloudflare creates the DNS records. `_redirects`
   sends `www` to the apex.
6. **Analytics.** In the Pages project, Metrics → Web Analytics → Enable. The beacon is injected
   at the edge and is already allowed by the Content Security Policy.
7. **Check** `https://concision.io`, `https://www.concision.io` (redirects), `/privacy/`, and the
   response headers (`curl -I https://concision.io`).
8. **Protect `main`.** In the GitHub repo, Settings → Branches → add a rule for `main`: require a
   pull request and require the `ci` status check. No force pushes.

## Contributing

Work on a branch, open a pull request, let `ci` pass, merge to `main`. Commit messages use
Conventional Commits, for example `feat(hero): tighten the headline`.
