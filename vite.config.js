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
        notFound: resolve(import.meta.dirname, '404.html'),
      },
    },
  },
  preview: {
    port: PREVIEW_PORT,
    strictPort: true,
    headers: globalHeaders,
  },
});
