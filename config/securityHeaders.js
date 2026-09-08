// header rules shared by the Cloudflare _headers file (build) and the preview server (tests)
const CLOUDFLARE_INSIGHTS_SCRIPT_ORIGIN = 'https://static.cloudflareinsights.com';
const CLOUDFLARE_INSIGHTS_BEACON_ORIGIN = 'https://cloudflareinsights.com';
const ONE_YEAR_IN_SECONDS = 31536000;
const ONE_DAY_IN_SECONDS = 86400;

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
  { path: '/static/*', headers: { 'Cache-Control': `public, max-age=${ONE_DAY_IN_SECONDS}` } },
];

export const globalHeaders = securityHeaderRules.find((rule) => rule.path === GLOBAL_PATH).headers;

export const formatHeadersFile = (rules) => {
  const blocks = rules.map(({ path, headers }) => {
    const headerLines = Object.entries(headers).map(([name, value]) => `  ${name}: ${value}`);
    return [path, ...headerLines].join('\n');
  });
  return `${blocks.join('\n')}\n`;
};
