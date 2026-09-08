# Concision website

Static company site: Vite 8 multi-page build, plain HTML, CSS and JavaScript, no framework, no
runtime dependencies. Spec: `docs/superpowers/specs/2026-09-08-concision-website-design.md`.

## Commands

`npm run dev`, `npm run build`, `npm run lint`, `npm run format`, `npm run test:unit`,
`npm run test:e2e` (builds first), `npm run render-assets`, `npm run derive-wordmark`.

## Rules

- Company facts (name, number, address, email, dates) live only in `site.config.js`. HTML uses
  `{{ dotted.path }}` placeholders; tests import the config. Never retype these values.
- Shared markup goes in `partials/` and is pulled in with `<!-- @include partials/x.html -->`.
- The Content Security Policy is `style-src 'self'; script-src 'self'`: no `style` attributes,
  no `<style>` blocks, no inline scripts in site HTML. JSON-LD data blocks are fine.
- One CSS file per component in `styles/components/`, imported from `styles/base.css`. Use the
  tokens in `styles/variables.css`. Spacing between siblings uses flex or grid `gap`.
- JavaScript is progressive enhancement. The site must be complete with it disabled; the tests
  check this.
- Named constants for selectors, class names, breakpoints and keys. Braces on every `if` except
  a very short `return`. Lowercase one-line comments.
- Copy: sentence-case headings; the London address is only ever the "Registered office"; the
  company "works from Leeds".
- Test first. Unit tests use `node --test`; browser tests use Playwright against the built site.
- Do not commit unless asked. Temporary files go in `temp/`.
