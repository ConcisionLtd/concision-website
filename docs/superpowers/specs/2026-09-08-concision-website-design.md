# Concision website design

Date: 2026-09-08
Status: draft for review

## 1. Purpose

A company website for Concision Ltd at `https://concision.io`. It exists to:

1. Satisfy the Apple Developer Program's organisation checks: a live site on the company domain showing the legal name, registration details, registered office and a contact route.
2. Give the company a credible public home that presents its products (Nudge, Spends) and its services (web applications, integrations and automation, consultancy).

The site is static. There is no backend, no contact form, no CMS and no runtime dependency.

### Success criteria

- Deployed at `https://concision.io` (with `www` redirecting to the apex) on Cloudflare Pages, deploying automatically on every merge to `main`.
- Every page shows the legal name, trading name, company number, country of registration, registered office and contact email, in the shipped HTML with JavaScript disabled.
- Fully responsive from 320px to ultra-wide, with no horizontal scrolling.
- WCAG 2.2 AA colour contrast, keyboard-operable navigation, semantic landmarks, reduced-motion respected.
- CI (lint, format check, unit tests, build, browser tests) passes on every pull request and on `main`.

## 2. Company facts

These are the canonical values. They live once in `site.config.js` and are injected into the HTML at build time. Nothing else in the repo restates them.

| Fact | Value |
| --- | --- |
| Legal name | Concision Ltd |
| Trading name | Concision |
| Company number | 14129925 |
| Incorporated | 25 May 2022 |
| Registered in | England and Wales (Companies House's term for a London registration; matches the Nudge footer) |
| Registered office | 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom |
| Nature of registered office | Third-party registered office service. Not a trading location and never described as "our office". |
| Based in | Leeds, United Kingdom |
| Contact email | hello@concision.io (group mailbox, already exists) |
| Domain | concision.io on Cloudflare. Currently a redirect rule sends it to nudgesupport.com. |
| Brand colour | `#32AFA9` |
| Ethos | "Cut the nonsense." Business software tends to be bloated, over-complicated and hard to use. It should be simple, and Concision makes it simple. |
| Products | Nudge (live, `https://nudgesupport.com`). Spends (iOS personal finance tracker, in development, no public URL yet). |
| Services | Web applications. Integrations and automation. Consultancy. |
| GitHub | `ConcisionLtd/concision-website`, public. Not yet created. |

## 3. Scope

In scope:

- Home page (`/`) and privacy notice (`/privacy/`).
- Build tooling, tests, CI workflow, Cloudflare Pages configuration files, deployment runbook.
- Generated favicons, manifest, social preview image, sitemap, robots, JSON-LD.

Out of scope (decided during brainstorming):

- Contact form. Contact is a `mailto:` link.
- Dark mode.
- A dedicated Spends page. Spends is a "coming soon" card that gains an App Store link later.
- Blog, CMS, analytics beyond Cloudflare Web Analytics, cookie banner (no cookies are set).
- Product privacy notices. Nudge has its own; Spends will get its own when it ships.

## 4. Architecture

### 4.1 Stack

Vite as the dev server and multi-page builder, plain HTML, CSS and JavaScript, no framework. All dependencies are development-only:

| Package | Purpose |
| --- | --- |
| `vite` | Dev server, multi-page build, asset hashing |
| `@playwright/test` | Browser tests and the asset rendering script |
| `eslint`, `@eslint/js`, `globals` | Linting (same flat config style as Nudge) |
| `prettier` | Formatting (same `.prettierrc` as Nudge) |

Node 20 LTS, pinned by `.nvmrc`, used locally, in CI and by Cloudflare Pages. The package is `"type": "module"`; every script, plugin and test is an ES module. Unit tests use Node's built-in test runner, so no test framework is installed.

No icon font. Any icons are inline SVG. No web fonts. The system font stack is used deliberately for the Apple-like feel and zero font loading.

### 4.2 Why not the other options

- Nudge's stack renders every section with web components in the browser. The legal details would not exist in the HTML until JavaScript ran. For a compliance-facing page the content must be static.
- A zero-build site would duplicate the header, footer and head metadata across pages and lose asset hashing and the dev server.

### 4.3 Repository layout

```text
concision-website/
├── .github/workflows/ci.yml
├── .nvmrc                       # 20
├── .gitignore
├── .prettierrc
├── .prettierignore
├── eslint.config.mjs
├── package.json
├── vite.config.js
├── playwright.config.js
├── CLAUDE.md                    # project conventions for Claude Code
├── README.md                    # commands and the Cloudflare runbook
├── site.config.js               # company facts, URLs, contact email (single source of truth)
├── index.html                   # home page
├── privacy/index.html           # privacy notice
├── partials/
│   ├── head-shared.html         # favicons, manifest, theme-color, stylesheet
│   ├── site-header.html
│   └── site-footer.html
├── styles/
│   ├── variables.css            # design tokens
│   ├── base.css                 # reset, typography, layout primitives; imports the rest
│   └── components/*.css         # one file per component or section
├── scripts/
│   ├── main.js                  # entry: wires the modules below
│   ├── mobileNav.js
│   └── revealOnScroll.js
├── plugins/
│   ├── htmlPartials.js          # Vite plugin: includes and value substitution
│   └── cloudflareHeaders.js     # Vite plugin: emits _headers from config/securityHeaders.js
├── config/
│   └── securityHeaders.js       # header rules shared by the build and the preview server
├── public/
│   ├── assets/                  # logos, favicons, social preview (committed, generated where noted)
│   ├── _redirects
│   ├── robots.txt
│   ├── sitemap.xml
│   └── manifest.json
├── tools/
│   ├── render-assets.js         # renders favicons and the social preview with Playwright
│   └── asset-templates/         # HTML templates the script renders
├── tests/
│   ├── unit/                    # node --test
│   └── e2e/                     # Playwright specs
├── branding/                    # logo source files supplied by the company
├── temp/                        # git-ignored working files
└── docs/superpowers/
    ├── specs/
    └── plans/
```

### 4.4 HTML partials plugin

`plugins/htmlPartials.js` is a local Vite plugin, roughly 60 lines, that runs in the `transformIndexHtml` hook with `order: 'pre'` so Vite still processes the resulting `<link>` and `<script>` tags.

It does two things:

1. **Includes.** `<!-- @include partials/site-footer.html -->` is replaced with the file's contents. Paths are relative to the project root. Partials may include other partials. A cycle or a missing file fails the build with a message naming the file.
2. **Substitution.** `{{ company.number }}` is replaced with the value at that path in the data object. The data object is `site.config.js` plus `build.year` (the year at build time). An unknown path fails the build. Values are inserted verbatim; every value is author-controlled so no escaping is applied, and the plugin documents this.

In development the plugin triggers a full reload when a file under `partials/` changes. `site.config.js` needs no watching: `vite.config.js` imports it, so Vite restarts itself when it changes.

Per-page metadata (title, description, canonical, Open Graph, JSON-LD) is written directly in each page's `<head>`. Only the shared tail of the head (favicons, manifest, theme colour, stylesheet) is a partial.

### 4.5 Security headers plugin

`config/securityHeaders.js` exports the header rules as data: a list of `{ path, headers }` entries. Two consumers read it:

- `plugins/cloudflareHeaders.js` emits `dist/_headers` in Cloudflare's format during `generateBundle`, so the file can never drift from the config.
- `vite.config.js` sets `preview.headers` to the `/*` entry, so the Playwright tests run against the built site with the real Content Security Policy applied. A CSP that breaks the site fails CI rather than production.

The rules:

```text
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; img-src 'self' data:; style-src 'self'; font-src 'self'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
/
  Cache-Control: no-cache
/privacy/
  Cache-Control: no-cache
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

The two `cloudflareinsights.com` origins exist for Cloudflare Web Analytics, which is enabled in the Pages dashboard and injected at the edge. HSTS and HTTPS upgrades are left to the Cloudflare zone settings (Always Use HTTPS), which is why the CSP carries no `upgrade-insecure-requests`: that directive would also apply to the plain-HTTP preview server the tests run against. `style-src 'self'` means no inline styles anywhere, which is also a project rule.

### 4.6 Pages and routing

| URL | Source | Notes |
| --- | --- | --- |
| `/` | `index.html` | Single scrolling page with anchor navigation |
| `/privacy/` | `privacy/index.html` | Directory index so the clean URL works in `vite preview` and on Pages |

Both are build inputs in `vite.config.js` (`build.rolldownOptions.input`; Vite 8 bundles with Rolldown and deprecates `rollupOptions`). `public/_redirects` contains one rule: `https://www.concision.io/* https://concision.io/:splat 301`.

### 4.7 JavaScript

JavaScript is progressive enhancement. With it disabled the site is complete: the navigation links are visible on every viewport, and the hamburger button is hidden. When the script runs it adds a class to the header that hides the links behind the button below 768px and wires the toggle.

- `mobileNav.js`: toggles the menu below 768px, sets `aria-expanded`, closes on link click, on Escape and on resize past the breakpoint.
- `revealOnScroll.js`: adds `is-visible` to `[data-reveal]` elements when they enter the viewport, using `IntersectionObserver`, once. Does nothing when `prefers-reduced-motion: reduce` matches.
- `main.js`: imports both and runs them on `DOMContentLoaded`.

No scroll spy and no scroll-linked header effects; the header hairline is always on. The privacy page loads the same entry script; it has no `[data-reveal]` elements, so only the menu has anything to act on.

## 5. Content

Copy below is the working draft. Final wording, including the headline, is chosen at the review before the first push.

### 5.1 Header

Logo (links to `/`), then Products, Services, About, Contact as anchor links, then a small "Get in touch" button linking to `#contact`. Below 768px the links collapse behind a hamburger button labelled "Menu".

### 5.2 Hero

Headline candidates, to be chosen at review. The build uses the first:

1. Software that cuts the nonsense.
2. Cut the nonsense.
3. Less nonsense. Better software.
4. Simple software for people who have had enough of complicated.

Sub-heading: "Most business software is bloated, over-complicated and a chore to use. Concision is an independent software studio in Leeds that builds the opposite: focused products and web applications that do the job and get out of your way."

Buttons: "See our products" (`#products`) and "Work with us" (`#contact`).

### 5.3 Products

Section heading: "Products". Two cards.

- **Nudge.** Logo from `nudge-landing-page/public/assets/nudge-logo.svg` (the newest version). "Customer support for small teams. Track questions, feature requests and bugs in one place, without the email threads and spreadsheets." Link: "Visit nudgesupport.com", opening in the same tab.
- **Spends.** No logo until one exists; a rounded square in `--color-primary-tint-strong` with an "S" in `--color-primary-strong` stands in. Badge: "Coming soon to iOS". "Personal finance by pay period. See how much you will have by the time you are next paid, and where your money goes each month." No link.

### 5.4 Services

Section heading: "Services". Three items with a short inline SVG icon each.

- **Web applications.** "Bespoke web applications and internal tools, designed around how your team actually works. Front end to database, built to be maintained."
- **Integrations and automation.** "Connect the systems you already use, replace manual re-keying, and let data move on its own."
- **Consultancy.** "Straight answers on architecture, technical direction and getting a stalled project moving. No jargon, no upsell."

### 5.5 About

Section heading: "About". One paragraph: "Concision Ltd was founded in 2022 and works from Leeds, UK. The name is a standard as much as a label: say what matters, leave out what doesn't, and hold the software to the same rule."

### 5.6 Contact

Section heading: "Contact". "Got a project, or a tool your team hates using? Tell us about it." A primary button "hello@concision.io" (`mailto:hello@concision.io`). Beneath it, labelled "Registered office", the registered office address on separate lines.

### 5.7 Footer

Shared partial on both pages. Line one: "© {{ build.year }} Concision Ltd". Line two: "Concision is a trading name of Concision Ltd, registered in England and Wales, company number 14129925. Registered office: 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom." Links: Privacy, hello@concision.io. All values come from `site.config.js`.

### 5.8 Privacy notice

`/privacy/`, headed "Privacy notice" with a "Last updated" date. Plain English, short sections:

1. Who we are: Concision Ltd, company number, registered office, contact email.
2. What this notice covers: the concision.io website only. Products have their own notices.
3. What we collect and why: aggregated, cookieless page analytics via Cloudflare Web Analytics; hosting and security logs processed by Cloudflare, which may include IP addresses; the content of any email you send us, kept only as long as needed to deal with it. Legal basis: legitimate interests.
4. Cookies: this site sets none.
5. Who we share it with: Cloudflare (hosting, analytics) and our email provider. No selling, no advertising.
6. Your rights under UK GDPR: access, rectification, erasure, restriction, objection, portability, and how to exercise them by email.
7. Complaints: the Information Commissioner's Office, `https://ico.org.uk`.
8. Changes to this notice.

This is legal copy and is flagged for the company's review before publication.

### 5.9 Metadata

- `<html lang="en-GB">`.
- Per page: `<title>`, description, canonical, Open Graph (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, `og:locale`), Twitter card (summary_large_image).
- Home page JSON-LD `Organization`: `name` Concision, `legalName` Concision Ltd, `url`, `logo`, `email`, `foundingDate` 2022-05-25, `address` (the registered office as `PostalAddress`), and an `identifier` `PropertyValue` with `propertyID` "UK company number" and `value` 14129925.
- `public/sitemap.xml` lists both URLs. `public/robots.txt` allows everything and points at the sitemap.
- Favicons: SVG favicon, PNG at 180 (Apple touch), 192, 256 and 512. `manifest.json` lists the 192 and 512 icons. `theme-color` `#ffffff`.

## 6. Visual design

### 6.1 Direction

Clean, minimal, Apple-like. White ground, near-black type, teal as the single accent. Generous vertical space, large restrained headings, hairline borders instead of shadows, one soft-tinted surface for cards. Nothing decorative that does not carry meaning. Sentence-case headings (Nudge uses lowercase; the company site is slightly more formal).

### 6.2 Tokens (`styles/variables.css`)

- **Colour.** `--color-primary: #32AFA9` for accents that are not text: the logo mark, badge backgrounds, borders and focus rings. `--color-primary-contrast: #257e7a`, a darkened teal at 4.8:1 against white, used for teal text and for filled buttons with white text. `--color-primary-strong: #1f6a67` for hover states and for badge text, `--color-primary-tint` (`#f5fbfb`) and `--color-primary-tint-strong` (`#eaf7f6`) for surfaces. Neutrals: `--color-text-heading: #1d1d1f`, `--color-text-default: #424245`, `--color-text-subtle: #6e6e73`, `--color-surface: #ffffff`, `--color-surface-muted: #f5f5f7`, `--color-border: #d2d2d7`, `--color-border-muted: #e8e8ed`.
- **Type.** `font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`. Fluid headings: h1 `clamp(2.5rem, 6vw, 4.5rem)` with `letter-spacing: -0.02em` and `line-height: 1.05`; h2 `clamp(2rem, 4vw, 3rem)`; h3 `1.5rem`. Body `1.125rem` at `line-height: 1.6`; lead paragraph `1.375rem`. `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs.
- **Spacing.** Section gap `6rem` on mobile, `9rem` from 1024px. Content column `max-width: 1100px`, inline padding `1.25rem` on mobile, `2rem` from 768px. Component spacing uses flex or grid with `gap`, never sibling margins.
- **Radius.** Cards `20px`, buttons `999px` (pill), badges `999px`.
- **Breakpoints.** 640, 768, 1024, 1280 (as Nudge). Mobile-first.
- **Motion.** `[data-reveal]` starts at `opacity: 0; translateY(12px)` and transitions over `0.6s` to visible. The header hairline is always on; there is no scroll-driven animation. The reveal transition is disabled under `prefers-reduced-motion: reduce`.

### 6.3 Components

- **Header.** Sticky, `backdrop-filter: saturate(180%) blur(20px)`, `rgba(255,255,255,0.8)` background, hairline bottom border, 64px tall. Logo left, links centre, button right. Mobile: logo and hamburger, the menu drops down full width.
- **Buttons.** `.button` with `.button--primary` (teal-contrast fill, white text) and `.button--secondary` (transparent, hairline border, heading-colour text). Pill shape, `0.75rem 1.5rem` padding, medium weight. Visible focus ring in `--color-primary`.
- **Cards.** `--color-surface-muted` background, `20px` radius, `2rem` padding, no shadow. Products cards are a two-column grid from 768px. Services are a three-column grid from 1024px.
- **Badge.** Small pill, `--color-primary-tint-strong` background, `--color-primary-strong` text (the lighter `--color-primary-contrast` falls just short of 4.5:1 on that tint).
- **Section.** `<section>` with an `id`, a heading, an optional lead, then content. Anchor targets get `scroll-margin-top` equal to the header height.
- **Footer.** Small text in `--color-text-subtle`, hairline top border, the legal line wrapping naturally.
- **Skip link.** First element in `<body>`, visible on focus.

### 6.4 Accessibility

- Landmarks: `header`, `nav` (labelled), `main`, `footer`.
- One `h1` per page. Sections headed by `h2`.
- All interactive elements keyboard reachable with visible focus. The mobile menu button carries `aria-expanded` and `aria-controls`.
- Contrast: every text and button colour pair reaches 4.5:1. A unit test reads the token file and asserts this so a palette tweak cannot silently regress it.
- Images carry `alt` text and explicit `width` and `height`.
- No link opens a new tab. Product and external links navigate in the same tab, so no `target` or `rel` attributes are needed.

## 7. Assets

- **Company logo.** Supplied by the company as SVG in `branding/`. A copy ships as `public/assets/concision-logo.svg` (and `concision-mark.svg` if an icon-only mark is supplied). Until it arrives the header shows a text wordmark, and the plan includes a swap step.
- **SVG favicon.** `public/assets/favicon.svg` is the icon-only mark if one is supplied. Otherwise it is a hand-authored teal rounded square with a white "C" in the system font, and it is replaced when a mark arrives.
- **Nudge logo.** Copied from `nudge-landing-page/public/assets/nudge-logo.svg`.
- **Generated PNGs.** `tools/render-assets.js` uses Playwright to render `tools/asset-templates/favicon.html` at 180, 192, 256 and 512 pixels and `social-preview.html` at 1200×630, writing into `public/assets/`. The outputs are committed so Cloudflare's build does not need a browser. The script is run by hand when the logo changes and is documented in the README.

## 8. Deployment

### 8.1 Cloudflare Pages

- Project connected to `ConcisionLtd/concision-website` through the Git integration. Cloudflare builds on every push; `main` is production, other branches get preview URLs.
- Build command `npm run build`, output directory `dist`, root directory `/`. Node version comes from `.nvmrc`.
- No environment variables and no secrets anywhere.
- Web Analytics enabled from the Pages project settings, so the beacon is injected at the edge and no token lives in the repo.

### 8.2 Domain

- Add `concision.io` and `www.concision.io` as custom domains on the Pages project. Cloudflare creates the DNS records because the zone is already on Cloudflare.
- Before that, delete the existing redirect rule that sends concision.io to nudgesupport.com, and any placeholder DNS records the redirect relied on, otherwise the custom domain step fails.
- `_redirects` sends `www` to the apex.

### 8.3 Runbook

The README carries the dashboard steps above in order, with what to check after each. The Cloudflare plugin in Claude Code (read-only access to the Concision account) can be used to verify zone, DNS and Pages state during that session.

### 8.4 GitHub

- Repo created public under `ConcisionLtd` at the first push, after the local review.
- `main` protected: pull requests required, the `ci` check required, no force pushes. Set in the repo settings after the first push.
- Conventional Commits (`feat(hero):`, `fix(nav):`, `chore(ci):`).

## 9. Testing

### 9.1 Unit tests (`node --test tests/unit`)

- `htmlPartials`: include replaces the directive, nested includes resolve, a missing file throws with its path, a cycle throws, `{{ a.b }}` resolves, an unknown path throws.
- `cloudflareHeaders`: the emitted `_headers` text matches the rules in `config/securityHeaders.js` exactly.
- `securityHeaders`: the `/*` entry contains a CSP and the CSP allows the two Cloudflare Insights origins.
- Tokens: every foreground/background pair listed in the test reaches 4.5:1.

### 9.2 Browser tests (Playwright, `tests/e2e`)

Run against `vite preview` of the built `dist`, with the real security headers applied. The Playwright `webServer` command is `npm run build && npm run preview`, so `npm run test:e2e` always tests a fresh build. Two projects: Desktop Chromium at 1280×800 and Mobile Chromium at 375×812. WebKit is not required in CI; it can be run locally.

- Company details: both pages' footers contain the legal name, company number, "England and Wales", the registered office and the contact email, with JavaScript disabled.
- Home JSON-LD parses and carries the company number, legal name and founding date.
- Navigation: every header link targets an element that exists; the "Work with us" button reaches `#contact`.
- Mobile menu: hidden by default under 768px, opens on click with `aria-expanded="true"`, closes on Escape and on link click.
- Layout: `document.documentElement.scrollWidth` equals the viewport width at 375, 768 and 1280.
- Links: the Nudge link points at `https://nudgesupport.com` and has no `target`; the contact button is a `mailto:` to the configured address; the Privacy link resolves to `/privacy/` with status 200.
- Metadata: each page has a `<title>`, a description, a canonical, an `og:image`.
- Console: no errors or CSP violations on either page.

### 9.3 CI (`.github/workflows/ci.yml`)

On `pull_request` and on `push` to `main`: checkout, setup-node from `.nvmrc` with npm cache, `npm ci`, `npm run lint`, `npm run format:check`, `npm run test:unit`, `npm run build`, `npx playwright install --with-deps chromium`, `npm run test:e2e`. The explicit build step gives a clear failure signal; the Playwright web server rebuilds, which costs about a second. The Playwright report is uploaded as an artifact on failure.

### 9.4 npm scripts

| Script | Command |
| --- | --- |
| `dev` | `vite` |
| `build` | `vite build` |
| `preview` | `vite preview` |
| `lint` | `eslint .` |
| `format` | `prettier --write .` |
| `format:check` | `prettier --check .` |
| `test:unit` | `node --test tests/unit` |
| `test:e2e` | `playwright test` |
| `test` | `npm run test:unit && npm run test:e2e` |
| `render-assets` | `node tools/render-assets.js` |

## 10. Development workflow

1. This spec, reviewed and approved.
2. An implementation plan in `docs/superpowers/plans/`, produced with the writing-plans skill.
3. Implementation in small test-first slices. Each slice: failing test, minimal code, passing test, tidy.
4. Local review by the company: run the dev server, smoke test on desktop and phone, choose the headline, review the privacy notice, confirm the logo.
5. First commit and push to the new GitHub repo, then the Cloudflare Pages runbook.
6. Subsequent changes through branches and pull requests, gated by CI.

Nothing is committed until the company asks. Temporary working files go in `temp/`.

## 11. Open items

| Item | Owner | When |
| --- | --- | --- |
| Drop the logo SVG(s) into `branding/` | Company | Any time before the pre-push review |
| Choose the headline from the candidates in 5.2 | Company | Pre-push review |
| Review the privacy notice wording | Company | Pre-push review |
| Create the GitHub repo and push | Claude, with confirmation | After local review |
| Cloudflare Pages project, custom domain, redirect removal, analytics | Company with Claude, following the README runbook | After first push |
| Branch protection on `main` | Company or Claude via the GitHub connector | After first push |
