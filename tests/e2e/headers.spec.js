import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  securityHeaderRules,
  globalHeaders,
  formatHeadersFile,
} from '../../config/securityHeaders.js';

const HEADERS_FILE_PATH = path.resolve(import.meta.dirname, '../../dist/_headers');
const CSP_HEADER_NAME = 'content-security-policy';

test('the build emits _headers matching the configured rules', () => {
  const emitted = readFileSync(HEADERS_FILE_PATH, 'utf8');
  expect(emitted).toBe(formatHeadersFile(securityHeaderRules));
});

test('the preview server serves the configured content security policy', async ({ request }) => {
  const response = await request.get('/');
  expect(response.headers()[CSP_HEADER_NAME]).toBe(globalHeaders['Content-Security-Policy']);
});
