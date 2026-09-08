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
