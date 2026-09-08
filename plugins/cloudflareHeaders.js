import { formatHeadersFile } from '../config/securityHeaders.js';

const HEADERS_FILE_NAME = '_headers';

export const cloudflareHeaders = ({ rules }) => ({
  name: 'cloudflare-headers',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: HEADERS_FILE_NAME, source: formatHeadersFile(rules) });
  },
});
