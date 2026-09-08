# Concision Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify the static company website for Concision Ltd (home page and privacy notice) ready for Cloudflare Pages, with tests and CI.

**Architecture:** Vite 8 multi-page build of plain HTML, CSS and JavaScript. Two local Vite plugins: one inlines shared HTML partials and substitutes `{{ }}` placeholders from `site.config.js` at build time, the other emits Cloudflare's `_headers` file from a shared header config that the preview server also uses. JavaScript is progressive enhancement only (mobile menu, reveal on scroll).

**Tech Stack:** Node 20, Vite ^8.2, @playwright/test ^1.63 (browser tests and asset rendering), Node's built-in test runner (`node --test`), ESLint ^10 with @eslint/js, Prettier ^3.9, GitHub Actions, Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-09-08-concision-website-design.md`

## Global Constraints

- **Commits.** For this project the company has asked for commits as work progresses (overriding their usual wait-for-approval rule). Every task ends with the full checks passing and then one commit on the current feature branch. Use a Conventional Commit subject with a short scope, for example `feat(header): add sticky header and mobile menu`, a body line or two if useful, then end the message with these two trailer lines exactly:

  ```text
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01MWzWmMX7n5ZKgprF3TqTzy
  ```

  Never push. Never touch `main`. Stage only the task's files (`git add` the paths you created or changed; never `git add -A` blindly), and never commit `node_modules/`, `dist/`, `temp/`, `playwright-report/` or `test-results/`.

- Node 20 (`.nvmrc` contains `20`). `package.json` has `"type": "module"`; every `.js` file is an ES module.
- Development dependencies only: `vite`, `@playwright/test`, `eslint`, `@eslint/js`, `globals`, `prettier`. No runtime dependencies, no icon fonts, no web fonts, no CDN scripts or styles.
- The CSP is `style-src 'self'` and `script-src 'self'`: no `style=""` attributes, no `<style>` blocks and no inline JavaScript in site HTML. `<script type="application/ld+json">` is a data block and is allowed. Rendering templates under `tools/asset-templates/` are not served and may use `<style>` blocks.
- Company facts live only in `site.config.js`. HTML refers to them with `{{ dotted.path }}` placeholders. Never type the company number, address, email or founding date into HTML, tests or copy directly; tests import `site.config.js`.
- Copy: sentence-case headings. The London address is only ever labelled "Registered office". The company "works from Leeds". No em dashes in copy.
- Code style: braces on every `if` unless it is a very short `return`; extract function results to named constants before conditionals; one-line comments start lowercase; no magic strings (named constants for selectors, class names, breakpoints); CSS spacing uses flex or grid with `gap`, never sibling margins; styling by class, never by `style` binding.
- Prettier settings (identical to the Nudge landing page): single quotes, semicolons, print width 100, trailing commas `es5`. Run `npm run format` before finishing any task; `npm run lint` and `npm run format:check` must pass.
- Temporary working files go in `temp/`, which is git-ignored.
- Paths in this plan are relative to the repository root `~/dev/concision-website`. The Nudge landing page is at `~/dev/nudge-landing-page`.

---

### Task 1: Scaffold the project and the site config

**Files:**

- Create: `package.json`, `.nvmrc`, `.gitignore`, `.prettierrc`, `.prettierignore`, `eslint.config.mjs`, `site.config.js`
- Test: `tests/unit/siteConfig.test.js`

**Interfaces:**

- Produces: `siteConfig` (named export of `site.config.js`) with the shape shown in Step 6. Every later task reads company facts from it.
- Produces: npm scripts `dev`, `build`, `preview`, `lint`, `format`, `format:check`, `test:unit`, `test:e2e`, `test`, `render-assets`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "concision-website",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "The company website for Concision Ltd at https://concision.io.",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test:unit": "node --test tests/unit",
    "test:e2e": "playwright test",
    "test": "npm run test:unit && npm run test:e2e",
    "render-assets": "node tools/render-assets.js"
  },
  "engines": {
    "node": ">=20.19.0"
  }
}
```

- [ ] **Step 2: Install the development dependencies and the Chromium browser**

Run:

```bash
cd ~/dev/concision-website
npm install --save-dev vite@^8.2.2 @playwright/test@^1.63.0 eslint@^10.10.0 @eslint/js@^10.0.1 globals@^17.12.0 prettier@^3.9.6
npx playwright install chromium
```

Expected: `package-lock.json` created, `devDependencies` added to `package.json`, Chromium downloaded.

- [ ] **Step 3: Create the tooling files**

`.nvmrc`:

```text
20
```

`.gitignore`:

```text
node_modules/
dist/
.DS_Store
temp/
playwright-report/
test-results/
```

`.prettierrc`:

```json
{
  "singleQuote": true,
  "semi": true,
  "printWidth": 100,
  "trailingComma": "es5"
}
```

`.prettierignore`:

```text
node_modules/
dist/
temp/
playwright-report/
test-results/
package-lock.json
tests/unit/fixtures/
```

`eslint.config.mjs`:

```js
import js from '@eslint/js';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

const nodeFiles = [
  'plugins/**/*.js',
  'config/**/*.js',
  'tools/**/*.js',
  'tests/**/*.js',
  'vite.config.js',
  'playwright.config.js',
  'site.config.js',
];

export default defineConfig([
  globalIgnores(['dist/', 'node_modules/', 'playwright-report/', 'test-results/', 'temp/']),
  {
    files: ['**/*.{js,mjs}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
  },
  {
    files: nodeFiles,
    languageOptions: {
      globals: { ...globals.node },
    },
  },
]);
```

Also create the empty git-ignored working folder: `mkdir -p temp`.

- [ ] **Step 4: Write the failing site config test**

`tests/unit/siteConfig.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { siteConfig } from '../../site.config.js';

test('site URL is the https apex domain', () => {
  assert.equal(siteConfig.siteUrl, 'https://concision.io');
});

test('company number is an eight digit Companies House number', () => {
  assert.match(siteConfig.company.number, /^\d{8}$/);
});

test('founding date is an ISO date and the founding year matches it', () => {
  assert.match(siteConfig.company.foundingDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(siteConfig.company.foundingYear, siteConfig.company.foundingDate.slice(0, 4));
});

test('contact email is on the company domain', () => {
  assert.equal(siteConfig.contactEmail, 'hello@concision.io');
});

test('registered office has every line the footer needs', () => {
  const { registeredOffice } = siteConfig.company;
  for (const key of ['line1', 'line2', 'city', 'postcode', 'country']) {
    assert.ok(registeredOffice[key], `missing registered office ${key}`);
  }
});

test('the Nudge product has an https URL', () => {
  assert.match(siteConfig.products.nudge.url, /^https:\/\//);
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL, the import of `../../site.config.js` cannot be found (ERR_MODULE_NOT_FOUND).

- [ ] **Step 6: Create `site.config.js`**

```js
// single source of truth for company facts and site-wide values
export const siteConfig = {
  siteUrl: 'https://concision.io',
  siteName: 'Concision',
  contactEmail: 'hello@concision.io',
  company: {
    legalName: 'Concision Ltd',
    tradingName: 'Concision',
    number: '14129925',
    foundingDate: '2022-05-25',
    foundingYear: '2022',
    registeredIn: 'England and Wales',
    baseCity: 'Leeds',
    registeredOffice: {
      line1: '71-75 Shelton Street',
      line2: 'Covent Garden',
      city: 'London',
      postcode: 'WC2H 9JQ',
      country: 'United Kingdom',
    },
  },
  products: {
    nudge: {
      name: 'Nudge',
      url: 'https://nudgesupport.com',
    },
    spends: {
      name: 'Spends',
    },
  },
};
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm run test:unit`
Expected: `# pass 6`, `# fail 0`.

- [ ] **Step 8: Format and lint**

Run: `npm run format && npm run lint && npm run format:check`
Expected: Prettier rewrites nothing unexpected, ESLint reports no problems, the format check passes.

---

### Task 2: HTML partials plugin

**Files:**

- Create: `plugins/htmlPartials.js`
- Create: `tests/unit/fixtures/partials/inner.html`, `outer.html`, `footer.html`, `cycle-a.html`, `cycle-b.html`
- Test: `tests/unit/htmlPartials.test.js`

**Interfaces:**

- Produces: `renderHtml(html, { root, data })` returning the transformed HTML string; throws `Error` on a missing partial, a circular include or an unknown placeholder.
- Produces: `htmlPartials({ data })` returning a Vite plugin object. Task 4 passes it `{ ...siteConfig, build: { year } }`.
- Directive syntax: `<!-- @include partials/site-footer.html -->` (path relative to the Vite root). Placeholder syntax: `{{ company.number }}`.

- [ ] **Step 1: Create the fixture partials without trailing newlines**

Run (the `printf '%s'` form writes no newline, which keeps the assertions exact):

```bash
mkdir -p tests/unit/fixtures/partials
printf '%s' '<span>inner</span>' > tests/unit/fixtures/partials/inner.html
printf '%s' '<div><!-- @include partials/inner.html --></div>' > tests/unit/fixtures/partials/outer.html
printf '%s' '<footer>{{ company.legalName }}</footer>' > tests/unit/fixtures/partials/footer.html
printf '%s' '<!-- @include partials/cycle-b.html -->' > tests/unit/fixtures/partials/cycle-a.html
printf '%s' '<!-- @include partials/cycle-a.html -->' > tests/unit/fixtures/partials/cycle-b.html
```

- [ ] **Step 2: Write the failing tests**

`tests/unit/htmlPartials.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { renderHtml } from '../../plugins/htmlPartials.js';

const root = path.resolve(import.meta.dirname, 'fixtures');
const data = { company: { legalName: 'Concision Ltd' }, build: { year: '2026' } };
const render = (html) => renderHtml(html, { root, data });

test('replaces an include directive with the partial contents', () => {
  const output = render('<body><!-- @include partials/inner.html --></body>');
  assert.equal(output, '<body><span>inner</span></body>');
});

test('resolves includes nested inside partials', () => {
  const output = render('<!-- @include partials/outer.html -->');
  assert.equal(output, '<div><span>inner</span></div>');
});

test('substitutes placeholders inside included partials', () => {
  const output = render('<!-- @include partials/footer.html -->');
  assert.equal(output, '<footer>Concision Ltd</footer>');
});

test('substitutes dotted placeholders in the page itself, with or without inner spaces', () => {
  const output = render('<p>{{ build.year }} {{company.legalName}}</p>');
  assert.equal(output, '<p>2026 Concision Ltd</p>');
});

test('fails on a missing partial, naming the file', () => {
  assert.throws(() => render('<!-- @include partials/nope.html -->'), /partials\/nope\.html/);
});

test('fails on a circular include', () => {
  assert.throws(() => render('<!-- @include partials/cycle-a.html -->'), /Circular include/);
});

test('fails on an unknown placeholder', () => {
  assert.throws(
    () => render('{{ company.missing }}'),
    /Unknown placeholder: \{\{ company\.missing \}\}/
  );
});

test('fails when a placeholder resolves to an object rather than a value', () => {
  assert.throws(() => render('{{ company }}'), /Unknown placeholder/);
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `node --test tests/unit/htmlPartials.test.js`
Expected: FAIL with ERR_MODULE_NOT_FOUND for `plugins/htmlPartials.js`.

- [ ] **Step 4: Implement the plugin**

`plugins/htmlPartials.js`:

```js
import { readFileSync } from 'node:fs';
import path from 'node:path';

const INCLUDE_PATTERN = /<!--\s*@include\s+(\S+)\s*-->/g;
const PLACEHOLDER_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;
const PARTIALS_DIRECTORY = 'partials';
const FULL_RELOAD_EVENT = { type: 'full-reload', path: '*' };

const readPartial = (absolutePath, includePath) => {
  try {
    return readFileSync(absolutePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Missing partial: ${includePath} (expected at ${absolutePath})`);
    }
    throw error;
  }
};

const expandIncludes = (html, root, stack) =>
  html.replace(INCLUDE_PATTERN, (_, includePath) => {
    const absolutePath = path.resolve(root, includePath);
    const isCircular = stack.includes(absolutePath);
    if (isCircular) {
      throw new Error(`Circular include: ${[...stack, absolutePath].join(' -> ')}`);
    }
    const contents = readPartial(absolutePath, includePath);
    return expandIncludes(contents, root, [...stack, absolutePath]);
  });

const resolveValue = (data, dottedPath) =>
  dottedPath.split('.').reduce((value, key) => (value == null ? undefined : value[key]), data);

const substitutePlaceholders = (html, data) =>
  html.replace(PLACEHOLDER_PATTERN, (_, dottedPath) => {
    const value = resolveValue(data, dottedPath);
    const isPrintable = value != null && typeof value !== 'object';
    if (!isPrintable) {
      throw new Error(`Unknown placeholder: {{ ${dottedPath} }}`);
    }
    return String(value);
  });

// values are inserted verbatim: every value comes from site.config.js and is author-controlled
export const renderHtml = (html, { root, data }) =>
  substitutePlaceholders(expandIncludes(html, root, []), data);

export const htmlPartials = ({ data }) => {
  let root;

  return {
    name: 'html-partials',
    configResolved(config) {
      root = config.root;
    },
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => renderHtml(html, { root, data }),
    },
    configureServer(server) {
      const partialsDirectory = path.resolve(root, PARTIALS_DIRECTORY) + path.sep;
      server.watcher.on('change', (file) => {
        const isPartial = file.startsWith(partialsDirectory);
        if (isPartial) {
          server.hot.send(FULL_RELOAD_EVENT);
        }
      });
    },
  };
};
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --test tests/unit/htmlPartials.test.js`
Expected: `# pass 8`, `# fail 0`.

- [ ] **Step 6: Format and lint**

Run: `npm run format && npm run lint && npm run format:check && npm run test:unit`
Expected: all pass (14 unit tests in total).

---

### Task 3: Security headers config and the Cloudflare `_headers` plugin

**Files:**

- Create: `config/securityHeaders.js`, `plugins/cloudflareHeaders.js`
- Test: `tests/unit/securityHeaders.test.js`

**Interfaces:**

- Produces: `securityHeaderRules` (array of `{ path: string, headers: Record<string, string> }`), `globalHeaders` (the headers object of the `/*` rule), `formatHeadersFile(rules)` returning the `_headers` file text.
- Produces: `cloudflareHeaders({ rules })` returning a Vite plugin that emits `_headers` during `generateBundle`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/securityHeaders.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  securityHeaderRules,
  globalHeaders,
  formatHeadersFile,
} from '../../config/securityHeaders.js';
import { cloudflareHeaders } from '../../plugins/cloudflareHeaders.js';

test('formats rules in the Cloudflare _headers layout', () => {
  const rules = [
    { path: '/*', headers: { 'X-One': '1', 'X-Two': '2' } },
    { path: '/assets/*', headers: { 'Cache-Control': 'immutable' } },
  ];
  assert.equal(
    formatHeadersFile(rules),
    '/*\n  X-One: 1\n  X-Two: 2\n/assets/*\n  Cache-Control: immutable\n'
  );
});

test('the global rule carries a CSP that allows Cloudflare Web Analytics and nothing inline', () => {
  const csp = globalHeaders['Content-Security-Policy'];
  assert.match(csp, /script-src 'self' https:\/\/static\.cloudflareinsights\.com/);
  assert.match(csp, /connect-src 'self' https:\/\/cloudflareinsights\.com/);
  assert.match(csp, /style-src 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /unsafe-inline/);
});

test('every page and the hashed assets have a cache rule', () => {
  const paths = securityHeaderRules.map((rule) => rule.path);
  assert.deepEqual(paths, ['/*', '/', '/privacy/', '/assets/*']);
});

test('the plugin emits _headers built from the rules it is given', () => {
  const emitted = [];
  const plugin = cloudflareHeaders({ rules: securityHeaderRules });
  plugin.generateBundle.call({ emitFile: (file) => emitted.push(file) });
  assert.deepEqual(emitted, [
    { type: 'asset', fileName: '_headers', source: formatHeadersFile(securityHeaderRules) },
  ]);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/unit/securityHeaders.test.js`
Expected: FAIL with ERR_MODULE_NOT_FOUND for `config/securityHeaders.js`.

- [ ] **Step 3: Create the header config**

`config/securityHeaders.js`:

```js
// header rules shared by the Cloudflare _headers file (build) and the preview server (tests)
const CLOUDFLARE_INSIGHTS_SCRIPT_ORIGIN = 'https://static.cloudflareinsights.com';
const CLOUDFLARE_INSIGHTS_BEACON_ORIGIN = 'https://cloudflareinsights.com';
const ONE_YEAR_IN_SECONDS = 31536000;

export const GLOBAL_PATH = '/*';

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' ${CLOUDFLARE_INSIGHTS_SCRIPT_ORIGIN}`,
  `connect-src 'self' ${CLOUDFLARE_INSIGHTS_BEACON_ORIGIN}`,
  "img-src 'self' data:",
  "style-src 'self'",
  "font-src 'self'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

const noCache = { 'Cache-Control': 'no-cache' };

export const securityHeaderRules = [
  {
    path: GLOBAL_PATH,
    headers: {
      'Content-Security-Policy': contentSecurityPolicy,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
  { path: '/', headers: noCache },
  { path: '/privacy/', headers: noCache },
  {
    path: '/assets/*',
    headers: { 'Cache-Control': `public, max-age=${ONE_YEAR_IN_SECONDS}, immutable` },
  },
];

export const globalHeaders = securityHeaderRules.find((rule) => rule.path === GLOBAL_PATH).headers;

export const formatHeadersFile = (rules) => {
  const blocks = rules.map(({ path, headers }) => {
    const headerLines = Object.entries(headers).map(([name, value]) => `  ${name}: ${value}`);
    return [path, ...headerLines].join('\n');
  });
  return `${blocks.join('\n')}\n`;
};
```

- [ ] **Step 4: Create the plugin**

`plugins/cloudflareHeaders.js`:

```js
import { formatHeadersFile } from '../config/securityHeaders.js';

const HEADERS_FILE_NAME = '_headers';

export const cloudflareHeaders = ({ rules }) => ({
  name: 'cloudflare-headers',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: HEADERS_FILE_NAME, source: formatHeadersFile(rules) });
  },
});
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --test tests/unit/securityHeaders.test.js`
Expected: `# pass 4`, `# fail 0`.

- [ ] **Step 6: Format and lint**

Run: `npm run format && npm run lint && npm run format:check && npm run test:unit`
Expected: all pass (18 unit tests).

---

### Task 4: Vite and Playwright wiring, page shells, shared partials

**Files:**

- Create: `vite.config.js`, `playwright.config.js`, `index.html`, `privacy/index.html`, `partials/head-shared.html`, `partials/site-header.html`, `partials/site-footer.html`
- Test: `tests/e2e/companyDetails.spec.js`, `tests/e2e/pages.spec.js`

**Interfaces:**

- Consumes: `htmlPartials`, `cloudflareHeaders`, `securityHeaderRules`, `globalHeaders`, `siteConfig`.
- Produces: the page shells that later tasks fill. `index.html` has `<main id="main" class="page-main">` that section tasks append to, in order: hero, products, services, about, contact. The header's `<nav>` has accessible name `Main` and the menu button's accessible name is `Menu`; tests rely on both.
- Produces: Playwright projects `desktop-chromium` (1280×800) and `mobile-chromium` (375×812), base URL `http://localhost:4173`, web server `npm run build && npm run preview`.

- [ ] **Step 1: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { htmlPartials } from './plugins/htmlPartials.js';
import { cloudflareHeaders } from './plugins/cloudflareHeaders.js';
import { securityHeaderRules, globalHeaders } from './config/securityHeaders.js';
import { siteConfig } from './site.config.js';

const PREVIEW_PORT = 4173;

const templateData = {
  ...siteConfig,
  build: { year: String(new Date().getFullYear()) },
};

export default defineConfig({
  // multi-page site: unknown paths must 404 in dev and preview, as they do on Cloudflare Pages
  appType: 'mpa',
  plugins: [
    htmlPartials({ data: templateData }),
    cloudflareHeaders({ rules: securityHeaderRules }),
  ],
  build: {
    rolldownOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        privacy: resolve(import.meta.dirname, 'privacy/index.html'),
      },
    },
  },
  preview: {
    port: PREVIEW_PORT,
    strictPort: true,
    headers: globalHeaders,
  },
});
```

- [ ] **Step 2: Create `playwright.config.js`**

```js
import { defineConfig, devices } from '@playwright/test';

const PREVIEW_PORT = 4173;
const baseURL = `http://localhost:${PREVIEW_PORT}`;
const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: baseURL,
    reuseExistingServer: !isCi,
    timeout: 60_000,
  },
});
```

- [ ] **Step 3: Create the shared partials**

`partials/head-shared.html` (favicons and the stylesheet are added by later tasks):

```html
<meta name="theme-color" content="#ffffff" />
```

`partials/site-header.html`:

```html
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="container site-header__inner">
    <a class="site-header__brand" href="/">
      <span class="site-header__wordmark">{{ siteName }}</span>
    </a>
    <button
      class="site-header__toggle"
      type="button"
      aria-expanded="false"
      aria-controls="site-nav"
    >
      <span class="visually-hidden">Menu</span>
      <svg
        class="site-header__toggle-icon"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
    <nav id="site-nav" class="site-nav" aria-label="Main">
      <ul class="site-nav__list list-reset">
        <li><a class="site-nav__link" href="/#products">Products</a></li>
        <li><a class="site-nav__link" href="/#services">Services</a></li>
        <li><a class="site-nav__link" href="/#about">About</a></li>
        <li><a class="site-nav__link" href="/#contact">Contact</a></li>
      </ul>
      <a class="button button--primary button--small" href="/#contact">Get in touch</a>
    </nav>
  </div>
</header>
```

`partials/site-footer.html`:

```html
<footer class="site-footer">
  <div class="container site-footer__inner">
    <p class="site-footer__copyright">&copy; {{ build.year }} {{ company.legalName }}</p>
    <p class="site-footer__legal">
      {{ company.tradingName }} is a trading name of {{ company.legalName }}, registered in {{
      company.registeredIn }}, company number {{ company.number }}. Registered office: {{
      company.registeredOffice.line1 }}, {{ company.registeredOffice.line2 }}, {{
      company.registeredOffice.city }}, {{ company.registeredOffice.postcode }}, {{
      company.registeredOffice.country }}.
    </p>
    <ul class="site-footer__links list-reset">
      <li><a href="/privacy/">Privacy</a></li>
      <li><a href="mailto:{{ contactEmail }}">{{ contactEmail }}</a></li>
    </ul>
  </div>
</footer>
```

- [ ] **Step 4: Create the page shells**

`index.html`:

```html
<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ siteName }} | Software studio in {{ company.baseCity }}, UK</title>
    <meta
      name="description"
      content="{{ company.tradingName }} is an independent software studio in {{ company.baseCity }}. We build focused products and web applications, and help businesses cut the nonsense out of their software."
    />
    <link rel="canonical" href="{{ siteUrl }}/" />
    <!-- @include partials/head-shared.html -->
  </head>
  <body>
    <!-- @include partials/site-header.html -->
    <main id="main" class="page-main"></main>
    <!-- @include partials/site-footer.html -->
  </body>
</html>
```

`privacy/index.html`:

```html
<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Privacy notice | {{ siteName }}</title>
    <meta
      name="description"
      content="How {{ company.legalName }} handles information collected through the {{ siteName }} website."
    />
    <link rel="canonical" href="{{ siteUrl }}/privacy/" />
    <!-- @include partials/head-shared.html -->
  </head>
  <body>
    <!-- @include partials/site-header.html -->
    <main id="main" class="page-main">
      <article class="container prose">
        <h1>Privacy notice</h1>
      </article>
    </main>
    <!-- @include partials/site-footer.html -->
  </body>
</html>
```

- [ ] **Step 5: Build and confirm both pages and `_headers` are emitted**

Run: `npm run build && find dist -type f | sort && cat dist/_headers`
Expected: `dist/index.html`, `dist/privacy/index.html`, `dist/_headers`; the `_headers` output starts with `/*` and the CSP line. Open `dist/index.html` and confirm the footer contains "company number 14129925" and this year.

- [ ] **Step 6: Write the failing browser tests**

`tests/e2e/companyDetails.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { siteConfig } from '../../site.config.js';

const PAGE_PATHS = ['/', '/privacy/'];

// the legal details must be in the shipped HTML, so these run with JavaScript off
test.use({ javaScriptEnabled: false });

for (const pagePath of PAGE_PATHS) {
  test(`the footer on ${pagePath} shows the legal details without JavaScript`, async ({ page }) => {
    await page.goto(pagePath);
    const footer = page.getByRole('contentinfo');
    const { company } = siteConfig;

    await expect(footer).toContainText(company.legalName);
    await expect(footer).toContainText(`company number ${company.number}`);
    await expect(footer).toContainText(`registered in ${company.registeredIn}`);
    await expect(footer).toContainText('Registered office:');
    await expect(footer).toContainText(company.registeredOffice.line1);
    await expect(footer).toContainText(company.registeredOffice.postcode);
    await expect(footer).toContainText(siteConfig.contactEmail);
  });

  test(`the footer on ${pagePath} shows the current year`, async ({ page }) => {
    await page.goto(pagePath);
    const currentYear = String(new Date().getFullYear());
    await expect(page.getByRole('contentinfo')).toContainText(`© ${currentYear}`);
  });
}
```

`tests/e2e/pages.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('the privacy notice is reachable from the footer', async ({ page }) => {
  await page.goto('/');
  const privacyLink = page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' });
  await privacyLink.click();
  await expect(page).toHaveURL(/\/privacy\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy notice');
});

test('the privacy notice responds with 200 directly', async ({ request }) => {
  const response = await request.get('/privacy/');
  expect(response.status()).toBe(200);
});
```

- [ ] **Step 7: Run the browser tests**

Run: `npx playwright test tests/e2e/companyDetails.spec.js tests/e2e/pages.spec.js`
Expected: all pass, 6 tests per project, 12 runs in total. If the web server fails to start, run `npm run build` alone to see the error.

Note: these pass immediately because Step 3 and Step 4 wrote the markup before the tests. The tests still earn their place: they pin the no-JavaScript guarantee that every later task must preserve.

- [ ] **Step 8: Format and lint**

Run: `npm run format && npm run lint && npm run format:check`
Expected: all pass. Prettier will reflow the HTML; that is fine.

---

### Task 5: Design tokens, base styles and the contrast test

**Files:**

- Create: `styles/variables.css`, `styles/base.css`
- Modify: `partials/head-shared.html` (add the stylesheet link)
- Create: `tests/unit/helpers/contrast.js`
- Test: `tests/unit/colorContrast.test.js`, `tests/e2e/layout.spec.js`

**Interfaces:**

- Produces: the CSS custom properties listed in Step 3 (colours, type, layout, radius, motion). Every component stylesheet uses these names.
- Produces: base classes `.container`, `.section`, `.section__header`, `.section__lead`, `.list-reset`, `.visually-hidden`, `.skip-link`, `.button`, `.button--primary`, `.button--secondary`, `.button--small`, `.badge`.
- Produces: `contrastRatio(hexA, hexB)` and `readColorTokens(filePath)` helpers for tests.

- [ ] **Step 1: Write the failing contrast tests**

`tests/unit/helpers/contrast.js`:

```js
import { readFileSync } from 'node:fs';

const HEX_TOKEN_PATTERN = /--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi;
const SRGB_THRESHOLD = 0.04045;

const hexToRgb = (hex) => {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
};

const channelToLinear = (channel) => {
  const scaled = channel / 255;
  return scaled <= SRGB_THRESHOLD ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
};

export const relativeLuminance = (hex) => {
  const [red, green, blue] = hexToRgb(hex).map(channelToLinear);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

export const contrastRatio = (hexA, hexB) => {
  const luminanceA = relativeLuminance(hexA);
  const luminanceB = relativeLuminance(hexB);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
};

// returns { tokenName: '#rrggbb' } for every six digit hex custom property in a CSS file
export const readColorTokens = (filePath) => {
  const css = readFileSync(filePath, 'utf8');
  const entries = [...css.matchAll(HEX_TOKEN_PATTERN)].map(([, name, hex]) => [
    name,
    hex.toLowerCase(),
  ]);
  return Object.fromEntries(entries);
};
```

`tests/unit/colorContrast.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { contrastRatio, readColorTokens } from './helpers/contrast.js';

const MINIMUM_CONTRAST = 4.5;
const tokensPath = path.resolve(import.meta.dirname, '../../styles/variables.css');

// [foreground, background] pairs the design uses for text or for text on filled controls
const textPairs = [
  ['color-text-heading', 'color-surface'],
  ['color-text-heading', 'color-surface-muted'],
  ['color-text-heading', 'color-primary-tint'],
  ['color-text-default', 'color-surface'],
  ['color-text-default', 'color-surface-muted'],
  ['color-text-default', 'color-primary-tint'],
  ['color-text-default', 'color-primary-tint-strong'],
  ['color-text-subtle', 'color-surface'],
  ['color-text-subtle', 'color-surface-muted'],
  ['color-primary-contrast', 'color-surface'],
  ['color-text-on-primary', 'color-primary-contrast'],
  ['color-text-on-primary', 'color-primary-strong'],
  ['color-primary-strong', 'color-primary-tint-strong'],
];

test('black on white is the maximum ratio', () => {
  assert.equal(contrastRatio('#000000', '#ffffff'), 21);
});

for (const [foreground, background] of textPairs) {
  test(`${foreground} on ${background} reaches ${MINIMUM_CONTRAST}:1`, () => {
    const tokens = readColorTokens(tokensPath);
    assert.ok(tokens[foreground], `token --${foreground} is missing or not a six digit hex`);
    assert.ok(tokens[background], `token --${background} is missing or not a six digit hex`);
    const ratio = contrastRatio(tokens[foreground], tokens[background]);
    assert.ok(
      ratio >= MINIMUM_CONTRAST,
      `--${foreground} on --${background} is ${ratio.toFixed(2)}:1`
    );
  });
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/unit/colorContrast.test.js`
Expected: FAIL: `styles/variables.css` does not exist (ENOENT).

- [ ] **Step 3: Create the tokens**

`styles/variables.css`:

```css
:root {
  /* colour: the brand teal is for accents; the contrast teal is for text and filled buttons */
  --color-primary: #32afa9;
  --color-primary-contrast: #257e7a;
  --color-primary-strong: #1f6a67;
  --color-primary-tint: #f5fbfb;
  --color-primary-tint-strong: #eaf7f6;

  --color-text-heading: #1d1d1f;
  --color-text-default: #424245;
  --color-text-subtle: #6e6e73;
  --color-text-on-primary: #ffffff;

  --color-surface: #ffffff;
  --color-surface-muted: #f5f5f7;
  --color-border: #d2d2d7;
  --color-border-muted: #e8e8ed;
  --color-header-backdrop: rgb(255 255 255 / 0.8);

  /* type */
  --font-family-base: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-body: 1.125rem;
  --font-size-lead: 1.375rem;
  --font-size-h3: 1.5rem;
  --font-size-h2: clamp(2rem, 4vw, 3rem);
  --font-size-h1: clamp(2.5rem, 6vw, 4.5rem);
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --line-height-tight: 1.05;
  --line-height-snug: 1.2;
  --line-height-body: 1.6;
  --letter-spacing-tight: -0.02em;

  /* layout */
  --container-max-width: 1100px;
  --container-padding: 1.25rem;
  --section-gap: 6rem;
  --header-height: 4rem;

  /* radius */
  --radius-card: 20px;
  --radius-pill: 999px;
  --radius-focus: 4px;

  /* motion */
  --duration-reveal: 0.6s;
  --duration-hover: 0.2s;
  --easing-standard: ease-out;

  /* z-index */
  --z-index-header: 100;
}

@media (min-width: 768px) {
  :root {
    --container-padding: 2rem;
  }
}

@media (min-width: 1024px) {
  :root {
    --section-gap: 9rem;
  }
}
```

- [ ] **Step 4: Run the contrast tests to verify they pass**

Run: `node --test tests/unit/colorContrast.test.js`
Expected: `# pass 14`, `# fail 0`. If a pair fails, darken the foreground token slightly and re-run; do not lower `MINIMUM_CONTRAST`.

- [ ] **Step 5: Create the base stylesheet**

`styles/base.css`:

```css
@import url(variables.css);

/***** reset and document *****/
html {
  box-sizing: border-box;
  scroll-behavior: smooth;
  scroll-padding-top: var(--header-height);

  & *,
  & ::before,
  & ::after {
    box-sizing: inherit;
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}

body {
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--font-size-body);
  line-height: var(--line-height-body);
  color: var(--color-text-default);
  background-color: var(--color-surface);
  -webkit-font-smoothing: antialiased;
}

h1,
h2,
h3 {
  margin: 0;
  color: var(--color-text-heading);
  font-weight: var(--font-weight-semibold);
  text-wrap: balance;
}

h1 {
  font-size: var(--font-size-h1);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
}

h2 {
  font-size: var(--font-size-h2);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-tight);
}

h3 {
  font-size: var(--font-size-h3);
  line-height: var(--line-height-snug);
}

p {
  margin: 0;
  text-wrap: pretty;
}

a {
  color: var(--color-primary-contrast);
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  transition: color var(--duration-hover) ease;

  &:hover {
    color: var(--color-primary-strong);
  }
}

img,
svg {
  display: block;
  max-width: 100%;
  height: auto;
}

button {
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
}

address {
  font-style: normal;
}

/***** accessibility *****/
a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
  border-radius: var(--radius-focus);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.skip-link {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: calc(var(--z-index-header) + 1);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-pill);
  background-color: var(--color-surface);
  color: var(--color-text-heading);
  transform: translateY(-200%);

  &:focus {
    transform: none;
  }
}

/***** layout *****/
.container {
  width: 100%;
  max-width: var(--container-max-width);
  margin-inline: auto;
  padding-inline: var(--container-padding);
}

.page-main {
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
  padding-block: 3rem var(--section-gap);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  scroll-margin-top: var(--header-height);
}

.section__header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 40rem;
}

.section__lead {
  font-size: var(--font-size-lead);
}

.list-reset {
  margin: 0;
  padding: 0;
  list-style: none;
}

/***** controls *****/
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  line-height: 1.2;
  text-decoration: none;
  transition:
    background-color var(--duration-hover) ease,
    color var(--duration-hover) ease,
    border-color var(--duration-hover) ease;
}

.button--primary {
  background-color: var(--color-primary-contrast);
  color: var(--color-text-on-primary);

  &:hover {
    background-color: var(--color-primary-strong);
    color: var(--color-text-on-primary);
  }
}

.button--secondary {
  background-color: transparent;
  color: var(--color-text-heading);
  border: 1px solid var(--color-border);

  &:hover {
    color: var(--color-text-heading);
    border-color: var(--color-text-heading);
  }
}

.button--small {
  padding: 0.5rem 1rem;
  font-size: var(--font-size-sm);
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
  background-color: var(--color-primary-tint-strong);
  color: var(--color-primary-strong);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}
```

Component stylesheets are imported at the top of this file by later tasks, directly under the `variables.css` import.

- [ ] **Step 6: Link the stylesheet from the shared head partial**

`partials/head-shared.html` becomes:

```html
<meta name="theme-color" content="#ffffff" /> <link rel="stylesheet" href="/styles/base.css" />
```

- [ ] **Step 7: Write the layout test**

`tests/e2e/layout.spec.js`:

```js
import { test, expect } from '@playwright/test';

const PAGE_PATHS = ['/', '/privacy/'];
const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
];

const readDocumentWidths = (page) =>
  page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

for (const pagePath of PAGE_PATHS) {
  for (const viewport of VIEWPORTS) {
    test(`${pagePath} has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(pagePath);
      const { scrollWidth, clientWidth } = await readDocumentWidths(page);
      expect(scrollWidth).toBe(clientWidth);
    });
  }
}
```

- [ ] **Step 8: Run the full checks**

Run: `npm run format && npm run lint && npm run format:check && npm run test`
Expected: unit tests pass (32), browser tests pass (both projects). Open `npm run dev` in a browser and confirm the footer text renders in the system font with the muted colours and the skip link appears on Tab.

---

### Task 6: Header styling and the mobile menu

**Files:**

- Create: `styles/components/site-header.css`, `scripts/main.js`, `scripts/mobileNav.js`
- Modify: `styles/base.css` (import), `index.html` and `privacy/index.html` (script tag)
- Test: `tests/e2e/navigation.spec.js`

**Interfaces:**

- Consumes: the header partial from Task 4 (`.site-header`, `.site-header__toggle`, `.site-nav`, nav name `Main`, button name `Menu`) and base classes from Task 5.
- Produces: `initMobileNav()` (named export of `scripts/mobileNav.js`). `scripts/main.js` is the single entry that later tasks add imports to. When JavaScript runs, `<html>` gains the class `js` and the header gains `site-header--enhanced`; an open menu adds `site-header--open`.

- [ ] **Step 1: Write the failing navigation tests**

`tests/e2e/navigation.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { siteConfig } from '../../site.config.js';

const MOBILE_BREAKPOINT = 768;
const mainNav = (page) => page.getByRole('navigation', { name: 'Main' });
const menuButton = (page) => page.getByRole('button', { name: 'Menu' });
const isMobileViewport = ({ viewport }) => viewport.width < MOBILE_BREAKPOINT;
const isDesktopViewport = ({ viewport }) => viewport.width >= MOBILE_BREAKPOINT;

test('the brand link is named after the company and goes home', async ({ page }) => {
  await page.goto('/privacy/');
  const brandLink = page.getByRole('banner').getByRole('link', { name: siteConfig.siteName });
  await expect(brandLink).toHaveAttribute('href', '/');
});

test.describe('mobile menu', () => {
  test.skip(isDesktopViewport, 'mobile viewports only');

  test('is collapsed until the menu button opens it', async ({ page }) => {
    await page.goto('/');
    await expect(mainNav(page)).toBeHidden();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');

    await menuButton(page).click();

    await expect(mainNav(page)).toBeVisible();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'true');
  });

  test('closes on Escape', async ({ page }) => {
    await page.goto('/');
    await menuButton(page).click();
    await expect(mainNav(page)).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(mainNav(page)).toBeHidden();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('closes when a link is chosen', async ({ page }) => {
    await page.goto('/');
    await menuButton(page).click();

    await mainNav(page).getByRole('link', { name: 'About' }).click();

    await expect(mainNav(page)).toBeHidden();
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('the links are visible and there is no menu button', async ({ page }) => {
      await page.goto('/');
      await expect(mainNav(page)).toBeVisible();
      await expect(menuButton(page)).toBeHidden();
    });
  });
});

test.describe('desktop navigation', () => {
  test.skip(isMobileViewport, 'desktop viewports only');

  test('shows the links inline and no menu button', async ({ page }) => {
    await page.goto('/');
    await expect(mainNav(page)).toBeVisible();
    await expect(menuButton(page)).toBeHidden();
    await expect(mainNav(page).getByRole('link', { name: 'Get in touch' })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx playwright test tests/e2e/navigation.spec.js`
Expected: every mobile menu test fails (the nav is visible because nothing collapses it yet, and the unstyled menu button is visible even without JavaScript) and the desktop test fails (the menu button is visible because it is not yet styled). Only the brand link test passes.

- [ ] **Step 3: Create the mobile menu module**

`scripts/mobileNav.js`:

```js
const HEADER_SELECTOR = '.site-header';
const TOGGLE_SELECTOR = '.site-header__toggle';
const NAV_SELECTOR = '.site-nav';
const ENHANCED_CLASS = 'site-header--enhanced';
const OPEN_CLASS = 'site-header--open';
const DESKTOP_MEDIA_QUERY = '(min-width: 768px)';
const ESCAPE_KEY = 'Escape';

// collapses the navigation behind the menu button on small screens once JavaScript is available
export const initMobileNav = () => {
  const header = document.querySelector(HEADER_SELECTOR);
  const toggle = header?.querySelector(TOGGLE_SELECTOR);
  const nav = header?.querySelector(NAV_SELECTOR);
  const hasMenu = Boolean(header && toggle && nav);
  if (!hasMenu) return;

  const desktopQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);

  const setOpen = (isOpen) => {
    header.classList.toggle(OPEN_CLASS, isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  };

  const close = () => setOpen(false);

  toggle.addEventListener('click', () => {
    const isOpen = header.classList.contains(OPEN_CLASS);
    setOpen(!isOpen);
  });

  nav.addEventListener('click', (event) => {
    const isLink = Boolean(event.target.closest('a'));
    if (isLink) {
      close();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === ESCAPE_KEY) {
      close();
    }
  });

  desktopQuery.addEventListener('change', (event) => {
    if (event.matches) {
      close();
    }
  });

  header.classList.add(ENHANCED_CLASS);
  close();
};
```

`scripts/main.js`:

```js
import { initMobileNav } from './mobileNav.js';

const JS_ENABLED_CLASS = 'js';

document.documentElement.classList.add(JS_ENABLED_CLASS);
initMobileNav();
```

- [ ] **Step 4: Add the entry script to both pages**

In `index.html` and `privacy/index.html`, add this as the last line inside `<body>`, after the footer include:

```html
<script type="module" src="/scripts/main.js"></script>
```

- [ ] **Step 5: Create the header stylesheet**

`styles/components/site-header.css`:

```css
.site-header {
  position: sticky;
  top: 0;
  z-index: var(--z-index-header);
  background-color: var(--color-header-backdrop);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--color-border-muted);

  & .site-header__inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-height: var(--header-height);
  }

  & .site-header__brand {
    display: inline-flex;
    align-items: center;
    color: var(--color-text-heading);
    text-decoration: none;
    font-size: 1.25rem;
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--letter-spacing-tight);

    &:hover {
      color: var(--color-primary-contrast);
    }
  }

  /* the button only exists visually once JavaScript has enhanced the header */
  & .site-header__toggle {
    display: none;
    align-items: center;
    padding: 0.5rem;
    color: var(--color-text-heading);
  }

  & .site-nav {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.25rem;
    width: 100%;
    padding-block: 0.5rem 1.25rem;
  }

  & .site-nav__list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  & .site-nav__link {
    color: var(--color-text-heading);
    font-weight: var(--font-weight-medium);
    text-decoration: none;

    &:hover {
      color: var(--color-primary-contrast);
    }
  }

  &.site-header--enhanced {
    & .site-header__toggle {
      display: inline-flex;
    }

    & .site-nav {
      display: none;
    }

    &.site-header--open .site-nav {
      display: flex;
    }
  }

  @media (min-width: 768px) {
    & .site-nav,
    &.site-header--enhanced .site-nav {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 2rem;
      width: auto;
      padding-block: 0;
    }

    & .site-nav__list {
      flex-direction: row;
      gap: 2rem;
    }

    &.site-header--enhanced .site-header__toggle {
      display: none;
    }
  }
}
```

- [ ] **Step 6: Import the stylesheet**

In `styles/base.css`, directly after `@import url(variables.css);`, add:

```css
@import url(components/site-header.css);
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx playwright test tests/e2e/navigation.spec.js`
Expected: all pass (mobile tests run in `mobile-chromium`, desktop in `desktop-chromium`, the rest in both).

- [ ] **Step 8: Verify by hand and run the full checks**

Run `npm run dev`, open the URL on a narrow window: the menu button appears, opens and closes; edit `partials/site-header.html` and confirm the browser reloads on save. Then:

Run: `npm run format && npm run lint && npm run format:check && npm run test`
Expected: all pass.

---

### Task 7: Hero section

**Files:**

- Modify: `index.html` (inside `<main>`), `styles/base.css` (import)
- Create: `styles/components/hero.css`
- Test: `tests/e2e/hero.spec.js`

**Interfaces:**

- Consumes: `.container`, `.button`, `.button--primary`, `.button--secondary` from Task 5; `company.tradingName` and `company.baseCity` from `siteConfig`.
- Produces: the page's only `<h1>`. The headline text is a review-stage choice (spec 5.2); the build uses candidate 1.

- [ ] **Step 1: Write the failing test**

`tests/e2e/hero.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { siteConfig } from '../../site.config.js';

test('the hero carries the single h1 and both calls to action', async ({ page }) => {
  await page.goto('/');
  const headings = page.getByRole('heading', { level: 1 });
  await expect(headings).toHaveCount(1);
  await expect(headings).toContainText('cuts the nonsense');
  await expect(page.getByRole('link', { name: 'See our products' })).toHaveAttribute(
    'href',
    '#products'
  );
  await expect(page.getByRole('link', { name: 'Work with us' })).toHaveAttribute(
    'href',
    '#contact'
  );
});

test('the hero says where the company works from', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero')).toContainText(siteConfig.company.baseCity);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/e2e/hero.spec.js`
Expected: FAIL, no level-1 heading on the home page.

- [ ] **Step 3: Add the hero markup**

Replace the empty `<main id="main" class="page-main"></main>` in `index.html` with:

```html
<main id="main" class="page-main">
  <section class="container hero" aria-labelledby="hero-heading">
    <div class="hero__content">
      <h1 id="hero-heading" class="hero__title">
        Software that cuts the nonsense<span class="hero__accent">.</span>
      </h1>
      <p class="hero__lead">
        Most business software is bloated, over-complicated and a chore to use. {{
        company.tradingName }} is an independent software studio in {{ company.baseCity }} that
        builds the opposite: focused products and web applications that do the job and get out of
        your way.
      </p>
      <div class="hero__actions">
        <a class="button button--primary" href="#products">See our products</a>
        <a class="button button--secondary" href="#contact">Work with us</a>
      </div>
    </div>
  </section>
</main>
```

- [ ] **Step 4: Create the hero stylesheet and import it**

`styles/components/hero.css`:

```css
.hero {
  display: flex;
  flex-direction: column;
  padding-block: 2rem 0;

  & .hero__content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2rem;
    max-width: 52rem;
  }

  & .hero__lead {
    max-width: 40rem;
    font-size: var(--font-size-lead);
  }

  & .hero__accent {
    color: var(--color-primary);
  }

  & .hero__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  @media (min-width: 1024px) {
    padding-block: 5rem 0;
  }
}
```

In `styles/base.css`, add after the site-header import:

```css
@import url(components/hero.css);
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx playwright test tests/e2e/hero.spec.js`
Expected: PASS in both projects.

- [ ] **Step 6: Format, lint and full checks**

Run: `npm run format && npm run lint && npm run format:check && npm run test`
Expected: all pass. In the browser the headline is large with a teal full stop, and the two buttons sit side by side on desktop and wrap on a phone.

---

### Task 8: Products section

**Files:**

- Create: `public/assets/nudge-logo.svg` (copied), `styles/components/products.css`
- Modify: `index.html` (after the hero), `styles/base.css` (import)
- Test: `tests/e2e/products.spec.js`

**Interfaces:**

- Consumes: `.section`, `.section__header`, `.section__lead`, `.list-reset`, `.badge` from Task 5; `products.nudge.name`, `products.nudge.url`, `products.spends.name` from `siteConfig`.
- Produces: `<section id="products">`, the target of the header link and the hero button.

- [ ] **Step 1: Copy the Nudge logo**

Run:

```bash
mkdir -p public/assets
cp ~/dev/nudge-landing-page/public/assets/nudge-logo.svg public/assets/nudge-logo.svg
head -c 120 public/assets/nudge-logo.svg
```

Expected: the file starts with `<svg width="194" height="32" viewBox="0 0 194 32"`. Those are the intrinsic dimensions used in the `<img>` below.

- [ ] **Step 2: Write the failing tests**

`tests/e2e/products.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { siteConfig } from '../../site.config.js';

const productCard = (page, productName) =>
  page.locator('#products .product-card', { hasText: productName });

test('the Nudge card links to the product site in the same tab', async ({ page }) => {
  await page.goto('/');
  const nudgeLink = page.getByRole('link', { name: 'Visit nudgesupport.com' });
  await expect(nudgeLink).toHaveAttribute('href', siteConfig.products.nudge.url);
  await expect(nudgeLink).not.toHaveAttribute('target');
});

test('the Nudge logo names the product and has explicit dimensions', async ({ page }) => {
  await page.goto('/');
  const logo = page.locator('#products').getByRole('img', { name: siteConfig.products.nudge.name });
  await expect(logo).toHaveAttribute('width', '194');
  await expect(logo).toHaveAttribute('height', '32');
});

test('the Spends card is marked as coming soon and has no link', async ({ page }) => {
  await page.goto('/');
  const spendsCard = productCard(page, siteConfig.products.spends.name);
  await expect(spendsCard).toContainText('Coming soon to iOS');
  await expect(spendsCard.getByRole('link')).toHaveCount(0);
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx playwright test tests/e2e/products.spec.js`
Expected: FAIL, the links and cards do not exist.

- [ ] **Step 4: Add the products markup**

In `index.html`, directly after the closing `</section>` of the hero and still inside `<main>`, add:

```html
<section id="products" class="container section" aria-labelledby="products-heading">
  <div class="section__header">
    <h2 id="products-heading">Products</h2>
    <p class="section__lead">Things we make and stand behind.</p>
  </div>
  <ul class="product-grid list-reset">
    <li class="product-card">
      <h3 class="product-card__name">
        <img
          class="product-card__logo"
          src="/assets/nudge-logo.svg"
          alt="{{ products.nudge.name }}"
          width="194"
          height="32"
        />
      </h3>
      <p class="product-card__tagline">Customer support for small teams.</p>
      <p>
        Track questions, feature requests and bugs in one place, without the email threads and
        spreadsheets.
      </p>
      <a class="product-card__link" href="{{ products.nudge.url }}">Visit nudgesupport.com</a>
    </li>
    <li class="product-card">
      <h3 class="product-card__name">
        <span class="product-card__mark" aria-hidden="true">S</span>
        <span>{{ products.spends.name }}</span>
      </h3>
      <span class="badge">Coming soon to iOS</span>
      <p class="product-card__tagline">Personal finance by pay period.</p>
      <p>
        See how much you will have by the time you are next paid, and where your money goes each
        month.
      </p>
    </li>
  </ul>
</section>
```

- [ ] **Step 5: Create the products stylesheet and import it**

`styles/components/products.css`:

```css
.product-grid {
  display: grid;
  gap: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.product-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  padding: 2rem;
  border-radius: var(--radius-card);
  background-color: var(--color-surface-muted);

  & .product-card__name {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  & .product-card__logo {
    width: auto;
    height: 2rem;
  }

  & .product-card__mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 8px;
    background-color: var(--color-primary-tint-strong);
    color: var(--color-primary-strong);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
  }

  & .product-card__tagline {
    color: var(--color-text-heading);
    font-weight: var(--font-weight-medium);
  }

  & .product-card__link {
    font-weight: var(--font-weight-medium);
  }
}
```

In `styles/base.css`, add after the hero import:

```css
@import url(components/products.css);
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx playwright test tests/e2e/products.spec.js`
Expected: PASS in both projects.

- [ ] **Step 7: Format, lint and full checks**

Run: `npm run format && npm run lint && npm run format:check && npm run test`
Expected: all pass. Two cards side by side from 768px, stacked below.

---

### Task 9: Services and About sections

**Files:**

- Create: `styles/components/services.css`, `styles/components/about.css`
- Modify: `index.html` (after products), `styles/base.css` (imports)
- Test: `tests/e2e/sections.spec.js`

**Interfaces:**

- Consumes: `.section` classes from Task 5; `company.legalName`, `company.foundingYear`, `company.baseCity` from `siteConfig`.
- Produces: `<section id="services">` and `<section id="about">`.

- [ ] **Step 1: Write the failing tests**

`tests/e2e/sections.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { siteConfig } from '../../site.config.js';

const SERVICE_NAMES = ['Web applications', 'Integrations and automation', 'Consultancy'];

test('the services section lists the three services in order', async ({ page }) => {
  await page.goto('/');
  const services = page.locator('#services');
  await expect(services.getByRole('heading', { level: 2 })).toHaveText('Services');
  await expect(services.getByRole('heading', { level: 3 })).toHaveText(SERVICE_NAMES);
});

test('the about section says when the company was founded and where it works from', async ({
  page,
}) => {
  await page.goto('/');
  const about = page.locator('#about');
  await expect(about.getByRole('heading', { level: 2 })).toHaveText('About');
  await expect(about).toContainText(`founded in ${siteConfig.company.foundingYear}`);
  await expect(about).toContainText(`works from ${siteConfig.company.baseCity}`);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx playwright test tests/e2e/sections.spec.js`
Expected: FAIL, neither section exists.

- [ ] **Step 3: Add the services and about markup**

In `index.html`, directly after the products `</section>`, add:

```html
<section id="services" class="container section" aria-labelledby="services-heading">
  <div class="section__header">
    <h2 id="services-heading">Services</h2>
    <p class="section__lead">The same standard, applied to your software.</p>
  </div>
  <ul class="service-grid list-reset">
    <li class="service-card">
      <svg
        class="service-card__icon"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M3 9h18" />
      </svg>
      <h3>Web applications</h3>
      <p>
        Bespoke web applications and internal tools, designed around how your team actually works.
        Front end to database, built to be maintained.
      </p>
    </li>
    <li class="service-card">
      <svg
        class="service-card__icon"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
        <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
      </svg>
      <h3>Integrations and automation</h3>
      <p>
        Connect the systems you already use, replace manual re-keying, and let data move on its own.
      </p>
    </li>
    <li class="service-card">
      <svg
        class="service-card__icon"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path
          d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"
        />
      </svg>
      <h3>Consultancy</h3>
      <p>
        Straight answers on architecture, technical direction and getting a stalled project moving.
        No jargon, no upsell.
      </p>
    </li>
  </ul>
</section>

<section id="about" class="container section" aria-labelledby="about-heading">
  <div class="section__header">
    <h2 id="about-heading">About</h2>
  </div>
  <div class="about__body">
    <p class="section__lead">
      {{ company.legalName }} was founded in {{ company.foundingYear }} and works from {{
      company.baseCity }}, UK.
    </p>
    <p>
      The name is a standard as much as a label: say what matters, leave out what doesn't, and hold
      the software to the same rule.
    </p>
  </div>
</section>
```

- [ ] **Step 4: Create the stylesheets and import them**

`styles/components/services.css`:

```css
.service-grid {
  display: grid;
  gap: 1.5rem;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.service-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  border: 1px solid var(--color-border-muted);
  border-radius: var(--radius-card);

  & .service-card__icon {
    color: var(--color-primary-contrast);
  }
}
```

`styles/components/about.css`:

```css
.about__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 44rem;
}
```

In `styles/base.css`, add after the products import:

```css
@import url(components/services.css);
@import url(components/about.css);
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx playwright test tests/e2e/sections.spec.js`
Expected: PASS in both projects.

- [ ] **Step 6: Format, lint and full checks**

Run: `npm run format && npm run lint && npm run format:check && npm run test`
Expected: all pass. Three service cards in a row from 1024px, with teal line icons.

---

### Task 10: Contact section, footer styling and anchor integrity

**Files:**

- Create: `styles/components/contact.css`, `styles/components/site-footer.css`
- Modify: `index.html` (after about), `styles/base.css` (imports)
- Test: `tests/e2e/contact.spec.js`

**Interfaces:**

- Consumes: `.button--primary` and `.section` classes; `contactEmail`, `company.legalName`, `company.registeredOffice.*` from `siteConfig`.
- Produces: `<section id="contact">`, the target of the header link, the header button and the hero's second button. With this task every anchor on the page resolves.

- [ ] **Step 1: Write the failing tests**

`tests/e2e/contact.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { siteConfig } from '../../site.config.js';

const ANCHOR_LINK_SELECTOR = 'a[href*="#"]';

const readAnchorIds = (locator) =>
  locator.evaluateAll((links) =>
    links.map((link) => link.getAttribute('href').split('#')[1]).filter(Boolean)
  );

test('the contact button is a mailto link to the company address', async ({ page }) => {
  await page.goto('/');
  const contact = page.locator('#contact');
  const emailButton = contact.getByRole('link', { name: siteConfig.contactEmail });
  await expect(emailButton).toHaveAttribute('href', `mailto:${siteConfig.contactEmail}`);
});

test('the contact section labels the London address as the registered office', async ({ page }) => {
  await page.goto('/');
  const contact = page.locator('#contact');
  await expect(contact).toContainText('Registered office');
  await expect(contact).toContainText(siteConfig.company.registeredOffice.postcode);
  await expect(contact).not.toContainText('our office');
});

test('every header link and hero button targets a section that exists', async ({ page }) => {
  await page.goto('/');
  const headerAnchors = page.locator(`header ${ANCHOR_LINK_SELECTOR}`);
  const heroAnchors = page.locator(`.hero ${ANCHOR_LINK_SELECTOR}`);
  const ids = [...(await readAnchorIds(headerAnchors)), ...(await readAnchorIds(heroAnchors))];

  expect(ids.length).toBeGreaterThanOrEqual(6);
  for (const id of ids) {
    await expect(page.locator(`#${id}`), `#${id} should exist`).toHaveCount(1);
  }
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx playwright test tests/e2e/contact.spec.js`
Expected: the first two FAIL (no `#contact`), the anchor test FAILS on `#contact`.

- [ ] **Step 3: Add the contact markup**

In `index.html`, directly after the about `</section>`, add:

```html
<section id="contact" class="container section contact" aria-labelledby="contact-heading">
  <div class="contact__panel">
    <div class="section__header">
      <h2 id="contact-heading">Contact</h2>
      <p class="section__lead">Got a project, or a tool your team hates using? Tell us about it.</p>
    </div>
    <a class="button button--primary" href="mailto:{{ contactEmail }}">{{ contactEmail }}</a>
    <address class="contact__address">
      <span class="contact__address-label">Registered office</span>
      <span>{{ company.legalName }}</span>
      <span>{{ company.registeredOffice.line1 }}</span>
      <span>{{ company.registeredOffice.line2 }}</span>
      <span>{{ company.registeredOffice.city }}</span>
      <span>{{ company.registeredOffice.postcode }}</span>
      <span>{{ company.registeredOffice.country }}</span>
    </address>
  </div>
</section>
```

- [ ] **Step 4: Create the contact and footer stylesheets and import them**

`styles/components/contact.css`:

```css
.contact {
  & .contact__panel {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2rem;
    padding: 2.5rem;
    border-radius: var(--radius-card);
    background-color: var(--color-primary-tint);

    @media (min-width: 768px) {
      padding: 3.5rem;
    }
  }

  & .contact__address {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    color: var(--color-text-subtle);
    font-size: var(--font-size-md);
  }

  & .contact__address-label {
    color: var(--color-text-heading);
    font-weight: var(--font-weight-medium);
  }
}
```

`styles/components/site-footer.css`:

```css
.site-footer {
  padding-block: 3rem;
  border-top: 1px solid var(--color-border-muted);
  color: var(--color-text-subtle);
  font-size: var(--font-size-sm);

  & .site-footer__inner {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  & .site-footer__legal {
    max-width: 60rem;
  }

  & .site-footer__links {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  & a {
    color: var(--color-text-subtle);

    &:hover {
      color: var(--color-text-heading);
    }
  }
}
```

In `styles/base.css`, add after the about import:

```css
@import url(components/contact.css);
@import url(components/site-footer.css);
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx playwright test tests/e2e/contact.spec.js`
Expected: PASS in both projects.

- [ ] **Step 6: Format, lint and full checks**

Run: `npm run format && npm run lint && npm run format:check && npm run test`
Expected: all pass. The contact panel sits on a faint teal tint; the footer is small, muted text with a hairline above it.

---

### Task 11: Reveal on scroll

**Files:**

- Create: `scripts/revealOnScroll.js`, `styles/components/reveal.css`
- Modify: `scripts/main.js`, `styles/base.css` (import), `index.html` (add `data-reveal` to the products, services, about and contact sections)
- Test: `tests/e2e/reveal.spec.js`

**Interfaces:**

- Consumes: the `js` class on `<html>` set by `scripts/main.js` in Task 6.
- Produces: `initRevealOnScroll()` (named export). Elements with `data-reveal` gain `is-visible` when they enter the viewport.

- [ ] **Step 1: Write the failing tests**

`tests/e2e/reveal.spec.js`:

```js
import { test, expect } from '@playwright/test';

const REVEAL_SELECTOR = '[data-reveal]';
const VISIBLE_CLASS = /is-visible/;
const NOT_YET_VISIBLE_SELECTOR = `${REVEAL_SELECTOR}:not(.is-visible)`;

test('the contact section is marked for reveal and reveals when scrolled into view', async ({
  page,
}) => {
  await page.goto('/');
  const contact = page.locator('#contact');
  await expect(contact).toHaveAttribute('data-reveal', '');
  await expect(contact).not.toHaveClass(VISIBLE_CLASS);

  await contact.scrollIntoViewIfNeeded();

  await expect(contact).toHaveClass(VISIBLE_CLASS);
});

test('everything is revealed at once when reduced motion is preferred', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator(REVEAL_SELECTOR)).not.toHaveCount(0);
  await expect(page.locator(NOT_YET_VISIBLE_SELECTOR)).toHaveCount(0);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('sections marked for reveal are fully opaque', async ({ page }) => {
    await page.goto('/');
    const opacity = await page
      .locator('#contact')
      .evaluate((element) => getComputedStyle(element).opacity);
    expect(opacity).toBe('1');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx playwright test tests/e2e/reveal.spec.js`
Expected: the first two FAIL (no `data-reveal` attributes); the no-JavaScript test passes.

- [ ] **Step 3: Mark the sections**

In `index.html`, add the attribute `data-reveal` to the opening tags of the four sections with ids `products`, `services`, `about` and `contact`. For example:

```html
<section
  id="products"
  class="container section"
  aria-labelledby="products-heading"
  data-reveal
></section>
```

The hero is not marked: it is on screen at load.

- [ ] **Step 4: Create the reveal module and wire it in**

`scripts/revealOnScroll.js`:

```js
const REVEAL_SELECTOR = '[data-reveal]';
const VISIBLE_CLASS = 'is-visible';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const OBSERVER_OPTIONS = { rootMargin: '0px 0px -10% 0px', threshold: 0 };

const reveal = (element) => element.classList.add(VISIBLE_CLASS);

const isInViewport = (element) => element.getBoundingClientRect().top < window.innerHeight;

// fades marked elements in as they scroll into view; anything already on screen shows at once
export const initRevealOnScroll = () => {
  const elements = [...document.querySelectorAll(REVEAL_SELECTOR)];
  if (elements.length === 0) return;

  const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
  const canObserve = 'IntersectionObserver' in window;
  if (prefersReducedMotion || !canObserve) {
    elements.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      activeObserver.unobserve(entry.target);
    });
  }, OBSERVER_OPTIONS);

  elements.forEach((element) => {
    const elementIsInViewport = isInViewport(element);
    if (elementIsInViewport) {
      reveal(element);
    } else {
      observer.observe(element);
    }
  });
};
```

`scripts/main.js` becomes:

```js
import { initMobileNav } from './mobileNav.js';
import { initRevealOnScroll } from './revealOnScroll.js';

const JS_ENABLED_CLASS = 'js';

document.documentElement.classList.add(JS_ENABLED_CLASS);
initMobileNav();
initRevealOnScroll();
```

- [ ] **Step 5: Create the reveal stylesheet and import it**

`styles/components/reveal.css`:

```css
/* only when JavaScript is running and the visitor has not asked for reduced motion */
@media (prefers-reduced-motion: no-preference) {
  .js [data-reveal] {
    opacity: 0;
    transform: translateY(12px);
    transition:
      opacity var(--duration-reveal) var(--easing-standard),
      transform var(--duration-reveal) var(--easing-standard);
  }

  .js [data-reveal].is-visible {
    opacity: 1;
    transform: none;
  }
}
```

In `styles/base.css`, add after the site-footer import:

```css
@import url(components/reveal.css);
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx playwright test tests/e2e/reveal.spec.js`
Expected: PASS in both projects.

- [ ] **Step 7: Format, lint and full checks**

Run: `npm run format && npm run lint && npm run format:check && npm run test`
Expected: all pass. In the browser, sections rise gently into view as you scroll; with "Reduce motion" on in system settings, nothing animates.

---

### Task 12: Privacy notice content

**Files:**

- Modify: `privacy/index.html` (replace the `<article>`), `styles/base.css` (import)
- Create: `styles/components/prose.css`
- Test: `tests/e2e/privacy.spec.js`

**Interfaces:**

- Consumes: `company.*`, `contactEmail`, `siteName` from `siteConfig`.
- Produces: the finished privacy page. The copy is flagged for the company's review before the first push; changing wording later only requires editing this file and the "Last updated" date.

- [ ] **Step 1: Write the failing tests**

`tests/e2e/privacy.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { siteConfig } from '../../site.config.js';

const SECTION_HEADINGS = [
  'Who we are',
  'What this notice covers',
  'What we collect and why',
  'Cookies',
  'Who we share it with',
  'Your rights',
  'Complaints',
  'Changes to this notice',
];

test('the privacy notice covers the required sections in order', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(SECTION_HEADINGS);
});

test('the privacy notice identifies the company and how to reach it', async ({ page }) => {
  await page.goto('/privacy/');
  const article = page.getByRole('article');
  await expect(article).toContainText(siteConfig.company.legalName);
  await expect(article).toContainText(siteConfig.company.number);
  await expect(
    article.getByRole('link', { name: siteConfig.contactEmail }).first()
  ).toHaveAttribute('href', `mailto:${siteConfig.contactEmail}`);
  await expect(article.getByRole('link', { name: /ico\.org\.uk/ })).toHaveAttribute(
    'href',
    'https://ico.org.uk'
  );
});

test('the privacy notice states when it was last updated', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByRole('article')).toContainText(/Last updated \d{1,2} \w+ \d{4}/);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx playwright test tests/e2e/privacy.spec.js`
Expected: FAIL, there are no level-2 headings on the privacy page.

- [ ] **Step 3: Write the privacy notice**

Replace the `<article class="container prose">...</article>` in `privacy/index.html` with:

```html
<article class="container prose">
  <div class="prose__intro">
    <h1>Privacy notice</h1>
    <p class="prose__meta">Last updated 8 September 2026</p>
  </div>

  <section class="prose__section">
    <h2>Who we are</h2>
    <p>
      {{ company.legalName }} ("we", "us") runs this website at {{ siteUrl }}. We are registered in
      {{ company.registeredIn }}, company number {{ company.number }}. Our registered office is {{
      company.registeredOffice.line1 }}, {{ company.registeredOffice.line2 }}, {{
      company.registeredOffice.city }}, {{ company.registeredOffice.postcode }}, {{
      company.registeredOffice.country }}. You can reach us at
      <a href="mailto:{{ contactEmail }}">{{ contactEmail }}</a>.
    </p>
  </section>

  <section class="prose__section">
    <h2>What this notice covers</h2>
    <p>
      This notice covers the {{ siteName }} website only. Our products, such as {{
      products.nudge.name }}, have their own privacy notices that apply when you use them.
    </p>
  </section>

  <section class="prose__section">
    <h2>What we collect and why</h2>
    <p>We keep this site simple, and that goes for data too.</p>
    <ul>
      <li>
        <strong>Analytics.</strong> We use Cloudflare Web Analytics to understand how many people
        visit and which pages they read. It does not use cookies, does not fingerprint your device
        and only gives us aggregated figures. We cannot identify you from it.
      </li>
      <li>
        <strong>Hosting and security logs.</strong> The site is served by Cloudflare. Like any host,
        Cloudflare processes technical information such as your IP address, browser type and the
        pages you request in order to deliver the site and protect it from abuse. Cloudflare holds
        these logs briefly under its own privacy policy.
      </li>
      <li>
        <strong>Email.</strong> If you email us we receive your name, your email address and
        whatever you write. We use it only to reply and to deal with what you asked. We keep it for
        as long as that takes, and for a reasonable period afterwards in case you come back to us.
      </li>
    </ul>
    <p>
      Our legal basis for all of this is our legitimate interest in running a website, keeping it
      secure and answering the people who contact us.
    </p>
  </section>

  <section class="prose__section">
    <h2>Cookies</h2>
    <p>This site sets no cookies.</p>
  </section>

  <section class="prose__section">
    <h2>Who we share it with</h2>
    <p>
      Cloudflare, Inc. hosts the site and provides the analytics. Our email provider stores the
      messages you send us. We do not sell your information and we do not use it for advertising.
    </p>
  </section>

  <section class="prose__section">
    <h2>Your rights</h2>
    <p>Under UK data protection law you can ask us to:</p>
    <ul>
      <li>tell you what personal information we hold about you and give you a copy</li>
      <li>correct it</li>
      <li>delete it</li>
      <li>restrict how we use it</li>
      <li>stop using it where we rely on legitimate interests</li>
      <li>provide it to you in a portable form</li>
    </ul>
    <p>
      Email <a href="mailto:{{ contactEmail }}">{{ contactEmail }}</a> and we will respond within
      one month.
    </p>
  </section>

  <section class="prose__section">
    <h2>Complaints</h2>
    <p>
      If you are unhappy with how we have handled your information you can complain to the
      Information Commissioner's Office at <a href="https://ico.org.uk">ico.org.uk</a>. We would
      appreciate the chance to put things right first.
    </p>
  </section>

  <section class="prose__section">
    <h2>Changes to this notice</h2>
    <p>We will update this page if anything changes and revise the date at the top.</p>
  </section>
</article>
```

- [ ] **Step 4: Create the prose stylesheet and import it**

`styles/components/prose.css`:

```css
.prose {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  max-width: 44rem;

  & .prose__intro {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  & .prose__meta {
    color: var(--color-text-subtle);
    font-size: var(--font-size-md);
  }

  & .prose__section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  & ul {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
    padding-left: 1.25rem;
  }

  & strong {
    color: var(--color-text-heading);
    font-weight: var(--font-weight-medium);
  }
}
```

In `styles/base.css`, add after the reveal import:

```css
@import url(components/prose.css);
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx playwright test tests/e2e/privacy.spec.js`
Expected: PASS in both projects.

- [ ] **Step 6: Format, lint and full checks**

Run: `npm run format && npm run lint && npm run format:check && npm run test`
Expected: all pass. The notice reads as a narrow column of short sections with bulleted lists.

---

### Task 13: Metadata, favicons, social preview, sitemap and robots

**Files:**

- Modify: `partials/head-shared.html`, `index.html` (head), `privacy/index.html` (head)
- Create: `public/_redirects`, `public/robots.txt`, `public/sitemap.xml`, `public/manifest.json`, `public/assets/favicon.svg`, `tools/asset-templates/favicon.html`, `tools/asset-templates/social-preview.html`, `tools/render-assets.js`
- Generated: `public/assets/favicon-180.png`, `favicon-192.png`, `favicon-256.png`, `favicon-512.png`, `social-preview.png`
- Test: `tests/unit/publicFiles.test.js`, `tests/e2e/metadata.spec.js`

**Interfaces:**

- Consumes: `siteUrl`, `siteName`, `company.*`, `contactEmail` from `siteConfig`.
- Produces: `npm run render-assets`, which rewrites the PNGs from the templates. Re-run it whenever the favicon SVG or the social preview template changes; the PNGs are committed so the Cloudflare build never needs a browser.

- [ ] **Step 1: Write the failing tests**

`tests/unit/publicFiles.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { siteConfig } from '../../site.config.js';

const publicDirectory = path.resolve(import.meta.dirname, '../../public');
const readPublicFile = (name) => readFileSync(path.join(publicDirectory, name), 'utf8');

test('every sitemap URL is on the site domain and there is one per page', () => {
  const sitemap = readPublicFile('sitemap.xml');
  const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => url);
  assert.deepEqual(locations, [`${siteConfig.siteUrl}/`, `${siteConfig.siteUrl}/privacy/`]);
});

test('robots.txt allows crawling and points at the sitemap', () => {
  const robots = readPublicFile('robots.txt');
  assert.match(robots, /^User-agent: \*\nAllow: \/$/m);
  assert.match(robots, new RegExp(`^Sitemap: ${siteConfig.siteUrl}/sitemap\\.xml$`, 'm'));
});

test('the manifest lists the 192 and 512 pixel icons', () => {
  const manifest = JSON.parse(readPublicFile('manifest.json'));
  const sizes = manifest.icons.map((icon) => icon.sizes);
  assert.deepEqual(sizes, ['192x192', '512x512']);
  assert.equal(manifest.name, siteConfig.siteName);
});

test('_redirects sends www to the apex domain', () => {
  const wwwUrl = siteConfig.siteUrl.replace('https://', 'https://www.');
  const redirects = readPublicFile('_redirects');
  assert.equal(redirects.trim(), `${wwwUrl}/* ${siteConfig.siteUrl}/:splat 301`);
});
```

`tests/e2e/metadata.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { siteConfig } from '../../site.config.js';

const SOCIAL_PREVIEW_URL = `${siteConfig.siteUrl}/assets/social-preview.png`;
const IGNORED_REQUEST_PATHS = ['/favicon.ico'];
const PUBLIC_FILES = [
  { path: '/assets/favicon.svg', contentType: /image\/svg\+xml/ },
  { path: '/assets/favicon-180.png', contentType: /image\/png/ },
  { path: '/assets/favicon-256.png', contentType: /image\/png/ },
  { path: '/assets/social-preview.png', contentType: /image\/png/ },
  { path: '/manifest.json', contentType: /json/ },
  { path: '/sitemap.xml', contentType: /xml/ },
  { path: '/robots.txt', contentType: /text\/plain/ },
];
const PAGES = [
  { path: '/', canonical: `${siteConfig.siteUrl}/` },
  { path: '/privacy/', canonical: `${siteConfig.siteUrl}/privacy/` },
];

const isIgnoredRequest = (url) => IGNORED_REQUEST_PATHS.some((ignored) => url.endsWith(ignored));

for (const { path, canonical } of PAGES) {
  test(`${path} has a title, description, canonical and social image`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(new RegExp(siteConfig.siteName));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      SOCIAL_PREVIEW_URL
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
    );
  });

  test(`${path} loads without console errors or failed requests`, async ({ page }) => {
    const problems = [];
    page.on('console', (message) => {
      const isError = message.type() === 'error';
      if (isError) {
        problems.push(`console: ${message.text()}`);
      }
    });
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    page.on('response', (response) => {
      const isFailure = response.status() >= 400 && !isIgnoredRequest(response.url());
      if (isFailure) {
        problems.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto(path);
    await page.waitForLoadState('networkidle');

    expect(problems).toEqual([]);
  });
}

test('the home page JSON-LD describes the organisation', async ({ page }) => {
  await page.goto('/');
  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  const organisation = JSON.parse(jsonLd);

  expect(organisation['@type']).toBe('Organization');
  expect(organisation.name).toBe(siteConfig.company.tradingName);
  expect(organisation.legalName).toBe(siteConfig.company.legalName);
  expect(organisation.url).toBe(siteConfig.siteUrl);
  expect(organisation.email).toBe(siteConfig.contactEmail);
  expect(organisation.foundingDate).toBe(siteConfig.company.foundingDate);
  expect(organisation.identifier.value).toBe(siteConfig.company.number);
  expect(organisation.address.postalCode).toBe(siteConfig.company.registeredOffice.postcode);
  expect(organisation.address.addressCountry).toBe('GB');
});

test('the icons, manifest, sitemap and robots files are served with the right type', async ({
  request,
}) => {
  for (const { path, contentType } of PUBLIC_FILES) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()['content-type'], path).toMatch(contentType);
  }
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/unit/publicFiles.test.js; npx playwright test tests/e2e/metadata.spec.js`
Expected: the unit tests FAIL (files missing); the metadata tests FAIL on `og:image`, JSON-LD and the served files.

- [ ] **Step 3: Create the public files**

`public/_redirects` (Cloudflare Pages redirect rule, one line):

```text
https://www.concision.io/* https://concision.io/:splat 301
```

`public/robots.txt`:

```text
User-agent: *
Allow: /

Sitemap: https://concision.io/sitemap.xml
```

`public/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://concision.io/</loc>
  </url>
  <url>
    <loc>https://concision.io/privacy/</loc>
  </url>
</urlset>
```

`public/manifest.json`:

```json
{
  "name": "Concision",
  "short_name": "Concision",
  "start_url": "/",
  "display": "browser",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "icons": [
    { "src": "/assets/favicon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/assets/favicon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

`public/assets/favicon.svg` (the stand-in mark: a teal rounded square with a white "C" drawn as a 270 degree arc, gap facing right; replaced by the official mark in Task 15):

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="#32afa9" />
  <circle
    cx="32"
    cy="32"
    r="15"
    fill="none"
    stroke="#ffffff"
    stroke-width="7"
    stroke-linecap="round"
    stroke-dasharray="70.7 23.5"
    transform="rotate(45 32 32)"
  />
</svg>
```

`_redirects`, `robots.txt` and `sitemap.xml` are static files outside the partials pipeline, which is why the unit tests pin their URLs to `siteConfig.siteUrl`.

- [ ] **Step 4: Create the render templates and script**

`tools/asset-templates/favicon.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Favicon render template</title>
    <style>
      html,
      body {
        margin: 0;
        height: 100%;
        background: transparent;
      }

      img {
        display: block;
        width: 100vw;
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <img src="../../public/assets/favicon.svg" alt="" />
  </body>
</html>
```

`tools/asset-templates/social-preview.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Social preview render template</title>
    <style>
      html,
      body {
        margin: 0;
        width: 1200px;
        height: 630px;
        background: #ffffff;
        font-family:
          system-ui,
          -apple-system,
          'Segoe UI',
          Roboto,
          Helvetica,
          Arial,
          sans-serif;
      }

      .card {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 32px;
        box-sizing: border-box;
        height: 100%;
        padding: 0 96px;
      }

      .mark {
        width: 112px;
        height: 112px;
      }

      .wordmark {
        color: #1d1d1f;
        font-size: 96px;
        font-weight: 600;
        line-height: 1;
        letter-spacing: -0.02em;
      }

      .tagline {
        color: #424245;
        font-size: 36px;
      }

      .url {
        color: #6e6e73;
        font-size: 28px;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <img class="mark" src="../../public/assets/favicon.svg" alt="" />
      <div class="wordmark">Concision</div>
      <div class="tagline">Software that cuts the nonsense.</div>
      <div class="url">concision.io</div>
    </div>
  </body>
</html>
```

`tools/render-assets.js`:

```js
import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const OUTPUT_DIRECTORY = path.resolve(import.meta.dirname, '../public/assets');
const TEMPLATES_DIRECTORY = path.resolve(import.meta.dirname, 'asset-templates');
const FAVICON_TEMPLATE = 'favicon.html';
const SOCIAL_PREVIEW_TEMPLATE = 'social-preview.html';
const FAVICON_SIZES = [180, 192, 256, 512];
const SOCIAL_PREVIEW_SIZE = { width: 1200, height: 630 };

const renderTargets = [
  ...FAVICON_SIZES.map((size) => ({
    template: FAVICON_TEMPLATE,
    output: `favicon-${size}.png`,
    width: size,
    height: size,
    transparent: true,
  })),
  {
    template: SOCIAL_PREVIEW_TEMPLATE,
    output: 'social-preview.png',
    ...SOCIAL_PREVIEW_SIZE,
    transparent: false,
  },
];

const renderTarget = async (page, target) => {
  const templateUrl = pathToFileURL(path.join(TEMPLATES_DIRECTORY, target.template)).href;
  await page.setViewportSize({ width: target.width, height: target.height });
  await page.goto(templateUrl);
  await page.screenshot({
    path: path.join(OUTPUT_DIRECTORY, target.output),
    type: 'png',
    omitBackground: target.transparent,
  });
  console.log(`rendered ${target.output} (${target.width}x${target.height})`);
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const target of renderTargets) {
    await renderTarget(page, target);
  }
} finally {
  await browser.close();
}
```

- [ ] **Step 5: Render the PNGs**

Run: `npm run render-assets && ls -la public/assets`
Expected: five `rendered ...` lines and the PNGs present. Open `public/assets/social-preview.png` and `favicon-512.png` to eyeball them: a teal rounded square with a white "C", and a white card with the mark, wordmark, tagline and URL.

- [ ] **Step 6: Complete the shared head partial**

`partials/head-shared.html` becomes:

```html
<meta name="theme-color" content="#ffffff" />
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/assets/favicon-256.png" sizes="256x256" type="image/png" />
<link rel="apple-touch-icon" href="/assets/favicon-180.png" sizes="180x180" />
<link rel="manifest" href="/manifest.json" />
<link rel="stylesheet" href="/styles/base.css" />
```

- [ ] **Step 7: Add social metadata and JSON-LD to the home page**

In `index.html`, directly after the `<link rel="canonical" ... />` line, add:

```html
<meta name="robots" content="index, follow" />

<!-- open graph -->
<meta property="og:type" content="website" />
<meta property="og:site_name" content="{{ siteName }}" />
<meta property="og:locale" content="en_GB" />
<meta property="og:url" content="{{ siteUrl }}/" />
<meta
  property="og:title"
  content="{{ siteName }} | Software studio in {{ company.baseCity }}, UK"
/>
<meta
  property="og:description"
  content="Focused products and web applications from an independent software studio in {{ company.baseCity }}."
/>
<meta property="og:image" content="{{ siteUrl }}/assets/social-preview.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="{{ siteName }} wordmark and tagline" />

<!-- twitter card -->
<meta name="twitter:card" content="summary_large_image" />
<meta
  name="twitter:title"
  content="{{ siteName }} | Software studio in {{ company.baseCity }}, UK"
/>
<meta
  name="twitter:description"
  content="Focused products and web applications from an independent software studio in {{ company.baseCity }}."
/>
<meta name="twitter:image" content="{{ siteUrl }}/assets/social-preview.png" />
<meta name="twitter:image:alt" content="{{ siteName }} wordmark and tagline" />

<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "{{ company.tradingName }}",
    "legalName": "{{ company.legalName }}",
    "url": "{{ siteUrl }}",
    "logo": "{{ siteUrl }}/assets/favicon-512.png",
    "email": "{{ contactEmail }}",
    "foundingDate": "{{ company.foundingDate }}",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "{{ company.registeredOffice.line1 }}, {{ company.registeredOffice.line2 }}",
      "addressLocality": "{{ company.registeredOffice.city }}",
      "postalCode": "{{ company.registeredOffice.postcode }}",
      "addressCountry": "GB"
    },
    "identifier": {
      "@type": "PropertyValue",
      "propertyID": "UK company number",
      "value": "{{ company.number }}"
    }
  }
</script>
```

- [ ] **Step 8: Add social metadata to the privacy page**

In `privacy/index.html`, directly after the `<link rel="canonical" ... />` line, add:

```html
<meta name="robots" content="index, follow" />

<!-- open graph -->
<meta property="og:type" content="website" />
<meta property="og:site_name" content="{{ siteName }}" />
<meta property="og:locale" content="en_GB" />
<meta property="og:url" content="{{ siteUrl }}/privacy/" />
<meta property="og:title" content="Privacy notice | {{ siteName }}" />
<meta
  property="og:description"
  content="How {{ company.legalName }} handles information collected through the {{ siteName }} website."
/>
<meta property="og:image" content="{{ siteUrl }}/assets/social-preview.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="{{ siteName }} wordmark and tagline" />

<!-- twitter card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Privacy notice | {{ siteName }}" />
<meta
  name="twitter:description"
  content="How {{ company.legalName }} handles information collected through the {{ siteName }} website."
/>
<meta name="twitter:image" content="{{ siteUrl }}/assets/social-preview.png" />
<meta name="twitter:image:alt" content="{{ siteName }} wordmark and tagline" />
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `node --test tests/unit/publicFiles.test.js && npx playwright test tests/e2e/metadata.spec.js`
Expected: all pass. If the "console errors" test reports a CSP violation, the offending resource is listed in the message: fix the markup, never widen the CSP with `unsafe-inline`.

- [ ] **Step 10: Format, lint and full checks**

Run: `npm run format && npm run lint && npm run format:check && npm run test`
Expected: all pass. The browser tab shows the teal "C" icon.

---

### Task 14: CI workflow, README and project instructions

**Files:**

- Create: `.github/workflows/ci.yml`, `README.md`, `CLAUDE.md`

**Interfaces:**

- Consumes: every npm script from Task 1.
- Produces: the `ci` check that branch protection will require, and the deployment runbook the company follows after the first push.

- [ ] **Step 1: Create the workflow**

`.github/workflows/ci.yml`:

```yaml
name: ci

on:
  pull_request:
  push:
    branches: [main]

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm

      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run test:unit
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e

      - uses: actions/upload-artifact@v7
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

- [ ] **Step 2: Write the README**

`README.md`:

```markdown
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
```

- [ ] **Step 3: Write the project instructions for Claude Code**

`CLAUDE.md`:

```markdown
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
```

- [ ] **Step 4: Validate the workflow file and run everything**

Run:

```bash
node -e "import('node:fs').then(({ readFileSync }) => { const yaml = readFileSync('.github/workflows/ci.yml', 'utf8'); const hasE2eStep = yaml.includes('npm run test:e2e'); if (!hasE2eStep) { throw new Error('workflow missing e2e step'); } console.log('workflow ok'); })"
npm run format && npm run lint && npm run format:check && npm run test
```

Expected: `workflow ok`; formatting, linting, unit and browser tests all pass. Prettier also formats the markdown and YAML; that is expected.

- [ ] **Step 5: Final review of the working tree**

Run: `git status --short`
Expected: nothing under `node_modules/`, `dist/`, `temp/`, `playwright-report/` or `test-results/` is ever listed. Commit this task's files (`chore(ci): add workflow, README and project instructions`). After the commit `git status --short` prints nothing.

---

### Task 15: Swap in the official logo (run once `branding/` holds the files)

**Files:**

- Create: `public/assets/concision-logo.svg` (copied), `tools/derive-wordmark.js`, `public/assets/concision-wordmark.svg` (derived), `tests/unit/wordmark.test.js`
- Modify: `package.json` (script), `partials/site-header.html`, `styles/components/site-header.css`, `public/assets/favicon.svg`, `tools/asset-templates/social-preview.html`
- Regenerate: the PNGs via `npm run render-assets`

**Interfaces:**

- Consumes: the brand link test from Task 6, which passes for both the text wordmark and an image with `alt="{{ siteName }}"`.

- [ ] **Step 1: Check what was supplied**

Run: `ls -la branding/ && for f in branding/*.svg; do echo "== $f"; head -c 300 "$f"; echo; done`
Expected: `branding/concision-logo.svg` (`viewBox="0 0 438 134"`, three paths filled `#16B3B9`, `#757A83` and `#9CA3AF`) and `branding/concision-mark.svg` (`viewBox="0 0 112 80"`, one path filled `#16B3B9`, no background). Both are already in place.

- [ ] **Step 2: Copy the logo in and derive the header wordmark**

The full logo carries a "CUT THE NONSENSE" line under the wordmark that is illegible at header size, so the header uses a wordmark-only derivative. The wordmark's bounding box in the logo's coordinates is x 4.9 to 430.6, y 1.8 to 66.2; the derived viewBox is `0 0 436 68`. The icon mark is not copied on its own: the favicon embeds its path (Step 4) and `branding/` keeps the source.

Run: `cp branding/concision-logo.svg public/assets/concision-logo.svg`

Create `tools/derive-wordmark.js`:

```js
// derives the wordmark-only logo (no tagline line) used in the site header from the supplied logo
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SOURCE_PATH = path.resolve(import.meta.dirname, '../branding/concision-logo.svg');
const OUTPUT_PATH = path.resolve(import.meta.dirname, '../public/assets/concision-wordmark.svg');
const TAGLINE_FILL = '#9CA3AF';
const TAGLINE_PATH_PATTERN = new RegExp(`<path[^>]*fill="${TAGLINE_FILL}"[^>]*/>\\s*`);
const SVG_OPEN_TAG_PATTERN = /<svg[^>]*>/;
// the wordmark's bounding box in the logo's coordinate space, with a little breathing room
const WORDMARK_SIZE = { width: 436, height: 68 };

const wordmarkOpenTag = `<svg width="${WORDMARK_SIZE.width}" height="${WORDMARK_SIZE.height}" viewBox="0 0 ${WORDMARK_SIZE.width} ${WORDMARK_SIZE.height}" fill="none" xmlns="http://www.w3.org/2000/svg">`;

const logo = readFileSync(SOURCE_PATH, 'utf8');
const hasTagline = TAGLINE_PATH_PATTERN.test(logo);
if (!hasTagline) {
  throw new Error(`Expected a tagline path filled ${TAGLINE_FILL} in ${SOURCE_PATH}`);
}

const wordmark = logo
  .replace(TAGLINE_PATH_PATTERN, '')
  .replace(SVG_OPEN_TAG_PATTERN, wordmarkOpenTag);
writeFileSync(OUTPUT_PATH, wordmark);
console.log(`wrote ${OUTPUT_PATH}`);
```

Add `"derive-wordmark": "node tools/derive-wordmark.js"` to the `scripts` in `package.json` after `render-assets`, then run `npm run derive-wordmark`.

Create `tests/unit/wordmark.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const wordmarkPath = path.resolve(
  import.meta.dirname,
  '../../public/assets/concision-wordmark.svg'
);
const TAGLINE_FILL = '#9CA3AF';
const WORDMARK_FILLS = ['#757A83', '#16B3B9'];

test('the header wordmark is the logo without its tagline line', () => {
  const wordmark = readFileSync(wordmarkPath, 'utf8');
  assert.doesNotMatch(wordmark, new RegExp(TAGLINE_FILL));
  for (const fill of WORDMARK_FILLS) {
    assert.match(wordmark, new RegExp(`fill="${fill}"`), `missing wordmark path ${fill}`);
  }
  assert.match(wordmark, /viewBox="0 0 436 68"/);
});
```

Run: `node --test tests/unit/wordmark.test.js`
Expected: 1 passing.

- [ ] **Step 3: Replace the wordmark in the header**

In `partials/site-header.html`, replace `<span class="site-header__wordmark">{{ siteName }}</span>` with an image of the derived wordmark, whose `width` and `height` are its intrinsic size:

```html
<img
  class="site-header__logo"
  src="/assets/concision-wordmark.svg"
  alt="{{ siteName }}"
  width="436"
  height="68"
/>
```

In `styles/components/site-header.css`, inside `.site-header__brand`, add:

```css
& .site-header__logo {
  width: auto;
  height: 1.75rem;
}
```

- [ ] **Step 4: Build the favicon from the mark and update the social preview**

The mark is not square and has no background, so the favicon wraps it: a rounded square in the logo's own teal (`#16B3B9`, so the icon matches the logo rather than the site accent) with the mark recoloured white and centred. Replace `public/assets/favicon.svg` with this, pasting the `d="..."` attribute verbatim from `branding/concision-mark.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144" width="144" height="144">
  <rect width="144" height="144" rx="32" fill="#16B3B9" />
  <g transform="translate(16 32)">
    <path d="PASTE THE MARK PATH DATA HERE" fill="#ffffff" />
  </g>
</svg>
```

(112×80 placed in 144×144: offsets of 16 and 32 centre it.)

In `tools/asset-templates/social-preview.html`, replace the `.mark` image and the `.wordmark` div with a single image of the full logo, delete the `.tagline` div (the logo carries the tagline itself), and replace the `.mark`, `.wordmark` and `.tagline` rules with one rule for the logo. The card keeps the logo and the URL:

```html
<img class="logo" src="../../public/assets/concision-logo.svg" alt="" />
```

```css
.logo {
  width: 520px;
  height: auto;
}
```

- [ ] **Step 5: Re-render and verify**

Run: `npm run render-assets && npm run format && npm run lint && npm run format:check && npm run test`
Expected: PNGs regenerated, all checks pass (unit 37), the header shows the wordmark at 1.75rem on both viewports with the "on" in the logo's teal. Open `public/assets/favicon-512.png` and `social-preview.png` to check the composition: a white mark centred on a teal rounded square, and the full logo (with its own tagline line) above the URL, nothing else. Commit (`feat(brand): swap in the official logo and mark`).

---

## Post-review amendments (2026-09-08)

The final whole-branch review found defects in the spec's Cloudflare assumptions and a few implementation gaps. These were applied in one fix wave after all 15 tasks; the task text above is left as executed, and the spec has been corrected to match.

- `public/_redirects` removed: Cloudflare Pages cannot express a domain-level redirect there. `www` → apex is a zone-level Redirect Rule, added to the README runbook with a verification step; the `_redirects` unit test is gone.
- Committed public files moved from `public/assets/` to `public/static/` (served from `/static/`) so the year-long `immutable` cache applies only to Vite's hashed bundle under `/assets/`; `/static/*` gets `public, max-age=86400`. Every reference (head partial, header, products, metadata, manifest, tests, render and derive scripts) points at `/static/`.
- The unused public copy of the full logo is gone; the social preview template reads `branding/concision-logo.svg`.
- `.product-card__link` uses `--color-primary-strong` (the contrast teal on the muted card surface was 4.44:1); the contrast test now covers `color-primary-contrast` and `color-primary-strong` on `color-surface-muted`, and `color-text-subtle` on `color-primary-tint`.
- Escape now returns focus to the menu button; the navigation spec asserts it.
- `@media print` shows revealed sections; `<main>` has `tabindex="-1"`; `og:image:alt` describes the logo and address.
- New `tests/e2e/headers.spec.js`: `dist/_headers` matches `formatHeadersFile(securityHeaderRules)` after the build, and the served Content-Security-Policy equals the configured one. Layout spec adds 320 and 1920.
- Selector constants in `contact.spec.js` and `hero.spec.js`.
- README: runbook steps for creating the repo and authorising Cloudflare's GitHub app, the Redirect Rule, Email Address Obfuscation off, HSTS, a "production differs from preview" section, and a note on `reuseExistingServer`. CLAUDE.md names the full CSP source.
- Pre-push review decisions: hero headline is candidate 4 ("Simple software for people who have had enough of complicated."); Node pinned to 22; favicon background is the brand teal `#32AFA9` (the logo's `#16B3B9` is a Figma error the company will correct).
- Feedback round (2026-09-08): copy rewritten to be scan-read (two short paragraphs, key words in `<strong>`, informal tone); headline "Simple software for people who are tired of complicated."; the company supplied a tagline-less wordmark, so `tools/derive-wordmark.js`, its test and npm script are gone; favicon is the teal mark on a white tile; viewport-specific Playwright tests use `@mobile`/`@desktop` tags with per-project `grepInvert` instead of skips; unit tests use Node 22's own glob expansion.
